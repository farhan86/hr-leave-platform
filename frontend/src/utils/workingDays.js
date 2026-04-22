// Bangladesh public holidays 2026 (approximate Islamic dates based on moon sighting)
// Weekend: Friday (5) and Saturday (6); working week is Sunday–Thursday
const BD_HOLIDAYS_2026 = new Set([
  '2026-01-01', // New Year's Day
  '2026-02-14', // Shab-e-Barat (approx)
  '2026-02-21', // International Mother Language Day / Shaheed Dibosh
  '2026-03-17', // Birthday of Sheikh Mujibur Rahman
  '2026-03-26', // Independence Day
  '2026-03-30', // Eid ul-Fitr Day 1 (approx)
  '2026-03-31', // Eid ul-Fitr Day 2 (approx)
  '2026-04-01', // Eid ul-Fitr Day 3 (approx)
  '2026-04-14', // Pohela Boishakh (Bengali New Year)
  '2026-05-01', // May Day
  '2026-06-06', // Eid ul-Adha Day 1 (approx)
  '2026-06-07', // Eid ul-Adha Day 2 (approx)
  '2026-06-08', // Eid ul-Adha Day 3 (approx)
  '2026-07-27', // Ashura (approx)
  '2026-08-15', // National Mourning Day
  '2026-09-04', // Eid-e-Miladunnabi (approx)
  '2026-10-02', // Durga Puja (approx)
  '2026-12-16', // Victory Day
  '2026-12-25', // Christmas Day
])

/**
 * Count working days between two ISO date strings (inclusive).
 * Excludes Friday, Saturday, and Bangladesh public holidays.
 */
export function calcWorkingDays(startIso, endIso) {
  if (!startIso || !endIso) return 0

  const start = new Date(startIso)
  const end   = new Date(endIso)
  if (end < start) return 0

  let count = 0
  const cur = new Date(start)

  while (cur <= end) {
    const day = cur.getDay() // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
    const iso = cur.toISOString().slice(0, 10)
    if (day !== 5 && day !== 6 && !BD_HOLIDAYS_2026.has(iso)) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }

  return count
}

/** Format a date string as "DD MMM YYYY" */
export function fmtDate(isoOrDate) {
  if (!isoOrDate) return '—'
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Relative time helper: "2 days ago", "just now" */
export function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
