namespace GreenLedger.Application.Auth.Dtos;

public sealed record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    Guid UserId,
    string Email,
    string Role);
