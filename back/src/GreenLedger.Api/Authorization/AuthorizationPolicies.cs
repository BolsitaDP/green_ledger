using GreenLedger.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace GreenLedger.Api.Authorization;

public static class AuthorizationPolicies
{
    public const string BatchRead = nameof(BatchRead);
    public const string BatchCreate = nameof(BatchCreate);
    public const string BatchMove = nameof(BatchMove);
    public const string BatchStatusChange = nameof(BatchStatusChange);
    public const string DocumentUpload = nameof(DocumentUpload);
    public const string AuditRead = nameof(AuditRead);
    public const string UserRead = nameof(UserRead);

    public static void AddGreenLedgerPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(
            BatchRead,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.ComplianceOfficer.ToString(),
                PlatformRole.QualityManager.ToString(),
                PlatformRole.CultivationOperator.ToString(),
                PlatformRole.LabAnalyst.ToString(),
                PlatformRole.DistributionOperator.ToString(),
                PlatformRole.Regulator.ToString()));

        options.AddPolicy(
            BatchCreate,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.CultivationOperator.ToString()));

        options.AddPolicy(
            BatchMove,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.CultivationOperator.ToString(),
                PlatformRole.DistributionOperator.ToString(),
                PlatformRole.ComplianceOfficer.ToString()));

        options.AddPolicy(
            BatchStatusChange,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.QualityManager.ToString(),
                PlatformRole.ComplianceOfficer.ToString()));

        options.AddPolicy(
            DocumentUpload,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.LabAnalyst.ToString(),
                PlatformRole.QualityManager.ToString(),
                PlatformRole.ComplianceOfficer.ToString()));

        options.AddPolicy(
            AuditRead,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.ComplianceOfficer.ToString(),
                PlatformRole.QualityManager.ToString(),
                PlatformRole.Regulator.ToString()));

        options.AddPolicy(
            UserRead,
            policy => policy.RequireRole(
                PlatformRole.Admin.ToString(),
                PlatformRole.ComplianceOfficer.ToString(),
                PlatformRole.Regulator.ToString()));
    }
}
