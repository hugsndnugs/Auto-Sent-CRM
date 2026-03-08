import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ContactForm from '../components/ContactForm'

export default function Contacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    loadContacts()
    loadCompanies()
  }, [user?.id])

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('id, name').order('name')
    setCompanies(data ?? [])
  }

  async function loadContacts() {
    const uid = user?.id
    const { data } = await supabase
      .from('contacts')
      .select('id, full_name, email, phone, company_id, source, tags, created_at')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('full_name')
    setContacts(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    loadContacts()
  }

  function getCompanyName(companyId) {
    return companies.find((c) => c.id === companyId)?.name ?? '—'
  }

  if (loading) return <div className="text-slate-500">Loading contacts...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Contacts</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          <Plus className="w-4 h-4" />
          Add contact
        </button>
      </div>

      {showForm && (
        <ContactForm
          companies={companies}
          contact={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadContacts(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Source</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/contacts/${c.id}`} className="font-medium text-slate-800 hover:underline">
                    {c.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{getCompanyName(c.company_id)}</td>
                <td className="px-4 py-3 text-slate-600">{c.source || '—'}</td>
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
        {contacts.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">No contacts yet. Add one to get started.</div>
        )}
      </div>
    </div>
  )
}
