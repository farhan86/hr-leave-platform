namespace HRLeave.Api.Models;

public class AuditLog
{
    public int AuditLogId { get; set; }
    public int? ActingEmployeeId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string AffectedTable { get; set; } = string.Empty;
    public int RecordId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public DateTime Timestamp { get; set; }
}
