using GreenLedger.Application.Batches.Dtos;

namespace GreenLedger.Application.Abstractions;

public interface IBatchReadService
{
    Task<IReadOnlyCollection<BatchSummaryDto>> GetActiveBatchesAsync(CancellationToken cancellationToken);
}
