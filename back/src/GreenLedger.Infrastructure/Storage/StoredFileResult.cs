namespace GreenLedger.Infrastructure.Storage;

internal sealed record StoredFileResult(
    string RelativePath,
    string ContentType,
    long FileSizeInBytes,
    string Sha256Hash);
