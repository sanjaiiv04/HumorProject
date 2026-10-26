import type { SupabaseClient } from '@supabase/supabase-js'

// Preserve the original UNI policy even when the new RPC is unavailable.
export const COLUMBIA_EMAIL = /^[a-z]{2,3}[0-9]{1,4}@columbia\.edu$/

export async function canSignIn(supabase: Pick<SupabaseClient, 'rpc'>, email: string | undefined): Promise<boolean> {
  if (!email) return false
  if (COLUMBIA_EMAIL.test(email.toLowerCase())) return true
  try {
    // The database checks auth.uid(), never a caller-supplied email or user ID.
    const { data, error } = await supabase.rpc('current_user_signup_allowed')
    return !error && data === true
  } catch {
    return false
  }
}
