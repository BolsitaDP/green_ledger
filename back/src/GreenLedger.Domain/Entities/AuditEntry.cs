using GreenLedger.Domain.Common;

namespace GreenLedger.Domain.Entities;

public sealed class AuditEntry : BaseEntity
{
    private AuditEntry()
    {
    }

    public AuditEntry(
        string actorUserId,
        string actorEmail,
        string actorRole,
        string action,
        string entityName,
        string entityId,
        Guid? relatedBatchId,
        string? oldValuesJson,
        string? newValuesJson,
        string? reason,
        string? correlationId,
        string? ipAddress)
    {
        ActorUserId = actorUserId;
        ActorEmail = actorEmail;
        ActorRole = actorRole;
        Action = action;
        EntityName = entityName;
        EntityId = entityId;
        RelatedBatchId = relatedBatchId;
        OldValuesJson = oldValuesJson;
        NewValuesJson = newValuesJson;
        Reason = reason;
        CorrelationId = correlationId;
        IpAddress = ipAddress;
        OccurredAtUtc = DateTimeOffset.UtcNow;
    }

    public string ActorUserId { get; private set; } = string.Empty;
    public string ActorEmail { get; private set; } = string.Empty;
    public string ActorRole { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public string EntityName { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public Guid? RelatedBatchId { get; private set; }
    public string? OldValuesJson { get; private set; }
    public string? NewValuesJson { get; private set; }
    public string? Reason { get; private set; }
    public string? CorrelationId { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTimeOffset OccurredAtUtc { get; private set; }
}
