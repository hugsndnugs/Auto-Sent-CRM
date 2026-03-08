import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  LayoutDashboard,
  Users,
  Building2,
  HandCoins,
  Activity,
  Ticket,
  Megaphone,
  Search,
  Settings,
  LogOut,
} from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/deals', icon: HandCoins, label: 'Deals' },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 bg-slate-900 text-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="font-semibold text-lg text-white">Auto-Sent CRM</h1>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-300'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-700">
          <div className="px-3 py-2 text-xs text-slate-400 truncate">
            {profile?.display_name || 'User'}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
