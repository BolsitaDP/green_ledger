using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Documents.Dtos;
using GreenLedger.Domain.Entities;
using GreenLedger.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GreenLedger.Infrastructure.Persistence;

internal sealed class PostgresDocumentService(
    GreenLedgerDbContext dbContext,
    ILocalDocumentStorage localDocumentStorage) : IDocumentService
{
    private static readonly JsonSerializerOptions AuditJsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "application/pdf",
        "image/png",
        "image/jpeg"
    ];

    public async Task<BatchDocumentDto> UploadDocumentAsync(
        Guid batchId,
        UploadBatchDocumentRequestDto request,
        string originalFileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken)
    {
        if (request.ActorUserId == Guid.Empty)
        {
            throw new InvalidOperationException("Actor user is required.");
        }

        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            throw new InvalidOperationException("A file name is required.");
        }

        if (!AllowedContentTypes.Contains(contentType))
        {
            throw new InvalidOperationException("Unsupported document content type.");
        }

        var batch = await dbContext.Batches
            .FirstOrDefaultAsync(x => x.Id == batchId, cancellationToken)
            ?? throw new KeyNotFoundException("Batch was not found.");

        var actor = await dbContext.UserAccounts
            .FirstOrDefaultAsync(x => x.Id == request.ActorUserId && x.IsActive, cancellationToken)
            ?? throw new KeyNotFoundException("Actor user was not found or is inactive.");

        var fileName = Path.GetFileName(originalFileName);

        var nextVersion = await dbContext.CertificationDocuments
            .Where(x => x.BatchId == batchId && x.FileName == fileName)
            .Select(x => (int?)x.Version)
            .MaxAsync(cancellationToken) ?? 0;

        nextVersion += 1;

        var storedFile = await localDocumentStorage.SaveAsync(
            batchId,
            fileName,
            contentType,
            content,
            cancellationToken);

        batch.AddDocument(
            fileName,
            storedFile.RelativePath,
            storedFile.Sha256Hash,
            storedFile.ContentType,
            storedFile.FileSizeInBytes,
            nextVersion,
            request.ExpiresAtUtc,
            actor.Id.ToString());

        var createdDocument = batch.Documents
            .OrderByDescending(x => x.CreatedAtUtc)
            .First();

        await dbContext.CertificationDocuments.AddAsync(createdDocument, cancellationToken);
        await dbContext.AuditEntries.AddAsync(
            new AuditEntry(
                actor.Id.ToString(),
                actor.Email,
                actor.Role.ToString(),
                "DOCUMENT_UPLOADED",
                "CertificationDocument",
                createdDocument.Id.ToString(),
                batchId,
                null,
                JsonSerializer.Serialize(
                    new
                    {
                        createdDocument.FileName,
                        createdDocument.Version,
                        createdDocument.Sha256Hash,
                        createdDocument.ContentType,
                        createdDocument.FileSizeInBytes,
                        createdDocument.ExpiresAtUtc
                    },
                    AuditJsonOptions),
                "Regulatory document uploaded.",
                Guid.NewGuid().ToString("N"),
                "127.0.0.1"),
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return MapDocument(createdDocument);
    }

    public async Task<IReadOnlyCollection<BatchDocumentDto>> GetBatchDocumentsAsync(Guid batchId, CancellationToken cancellationToken)
    {
        return await dbContext.CertificationDocuments
            .AsNoTracking()
            .Where(x => x.BatchId == batchId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ThenByDescending(x => x.Version)
            .Select(document => MapDocument(document))
            .ToListAsync(cancellationToken);
    }

    public async Task<DocumentDownloadResultDto> DownloadDocumentAsync(Guid documentId, CancellationToken cancellationToken)
    {
        var document = await dbContext.CertificationDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == documentId, cancellationToken)
            ?? throw new KeyNotFoundException("Document was not found.");

        var stream = await localDocumentStorage.OpenReadAsync(document.BlobPath, cancellationToken);
        return new DocumentDownloadResultDto(document.FileName, document.ContentType, stream);
    }

    private static BatchDocumentDto MapDocument(CertificationDocument document)
    {
        return new BatchDocumentDto(
            document.Id,
            document.BatchId,
            document.FileName,
            document.ContentType,
            document.FileSizeInBytes,
            document.Sha256Hash,
            document.Version,
            document.Status.ToString(),
            document.ExpiresAtUtc,
            document.CreatedAtUtc);
    }
}
