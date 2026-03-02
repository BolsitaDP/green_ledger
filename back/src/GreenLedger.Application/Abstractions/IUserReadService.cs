using GreenLedger.Application.Users.Dtos;

namespace GreenLedger.Application.Abstractions;

public interface IUserReadService
{
    Task<IReadOnlyCollection<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken);
}
