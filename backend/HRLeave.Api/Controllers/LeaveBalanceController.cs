using HRLeave.Api.DTOs;
using HRLeave.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HRLeave.Api.Controllers;

[ApiController]
[Route("api/v1/leave-balance")]
[Authorize]
public class LeaveBalanceController(ILeaveBalanceRepository repo) : ControllerBase
{
    private int CurrentEmployeeId => int.Parse(User.FindFirstValue("EmployeeId")!);
    private string CurrentRole => User.FindFirstValue("Role") ?? "Employee";

    [HttpGet]
    public async Task<IActionResult> GetMyBalance()
    {
        var year = DateTime.UtcNow.Year;
        var balances = await repo.GetByEmployeeAsync(CurrentEmployeeId, year);
        return Ok(balances.Select(lb => new LeaveBalanceResponse(
            lb.LeaveBalanceId,
            lb.LeaveTypeId,
            lb.LeaveType.LeaveTypeName,
            lb.Year,
            lb.TotalEntitled,
            lb.TotalUsed,
            lb.CarryForward,
            lb.Remaining)));
    }

    [HttpGet("{employeeId:int}")]
    public async Task<IActionResult> GetBalanceForEmployee(int employeeId)
    {
        if (CurrentRole != "Manager" && CurrentRole != "Admin")
            return Forbid();

        var year = DateTime.UtcNow.Year;
        var balances = await repo.GetByEmployeeAsync(employeeId, year);
        return Ok(balances.Select(lb => new LeaveBalanceResponse(
            lb.LeaveBalanceId,
            lb.LeaveTypeId,
            lb.LeaveType.LeaveTypeName,
            lb.Year,
            lb.TotalEntitled,
            lb.TotalUsed,
            lb.CarryForward,
            lb.Remaining)));
    }
}
