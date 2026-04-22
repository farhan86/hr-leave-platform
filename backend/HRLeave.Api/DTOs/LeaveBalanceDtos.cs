namespace HRLeave.Api.DTOs;

public record LeaveBalanceResponse(
    int LeaveBalanceId,
    int LeaveTypeId,
    string LeaveTypeName,
    int Year,
    decimal TotalEntitled,
    decimal TotalUsed,
    decimal CarryForward,
    decimal Remaining
);
