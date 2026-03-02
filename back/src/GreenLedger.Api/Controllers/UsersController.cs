using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Users.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace GreenLedger.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class UsersController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<UserSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<UserSummaryDto>>> GetAll(
        [FromServices] IUserReadService userReadService,
        CancellationToken cancellationToken)
    {
        var users = await userReadService.GetUsersAsync(cancellationToken);
        return Ok(users);
    }
}
