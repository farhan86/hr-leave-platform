using HRLeave.Api.Data;
using HRLeave.Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace HRLeave.Api.Repositories;

public class LeaveRequestRepository(HRLeaveDbContext db) : ILeaveRequestRepository
{
    public async Task<IEnumerable<LeaveRequest>> GetByEmployeeAsync(int employeeId, int? year, string? status)
    {
        var query = db.LeaveRequests
            .Include(lr => lr.Employee)
            .Include(lr => lr.LeaveType)
            .Include(lr => lr.ApprovedByEmployee)
            .Where(lr => lr.EmployeeId == employeeId);

        if (year.HasValue)
            query = query.Where(lr => lr.StartDate.Year == year.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(lr => lr.Status == status);

        return await query.OrderByDescending(lr => lr.CreatedAt).ToListAsync();
    }

    public async Task<IEnumerable<LeaveRequest>> GetTeamPendingAsync(int managerId)
    {
        return await db.LeaveRequests
            .Include(lr => lr.Employee)
            .Include(lr => lr.LeaveType)
            .Where(lr => lr.Employee.ManagerId == managerId && lr.Status == "Pending")
            .OrderBy(lr => lr.CreatedAt)
            .ToListAsync();
    }

    public async Task<LeaveRequest?> GetByIdAsync(int leaveRequestId)
    {
        return await db.LeaveRequests
            .Include(lr => lr.Employee)
            .Include(lr => lr.LeaveType)
            .Include(lr => lr.ApprovedByEmployee)
            .FirstOrDefaultAsync(lr => lr.LeaveRequestId == leaveRequestId);
    }

    public async Task<int> SubmitAsync(int employeeId, int leaveTypeId, DateOnly startDate, DateOnly endDate, decimal totalDays, string? reason)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.CommandText = "dbo.sp_SubmitLeaveRequest";

            cmd.Parameters.Add(new SqlParameter("@EmployeeId", employeeId));
            cmd.Parameters.Add(new SqlParameter("@LeaveTypeId", leaveTypeId));
            cmd.Parameters.Add(new SqlParameter("@StartDate", startDate.ToDateTime(TimeOnly.MinValue)));
            cmd.Parameters.Add(new SqlParameter("@EndDate", endDate.ToDateTime(TimeOnly.MinValue)));
            cmd.Parameters.Add(new SqlParameter("@TotalDays", totalDays));
            cmd.Parameters.Add(new SqlParameter("@Reason", (object?)reason ?? DBNull.Value));

            var newIdParam = new SqlParameter("@NewLeaveRequestId", System.Data.SqlDbType.Int)
            {
                Direction = System.Data.ParameterDirection.Output
            };
            cmd.Parameters.Add(newIdParam);

            var returnParam = new SqlParameter
            {
                Direction = System.Data.ParameterDirection.ReturnValue
            };
            cmd.Parameters.Add(returnParam);

            await cmd.ExecuteNonQueryAsync();

            var rc = returnParam.Value is int r ? r : 0;
            if (rc != 0) return rc; // negative error code — caller maps to 400

            return newIdParam.Value is int id ? id : 0;
        }
        finally
        {
            await conn.CloseAsync();
        }
    }

    public async Task<int> ApproveAsync(int leaveRequestId, int approvedByEmployeeId)
    {
        return await ExecuteSpAsync(
            "EXEC dbo.sp_ApproveLeaveRequest @LeaveRequestId, @ApprovedByEmployeeId",
            new SqlParameter("@LeaveRequestId", leaveRequestId),
            new SqlParameter("@ApprovedByEmployeeId", approvedByEmployeeId));
    }

    public async Task<int> RejectAsync(int leaveRequestId, int rejectedByEmployeeId, string rejectionNote)
    {
        return await ExecuteSpAsync(
            "EXEC dbo.sp_RejectLeaveRequest @LeaveRequestId, @RejectionNote, @RejectedByEmployeeId",
            new SqlParameter("@LeaveRequestId", leaveRequestId),
            new SqlParameter("@RejectionNote", rejectionNote),
            new SqlParameter("@RejectedByEmployeeId", rejectedByEmployeeId));
    }

    public async Task<int> CancelAsync(int leaveRequestId, int requestingEmployeeId)
    {
        return await ExecuteSpAsync(
            "EXEC dbo.sp_CancelLeaveRequest @LeaveRequestId, @RequestingEmployeeId",
            new SqlParameter("@LeaveRequestId", leaveRequestId),
            new SqlParameter("@RequestingEmployeeId", requestingEmployeeId));
    }

    // Helper: run an SP and capture the RETURN value
    private async Task<int> ExecuteSpAsync(string sql, params SqlParameter[] parameters)
    {
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandType = System.Data.CommandType.Text;
        cmd.CommandText = $"DECLARE @rc INT; {sql.Replace("EXEC ", "EXEC @rc = ")}; SELECT @rc";
        foreach (var p in parameters) cmd.Parameters.Add(p);
        var result = await cmd.ExecuteScalarAsync();
        await conn.CloseAsync();
        return result is int rc ? rc : 0;
    }
}
