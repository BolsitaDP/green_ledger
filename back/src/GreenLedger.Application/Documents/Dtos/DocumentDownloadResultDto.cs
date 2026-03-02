namespace GreenLedger.Application.Documents.Dtos;

public sealed record DocumentDownloadResultDto(
    string FileName,
    string ContentType,
    Stream Content);
