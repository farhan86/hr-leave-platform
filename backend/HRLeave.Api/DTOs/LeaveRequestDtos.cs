namespace HRLeave.Api.DTOs;

public record SubmitLeaveRequestDto(
    int LeaveTypeId,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal TotalDays,
    string? Reason
);

public record RejectLeaveRequestDto(string RejectionNote);

public record LeaveRequestResponse(
    int LeaveRequestId,
    int EmployeeId,
    string EmployeeName,
    int LeaveTypeId,
    string LeaveTypeName,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal TotalDays,
    string Status,
    string? Reason,
    string? RejectionNote,
    string? ApproverName,
    DateTime? ApprovedAt,
    DateTime CreatedAt
);
