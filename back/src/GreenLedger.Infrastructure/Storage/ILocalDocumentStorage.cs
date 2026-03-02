namespace GreenLedger.Infrastructure.Storage;

internal interface ILocalDocumentStorage
{
    Task<StoredFileResult> SaveAsync(
        Guid batchId,
        string originalFileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken);

    Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken);
}
