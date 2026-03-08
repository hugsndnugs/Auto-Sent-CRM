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

  useEffect(() => {
    loadActivities()
    loadContacts()
    loadCompanies()
    loadDeals()
  }, [user?.id, contactFilter, companyFilter])

  async function loadContacts() {
    const { data } = await supabase.from('contacts').select('id, full_name').order('full_name')
    setContacts(data ?? [])
  }

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data ?? [])
  }

  async function loadDeals() {
    const { data } = await supabase.from('deals').select('id, title').order('title')
    setDeals(data ?? [])
  }

  async function loadActivities() {
    const uid = user?.id
    let q = supabase
      .from('activities')
      .select('id, type, subject, body, contact_id, company_id, deal_id, occurred_at, created_at')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('occurred_at', { ascending: false })
    if (contactFilter) q = q.eq('contact_id', contactFilter)
    if (companyFilter) q = q.eq('company_id', companyFilter)
    const { data } = await q.limit(100)
    setActivities(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this activity?')) return
    await supabase.from('activities').delete().eq('id', id)
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

  if (loading) return <div className="text-slate-500">Loading activities...</div>

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
