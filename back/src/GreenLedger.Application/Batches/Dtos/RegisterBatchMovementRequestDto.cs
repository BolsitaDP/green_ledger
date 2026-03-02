namespace GreenLedger.Application.Batches.Dtos;

public sealed class RegisterBatchMovementRequestDto
{
    public string ToStage { get; init; } = string.Empty;
    public Guid ActorUserId { get; init; }
    public string Notes { get; init; } = string.Empty;
}
