using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Auth.Dtos;
using GreenLedger.Domain.Entities;
using GreenLedger.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace GreenLedger.Infrastructure.Persistence;

internal sealed class AuthService(
    GreenLedgerDbContext dbContext,
    PasswordHasher<UserAccount> passwordHasher,
    JwtTokenGenerator jwtTokenGenerator,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await dbContext.UserAccounts
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email && x.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Invalid credentials.");

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            throw new InvalidOperationException("Invalid credentials.");
        }

        return await IssueTokensAsync(user, cancellationToken);
    }

    public async Task<AuthResponseDto> RefreshAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            throw new InvalidOperationException("Refresh token is required.");
        }

        var tokenHash = RefreshTokenHasher.Hash(request.RefreshToken);

        var storedToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken)
            ?? throw new InvalidOperationException("Refresh token is invalid.");

        if (storedToken.IsRevoked || storedToken.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException("Refresh token is expired or revoked.");
        }

        var user = await dbContext.UserAccounts
            .FirstOrDefaultAsync(x => x.Id == storedToken.UserAccountId && x.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Refresh token user is invalid.");

        storedToken.Revoke();
        await dbContext.SaveChangesAsync(cancellationToken);

        return await IssueTokensAsync(user, cancellationToken);
    }

    public async Task LogoutAsync(LogoutRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return;
        }

        var tokenHash = RefreshTokenHasher.Hash(request.RefreshToken);
        var storedToken = await dbContext.RefreshTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);

        if (storedToken is null)
        {
            return;
        }

        storedToken.Revoke();
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthResponseDto> IssueTokensAsync(UserAccount user, CancellationToken cancellationToken)
    {
        var (accessToken, expiresAtUtc) = jwtTokenGenerator.CreateAccessToken(user);
        var refreshToken = jwtTokenGenerator.CreateRefreshToken();

        var refreshTokenEntity = new RefreshToken(
            user.Id,
            RefreshTokenHasher.Hash(refreshToken),
            DateTimeOffset.UtcNow.AddDays(_jwtOptions.RefreshTokenDays));

        await dbContext.RefreshTokens.AddAsync(refreshTokenEntity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto(
            accessToken,
            refreshToken,
            expiresAtUtc,
            user.Id,
            user.Email,
            Regex.Replace(user.Role.ToString(), "([a-z])([A-Z])", "$1 $2"));
    }
}
