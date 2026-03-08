import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import STAGES from '../lib/dealStages'
import { Plus, Pencil, Trash2, LayoutGrid, List } from 'lucide-react'
import DealForm from '../components/DealForm'

export default function Deals() {
  const [searchParams] = useSearchParams()
  const contactFilter = searchParams.get('contact')
  const companyFilter = searchParams.get('company')
  const { user } = useAuth()
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewMode, setViewMode] = useState('pipeline') // 'pipeline' | 'table'

  useEffect(() => {
    loadDeals()
    loadContacts()
    loadCompanies()
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
    const uid = user?.id
    let q = supabase
      .from('deals')
      .select('id, title, amount, currency, stage, contact_id, company_id, expected_close_date, closed_at, created_at')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('expected_close_date', { ascending: false })
    if (contactFilter) q = q.eq('contact_id', contactFilter)
    if (companyFilter) q = q.eq('company_id', companyFilter)
    const { data } = await q
    setDeals(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    loadDeals()
  }

  function getContactName(id) {
    return contacts.find((c) => c.id === id)?.full_name ?? '—'
  }
  function getCompanyName(id) {
    return companies.find((c) => c.id === id)?.name ?? '—'
  }

  const openDeals = deals.filter((d) => !d.closed_at)
  const byStage = {}
  STAGES.forEach((s) => { byStage[s] = openDeals.filter((d) => d.stage === s) })

  if (loading) return <div className="text-slate-500">Loading deals...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Deals</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-slate-300 overflow-hidden">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'pipeline' ? 'bg-slate-200' : 'bg-white hover:bg-slate-50'}`}
              title="Pipeline view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm border-l border-slate-300 ${viewMode === 'table' ? 'bg-slate-200' : 'bg-white hover:bg-slate-50'}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            <Plus className="w-4 h-4" />
            Add deal
          </button>
        </div>
      </div>

      {showForm && (
        <DealForm
          contacts={contacts}
          companies={companies}
          deal={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadDeals(); }}
        />
      )}

      {viewMode === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="w-64 flex-shrink-0 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden"
              >
                <div className="px-3 py-2 bg-slate-200 border-b border-slate-300 font-medium text-slate-800 capitalize">
                  {stage}
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {byStage[stage]?.map((d) => (
                    <div
                      key={d.id}
                      className="bg-white rounded border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Link to={`/deals/${d.id}`} className="font-medium text-slate-800 hover:underline block">
                        {d.title}
                      </Link>
                      <div className="text-sm text-slate-600 mt-1">
                        ${Number(d.amount).toLocaleString()} {d.currency}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{getContactName(d.contact_id)}</div>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => { e.preventDefault(); setEditing(d); setShowForm(true); }}
                          className="p-1 text-slate-500 hover:text-slate-700 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); handleDelete(d.id); }}
                          className="p-1 text-slate-500 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Stage</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Company</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Close date</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deals.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/deals/${d.id}`} className="font-medium text-slate-800 hover:underline">
                      {d.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    ${Number(d.amount).toLocaleString()} {d.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-slate-700">{d.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{getContactName(d.contact_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{getCompanyName(d.company_id)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <button
                      onClick={() => { setEditing(d); setShowForm(true); }}
                      className="p-1.5 text-slate-500 hover:text-slate-700 rounded"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
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
          {deals.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-500">No deals yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
