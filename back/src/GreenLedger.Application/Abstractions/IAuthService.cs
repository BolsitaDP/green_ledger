using GreenLedger.Application.Auth.Dtos;

namespace GreenLedger.Application.Abstractions;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken);
    Task<AuthResponseDto> RefreshAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken);
    Task LogoutAsync(LogoutRequestDto request, CancellationToken cancellationToken);
}
