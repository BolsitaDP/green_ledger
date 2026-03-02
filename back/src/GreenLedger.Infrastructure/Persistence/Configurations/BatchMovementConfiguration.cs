using GreenLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLedger.Infrastructure.Persistence.Configurations;

internal sealed class BatchMovementConfiguration : IEntityTypeConfiguration<BatchMovement>
{
    public void Configure(EntityTypeBuilder<BatchMovement> builder)
    {
        builder.ToTable("batch_movements");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActorUserId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Notes)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.FromStage)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(x => x.ToStage)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(x => new { x.BatchId, x.OccurredAtUtc });
    }
}
