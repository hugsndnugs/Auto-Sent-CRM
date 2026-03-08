import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import CampaignForm from '../components/CampaignForm'

const TYPES = ['email', 'ad', 'event']

export default function Campaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    loadCampaigns()
  }, [user?.id])

  async function loadCampaigns() {
    const uid = user?.id
    const { data } = await supabase
      .from('campaigns')
      .select('id, name, type, status, start_date, end_date, created_at')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('created_at', { ascending: false })
    setCampaigns(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this campaign?')) return
    await supabase.from('campaigns').delete().eq('id', id)
    loadCampaigns()
  }

  if (loading) return <div className="text-slate-500">Loading campaigns...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Campaigns</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          <Plus className="w-4 h-4" />
          New campaign
        </button>
      </div>

      {showForm && (
        <CampaignForm
          campaign={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadCampaigns(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Start</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">End</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/campaigns/${c.id}`} className="font-medium text-slate-800 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{c.type || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.status || '—'}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 flex items-center gap-1">
                  <button
                    onClick={() => { setEditing(c); setShowForm(true); }}
                    className="p-1.5 text-slate-500 hover:text-slate-700 rounded"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
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
        {campaigns.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">No campaigns yet.</div>
        )}
      </div>
    </div>
  )
}
