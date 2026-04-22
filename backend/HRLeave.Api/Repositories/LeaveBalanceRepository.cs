using HRLeave.Api.Data;
using HRLeave.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRLeave.Api.Repositories;

public class LeaveBalanceRepository(HRLeaveDbContext db) : ILeaveBalanceRepository
{
    public async Task<IEnumerable<LeaveBalance>> GetByEmployeeAsync(int employeeId, int year)
    {
        return await db.LeaveBalances
            .Include(lb => lb.LeaveType)
            .Where(lb => lb.EmployeeId == employeeId && lb.Year == year)
            .OrderBy(lb => lb.LeaveType.LeaveTypeName)
            .ToListAsync();
    }
}
