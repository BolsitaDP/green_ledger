namespace GreenLedger.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string RootPath { get; init; } = "back/storage";
    public long MaxFileSizeInBytes { get; init; } = 10 * 1024 * 1024;
}
