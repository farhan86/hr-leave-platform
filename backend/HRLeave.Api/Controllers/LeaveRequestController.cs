using HRLeave.Api.DTOs;
using HRLeave.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HRLeave.Api.Controllers;

[ApiController]
[Route("api/v1/leave-requests")]
[Authorize]
public class LeaveRequestController(LeaveRequestService leaveService, ApprovalService approvalService) : ControllerBase
{
    private int CurrentEmployeeId => int.Parse(User.FindFirstValue("EmployeeId")!);
    private string CurrentRole => User.FindFirstValue("Role") ?? "Employee";

    [HttpGet]
    public async Task<IActionResult> GetMyRequests([FromQuery] int? year, [FromQuery] string? status)
    {
        var (items, _) = await leaveService.GetMyRequestsAsync(CurrentEmployeeId, year, status);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitLeaveRequestDto dto)
    {
        var (id, error) = await leaveService.SubmitAsync(CurrentEmployeeId, dto);
        if (error is not null) return BadRequest(new { error });
        return CreatedAtAction(nameof(GetMyRequests), new { }, new { leaveRequestId = id });
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var error = await leaveService.CancelAsync(id, CurrentEmployeeId);
        if (error is not null) return BadRequest(new { error });
        return NoContent();
    }

    [HttpGet("team")]
    public async Task<IActionResult> GetTeamPending()
    {
        if (CurrentRole != "Manager" && CurrentRole != "Admin")
            return Forbid();

        var (items, _) = await leaveService.GetTeamPendingAsync(CurrentEmployeeId);
        return Ok(items);
    }

    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        if (CurrentRole != "Manager") return Forbid();

        var error = await approvalService.ApproveAsync(id, CurrentEmployeeId);
        if (error is not null) return BadRequest(new { error });
        return NoContent();
    }

    [HttpPut("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectLeaveRequestDto dto)
    {
        if (CurrentRole != "Manager") return Forbid();

        var error = await approvalService.RejectAsync(id, CurrentEmployeeId, dto.RejectionNote);
        if (error is not null) return BadRequest(new { error });
        return NoContent();
    }
}
