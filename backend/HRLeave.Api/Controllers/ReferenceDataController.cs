using HRLeave.Api.Data;
using HRLeave.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HRLeave.Api.Controllers;

[ApiController]
[Authorize]
public class ReferenceDataController(HRLeaveDbContext db) : ControllerBase
{
    private int CurrentEmployeeId => int.Parse(User.FindFirstValue("EmployeeId")!);

    [HttpGet("api/v1/leave-types")]
    public async Task<IActionResult> GetLeaveTypes()
    {
        var types = await db.LeaveTypes
            .Where(lt => lt.IsActive)
            .OrderBy(lt => lt.LeaveTypeName)
            .Select(lt => new LeaveTypeResponse(
                lt.LeaveTypeId,
                lt.LeaveTypeName,
                lt.DefaultDaysPerYear,
                lt.IsCarryForwardAllowed,
                lt.MaxCarryForwardDays))
            .ToListAsync();
        return Ok(types);
    }

    [HttpGet("api/v1/departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var depts = await db.Departments
            .OrderBy(d => d.DepartmentName)
            .Select(d => new DepartmentResponse(d.DepartmentId, d.DepartmentName))
            .ToListAsync();
        return Ok(depts);
    }

    [HttpGet("api/v1/employees/me")]
    public async Task<IActionResult> GetMe()
    {
        var emp = await db.Employees
            .Include(e => e.Department)
            .FirstOrDefaultAsync(e => e.EmployeeId == CurrentEmployeeId);

        if (emp is null) return NotFound();

        return Ok(new EmployeeMeResponse(
            emp.EmployeeId,
            emp.FirstName,
            emp.LastName,
            emp.Email,
            emp.Role,
            emp.Department?.DepartmentName,
            emp.JoinDate));
    }
}
