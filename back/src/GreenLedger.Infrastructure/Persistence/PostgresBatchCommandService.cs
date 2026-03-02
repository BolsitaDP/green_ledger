using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Batches.Dtos;
using GreenLedger.Domain.Entities;
using GreenLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace GreenLedger.Infrastructure.Persistence;

internal sealed class PostgresBatchCommandService(GreenLedgerDbContext dbContext) : IBatchCommandService
{
    private static readonly JsonSerializerOptions AuditJsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public async Task<BatchSummaryDto> CreateBatchAsync(CreateBatchRequestDto request, CancellationToken cancellationToken)
    {
        ValidateCreateRequest(request);

        var actor = await GetActiveUserAsync(request.ActorUserId, cancellationToken);

        var batchExists = await dbContext.Batches
            .AnyAsync(x => x.BatchNumber == request.BatchNumber, cancellationToken);

        if (batchExists)
        {
            throw new InvalidOperationException("A batch with the same number already exists.");
        }

        var batch = new Batch(
            request.BatchNumber.Trim(),
            request.ProductName.Trim(),
            request.CultivarName.Trim(),
            actor.TenantId);

        await dbContext.Batches.AddAsync(batch, cancellationToken);
        await dbContext.AuditEntries.AddAsync(
            CreateAuditEntry(
                actor,
                "BATCH_CREATED",
                "Batch",
                batch.BatchNumber,
                batch.Id,
                null,
                new
                {
                    batch.BatchNumber,
                    batch.ProductName,
                    batch.CultivarName,
                    CurrentStage = batch.CurrentStage,
                    Status = batch.Status
                },
                "Batch created from API."),
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return await BuildBatchSummaryAsync(batch.Id, cancellationToken)
            ?? throw new InvalidOperationException("The created batch could not be reloaded.");
    }

    public async Task<BatchSummaryDto> RegisterMovementAsync(Guid batchId, RegisterBatchMovementRequestDto request, CancellationToken cancellationToken)
    {
        ValidateMovementRequest(request);

        var batch = await dbContext.Batches
            .FirstOrDefaultAsync(x => x.Id == batchId, cancellationToken)
            ?? throw new KeyNotFoundException("Batch was not found.");

        var actor = await GetActiveUserAsync(request.ActorUserId, cancellationToken);
        var previousStage = batch.CurrentStage;
        var nextStage = ParseEnumValue<BatchStage>(request.ToStage);

        var movement = batch.MoveTo(nextStage, actor.Id.ToString(), request.Notes.Trim());

        await dbContext.BatchMovements.AddAsync(movement, cancellationToken);

        await dbContext.AuditEntries.AddAsync(
            CreateAuditEntry(
                actor,
                "BATCH_STAGE_CHANGED",
                "Batch",
                batch.BatchNumber,
                batch.Id,
                new { CurrentStage = previousStage },
                new { CurrentStage = nextStage },
                request.Notes.Trim()),
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return await BuildBatchSummaryAsync(batch.Id, cancellationToken)
            ?? throw new InvalidOperationException("The updated batch could not be reloaded.");
    }

    public async Task<BatchSummaryDto> ChangeStatusAsync(Guid batchId, ChangeBatchStatusRequestDto request, CancellationToken cancellationToken)
    {
        ValidateStatusRequest(request);

        var batch = await dbContext.Batches
            .FirstOrDefaultAsync(x => x.Id == batchId, cancellationToken)
            ?? throw new KeyNotFoundException("Batch was not found.");

        var actor = await GetActiveUserAsync(request.ActorUserId, cancellationToken);
        var previousStatus = batch.Status;
        var nextStatus = ParseEnumValue<BatchLifecycleStatus>(request.Status);

        batch.ChangeStatus(nextStatus);

        await dbContext.AuditEntries.AddAsync(
            CreateAuditEntry(
                actor,
                "BATCH_STATUS_CHANGED",
                "Batch",
                batch.BatchNumber,
                batch.Id,
                new { Status = previousStatus },
                new { Status = nextStatus },
                request.Reason.Trim()),
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return await BuildBatchSummaryAsync(batch.Id, cancellationToken)
            ?? throw new InvalidOperationException("The updated batch could not be reloaded.");
    }

    private async Task<UserAccount> GetActiveUserAsync(Guid actorUserId, CancellationToken cancellationToken)
    {
        return await dbContext.UserAccounts
            .FirstOrDefaultAsync(x => x.Id == actorUserId && x.IsActive, cancellationToken)
            ?? throw new KeyNotFoundException("Actor user was not found or is inactive.");
    }

    private async Task<BatchSummaryDto?> BuildBatchSummaryAsync(Guid batchId, CancellationToken cancellationToken)
    {
        return await dbContext.Batches
            .AsNoTracking()
            .Where(x => x.Id == batchId)
            .Select(batch => new BatchSummaryDto(
                batch.Id,
                batch.BatchNumber,
                batch.ProductName,
                batch.CultivarName,
                FormatValue(batch.CurrentStage.ToString()),
                FormatValue(batch.Status.ToString()),
                dbContext.CertificationDocuments.Count(document => document.BatchId == batch.Id),
                dbContext.BatchMovements
                    .Where(movement => movement.BatchId == batch.Id)
                    .Select(movement => (DateTimeOffset?)movement.OccurredAtUtc)
                    .Max() ?? batch.CreatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static AuditEntry CreateAuditEntry(
        UserAccount actor,
        string action,
        string entityName,
        string entityId,
        Guid relatedBatchId,
        object? oldValues,
        object? newValues,
        string reason)
    {
        return new AuditEntry(
            actor.Id.ToString(),
            actor.Email,
            actor.Role.ToString(),
            action,
            entityName,
            entityId,
            relatedBatchId,
            SerializeJsonOrNull(oldValues),
            SerializeJsonOrNull(newValues),
            reason,
            Guid.NewGuid().ToString("N"),
            "127.0.0.1");
    }

    private static string? SerializeJsonOrNull(object? value)
    {
        return value is null ? null : JsonSerializer.Serialize(value, AuditJsonOptions);
    }

    private static TEnum ParseEnumValue<TEnum>(string rawValue)
        where TEnum : struct, Enum
    {
        var normalized = Regex.Replace(rawValue ?? string.Empty, "[\\s_-]+", string.Empty);

        if (Enum.TryParse<TEnum>(normalized, ignoreCase: true, out var parsed))
        {
            return parsed;
        }

        throw new InvalidOperationException($"Value '{rawValue}' is not valid for {typeof(TEnum).Name}.");
    }

    private static string FormatValue(string value)
    {
        return Regex.Replace(value, "([a-z])([A-Z])", "$1 $2");
    }

    private static void ValidateCreateRequest(CreateBatchRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.BatchNumber) ||
            string.IsNullOrWhiteSpace(request.ProductName) ||
            string.IsNullOrWhiteSpace(request.CultivarName) ||
            request.ActorUserId == Guid.Empty)
        {
            throw new InvalidOperationException("Create batch request is incomplete.");
        }
    }

    private static void ValidateMovementRequest(RegisterBatchMovementRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.ToStage) ||
            string.IsNullOrWhiteSpace(request.Notes) ||
            request.ActorUserId == Guid.Empty)
        {
            throw new InvalidOperationException("Register movement request is incomplete.");
        }
    }

    private static void ValidateStatusRequest(ChangeBatchStatusRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Status) ||
            string.IsNullOrWhiteSpace(request.Reason) ||
            request.ActorUserId == Guid.Empty)
        {
            throw new InvalidOperationException("Change status request is incomplete.");
        }
    }
}
