using HRLeave.Api.Models;

namespace HRLeave.Api.Repositories;

public interface ILeaveRequestRepository
{
    Task<IEnumerable<LeaveRequest>> GetByEmployeeAsync(int employeeId, int? year, string? status);
    Task<IEnumerable<LeaveRequest>> GetTeamPendingAsync(int managerId);
    Task<LeaveRequest?> GetByIdAsync(int leaveRequestId);
    Task<int> SubmitAsync(int employeeId, int leaveTypeId, DateOnly startDate, DateOnly endDate, decimal totalDays, string? reason);
    Task<int> ApproveAsync(int leaveRequestId, int approvedByEmployeeId);
    Task<int> RejectAsync(int leaveRequestId, int rejectedByEmployeeId, string rejectionNote);
    Task<int> CancelAsync(int leaveRequestId, int requestingEmployeeId);
}
