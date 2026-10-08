import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const COLUMBIA_EMAIL = /^[a-z]{2,3}[0-9]{1,4}@columbia\.edu$/

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

      if (user?.email && COLUMBIA_EMAIL.test(user.email.toLowerCase())) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Signed in with Google, but not a Columbia account: undo the session
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?error=columbia`)
    }
  }

  // Supabase sends error params when the database trigger rejects a brand-new
  // non-Columbia signup, so that case gets the same pop-up
  if (searchParams.get('error') || searchParams.get('error_description')) {
    return NextResponse.redirect(`${origin}/?error=columbia`)
  }

  // Someone opened /auth/callback directly with nothing attached
  return NextResponse.redirect(`${origin}/login`)
}