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
    <main className="page-fade-in flex min-h-screen flex-col items-center justify-center px-4">
      <div className="sticker flex flex-col items-center gap-6 rounded-2xl bg-[var(--color-content-bg)] p-10 text-center">
        <h1 className="font-display text-4xl text-[var(--color-content-ink)]">
          🎭 CapRate
        </h1>
        <p className="max-w-xs text-sm font-medium text-[var(--color-content-ink)] opacity-70">
          Sign in to generate captions and vote on your favorites.
        </p>
        <button
          onClick={handleLogin}
          className="sticker rounded-full bg-[var(--color-skip)] px-6 py-3 text-sm font-bold text-[var(--color-ink)]"
        >
          Sign in with your UNI
        </button>
        <a
          href="/rate"
          className="text-xs font-medium text-[var(--color-content-ink)] underline opacity-60"
        >
          Just browsing? See captions without signing in →
        </a>
      </div>
    </main>
  )
}