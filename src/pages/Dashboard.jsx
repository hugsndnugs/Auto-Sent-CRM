import { useEffect, useState, useCallback } from 'react'
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
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const uid = user?.id
    if (!uid) return
    setError('')
    setLoading(true)
    const [contactsRes, companiesRes, dealsRes, ticketsRes, activitiesRes] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${uid},owner_id.is.null`),
      supabase.from('companies').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${uid},owner_id.is.null`),
      supabase.from('deals').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${uid},owner_id.is.null`).is('closed_at', null),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'waiting']),
      supabase.from('activities').select('id, type, subject, occurred_at, contact_id').or(`owner_id.eq.${uid},owner_id.is.null`).order('occurred_at', { ascending: false }).limit(10),
    ])
    const err = contactsRes.error || companiesRes.error || dealsRes.error || ticketsRes.error || activitiesRes.error
    if (err) {
      setError(err.message || 'Failed to load dashboard')
      setCounts({ contacts: 0, companies: 0, openDeals: 0, openTickets: 0 })
      setRecentActivities([])
    } else {
      setCounts({
        contacts: contactsRes.count ?? 0,
        companies: companiesRes.count ?? 0,
        openDeals: dealsRes.count ?? 0,
        openTickets: ticketsRes.count ?? 0,
      })
      setRecentActivities(activitiesRes.data ?? [])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (user?.id) load()
  }, [user?.id, load])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-200" />
                <div className="flex-1">
                  <div className="h-7 w-12 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-200" />
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="h-4 w-16 bg-slate-100 rounded" />
                <div className="h-4 w-40 bg-slate-100 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Contacts', value: counts.contacts, icon: Users, to: '/contacts', color: 'bg-blue-500' },
    { label: 'Companies', value: counts.companies, icon: Building2, to: '/companies', color: 'bg-emerald-500' },
    { label: 'Open deals', value: counts.openDeals, icon: HandCoins, to: '/deals', color: 'bg-amber-500' },
    { label: 'Open tickets', value: counts.openTickets, icon: Ticket, to: '/tickets', color: 'bg-violet-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(''); load(); }}
            className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}
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
                <span className="text-slate-500 truncate max-w-xs">
                  {a.contact_id ? (
                    <Link to={`/activities?contact=${a.contact_id}`} className="hover:underline" title={a.subject || '—'}>
                      {a.subject || '—'}
                    </Link>
                  ) : (
                    (a.subject || '—')
                  )}
                </span>
                <span className="text-slate-400 flex items-center gap-2">
                  {a.contact_id ? (
                    <Link to={`/contacts/${a.contact_id}`} className="hover:underline text-slate-600">
                      Contact
                    </Link>
                  ) : null}
                  {new Date(a.occurred_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
