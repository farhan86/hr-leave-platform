import { useEffect, useState } from 'react'
import { leaveService } from '../services/leaveService'
import ApprovalDashboard from '../components/ApprovalDashboard'

export default function TeamLeaves() {
  const [requests,     setRequests]     = useState([])
  const [initialLoad,  setInitialLoad]  = useState(true)
  const [error,        setError]        = useState('')

  const load = async (isRefresh = false) => {
    if (!isRefresh) setInitialLoad(true)
    setError('')
    try {
      const res = await leaveService.getTeamPending()
      setRequests(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied — this page is for Managers only.')
      } else {
        setError('Failed to load team leave requests.')
      }
    } finally {
      setInitialLoad(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {initialLoad
              ? 'Loading…'
              : `${requests.length} pending request${requests.length !== 1 ? 's' : ''} from your team`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      {initialLoad ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        !error && <ApprovalDashboard requests={requests} onRefresh={(action) => load(true, action)} />
      )}
    </div>
  )
}
