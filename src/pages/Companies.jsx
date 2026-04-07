import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import CompanyForm from '../components/CompanyForm'

export default function Companies() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const loadCompanies = useCallback(async () => {
    setError('')
    const uid = user?.id
    const { data, error: err } = await supabase
      .from('companies')
      .select('id, name, domain, industry, size, created_at')
      .or(`owner_id.eq.${uid},owner_id.is.null`)
      .order('name')
    if (err) {
      setError(err.message || 'Failed to load companies')
      setCompanies([])
    } else {
      setCompanies(data ?? [])
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  async function handleDelete(id) {
    if (!confirm('Delete this company?')) return
    const { error: err } = await supabase.from('companies').delete().eq('id', id)
    if (err) {
      setError(err.message || 'Failed to delete company')
      return
    }
    loadCompanies()
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Companies</h1>
          <div className="h-10 w-28 bg-slate-200 rounded-md animate-pulse" />
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
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
        <h1 className="text-2xl font-semibold text-slate-800">Companies</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
        >
          <Plus className="w-4 h-4" />
          Add company
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => { setError(''); loadCompanies(); }}
            className="shrink-0 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {showForm && (
        <CompanyForm
          company={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadCompanies(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Domain</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Industry</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700">Size</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/companies/${c.id}`} className="font-medium text-slate-800 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.domain || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.industry || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{c.size || '—'}</td>
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
        {companies.length === 0 && (
          <div className="px-4 py-12 text-center text-slate-500">No companies yet. Add one to get started.</div>
        )}
      </div>
    </div>
  )
}
