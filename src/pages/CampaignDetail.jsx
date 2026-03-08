import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Plus, Pencil, Trash2, UserMinus } from 'lucide-react'
import CampaignForm from '../components/CampaignForm'

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState(null)
  const [touchpoints, setTouchpoints] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [addContactId, setAddContactId] = useState('')

  useEffect(() => {
    loadCampaign()
    loadContacts()
  }, [id, user?.id])

  async function loadContacts() {
    const uid = user?.id
    const { data } = await supabase
      .from('contacts')
      .select('id, full_name, email')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('full_name')
    setContacts(data ?? [])
  }

  async function loadCampaign() {
    const uid = user?.id
    const { data: c, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .single()
    if (error || !c) {
      setCampaign(null)
      setLoading(false)
      return
    }
    setCampaign(c)
    const { data: tp } = await supabase
      .from('campaign_contacts')
      .select('id, contact_id, touched_at, status')
      .eq('campaign_id', id)
      .order('touched_at', { ascending: false })
    setTouchpoints(tp ?? [])
    setLoading(false)
  }

  async function handleAddContact() {
    if (!addContactId) return
    await supabase.from('campaign_contacts').insert({
      campaign_id: id,
      contact_id: addContactId,
    })
    setAddContactId('')
    loadCampaign()
  }

  async function handleRemoveTouchpoint(tpId) {
    await supabase.from('campaign_contacts').delete().eq('id', tpId)
    loadCampaign()
  }

  async function handleDelete() {
    if (!confirm('Delete this campaign?')) return
    await supabase.from('campaigns').delete().eq('id', id)
    navigate('/campaigns')
  }

  function getContactName(contactId) {
    return contacts.find((c) => c.id === contactId)?.full_name ?? '—'
  }

  if (loading) return <div className="text-slate-500">Loading...</div>
  if (!campaign) return <div className="text-slate-600">Campaign not found.</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{campaign.name}</h1>
          <p className="text-slate-600 mt-1">
            {campaign.type && <span className="capitalize">{campaign.type}</span>}
            {campaign.status && <span className="ml-2">· {campaign.status}</span>}
            {campaign.start_date && (
              <span className="ml-2">
                {new Date(campaign.start_date).toLocaleDateString()}
                {campaign.end_date && ` – ${new Date(campaign.end_date).toLocaleDateString()}`}
              </span>
            )}
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
        <CampaignForm
          campaign={campaign}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadCampaign(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          <h2 className="font-medium text-slate-800">Contacts in campaign</h2>
          <div className="flex gap-2 ml-auto items-center">
            <select
              value={addContactId}
              onChange={(e) => setAddContactId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-sm"
            >
              <option value="">Add contact...</option>
              {contacts
                .filter((c) => !touchpoints.some((tp) => tp.contact_id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
            </select>
            <button
              onClick={handleAddContact}
              disabled={!addContactId}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white rounded-md text-sm hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        <ul className="divide-y divide-slate-100">
          {touchpoints.length === 0 ? (
            <li className="px-4 py-6 text-slate-500 text-sm text-center">No contacts in this campaign yet.</li>
          ) : (
            touchpoints.map((tp) => (
              <li key={tp.id} className="px-4 py-3 flex items-center justify-between">
                <Link to={`/contacts/${tp.contact_id}`} className="font-medium text-slate-800 hover:underline">
                  {getContactName(tp.contact_id)}
                </Link>
                <div className="flex items-center gap-2">
                  {tp.touched_at && (
                    <span className="text-slate-500 text-sm">
                      {new Date(tp.touched_at).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveTouchpoint(tp.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                    title="Remove from campaign"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
