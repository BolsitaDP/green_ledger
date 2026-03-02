using GreenLedger.Application.Documents.Dtos;

namespace GreenLedger.Application.Abstractions;

public interface IDocumentService
{
    Task<BatchDocumentDto> UploadDocumentAsync(
        Guid batchId,
        UploadBatchDocumentRequestDto request,
        string originalFileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken);

    Task<IReadOnlyCollection<BatchDocumentDto>> GetBatchDocumentsAsync(Guid batchId, CancellationToken cancellationToken);

    Task<DocumentDownloadResultDto> DownloadDocumentAsync(Guid documentId, CancellationToken cancellationToken);
}
