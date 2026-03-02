namespace GreenLedger.Application.Batches.Dtos;

public sealed record BatchSummaryDto(
    Guid Id,
    string BatchNumber,
    string ProductName,
    string CultivarName,
    string CurrentStage,
    string Status,
    int DocumentsCount,
    DateTimeOffset LastMovementAtUtc);
