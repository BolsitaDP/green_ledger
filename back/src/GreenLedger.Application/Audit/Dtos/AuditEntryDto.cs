namespace GreenLedger.Application.Audit.Dtos;

public sealed record AuditEntryDto(
    Guid Id,
    string ActorEmail,
    string ActorRole,
    string Action,
    string EntityName,
    string EntityId,
    string? OldValuesJson,
    string? NewValuesJson,
    string? Reason,
    string? CorrelationId,
    string? IpAddress,
    DateTimeOffset OccurredAtUtc);
