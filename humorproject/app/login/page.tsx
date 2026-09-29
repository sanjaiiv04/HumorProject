'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <button
        onClick={handleLogin}
        className="rounded-full bg-black px-6 py-3 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Sign in with Google
      </button>
    </main>
  )
}