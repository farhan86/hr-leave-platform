import { useState } from 'react'

export default function RejectModal({ request, onConfirm, onClose }) {
  const [note,        setNote]        = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')

  if (!request) return null

  const handleConfirm = async () => {
    if (!note.trim()) {
      setError('Rejection note is required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(request.leaveRequestId, note.trim())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-900">Reject Leave Request</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-1">
          <p className="text-sm font-medium text-slate-800">
            {request.employeeName}
          </p>
          <p className="text-xs text-slate-500">
            {request.leaveTypeName} · {request.totalDays} day{request.totalDays !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-500">
            {request.startDateDisplay} – {request.endDateDisplay}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Rejection Note <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={e => { setNote(e.target.value); setError('') }}
            rows={3}
            placeholder="Explain why this request is being rejected…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">This note will be visible to the employee.</p>
        </div>

        {error && (
          <p className="text-rose-500 text-xs mb-4">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {submitting ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  )
}
