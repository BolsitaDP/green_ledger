using GreenLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenLedger.Infrastructure.Persistence.Configurations;

internal sealed class CertificationDocumentConfiguration : IEntityTypeConfiguration<CertificationDocument>
{
    public void Configure(EntityTypeBuilder<CertificationDocument> builder)
    {
        builder.ToTable("certification_documents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.BlobPath)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Sha256Hash)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.ContentType)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.UploadedByUserId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(x => new { x.BatchId, x.ExpiresAtUtc });
    }
}
