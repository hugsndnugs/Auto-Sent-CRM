import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { User, Building2, Pencil, Trash2 } from 'lucide-react'
import TicketForm from '../components/TicketForm'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [contact, setContact] = useState(null)
  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadTicket()
    loadContacts()
    loadCompanies()
  }, [id])

  async function loadContacts() {
    const { data } = await supabase.from('contacts').select('id, full_name').order('full_name')
    setContacts(data ?? [])
  }

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data ?? [])
  }

  async function loadTicket() {
    const { data: t, error } = await supabase.from('tickets').select('*').eq('id', id).single()
    if (error || !t) {
      setTicket(null)
      setLoading(false)
      return
    }
    setTicket(t)
    if (t.contact_id) {
      const { data: c } = await supabase.from('contacts').select('*').eq('id', t.contact_id).single()
      setContact(c)
    } else setContact(null)
    if (t.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', t.company_id).single()
      setCompany(co)
    } else setCompany(null)
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this ticket?')) return
    await supabase.from('tickets').delete().eq('id', id)
    navigate('/tickets')
  }

  if (loading) return <div className="text-slate-500">Loading...</div>
  if (!ticket) return <div className="text-slate-600">Ticket not found.</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{ticket.title}</h1>
          <p className="text-slate-600 mt-1">
            <span className="capitalize">{ticket.status?.replace('_', ' ')}</span>
            {' · '}
            <span className="capitalize">{ticket.priority}</span> priority
          </p>
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

      {showForm && (
        <TicketForm
          contacts={contacts}
          companies={companies}
          ticket={ticket}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadTicket(); }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="font-medium text-slate-800 mb-4">Details</h2>
          {ticket.description && (
            <p className="text-slate-600 whitespace-pre-wrap mb-4">{ticket.description}</p>
          )}
          <dl className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              {contact ? (
                <Link to={`/contacts/${contact.id}`} className="text-slate-800 hover:underline">{contact.full_name}</Link>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              {company ? (
                <Link to={`/companies/${company.id}`} className="text-slate-800 hover:underline">{company.name}</Link>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </div>
            <div className="text-sm text-slate-600">
              Created {new Date(ticket.created_at).toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">
              Updated {new Date(ticket.updated_at).toLocaleString()}
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
