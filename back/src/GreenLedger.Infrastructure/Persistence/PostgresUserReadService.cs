using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Users.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace GreenLedger.Infrastructure.Persistence;

internal sealed class PostgresUserReadService(GreenLedgerDbContext dbContext) : IUserReadService
{
    public async Task<IReadOnlyCollection<UserSummaryDto>> GetUsersAsync(CancellationToken cancellationToken)
    {
        return await dbContext.UserAccounts
            .AsNoTracking()
            .OrderBy(x => x.FullName)
            .Select(user => new UserSummaryDto(
                user.Id,
                user.FullName,
                user.Email,
                Regex.Replace(user.Role.ToString(), "([a-z])([A-Z])", "$1 $2"),
                user.IsActive))
            .ToListAsync(cancellationToken);
    }
}
