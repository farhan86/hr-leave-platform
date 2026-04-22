import { useEffect, useState } from 'react'
import { leaveService } from '../services/leaveService'
import { fmtDate } from '../utils/workingDays'

const STATUS_STYLES = {
  Approved:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  Pending:   { dot: 'bg-amber-400',   badge: 'bg-amber-50  text-amber-700'   },
  Rejected:  { dot: 'bg-rose-400',    badge: 'bg-rose-50   text-rose-700'    },
  Cancelled: { dot: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-500'   },
}

export default function MyLeaves() {
  const [requests,   setRequests]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelId,   setCancelId]   = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await leaveService.getMyLeaves(yearFilter || undefined, statusFilter || undefined)
      setRequests(res.data)
    } catch {
      setError('Failed to load leave requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [yearFilter, statusFilter])

  const handleCancel = async (id) => {
    setCancelId(id)
    try {
      await leaveService.cancel(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.')
    } finally {
      setCancelId(null)
    }
  }

  const years = ['2025', '2026', '2027']

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Leave History</h1>
          <p className="text-sm text-slate-500 mt-0.5">All your submitted leave requests</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 font-medium">No leave requests found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or submit a new request.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Leave Type
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Dates
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Days
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.map(req => {
                const styles  = STATUS_STYLES[req.status] ?? STATUS_STYLES.Cancelled
                const isPending = req.status === 'Pending'
                const isCancelling = cancelId === req.leaveRequestId

                return (
                  <tr key={req.leaveRequestId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {req.leaveTypeName ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {fmtDate(req.startDate)} – {fmtDate(req.endDate)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {req.totalDays}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${styles.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                          {req.status}
                        </span>
                        {req.status === 'Rejected' && req.rejectionNote && (
                          <span className="text-xs text-slate-500 italic">
                            "{req.rejectionNote}"
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isPending && (
                        <button
                          onClick={() => handleCancel(req.leaveRequestId)}
                          disabled={isCancelling}
                          className="text-xs text-rose-500 hover:text-rose-700 font-medium disabled:opacity-40"
                        >
                          {isCancelling ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
