import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate  = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        key={to}
        to={to}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        {label}
      </Link>
    )
  }

  const initials = user?.email
    ? user.email.split('.')[0].slice(0, 1).toUpperCase() +
      (user.email.split('.')[1]?.slice(0, 1).toUpperCase() ?? '')
    : '?'

  const displayName = user?.email
    ? user.email
        .split('@')[0]
        .split('.')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
    : ''

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">HR</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">Leave Platform</span>
        </div>

        <div className="flex items-center gap-1">
          {navLink('/', 'Dashboard')}
          {navLink('/my-leaves', 'My Leaves')}
          {(user?.role === 'Manager' || user?.role === 'Admin') &&
            navLink('/team-leaves', 'Team Leaves')}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-700 text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-800 leading-none">{displayName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
