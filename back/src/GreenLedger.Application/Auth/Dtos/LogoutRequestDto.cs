namespace GreenLedger.Application.Auth.Dtos;

public sealed class LogoutRequestDto
{
    public string RefreshToken { get; init; } = string.Empty;
}
