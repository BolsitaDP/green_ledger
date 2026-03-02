using GreenLedger.Domain.Common;
using GreenLedger.Domain.Enums;

namespace GreenLedger.Domain.Entities;

public sealed class UserAccount : BaseEntity
{
    private UserAccount()
    {
    }

    public UserAccount(string fullName, string email, PlatformRole role, string tenantId)
    {
        FullName = fullName;
        Email = email;
        Role = role;
        TenantId = tenantId;
        IsActive = true;
    }

    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public PlatformRole Role { get; private set; }
    public string TenantId { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }

    public void SetPasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }
}
