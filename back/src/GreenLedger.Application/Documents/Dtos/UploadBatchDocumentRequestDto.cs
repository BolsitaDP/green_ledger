namespace GreenLedger.Application.Documents.Dtos;

public sealed class UploadBatchDocumentRequestDto
{
    public Guid ActorUserId { get; init; }
    public DateTimeOffset? ExpiresAtUtc { get; init; }
}
