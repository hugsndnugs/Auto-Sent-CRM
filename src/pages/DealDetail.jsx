import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import STAGES from '../lib/dealStages'
import { Building2, User, Pencil, Trash2, Activity, Check, X } from 'lucide-react'
import DealForm from '../components/DealForm'
import ActivityForm from '../components/ActivityForm'

export default function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [deal, setDeal] = useState(null)
  const [contact, setContact] = useState(null)
  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [error, setError] = useState('')

  const loadContacts = useCallback(async () => {
    const { data } = await supabase.from('contacts').select('id, full_name').order('full_name')
    setContacts(data ?? [])
  }, [])

  const loadCompanies = useCallback(async () => {
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data ?? [])
  }, [])

  const loadDeal = useCallback(async () => {
    const uid = user?.id
    const { data: d, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .single()
    if (error || !d) {
      setDeal(null)
      setLoading(false)
      return
    }
    setDeal(d)
    if (d.contact_id) {
      const { data: c } = await supabase.from('contacts').select('*').eq('id', d.contact_id).single()
      setContact(c)
    } else setContact(null)
    if (d.company_id) {
      const { data: co } = await supabase.from('companies').select('*').eq('id', d.company_id).single()
      setCompany(co)
    } else setCompany(null)
    const { data: acts } = await supabase
      .from('activities')
      .select('id, type, subject, body, occurred_at')
      .eq('deal_id', id)
      .order('occurred_at', { ascending: false })
    setActivities(acts ?? [])
    setLoading(false)
  }, [id, user?.id])

  useEffect(() => {
    loadDeal()
    loadContacts()
    loadCompanies()
  }, [loadCompanies, loadContacts, loadDeal])

  async function setStage(newStage) {
    await supabase
      .from('deals')
      .update({
        stage: newStage,
        closed_at: ['won', 'lost'].includes(newStage) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    loadDeal()
  }

  async function handleDelete() {
    if (!confirm('Delete this deal?')) return
    const { error: err } = await supabase.from('deals').delete().eq('id', id)
    if (err) {
      setError(err.message || 'Failed to delete deal')
      return
    }
    navigate('/deals')
  }

  if (loading) return <div className="text-slate-500">Loading...</div>
  if (!deal) return <div className="text-slate-600">Deal not found.</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{deal.title}</h1>
          <p className="text-slate-600 mt-1">
            ${Number(deal.amount).toLocaleString()} {deal.currency} ·{' '}
            <span className="capitalize">{deal.stage}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          {!deal.closed_at && (
            <>
              <button
                onClick={() => setStage('won')}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                <Check className="w-4 h-4" /> Won
              </button>
              <button
                onClick={() => setStage('lost')}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <X className="w-4 h-4" /> Lost
              </button>
            </>
          )}
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
        <DealForm
          contacts={contacts}
          companies={companies}
          deal={deal}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadDeal(); }}
        />
      )}

      {showActivityForm && (
        <ActivityForm
          contacts={contacts}
          companies={companies}
          deals={[{ id: deal.id, title: deal.title }]}
          activity={null}
          defaultDealId={deal.id}
          defaultContactId={deal.contact_id}
          defaultCompanyId={deal.company_id}
          onClose={() => setShowActivityForm(false)}
          onSaved={() => { setShowActivityForm(false); loadDeal(); }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="font-medium text-slate-800 mb-4">Details</h2>
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
              Expected close: {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
            </div>
            {deal.closed_at && (
              <div className="text-sm text-slate-600">
                Closed: {new Date(deal.closed_at).toLocaleString()}
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" />
              <h2 className="font-medium text-slate-800">Activity</h2>
            </div>
            <button
              onClick={() => setShowActivityForm(true)}
              className="text-sm px-3 py-1.5 bg-slate-800 text-white rounded-md hover:bg-slate-700"
            >
              Log activity
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <li className="px-4 py-6 text-slate-500 text-sm text-center">No activity yet.</li>
            ) : (
              activities.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <span className="capitalize font-medium text-slate-700">{a.type}</span>
                    <span className="text-slate-400 text-sm">{new Date(a.occurred_at).toLocaleString()}</span>
                  </div>
                  {a.subject && <div className="text-slate-600 text-sm mt-0.5">{a.subject}</div>}
                  {a.body && <div className="text-slate-500 text-sm mt-0.5">{a.body}</div>}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
