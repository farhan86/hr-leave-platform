import { useState, useEffect } from 'react'
import { leaveService } from '../services/leaveService'
import { calcWorkingDays } from '../utils/workingDays'

export default function LeaveForm({ leaveTypes, balances, onSuccess }) {
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [reason,      setReason]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)

  const workingDays = calcWorkingDays(startDate, endDate)

  const selectedBalance = balances?.find(
    b => b.leaveTypeId === parseInt(leaveTypeId, 10)
  )
  const remaining = selectedBalance?.remaining ?? null
  const exceeds   = remaining !== null && workingDays > remaining

  // Auto-set end date to start date if end is before start
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) setEndDate(startDate)
  }, [startDate, endDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (exceeds || workingDays === 0) return
    setError('')
    setSubmitting(true)
    try {
      await leaveService.submit({
        leaveTypeId: parseInt(leaveTypeId, 10),
        startDate,
        endDate,
        totalDays: workingDays,
        reason: reason || null,
      })
      setSuccess(true)
      setLeaveTypeId('')
      setStartDate('')
      setEndDate('')
      setReason('')
      if (onSuccess) onSuccess()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      const d = err.response?.data
      setError((typeof d === 'string' ? d : d?.error ?? d?.message ?? d?.title) || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-5">Apply for Leave</h2>

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <span className="text-emerald-600 text-sm font-medium">
            Leave request submitted successfully.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Leave Type</label>
          <select
            value={leaveTypeId}
            onChange={e => setLeaveTypeId(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a leave type…</option>
            {leaveTypes?.map(lt => (
              <option key={lt.leaveTypeId} value={lt.leaveTypeId}>
                {lt.leaveTypeName}
              </option>
            ))}
          </select>
          {selectedBalance && (
            <p className="mt-1 text-xs text-slate-500">
              {selectedBalance.remaining} days remaining of {selectedBalance.totalEntitled}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={e => setStartDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={e => setEndDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {startDate && endDate && (
          <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium border ${
            exceeds
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : workingDays === 0
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <span>
              {workingDays === 0
                ? 'No working days in selected range'
                : `${workingDays} working day${workingDays !== 1 ? 's' : ''}`}
            </span>
            {exceeds && <span>Exceeds balance ({remaining} days left)</span>}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Reason <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Brief reason for your leave…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={submitting || exceeds || workingDays === 0 || !leaveTypeId}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
