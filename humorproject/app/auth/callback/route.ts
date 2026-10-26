import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

import { canSignIn } from '@/lib/auth/signup-access'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) next = '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user && await canSignIn(supabase, user.email)) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // An authenticated identity still needs to qualify for CapRate access.
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?error=signup-access`)
    }
  }

  // Supabase can reject signup before a session exists. Keep the message
  // general: OAuth failures can also arrive here.
  if (searchParams.get('error') || searchParams.get('error_description')) {
    return NextResponse.redirect(`${origin}/?error=signup-access`)
  }

  // Someone opened /auth/callback directly with nothing attached
  return NextResponse.redirect(`${origin}/login`)
}