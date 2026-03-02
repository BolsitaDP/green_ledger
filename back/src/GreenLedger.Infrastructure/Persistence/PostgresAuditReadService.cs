using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Audit.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace GreenLedger.Infrastructure.Persistence;

internal sealed class PostgresAuditReadService(GreenLedgerDbContext dbContext) : IAuditReadService
{
    public async Task<IReadOnlyCollection<AuditEntryDto>> GetBatchAuditTrailAsync(Guid batchId, CancellationToken cancellationToken)
    {
        return await dbContext.AuditEntries
            .AsNoTracking()
            .Where(x => x.RelatedBatchId == batchId)
            .OrderByDescending(x => x.OccurredAtUtc)
            .Select(entry => new AuditEntryDto(
                entry.Id,
                entry.ActorEmail,
                FormatValue(entry.ActorRole),
                entry.Action,
                entry.EntityName,
                entry.EntityId,
                entry.OldValuesJson,
                entry.NewValuesJson,
                entry.Reason,
                entry.CorrelationId,
                entry.IpAddress,
                entry.OccurredAtUtc))
            .ToListAsync(cancellationToken);
    }

    private static string FormatValue(string value)
    {
        return Regex.Replace(value, "([a-z])([A-Z])", "$1 $2");
    }
}
