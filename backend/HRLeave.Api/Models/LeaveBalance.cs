namespace HRLeave.Api.Models;

public class LeaveBalance
{
    public int LeaveBalanceId { get; set; }
    public int EmployeeId { get; set; }
    public int LeaveTypeId { get; set; }
    public int Year { get; set; }
    public decimal TotalEntitled { get; set; }
    public decimal TotalUsed { get; set; }
    public decimal CarryForward { get; set; }
    // Remaining is a computed column in DB — mapped as read-only
    public decimal Remaining { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}
