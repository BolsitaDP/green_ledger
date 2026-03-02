using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Users.Dtos;
using GreenLedger.Api.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GreenLedger.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class UsersController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<UserSummaryDto>), StatusCodes.Status200OK)]
    [Authorize(Policy = AuthorizationPolicies.UserRead)]
    public async Task<ActionResult<IReadOnlyCollection<UserSummaryDto>>> GetAll(
        [FromServices] IUserReadService userReadService,
        CancellationToken cancellationToken)
    {
        var users = await userReadService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }
}
