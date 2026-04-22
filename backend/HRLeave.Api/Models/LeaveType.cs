namespace HRLeave.Api.Models;

public class LeaveType
{
    public int LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = string.Empty;
    public decimal DefaultDaysPerYear { get; set; }
    public bool IsCarryForwardAllowed { get; set; }
    public decimal MaxCarryForwardDays { get; set; }
    public bool RequiresApproval { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
