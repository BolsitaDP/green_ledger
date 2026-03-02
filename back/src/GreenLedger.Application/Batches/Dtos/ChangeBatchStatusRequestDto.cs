namespace GreenLedger.Application.Batches.Dtos;

public sealed class ChangeBatchStatusRequestDto
{
    public string Status { get; init; } = string.Empty;
    public Guid ActorUserId { get; init; }
    public string Reason { get; init; } = string.Empty;
}
