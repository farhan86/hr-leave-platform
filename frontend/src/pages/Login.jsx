import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ROLES = [
  {
    role: 'Employee',
    name: 'Tanvir Hossain',
    dept: 'Information Technology',
    employeeId: 3,
    description: 'Submit and track your own leave requests',
    color: 'indigo',
  },
  {
    role: 'Manager',
    name: 'Farhan Ahmed',
    dept: 'Engineering',
    employeeId: 1,
    description: 'Approve or reject team leave requests',
    color: 'violet',
  },
  {
    role: 'Admin',
    name: 'Nadia Rahman',
    dept: 'Human Resources',
    employeeId: 2,
    description: 'View all leave balances and team data',
    color: 'slate',
  },
]

const colorMap = {
  indigo: {
    badge:  'bg-indigo-100 text-indigo-700',
    avatar: 'bg-indigo-100 text-indigo-700',
    btn:    'bg-indigo-600 hover:bg-indigo-700 text-white',
    border: 'hover:border-indigo-300',
  },
  violet: {
    badge:  'bg-violet-100 text-violet-700',
    avatar: 'bg-violet-100 text-violet-700',
    btn:    'bg-violet-600 hover:bg-violet-700 text-white',
    border: 'hover:border-violet-300',
  },
  slate: {
    badge:  'bg-slate-100 text-slate-700',
    avatar: 'bg-slate-200 text-slate-700',
    btn:    'bg-slate-700 hover:bg-slate-800 text-white',
    border: 'hover:border-slate-400',
  },
}

export default function Login() {
  const { login, user } = useAuthStore()
  const navigate = useNavigate()
  if (user) {
    navigate('/')
    return null
  }

  const handleLogin = (role) => {
    login(role)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">HR</span>
          </div>
          <span className="text-xl font-bold text-slate-900">Leave Platform</span>
        </div>
        <p className="text-slate-500 text-sm">
          Portfolio demo by <span className="text-slate-800 font-medium">Farhan Ahmed</span> ·
          Select a role to sign in
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
        {ROLES.map(({ role, name, dept, employeeId, description, color }) => {
          const c = colorMap[color]
          const initials = name.split(' ').map(p => p[0]).join('')

          return (
            <div
              key={role}
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 transition-all ${c.border} cursor-pointer group`}
              onClick={() => handleLogin(role)}
            >
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${c.avatar}`}>
                  {initials}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
                  {role}
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{dept}</p>
                <p className="text-xs text-slate-400 mt-0.5">Employee ID #{employeeId}</p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>

              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.btn}`}
              >
                Sign in as {role}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Pre-configured mock JWT tokens — no real authentication
      </p>
    </div>
  )
}
