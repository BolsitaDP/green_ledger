using GreenLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLedger.Infrastructure.Persistence.Configurations;

internal sealed class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> builder)
    {
        builder.ToTable("audit_entries");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActorUserId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.ActorEmail)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.ActorRole)
            .HasMaxLength(80)
            .IsRequired();

        builder.Property(x => x.Action)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.EntityName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.EntityId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.OldValuesJson)
            .HasColumnType("jsonb");

        builder.Property(x => x.NewValuesJson)
            .HasColumnType("jsonb");

        builder.Property(x => x.Reason)
            .HasMaxLength(500);

        builder.Property(x => x.CorrelationId)
            .HasMaxLength(100);

        builder.Property(x => x.IpAddress)
            .HasMaxLength(64);

        builder.HasIndex(x => x.RelatedBatchId);
        builder.HasIndex(x => new { x.EntityName, x.EntityId, x.OccurredAtUtc });
    }
}
