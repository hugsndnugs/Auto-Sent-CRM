import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import TicketForm from '../components/TicketForm'

const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function Tickets() {
  const [searchParams] = useSearchParams()
  const contactFilter = searchParams.get('contact')
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const loadContacts = useCallback(async () => {
    const { data, error: err } = await supabase.from('contacts').select('id, full_name').order('full_name')
    if (err) return
    setContacts(data ?? [])
  }, [])

  const loadCompanies = useCallback(async () => {
    const { data, error: err } = await supabase.from('companies').select('id, name').order('name')
    if (err) return
    setCompanies(data ?? [])
  }, [])

  const loadTickets = useCallback(async () => {
    setError('')
    let q = supabase
      .from('tickets')
      .select('id, title, description, status, priority, contact_id, company_id, assignee_id, created_at, updated_at')
      .order('updated_at', { ascending: false })
    if (contactFilter) q = q.eq('contact_id', contactFilter)
    const { data, error: err } = await q
    if (err) {
      setError(err.message || 'Failed to load tickets')
      setTickets([])
    } else {
      setTickets(data ?? [])
    }
    setLoading(false)
  }, [contactFilter])

  useEffect(() => {
    loadTickets()
    loadContacts()
    loadCompanies()
  }, [loadCompanies, loadContacts, loadTickets, user?.id])

  async function handleDelete(id) {
    if (!confirm('Delete this ticket?')) return
    const { error: err } = await supabase.from('tickets').delete().eq('id', id)
    if (err) {
      setError(err.message || 'Failed to delete ticket')
      return
    }
    loadTickets()
  }

  function getContactName(id) {
    return contacts.find((c) => c.id === id)?.full_name ?? '—'
  }
  function getCompanyName(id) {
    return companies.find((c) => c.id === id)?.name ?? '—'
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Tickets</h1>
          <div className="h-10 w-28 bg-slate-200 rounded-md animate-pulse" />
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Tickets</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          <Plus className="w-4 h-4" />
          New ticket
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(''); loadTickets(); }}
            className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {showForm && (
        <TicketForm
          contacts={contacts}
          companies={companies}
          ticket={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadTickets(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Priority</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Contact</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Updated</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/tickets/${t.id}`} className="font-medium text-slate-800 hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="capitalize text-slate-700">{t.status?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{t.priority}</td>
                <td className="px-4 py-3 text-slate-600">{getContactName(t.contact_id)}</td>
                <td className="px-4 py-3 text-slate-600">{getCompanyName(t.company_id)}</td>
                <td className="px-4 py-3 text-slate-600 text-sm">{new Date(t.updated_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(t); setShowForm(true); }}
                    className="p-1.5 text-slate-500 hover:text-slate-700 rounded"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">No tickets yet.</div>
        )}
      </div>
    </div>
  )
}
