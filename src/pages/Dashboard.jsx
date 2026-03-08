import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Users, Building2, HandCoins, Ticket, Activity } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({
    contacts: 0,
    companies: 0,
    openDeals: 0,
    openTickets: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = user?.id
    if (!uid) return

    async function load() {
      const [contactsRes, companiesRes, dealsRes, ticketsRes, activitiesRes] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${uid},owner_id.is.null`),
        supabase.from('companies').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${uid},owner_id.is.null`),
        supabase.from('deals').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${uid},owner_id.is.null`).is('closed_at', null),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'waiting']),
        supabase.from('activities').select('id, type, subject, occurred_at, contact_id').or(`owner_id.eq.${uid},owner_id.is.null`).order('occurred_at', { ascending: false }).limit(10),
      ])
      setCounts({
        contacts: contactsRes.count ?? 0,
        companies: companiesRes.count ?? 0,
        openDeals: dealsRes.count ?? 0,
        openTickets: ticketsRes.count ?? 0,
      })
      setRecentActivities(activitiesRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [user?.id])

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>

  const cards = [
    { label: 'Contacts', value: counts.contacts, icon: Users, to: '/contacts', color: 'bg-blue-500' },
    { label: 'Companies', value: counts.companies, icon: Building2, to: '/companies', color: 'bg-emerald-500' },
    { label: 'Open deals', value: counts.openDeals, icon: HandCoins, to: '/deals', color: 'bg-amber-500' },
    { label: 'Open tickets', value: counts.openTickets, icon: Ticket, to: '/tickets', color: 'bg-violet-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`${color} rounded-lg p-3 text-white`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-slate-800">{value}</div>
              <div className="text-sm text-slate-600">{label}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-500" />
          <h2 className="font-medium text-slate-800">Recent activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivities.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No recent activity</div>
          ) : (
            recentActivities.map((a) => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-slate-700 capitalize">{a.type}</span>
                <span className="text-slate-500 truncate max-w-xs">{a.subject || '—'}</span>
                <span className="text-slate-400">{new Date(a.occurred_at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
