using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Batches.Dtos;
using GreenLedger.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace GreenLedger.Infrastructure.Persistence;

internal sealed class PostgresBatchReadService(GreenLedgerDbContext dbContext) : IBatchReadService
{
    public async Task<IReadOnlyCollection<BatchSummaryDto>> GetActiveBatchesAsync(CancellationToken cancellationToken)
    {
        var batches = await dbContext.Batches
            .AsNoTracking()
            .OrderBy(x => x.BatchNumber)
            .Select(batch => new BatchSummaryDto(
                batch.Id,
                batch.BatchNumber,
                batch.ProductName,
                batch.CultivarName,
                FormatEnumValue(batch.CurrentStage.ToString()),
                FormatEnumValue(batch.Status.ToString()),
                dbContext.CertificationDocuments.Count(document => document.BatchId == batch.Id),
                dbContext.BatchMovements
                    .Where(movement => movement.BatchId == batch.Id)
                    .Select(movement => (DateTimeOffset?)movement.OccurredAtUtc)
                    .Max() ?? batch.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return batches;
    }

    private static string FormatEnumValue(string value)
    {
        return Regex.Replace(value, "([a-z])([A-Z])", "$1 $2");
    }
}
