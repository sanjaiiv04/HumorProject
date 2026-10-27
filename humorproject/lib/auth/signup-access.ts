import type { SupabaseClient } from '@supabase/supabase-js'

export async function canSignIn(supabase: Pick<SupabaseClient, 'rpc'>, email: string | undefined): Promise<boolean> {
  if (!email) return false
  try {
    // The database checks auth.uid(), never a caller-supplied email or user ID.
    const { data, error } = await supabase.rpc('current_user_signup_allowed')
    return !error && data === true
  } catch {
    return false
  }
}
