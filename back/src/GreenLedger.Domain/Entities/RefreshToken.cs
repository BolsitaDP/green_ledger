using GreenLedger.Domain.Common;

namespace GreenLedger.Domain.Entities;

public sealed class RefreshToken : BaseEntity
{
    private RefreshToken()
    {
    }

    public RefreshToken(
        Guid userAccountId,
        string tokenHash,
        DateTimeOffset expiresAtUtc)
    {
        UserAccountId = userAccountId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
    }

    public Guid UserAccountId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; private set; }
    public DateTimeOffset? RevokedAtUtc { get; private set; }
    public bool IsRevoked => RevokedAtUtc.HasValue;

    public void Revoke()
    {
        if (!IsRevoked)
        {
            RevokedAtUtc = DateTimeOffset.UtcNow;
        }
    }
}
