namespace HRLeave.Api.DTOs;

public record LeaveTypeResponse(
    int LeaveTypeId,
    string LeaveTypeName,
    decimal DefaultDaysPerYear,
    bool IsCarryForwardAllowed,
    decimal MaxCarryForwardDays
);

public record DepartmentResponse(int DepartmentId, string DepartmentName);

public record EmployeeMeResponse(
    int EmployeeId,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string? DepartmentName,
    DateOnly JoinDate
);
