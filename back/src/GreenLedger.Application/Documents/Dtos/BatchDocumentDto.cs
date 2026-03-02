namespace GreenLedger.Application.Documents.Dtos;

public sealed record BatchDocumentDto(
    Guid Id,
    Guid BatchId,
    string FileName,
    string ContentType,
    long FileSizeInBytes,
    string Sha256Hash,
    int Version,
    string Status,
    DateTimeOffset? ExpiresAtUtc,
    DateTimeOffset CreatedAtUtc);
