using HRLeave.Api.Repositories;

namespace HRLeave.Api.Services;

public class ApprovalService(
    ILeaveRequestRepository repo,
    AuditService audit)
{
    public async Task<string?> ApproveAsync(int leaveRequestId, int approvedByEmployeeId)
    {
        var before = await repo.GetByIdAsync(leaveRequestId);
        if (before is null) return "Leave request not found.";

        var rc = await repo.ApproveAsync(leaveRequestId, approvedByEmployeeId);
        if (rc != 0)
            return rc == -2 ? "Only Pending requests can be approved."
                 : rc == -3 ? "Approver not found or inactive."
                 : rc == -4 ? "Insufficient balance at approval time."
                 : "Approval failed.";

        await audit.LogAsync(approvedByEmployeeId, "UPDATE", "LeaveRequest", leaveRequestId,
            new { before.Status }, new { Status = "Approved", ApprovedByEmployeeId = approvedByEmployeeId });

        return null;
    }

    public async Task<string?> RejectAsync(int leaveRequestId, int rejectedByEmployeeId, string rejectionNote)
    {
        var before = await repo.GetByIdAsync(leaveRequestId);
        if (before is null) return "Leave request not found.";

        var rc = await repo.RejectAsync(leaveRequestId, rejectedByEmployeeId, rejectionNote);
        if (rc != 0)
            return rc == -2 ? "Only Pending requests can be rejected."
                 : rc == -3 ? "Rejection note is required."
                 : "Rejection failed.";

        await audit.LogAsync(rejectedByEmployeeId, "UPDATE", "LeaveRequest", leaveRequestId,
            new { before.Status }, new { Status = "Rejected", RejectionNote = rejectionNote });

        return null;
    }
}
