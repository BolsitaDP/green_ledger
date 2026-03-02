using GreenLedger.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GreenLedger.Infrastructure.Persistence;

public sealed class GreenLedgerDbContext(DbContextOptions<GreenLedgerDbContext> options) : DbContext(options)
{
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<BatchMovement> BatchMovements => Set<BatchMovement>();
    public DbSet<CertificationDocument> CertificationDocuments => Set<CertificationDocument>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GreenLedgerDbContext).Assembly);
    }
}
