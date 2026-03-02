using GreenLedger.Application.Abstractions;
using GreenLedger.Application.Audit.Dtos;
using GreenLedger.Application.Batches.Dtos;
using GreenLedger.Application.Documents.Dtos;
using GreenLedger.Api.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GreenLedger.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class BatchesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<BatchSummaryDto>), StatusCodes.Status200OK)]
    [Authorize(Policy = AuthorizationPolicies.BatchRead)]
    public async Task<ActionResult<IReadOnlyCollection<BatchSummaryDto>>> GetAll(
        [FromServices] IBatchReadService batchReadService,
        CancellationToken cancellationToken)
    {
        var batches = await batchReadService.GetActiveBatchesAsync(cancellationToken);
        return Ok(batches);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BatchSummaryDto), StatusCodes.Status201Created)]
    [Authorize(Policy = AuthorizationPolicies.BatchCreate)]
    public async Task<ActionResult<BatchSummaryDto>> Create(
        [FromBody] CreateBatchRequestDto request,
        [FromServices] IBatchCommandService batchCommandService,
        CancellationToken cancellationToken)
    {
        var createdBatch = await batchCommandService.CreateBatchAsync(request, GetActorUserId(), cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = createdBatch.Id }, createdBatch);
    }

    [HttpPost("{id:guid}/movements")]
    [ProducesResponseType(typeof(BatchSummaryDto), StatusCodes.Status200OK)]
    [Authorize(Policy = AuthorizationPolicies.BatchMove)]
    public async Task<ActionResult<BatchSummaryDto>> RegisterMovement(
        Guid id,
        [FromBody] RegisterBatchMovementRequestDto request,
        [FromServices] IBatchCommandService batchCommandService,
        CancellationToken cancellationToken)
    {
        var updatedBatch = await batchCommandService.RegisterMovementAsync(id, request, GetActorUserId(), cancellationToken);
        return Ok(updatedBatch);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(BatchSummaryDto), StatusCodes.Status200OK)]
    [Authorize(Policy = AuthorizationPolicies.BatchStatusChange)]
    public async Task<ActionResult<BatchSummaryDto>> ChangeStatus(
        Guid id,
        [FromBody] ChangeBatchStatusRequestDto request,
        [FromServices] IBatchCommandService batchCommandService,
        CancellationToken cancellationToken)
    {
        var updatedBatch = await batchCommandService.ChangeStatusAsync(id, request, GetActorUserId(), cancellationToken);
        return Ok(updatedBatch);
    }

    [HttpGet("{id:guid}/documents")]
    [ProducesResponseType(typeof(IReadOnlyCollection<BatchDocumentDto>), StatusCodes.Status200OK)]
    [Authorize(Policy = AuthorizationPolicies.BatchRead)]
    public async Task<ActionResult<IReadOnlyCollection<BatchDocumentDto>>> GetDocuments(
        Guid id,
        [FromServices] IDocumentService documentService,
        CancellationToken cancellationToken)
    {
        var documents = await documentService.GetBatchDocumentsAsync(id, cancellationToken);
        return Ok(documents);
    }

    [HttpPost("{id:guid}/documents")]
    [ProducesResponseType(typeof(BatchDocumentDto), StatusCodes.Status201Created)]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [Authorize(Policy = AuthorizationPolicies.DocumentUpload)]
    public async Task<ActionResult<BatchDocumentDto>> UploadDocument(
        Guid id,
        [FromForm] DateTimeOffset? expiresAtUtc,
        IFormFile file,
        [FromServices] IDocumentService documentService,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();

        var createdDocument = await documentService.UploadDocumentAsync(
            id,
            new UploadBatchDocumentRequestDto
            {
                ExpiresAtUtc = expiresAtUtc
            },
            GetActorUserId(),
            file.FileName,
            file.ContentType,
            stream,
            cancellationToken);

        return CreatedAtAction(nameof(GetDocuments), new { id }, createdDocument);
    }

    [HttpGet("{id:guid}/audit")]
    [ProducesResponseType(typeof(IReadOnlyCollection<AuditEntryDto>), StatusCodes.Status200OK)]
    [Authorize(Policy = AuthorizationPolicies.AuditRead)]
    public async Task<ActionResult<IReadOnlyCollection<AuditEntryDto>>> GetAuditTrail(
        Guid id,
        [FromServices] IAuditReadService auditReadService,
        CancellationToken cancellationToken)
    {
        var auditTrail = await auditReadService.GetBatchAuditTrailAsync(id, cancellationToken);
        return Ok(auditTrail);
    }

    private Guid GetActorUserId()
    {
        var rawValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(rawValue, out var userId)
            ? userId
            : throw new InvalidOperationException("Authenticated user id claim is missing.");
    }
}
