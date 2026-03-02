using GreenLedger.Application.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace GreenLedger.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class DocumentsController : ControllerBase
{
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(
        Guid id,
        [FromServices] IDocumentService documentService,
        CancellationToken cancellationToken)
    {
        var document = await documentService.DownloadDocumentAsync(id, cancellationToken);
        return File(document.Content, document.ContentType, document.FileName);
    }
}
