using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace GreenLedger.Infrastructure.Storage;

internal sealed class LocalDocumentStorage(
    IHostEnvironment hostEnvironment,
    IOptions<StorageOptions> options) : ILocalDocumentStorage
{
    private readonly StorageOptions _options = options.Value;
    private readonly string _rootPath = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, options.Value.RootPath));

    public async Task<StoredFileResult> SaveAsync(
        Guid batchId,
        string originalFileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(_rootPath);

        var sanitizedFileName = Path.GetFileName(originalFileName);
        var extension = Path.GetExtension(sanitizedFileName);
        var generatedFileName = $"{Guid.NewGuid():N}{extension}";
        var batchFolder = Path.Combine(_rootPath, batchId.ToString("N"));
        Directory.CreateDirectory(batchFolder);

        var absolutePath = Path.Combine(batchFolder, generatedFileName);

        await using var fileStream = File.Create(absolutePath);
        using var sha256 = SHA256.Create();
        await using var cryptoStream = new CryptoStream(fileStream, sha256, CryptoStreamMode.Write);

        long fileSizeInBytes = 0;
        var buffer = new byte[81920];
        int bytesRead;

        while ((bytesRead = await content.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
        {
            fileSizeInBytes += bytesRead;

            if (fileSizeInBytes > _options.MaxFileSizeInBytes)
            {
                cryptoStream.Close();
                fileStream.Close();
                File.Delete(absolutePath);
                throw new InvalidOperationException("The uploaded file exceeds the maximum allowed size.");
            }

            await cryptoStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken);
        }

        await cryptoStream.FlushFinalBlockAsync(cancellationToken);

        var relativePath = Path.GetRelativePath(_rootPath, absolutePath).Replace('\\', '/');
        var sha256Hash = Convert.ToHexString(sha256.Hash ?? []).ToLowerInvariant();

        return new StoredFileResult(relativePath, contentType, fileSizeInBytes, sha256Hash);
    }

    public Task<Stream> OpenReadAsync(string relativePath, CancellationToken cancellationToken)
    {
        var absolutePath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));

        if (!absolutePath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid storage path.");
        }

        if (!File.Exists(absolutePath))
        {
            throw new FileNotFoundException("Document file was not found.", absolutePath);
        }

        Stream stream = File.OpenRead(absolutePath);
        return Task.FromResult(stream);
    }
}
