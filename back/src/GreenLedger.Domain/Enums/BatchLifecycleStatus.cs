namespace GreenLedger.Domain.Enums;

public enum BatchLifecycleStatus
{
    Draft = 1,
    Active = 2,
    OnHold = 3,
    ReadyForRelease = 4,
    Archived = 5
}
