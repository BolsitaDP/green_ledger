using GreenLedger.Domain.Common;
using GreenLedger.Domain.Enums;

namespace GreenLedger.Domain.Entities;

public sealed class Batch : BaseEntity
{
    private readonly List<BatchMovement> _movements = [];
    private readonly List<CertificationDocument> _documents = [];

    private Batch()
    {
    }

    public Batch(string batchNumber, string productName, string cultivarName, string tenantId)
    {
        BatchNumber = batchNumber;
        ProductName = productName;
        CultivarName = cultivarName;
        TenantId = tenantId;
        CurrentStage = BatchStage.Cultivation;
        Status = BatchLifecycleStatus.Active;
    }

    public string BatchNumber { get; private set; } = string.Empty;
    public string ProductName { get; private set; } = string.Empty;
    public string CultivarName { get; private set; } = string.Empty;
    public string TenantId { get; private set; } = string.Empty;
    public BatchStage CurrentStage { get; private set; }
    public BatchLifecycleStatus Status { get; private set; }
    public IReadOnlyCollection<BatchMovement> Movements => _movements;
    public IReadOnlyCollection<CertificationDocument> Documents => _documents;

    public BatchMovement MoveTo(BatchStage nextStage, string actorUserId, string notes)
    {
        if (nextStage == CurrentStage)
        {
            throw new InvalidOperationException("Batch is already in the requested stage.");
        }

        var movement = new BatchMovement(Id, CurrentStage, nextStage, actorUserId, notes);
        _movements.Add(movement);
        CurrentStage = nextStage;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
        return movement;
    }

    public void ChangeStatus(BatchLifecycleStatus newStatus)
    {
        if (newStatus == Status)
        {
            return;
        }

        Status = newStatus;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    public CertificationDocument AddDocument(
        string fileName,
        string blobPath,
        string sha256Hash,
        string contentType,
        long fileSizeInBytes,
        int version,
        DateTimeOffset? expiresAtUtc,
        string uploadedByUserId)
    {
        var document = new CertificationDocument(
            Id,
            fileName,
            blobPath,
            sha256Hash,
            contentType,
            fileSizeInBytes,
            version,
            expiresAtUtc,
            uploadedByUserId);

        _documents.Add(document);

        UpdatedAtUtc = DateTimeOffset.UtcNow;
        return document;
    }
}
