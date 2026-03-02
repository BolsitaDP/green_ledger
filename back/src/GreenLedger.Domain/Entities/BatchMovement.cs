using GreenLedger.Domain.Common;
using GreenLedger.Domain.Enums;

namespace GreenLedger.Domain.Entities;

public sealed class BatchMovement : BaseEntity
{
    private BatchMovement()
    {
    }

    public BatchMovement(Guid batchId, BatchStage fromStage, BatchStage toStage, string actorUserId, string notes)
    {
        BatchId = batchId;
        FromStage = fromStage;
        ToStage = toStage;
        ActorUserId = actorUserId;
        Notes = notes;
        OccurredAtUtc = DateTimeOffset.UtcNow;
    }

    public Guid BatchId { get; private set; }
    public BatchStage FromStage { get; private set; }
    public BatchStage ToStage { get; private set; }
    public string ActorUserId { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; private set; }
}
