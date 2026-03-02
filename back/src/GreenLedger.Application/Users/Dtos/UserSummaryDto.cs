namespace GreenLedger.Application.Users.Dtos;

public sealed record UserSummaryDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive);
