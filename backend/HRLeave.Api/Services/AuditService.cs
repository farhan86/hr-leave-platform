using System.Text.Json;
using HRLeave.Api.Data;
using HRLeave.Api.Models;

namespace HRLeave.Api.Services;

public class AuditService(HRLeaveDbContext db)
{
    public async Task LogAsync(int? actingEmployeeId, string actionType, string affectedTable, int recordId, object? oldValues, object? newValues)
    {
        db.AuditLogs.Add(new AuditLog
        {
            ActingEmployeeId = actingEmployeeId,
            ActionType       = actionType,
            AffectedTable    = affectedTable,
            RecordId         = recordId,
            OldValues        = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
            NewValues        = newValues is null ? null : JsonSerializer.Serialize(newValues),
            Timestamp        = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
