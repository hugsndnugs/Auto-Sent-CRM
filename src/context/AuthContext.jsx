import { useEffect, useState } from 'react'
import { AuthContext } from './authContextRef'
import { supabase } from '../lib/supabase'

/** Map Supabase auth errors to user-friendly messages. */
function authError(error) {
  const msg = (error?.message || '').toLowerCase()
  const isRateLimit = error?.status === 429 || msg.includes('429') || msg.includes('too many') || msg.includes('rate limit')
  if (isRateLimit) {
    return new Error('Too many sign-up attempts. Please wait a few minutes and try again.')
  }
  return new Error(error?.message || 'Something went wrong')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          await fetchProfile(session.user.id)
        } finally {
          setLoading(false)
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data)
    } catch {
      setProfile(null)
    }
  }

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw authError(error)
    if (data.user) {
      // Profile may be created by DB trigger (handle_new_user). Upsert with session when possible.
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName || email?.split('@')[0],
          updated_at: new Date().toISOString(),
        })
      } catch {
        // 401 etc. if session not ready (e.g. email confirmation). Trigger may have created profile.
      }
      await fetchProfile(data.user.id)
    }
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw authError(error)
    if (data.user) await fetchProfile(data.user.id)
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

