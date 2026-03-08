import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasConfig = supabaseUrl && supabaseAnonKey
if (!hasConfig) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Create .env with these values. Auth and data will not work until configured.')
}

// Use placeholders when missing so createClient() does not throw; requests will fail until .env is set
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

/**
 * Throws if the Supabase result has an error. Use after insert/update/delete/select
 * so callers can rely on try/catch for API errors instead of checking result.error.
 * @param {{ error?: { message?: string } | null; data?: unknown }} result
 * @returns the same result (so you can use result.data if needed)
 */
export function checkError(result) {
  if (result?.error) {
    throw new Error(result.error.message || 'Request failed')
  }
  return result
}
