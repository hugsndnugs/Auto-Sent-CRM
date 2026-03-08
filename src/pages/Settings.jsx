import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
  }, [profile?.display_name])

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          display_name: displayName.trim() || null,
          updated_at: new Date().toISOString(),
        })
      await refreshProfile()
      setMessage('Profile updated.')
    } catch (err) {
      setMessage(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Settings</h1>
      <div className="max-w-md bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="font-medium text-slate-800 mb-4">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {message && (
            <div className={`text-sm p-3 rounded-md ${message === 'Profile updated.' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="text"
              value={user?.email ?? ''}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-600"
            />
            <p className="text-xs text-slate-500 mt-1">Email is managed by your account provider.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
