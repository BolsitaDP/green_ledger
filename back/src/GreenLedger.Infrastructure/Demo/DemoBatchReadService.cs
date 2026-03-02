using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Batches.Dtos;

namespace GreenLedger.Infrastructure.Demo;

internal sealed class DemoBatchReadService : IBatchReadService
{
    public Task<IReadOnlyCollection<BatchSummaryDto>> GetActiveBatchesAsync(CancellationToken cancellationToken)
    {
        IReadOnlyCollection<BatchSummaryDto> batches =
        [
            new(
                Guid.Parse("d8e5544b-cf0f-4adc-8b83-118b81df5f55"),
                "GL-2026-001",
                "CBD Oil 30ml",
                "Harmony One",
                "Laboratory",
                "Active",
                3,
                new DateTimeOffset(2026, 2, 26, 14, 30, 0, TimeSpan.Zero)),
            new(
                Guid.Parse("6d61c2fd-9cc0-4cf2-9fe7-8854068c93e0"),
                "GL-2026-002",
                "THC Capsules",
                "Aurora Med",
                "Distribution",
                "Ready For Release",
                5,
                new DateTimeOffset(2026, 2, 25, 10, 15, 0, TimeSpan.Zero)),
            new(
                Guid.Parse("d930cf96-a042-4549-8f85-01cc9f63253f"),
                "GL-2026-003",
                "Dry Flower 10g",
                "Emerald Calm",
                "Cultivation",
                "On Hold",
                1,
                new DateTimeOffset(2026, 2, 27, 8, 45, 0, TimeSpan.Zero)),
            new(
                Guid.Parse("b6b1d57d-58f5-4e71-ad52-bf6465d37c95"),
                "GL-2026-004",
                "Topical Cream",
                "Relief Prime",
                "Laboratory",
                "Active",
                2,
                new DateTimeOffset(2026, 2, 24, 16, 0, 0, TimeSpan.Zero))
        ];

        return Task.FromResult(batches);
    }
}
