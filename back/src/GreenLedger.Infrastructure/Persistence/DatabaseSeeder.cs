using GreenLedger.Domain.Entities;
using GreenLedger.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace GreenLedger.Infrastructure.Persistence;

public sealed class DatabaseSeeder(GreenLedgerDbContext dbContext)
{
    private static readonly JsonSerializerOptions AuditJsonOptions = new()
    {
        WriteIndented = false,
        Converters = { new JsonStringEnumConverter() }
    };

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await BackfillLegacyDocumentMetadataAsync(cancellationToken);

        if (await dbContext.Batches.AnyAsync(cancellationToken))
        {
            return;
        }

        var users = CreateDemoUsers();
        var seededData = CreateDemoBatchesAndAudit(users);

        await dbContext.UserAccounts.AddRangeAsync(users, cancellationToken);
        await dbContext.Batches.AddRangeAsync(seededData.Batches, cancellationToken);
        await dbContext.AuditEntries.AddRangeAsync(seededData.AuditEntries, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task BackfillLegacyDocumentMetadataAsync(CancellationToken cancellationToken)
    {
        var legacyDocuments = await dbContext.CertificationDocuments
            .Where(x => x.ContentType == string.Empty)
            .ToListAsync(cancellationToken);

        if (legacyDocuments.Count == 0)
        {
            return;
        }

        foreach (var document in legacyDocuments)
        {
            document.ApplyStorageMetadataDefaults("application/pdf", 0);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static IReadOnlyCollection<UserAccount> CreateDemoUsers()
    {
        const string tenantId = "demo-tenant";

        return
        [
            new("Laura Admin", "laura.admin@greenledger.com", PlatformRole.Admin, tenantId),
            new("Ana Compliance", "ana.compliance@greenledger.com", PlatformRole.ComplianceOfficer, tenantId),
            new("Sofia Quality", "sofia.quality@greenledger.com", PlatformRole.QualityManager, tenantId),
            new("Camila Cultivation", "camila.cultivation@greenledger.com", PlatformRole.CultivationOperator, tenantId),
            new("Diego Lab", "diego.lab@greenledger.com", PlatformRole.LabAnalyst, tenantId),
            new("Mateo Distribution", "mateo.distribution@greenledger.com", PlatformRole.DistributionOperator, tenantId),
            new("Rita Regulator", "rita.regulator@gov.example", PlatformRole.Regulator, tenantId)
        ];
    }

    private static (IReadOnlyCollection<Batch> Batches, IReadOnlyCollection<AuditEntry> AuditEntries) CreateDemoBatchesAndAudit(
        IReadOnlyCollection<UserAccount> users)
    {
        const string tenantId = "demo-tenant";

        var usersByRole = users.ToDictionary(x => x.Role);

        var cultivationUser = usersByRole[PlatformRole.CultivationOperator];
        var labUser = usersByRole[PlatformRole.LabAnalyst];
        var qualityUser = usersByRole[PlatformRole.QualityManager];
        var complianceUser = usersByRole[PlatformRole.ComplianceOfficer];
        var distributionUser = usersByRole[PlatformRole.DistributionOperator];

        var batchOne = new Batch("GL-2026-001", "CBD Oil 30ml", "Harmony One", tenantId);
        batchOne.MoveTo(BatchStage.Laboratory, cultivationUser.Id.ToString(), "Transferred from cultivation to laboratory.");
        batchOne.AddDocument("coa-cbd-oil-v1.pdf", "/demo/coa-cbd-oil-v1.pdf", CreateFakeSha("coa-cbd-oil-v1"), "application/pdf", 180_224, 1, DateTimeOffset.UtcNow.AddMonths(6), labUser.Id.ToString());
        batchOne.AddDocument("gmp-checklist.pdf", "/demo/gmp-checklist.pdf", CreateFakeSha("gmp-checklist"), "application/pdf", 92_180, 1, DateTimeOffset.UtcNow.AddMonths(3), labUser.Id.ToString());
        batchOne.AddDocument("batch-release-form.pdf", "/demo/batch-release-form.pdf", CreateFakeSha("batch-release-form"), "application/pdf", 74_512, 1, DateTimeOffset.UtcNow.AddMonths(1), labUser.Id.ToString());

        var batchTwo = new Batch("GL-2026-002", "THC Capsules", "Aurora Med", tenantId);
        batchTwo.MoveTo(BatchStage.Laboratory, cultivationUser.Id.ToString(), "Entered laboratory review.");
        batchTwo.MoveTo(BatchStage.Distribution, complianceUser.Id.ToString(), "Approved for distribution.");
        batchTwo.ChangeStatus(BatchLifecycleStatus.ReadyForRelease);
        batchTwo.AddDocument("coa-thc-capsules-v1.pdf", "/demo/coa-thc-capsules-v1.pdf", CreateFakeSha("coa-thc-capsules-v1"), "application/pdf", 194_112, 1, DateTimeOffset.UtcNow.AddMonths(12), labUser.Id.ToString());
        batchTwo.AddDocument("stability-study.pdf", "/demo/stability-study.pdf", CreateFakeSha("stability-study"), "application/pdf", 166_348, 1, DateTimeOffset.UtcNow.AddMonths(10), labUser.Id.ToString());
        batchTwo.AddDocument("transport-permit.pdf", "/demo/transport-permit.pdf", CreateFakeSha("transport-permit"), "application/pdf", 65_000, 1, DateTimeOffset.UtcNow.AddMonths(2), complianceUser.Id.ToString());
        batchTwo.AddDocument("lab-approval.pdf", "/demo/lab-approval.pdf", CreateFakeSha("lab-approval"), "application/pdf", 81_220, 1, DateTimeOffset.UtcNow.AddMonths(8), qualityUser.Id.ToString());
        batchTwo.AddDocument("release-authorization.pdf", "/demo/release-authorization.pdf", CreateFakeSha("release-authorization"), "application/pdf", 88_912, 1, DateTimeOffset.UtcNow.AddMonths(4), complianceUser.Id.ToString());

        var batchThree = new Batch("GL-2026-003", "Dry Flower 10g", "Emerald Calm", tenantId);
        batchThree.ChangeStatus(BatchLifecycleStatus.OnHold);
        batchThree.AddDocument("investigation-note.pdf", "/demo/investigation-note.pdf", CreateFakeSha("investigation-note"), "application/pdf", 42_200, 1, DateTimeOffset.UtcNow.AddDays(20), qualityUser.Id.ToString());

        var batchFour = new Batch("GL-2026-004", "Topical Cream", "Relief Prime", tenantId);
        batchFour.MoveTo(BatchStage.Laboratory, cultivationUser.Id.ToString(), "Submitted for potency verification.");
        batchFour.AddDocument("formula-review.pdf", "/demo/formula-review.pdf", CreateFakeSha("formula-review"), "application/pdf", 59_120, 1, DateTimeOffset.UtcNow.AddMonths(9), labUser.Id.ToString());
        batchFour.AddDocument("microbiology-check.pdf", "/demo/microbiology-check.pdf", CreateFakeSha("microbiology-check"), "application/pdf", 61_904, 1, DateTimeOffset.UtcNow.AddMonths(5), labUser.Id.ToString());

        var auditEntries = new List<AuditEntry>
        {
            CreateAuditEntry(cultivationUser, "BATCH_CREATED", "Batch", batchOne.BatchNumber, batchOne.Id, null, new { batchOne.BatchNumber, batchOne.ProductName, batchOne.CurrentStage, batchOne.Status }, "Batch created by cultivation operator."),
            CreateAuditEntry(cultivationUser, "BATCH_MOVED_TO_LAB", "Batch", batchOne.BatchNumber, batchOne.Id, new { currentStage = "Cultivation" }, new { currentStage = "Laboratory" }, "Transferred to laboratory."),
            CreateAuditEntry(labUser, "DOCUMENT_UPLOADED", "CertificationDocument", "coa-cbd-oil-v1.pdf", batchOne.Id, null, new { fileName = "coa-cbd-oil-v1.pdf", version = 1 }, "Initial COA uploaded."),

            CreateAuditEntry(cultivationUser, "BATCH_CREATED", "Batch", batchTwo.BatchNumber, batchTwo.Id, null, new { batchTwo.BatchNumber, batchTwo.ProductName, batchTwo.CurrentStage, status = "Active" }, "Batch created by cultivation operator."),
            CreateAuditEntry(labUser, "LAB_RESULTS_RECORDED", "Batch", batchTwo.BatchNumber, batchTwo.Id, null, new { certificate = "coa-thc-capsules-v1.pdf", result = "pass" }, "Laboratory results recorded."),
            CreateAuditEntry(qualityUser, "QUALITY_APPROVED", "Batch", batchTwo.BatchNumber, batchTwo.Id, new { status = "Active" }, new { status = "Quality Approved" }, "Quality team approved release package."),
            CreateAuditEntry(complianceUser, "RELEASE_APPROVED", "Batch", batchTwo.BatchNumber, batchTwo.Id, new { status = "Active" }, new { status = "Ready For Release" }, "Compliance approved final release."),
            CreateAuditEntry(distributionUser, "DISTRIBUTION_PREPARED", "Batch", batchTwo.BatchNumber, batchTwo.Id, new { currentStage = "Laboratory" }, new { currentStage = "Distribution" }, "Distribution operator prepared outbound shipment."),

            CreateAuditEntry(cultivationUser, "BATCH_CREATED", "Batch", batchThree.BatchNumber, batchThree.Id, null, new { batchThree.BatchNumber, batchThree.ProductName, batchThree.CurrentStage, status = "Active" }, "Batch created by cultivation operator."),
            CreateAuditEntry(qualityUser, "BATCH_PUT_ON_HOLD", "Batch", batchThree.BatchNumber, batchThree.Id, new { status = "Active" }, new { status = "On Hold" }, "Investigation required before continuation."),

            CreateAuditEntry(cultivationUser, "BATCH_CREATED", "Batch", batchFour.BatchNumber, batchFour.Id, null, new { batchFour.BatchNumber, batchFour.ProductName, batchFour.CurrentStage, status = "Active" }, "Batch created by cultivation operator."),
            CreateAuditEntry(labUser, "MICROBIOLOGY_CHECK_RECORDED", "Batch", batchFour.BatchNumber, batchFour.Id, null, new { certificate = "microbiology-check.pdf", result = "pending-review" }, "Microbiology check uploaded.")
        };

        return ([batchOne, batchTwo, batchThree, batchFour], auditEntries);
    }

    private static string CreateFakeSha(string value)
    {
        return Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    }

    private static AuditEntry CreateAuditEntry(
        UserAccount actor,
        string action,
        string entityName,
        string entityId,
        Guid relatedBatchId,
        object? oldValues,
        object? newValues,
        string reason)
    {
        return new AuditEntry(
            actor.Id.ToString(),
            actor.Email,
            actor.Role.ToString(),
            action,
            entityName,
            entityId,
            relatedBatchId,
            SerializeJsonOrNull(oldValues),
            SerializeJsonOrNull(newValues),
            reason,
            Guid.NewGuid().ToString("N"),
            "10.0.10.24");
    }

    private static string? SerializeJsonOrNull(object? value)
    {
        return value is null ? null : JsonSerializer.Serialize(value, AuditJsonOptions);
    }
}
