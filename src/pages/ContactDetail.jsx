import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Building2, Mail, Phone, Pencil, Trash2, Activity, HandCoins, Ticket } from 'lucide-react'
import ContactForm from '../components/ContactForm'

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [contact, setContact] = useState(null)
  const [company, setCompany] = useState(null)
  const [companies, setCompanies] = useState([])
  const [deals, setDeals] = useState([])
  const [activities, setActivities] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadContact()
    loadCompanies()
  }, [id, user?.id])

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data ?? [])
  }

  async function loadContact() {
    const uid = user?.id
    const { data: c, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .single()
    if (error || !c) {
      setContact(null)
      setLoading(false)
      return
    }
    setContact(c)
    if (c.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', c.company_id).single()
      setCompany(co)
    } else setCompany(null)
    const [dealsRes, activitiesRes, ticketsRes] = await Promise.all([
      supabase.from('deals').select('id, title, amount, stage, expected_close_date').eq('contact_id', id).order('expected_close_date', { ascending: false }),
      supabase.from('activities').select('id, type, subject, occurred_at').eq('contact_id', id).order('occurred_at', { ascending: false }).limit(10),
      supabase.from('tickets').select('id, title, status, priority').eq('contact_id', id).order('updated_at', { ascending: false }).limit(10),
    ])
    setDeals(dealsRes.data ?? [])
    setActivities(activitiesRes.data ?? [])
    setTickets(ticketsRes.data ?? [])
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this contact?')) return
    const { error: err } = await supabase.from('contacts').delete().eq('id', id)
    if (err) {
      setError(err.message || 'Failed to delete contact')
      return
    }
    navigate('/contacts')
  }

  if (loading) return <div className="text-slate-500">Loading...</div>
  if (!contact) return <div className="text-slate-600">Contact not found.</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{contact.full_name}</h1>
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {contact.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-700 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <ContactForm
          companies={companies}
          contact={contact}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadContact(); }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="font-medium text-slate-800 mb-4">Details</h2>
          <dl className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{contact.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{contact.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {company ? (
                <Link to={`/companies/${company.id}`} className="text-slate-800 hover:underline">{company.name}</Link>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </div>
            {contact.source && (
              <div className="text-sm text-slate-600">Source: {contact.source}</div>
            )}
          </dl>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-slate-500" />
              <h2 className="font-medium text-slate-800">Deals</h2>
              <Link to={`/deals?contact=${id}`} className="ml-auto text-sm text-slate-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {deals.length === 0 ? (
                <li className="px-4 py-4 text-slate-500 text-sm">No deals</li>
              ) : (
                deals.slice(0, 5).map((d) => (
                  <li key={d.id} className="px-4 py-2">
                    <Link to={`/deals/${d.id}`} className="font-medium text-slate-800 hover:underline">{d.title}</Link>
                    <span className="text-slate-500 text-sm ml-2">{d.stage} · ${Number(d.amount).toLocaleString()}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" />
              <h2 className="font-medium text-slate-800">Recent activity</h2>
              <Link to={`/activities?contact=${id}`} className="ml-auto text-sm text-slate-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {activities.length === 0 ? (
                <li className="px-4 py-4 text-slate-500 text-sm">No activity</li>
              ) : (
                activities.map((a) => (
                  <li key={a.id} className="px-4 py-2 flex justify-between text-sm">
                    <span className="capitalize text-slate-700">{a.type}</span>
                    <span className="text-slate-500">{a.subject || '—'}</span>
                    <span className="text-slate-400">{new Date(a.occurred_at).toLocaleDateString()}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-slate-500" />
              <h2 className="font-medium text-slate-800">Tickets</h2>
              <Link to={`/tickets?contact=${id}`} className="ml-auto text-sm text-slate-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <li className="px-4 py-4 text-slate-500 text-sm">No tickets</li>
              ) : (
                tickets.slice(0, 5).map((t) => (
                  <li key={t.id} className="px-4 py-2">
                    <Link to={`/tickets/${t.id}`} className="font-medium text-slate-800 hover:underline">{t.title}</Link>
                    <span className="text-slate-500 text-sm ml-2">{t.status} · {t.priority}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
