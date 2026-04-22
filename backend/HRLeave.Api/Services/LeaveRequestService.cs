using HRLeave.Api.DTOs;
using HRLeave.Api.Repositories;

namespace HRLeave.Api.Services;

public class LeaveRequestService(
    ILeaveRequestRepository repo,
    AuditService audit)
{
    private static readonly Dictionary<int, string> SpErrors = new()
    {
        [-1] = "Employee not found or inactive.",
        [-2] = "Leave type not found or inactive.",
        [-3] = "End date must be on or after start date.",
        [-4] = "No leave balance record found for this year.",
        [-5] = "Insufficient leave balance.",
        [-6] = "An overlapping leave request already exists.",
    };

    public async Task<(int? Id, string? Error)> SubmitAsync(int employeeId, SubmitLeaveRequestDto dto)
    {
        var newId = await repo.SubmitAsync(employeeId, dto.LeaveTypeId, dto.StartDate, dto.EndDate, dto.TotalDays, dto.Reason);

        if (newId <= 0)
            return (null, SpErrors.GetValueOrDefault(newId, "Submission failed."));

        await audit.LogAsync(employeeId, "INSERT", "LeaveRequest", newId, null,
            new { dto.LeaveTypeId, dto.StartDate, dto.EndDate, dto.TotalDays, Status = "Pending" });

        return (newId, null);
    }

    public async Task<string?> CancelAsync(int leaveRequestId, int requestingEmployeeId)
    {
        var before = await repo.GetByIdAsync(leaveRequestId);
        if (before is null) return "Leave request not found.";

        var rc = await repo.CancelAsync(leaveRequestId, requestingEmployeeId);
        if (rc != 0)
            return rc == -2 ? "You can only cancel your own requests."
                 : rc == -3 ? "Only Pending requests can be cancelled."
                 : "Cancellation failed.";

        await audit.LogAsync(requestingEmployeeId, "UPDATE", "LeaveRequest", leaveRequestId,
            new { before.Status }, new { Status = "Cancelled" });

        return null;
    }

    public async Task<(IEnumerable<LeaveRequestResponse> Items, string? Error)> GetMyRequestsAsync(
        int employeeId, int? year, string? status)
    {
        var requests = await repo.GetByEmployeeAsync(employeeId, year, status);
        return (requests.Select(ToResponse), null);
    }

    public async Task<(IEnumerable<LeaveRequestResponse> Items, string? Error)> GetTeamPendingAsync(int managerId)
    {
        var requests = await repo.GetTeamPendingAsync(managerId);
        return (requests.Select(ToResponse), null);
    }

    private static LeaveRequestResponse ToResponse(Models.LeaveRequest lr) => new(
        lr.LeaveRequestId,
        lr.EmployeeId,
        $"{lr.Employee?.FirstName} {lr.Employee?.LastName}".Trim(),
        lr.LeaveTypeId,
        lr.LeaveType?.LeaveTypeName ?? "",
        lr.StartDate,
        lr.EndDate,
        lr.TotalDays,
        lr.Status,
        lr.Reason,
        lr.RejectionNote,
        lr.ApprovedByEmployee is null ? null : $"{lr.ApprovedByEmployee.FirstName} {lr.ApprovedByEmployee.LastName}",
        lr.ApprovedAt,
        lr.CreatedAt
    );
}
