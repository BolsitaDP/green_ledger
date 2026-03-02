namespace GreenLedger.Application.Documents.Dtos;

public sealed class UploadBatchDocumentRequestDto
{
    public DateTimeOffset? ExpiresAtUtc { get; init; }
}
