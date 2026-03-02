namespace GreenLedger.Application.Batches.Dtos;

public sealed class CreateBatchRequestDto
{
    public string BatchNumber { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string CultivarName { get; init; } = string.Empty;
    public Guid ActorUserId { get; init; }
}
