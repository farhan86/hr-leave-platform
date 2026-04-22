using HRLeave.Api.Models;

namespace HRLeave.Api.Repositories;

public interface ILeaveBalanceRepository
{
    Task<IEnumerable<LeaveBalance>> GetByEmployeeAsync(int employeeId, int year);
}
