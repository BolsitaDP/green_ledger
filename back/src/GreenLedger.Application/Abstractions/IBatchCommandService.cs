using GreenLedger.Application.Batches.Dtos;

namespace GreenLedger.Application.Abstractions;

public interface IBatchCommandService
{
    Task<BatchSummaryDto> CreateBatchAsync(CreateBatchRequestDto request, CancellationToken cancellationToken);
    Task<BatchSummaryDto> RegisterMovementAsync(Guid batchId, RegisterBatchMovementRequestDto request, CancellationToken cancellationToken);
    Task<BatchSummaryDto> ChangeStatusAsync(Guid batchId, ChangeBatchStatusRequestDto request, CancellationToken cancellationToken);
}
