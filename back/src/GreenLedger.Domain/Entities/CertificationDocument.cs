using GreenLedger.Domain.Common;
using GreenLedger.Domain.Enums;

namespace GreenLedger.Domain.Entities;

public sealed class CertificationDocument : BaseEntity
{
    private CertificationDocument()
    {
    }

    public CertificationDocument(
        Guid batchId,
        string fileName,
        string blobPath,
        string sha256Hash,
        string contentType,
        long fileSizeInBytes,
        int version,
        DateTimeOffset? expiresAtUtc,
        string uploadedByUserId)
    {
        BatchId = batchId;
        FileName = fileName;
        BlobPath = blobPath;
        Sha256Hash = sha256Hash;
        ContentType = contentType;
        FileSizeInBytes = fileSizeInBytes;
        Version = version;
        ExpiresAtUtc = expiresAtUtc;
        UploadedByUserId = uploadedByUserId;
        Status = DocumentStatus.PendingReview;
    }

    public Guid BatchId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string BlobPath { get; private set; } = string.Empty;
    public string Sha256Hash { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSizeInBytes { get; private set; }
    public int Version { get; private set; }
    public DateTimeOffset? ExpiresAtUtc { get; private set; }
    public string UploadedByUserId { get; private set; } = string.Empty;
    public DocumentStatus Status { get; private set; }

    public void ApplyStorageMetadataDefaults(string contentType, long fileSizeInBytes)
    {
        if (string.IsNullOrWhiteSpace(ContentType))
        {
            ContentType = contentType;
        }

        if (FileSizeInBytes == 0)
        {
            FileSizeInBytes = fileSizeInBytes;
        }
    }
}
