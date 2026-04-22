export default function BalanceCard({ leaveType, balance, pendingDays = 0 }) {
  const remaining = balance?.remaining    ?? 0
  const entitled  = balance?.totalEntitled ?? 0
  const used      = balance?.totalUsed    ?? 0
  const pct       = entitled > 0 ? Math.round((remaining / entitled) * 100) : 0

  const barColor =
    pct > 60 ? 'bg-emerald-500' :
    pct > 25 ? 'bg-amber-400'   :
               'bg-rose-400'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{leaveType}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
          pct > 60 ? 'bg-emerald-50 text-emerald-700' :
          pct > 25 ? 'bg-amber-50 text-amber-700'     :
                     'bg-rose-50 text-rose-600'
        }`}>
          {pct}%
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900">{remaining}</p>
        <p className="text-xs text-slate-400 mt-0.5">of {entitled} days remaining</p>
      </div>

      <div className="space-y-1">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{used} used · {balance?.carryForward ?? 0} carry-fwd</span>
          {pendingDays > 0 && (
            <span className="text-amber-500 font-medium">{pendingDays}d pending</span>
          )}
        </div>
      </div>
    </div>
  )
}
