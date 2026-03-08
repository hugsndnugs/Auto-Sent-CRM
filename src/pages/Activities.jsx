import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ActivityForm from '../components/ActivityForm'

export default function Activities() {
  const [searchParams] = useSearchParams()
  const contactFilter = searchParams.get('contact')
  const companyFilter = searchParams.get('company')
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadActivities()
    loadContacts()
    loadCompanies()
    loadDeals()
  }, [user?.id, contactFilter, companyFilter])

  async function loadContacts() {
    const { data, error: err } = await supabase.from('contacts').select('id, full_name').order('full_name')
    if (err) return
    setContacts(data ?? [])
  }

  async function loadCompanies() {
    const { data, error: err } = await supabase.from('companies').select('id, name').order('name')
    if (err) return
    setCompanies(data ?? [])
  }

  async function loadDeals() {
    const { data, error: err } = await supabase.from('deals').select('id, title').order('title')
    if (err) return
    setDeals(data ?? [])
  }

  async function loadActivities() {
    setError('')
    const uid = user?.id
    let q = supabase
      .from('activities')
      .select('id, type, subject, body, contact_id, company_id, deal_id, occurred_at, created_at')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('occurred_at', { ascending: false })
    if (contactFilter) q = q.eq('contact_id', contactFilter)
    if (companyFilter) q = q.eq('company_id', companyFilter)
    const { data, error: err } = await q.limit(100)
    if (err) {
      setError(err.message || 'Failed to load activities')
      setActivities([])
    } else {
      setActivities(data ?? [])
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this activity?')) return
    const { error: err } = await supabase.from('activities').delete().eq('id', id)
    if (err) {
      setError(err.message || 'Failed to delete activity')
      return
    }
    loadActivities()
  }

  function getContactName(id) {
    return contacts.find((c) => c.id === id)?.full_name ?? '—'
  }
  function getCompanyName(id) {
    return companies.find((c) => c.id === id)?.name ?? '—'
  }
  function getDealTitle(id) {
    return deals.find((d) => d.id === id)?.title ?? '—'
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Activities</h1>
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
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
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
        <h1 className="text-2xl font-semibold text-slate-800">Activities</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          <Plus className="w-4 h-4" />
          Log activity
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(''); loadActivities(); }}
            className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {showForm && (
        <ActivityForm
          contacts={contacts}
          companies={companies}
          deals={deals}
          activity={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadActivities(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Subject</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Contact</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Deal</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Date</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 capitalize text-slate-700">{a.type}</td>
                <td className="px-4 py-3 text-slate-600">{a.subject || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {a.contact_id ? (
                    <Link to={`/contacts/${a.contact_id}`} className="hover:underline">{getContactName(a.contact_id)}</Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {a.company_id ? (
                    <Link to={`/companies/${a.company_id}`} className="hover:underline">{getCompanyName(a.company_id)}</Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {a.deal_id ? (
                    <Link to={`/deals/${a.deal_id}`} className="hover:underline">{getDealTitle(a.deal_id)}</Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(a.occurred_at).toLocaleString()}</td>
                <td className="px-4 py-3 flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(a); setShowForm(true); }}
                    className="p-1.5 text-slate-500 hover:text-slate-700 rounded"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
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
        {activities.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">No activities yet.</div>
        )}
      </div>
    </div>
  )
}
