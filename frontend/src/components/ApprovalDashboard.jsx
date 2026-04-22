import { useState } from 'react'
import { leaveService } from '../services/leaveService'
import RejectModal from './RejectModal'
import { fmtDate, timeAgo } from '../utils/workingDays'

export default function ApprovalDashboard({ requests, onRefresh }) {
  const [rejectTarget, setRejectTarget] = useState(null)
  const [actionId,     setActionId]     = useState(null)
  const [successMsg,   setSuccessMsg]   = useState('')
  const [error,        setError]        = useState('')

  const handleApprove = async (id) => {
    setActionId(id)
    setError('')
    try {
      await leaveService.approve(id)
      setSuccessMsg('Leave request approved successfully.')
      setTimeout(() => setSuccessMsg(''), 3000)
      onRefresh()
    } catch (err) {
      const d = err.response?.data
      setError((typeof d === 'string' ? d : d?.error ?? d?.message ?? d?.title) || 'Failed to approve.')
    } finally {
      setActionId(null)
    }
  }

  const handleRejectConfirm = async (id, note) => {
    try {
      await leaveService.reject(id, note)
      setRejectTarget(null)
      setSuccessMsg('Leave request rejected.')
      setTimeout(() => setSuccessMsg(''), 3000)
      onRefresh()
    } catch (err) {
      const d = err.response?.data
      setRejectTarget(null)
      setError((typeof d === 'string' ? d : d?.error ?? d?.message ?? d?.title) || 'Failed to reject.')
    }
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <div className="text-3xl mb-3">✓</div>
        <p className="text-slate-600 font-medium">All caught up</p>
        <p className="text-slate-400 text-sm mt-1">No pending leave requests from your team.</p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-emerald-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map(req => {
          const employeeName  = req.employeeName ?? `Employee #${req.employeeId}`
          const leaveTypeName = req.leaveTypeName ?? '—'
          const isActioning   = actionId === req.leaveRequestId

          const enriched = {
            ...req,
            employeeName,
            leaveTypeName,
            startDateDisplay: fmtDate(req.startDate),
            endDateDisplay:   fmtDate(req.endDate),
          }

          return (
            <div
              key={req.leaveRequestId}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">{employeeName}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {leaveTypeName} · {req.totalDays} day{req.totalDays !== 1 ? 's' : ''}
                    {' · '}{fmtDate(req.startDate)} – {fmtDate(req.endDate)}
                  </p>
                  {req.reason && (
                    <p className="mt-2 text-sm text-slate-600 italic">"{req.reason}"</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <p className="text-xs text-slate-400">{timeAgo(req.createdAt)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(req.leaveRequestId)}
                      disabled={isActioning}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {isActioning ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectTarget(enriched)}
                      disabled={isActioning}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 disabled:opacity-40 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <RejectModal
        request={rejectTarget}
        onConfirm={handleRejectConfirm}
        onClose={() => setRejectTarget(null)}
      />
    </>
  )
}
