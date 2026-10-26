import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Deliberately separate from the cookie-backed user client. Never pass a user's
// session or expose this client/key to browser components.
export function createLoggingClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Generation logging is not configured.')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
