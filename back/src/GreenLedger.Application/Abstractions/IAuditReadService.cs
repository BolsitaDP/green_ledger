using GreenLedger.Application.Audit.Dtos;

namespace GreenLedger.Application.Abstractions;

public interface IAuditReadService
{
    Task<IReadOnlyCollection<AuditEntryDto>> GetBatchAuditTrailAsync(Guid batchId, CancellationToken cancellationToken);
}
