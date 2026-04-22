import { useEffect, useState } from 'react'
import { balanceService } from '../services/balanceService'
import { leaveService } from '../services/leaveService'
import { useAuthStore } from '../store/authStore'
import BalanceCard from '../components/BalanceCard'
import LeaveForm from '../components/LeaveForm'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [balances,     setBalances]     = useState([])
  const [leaveTypes,   setLeaveTypes]   = useState([])
  const [me,           setMe]           = useState(null)
  const [pendingMap,   setPendingMap]   = useState({})
  const [initialLoad,  setInitialLoad]  = useState(true)
  const [warmingUp,    setWarmingUp]    = useState(false)
  const [error,        setError]        = useState('')

  const load = async (isRefresh = false) => {
    if (!isRefresh) setInitialLoad(true)
    setError('')
    setWarmingUp(false)

    const maxRetries = 4
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 5000))
      }
      try {
        const [balRes, ltRes, meRes, reqRes] = await Promise.all([
          balanceService.getMyBalance(),
          balanceService.getLeaveTypes(),
          balanceService.getMe(),
          leaveService.getMyLeaves(new Date().getFullYear(), 'Pending'),
        ])
        setBalances(balRes.data)
        setLeaveTypes(ltRes.data)
        setMe(meRes.data)

        const map = {}
        for (const req of reqRes.data) {
          map[req.leaveTypeId] = (map[req.leaveTypeId] ?? 0) + req.totalDays
        }
        setPendingMap(map)
        setWarmingUp(false)
        setInitialLoad(false)
        return
      } catch {
        if (attempt === maxRetries - 1) {
          setError('Failed to load dashboard data. The server may be unavailable.')
          setWarmingUp(false)
          setInitialLoad(false)
        }
      }
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!initialLoad) return
    const t = setTimeout(() => setWarmingUp(true), 8000)
    return () => clearTimeout(t)
  }, [initialLoad])

  const displayBalances = balances.filter(b => b.totalEntitled > 0)
  const firstName = me?.firstName ?? user?.email?.split('.')[0] ?? 'there'
  const dept      = me?.departmentName
  const year      = new Date().getFullYear()

  if (initialLoad) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        {warmingUp && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <p className="text-amber-700 text-sm">
              Server is waking up — first load on the free tier takes up to 60s. Retrying automatically…
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Good {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {dept && `${dept} · `}Leave overview for {year}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <p className="text-rose-600 text-sm">{error}</p>
        </div>
      )}

      {displayBalances.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Leave Balances · {year}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayBalances.map(b => (
              <BalanceCard
                key={b.leaveTypeId}
                leaveType={b.leaveTypeName ?? `Type #${b.leaveTypeId}`}
                balance={b}
                pendingDays={pendingMap[b.leaveTypeId] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <LeaveForm
          leaveTypes={leaveTypes.filter(lt => lt.defaultDaysPerYear > 0)}
          balances={balances}
          onSuccess={() => load(true)}
        />
      </section>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
