'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/generate', label: 'Generate', icon: '🎨' },
  { href: '/rate', label: 'Rate', icon: '⭐' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/rate'
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col justify-between border-r-[3px] border-[var(--color-ink)] bg-[var(--color-surface)] px-4 py-6">
      <div>
        <h2 className="mb-8 px-2 text-lg font-display text-[var(--color-ink)]">
          🎭 CapRate
        </h2>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'border-[var(--color-ink)] bg-[var(--color-skip)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-border)]'
                    : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:bg-[var(--color-bg-start)]'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>

      {loggedIn ? (
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-950/40"
        >
          <span>🚪</span>
          Log out
        </button>
      ) : (
        <a
          href="/login"
          className="sticker flex items-center justify-center gap-2 rounded-lg bg-[var(--color-skip)] px-3 py-2 text-sm font-bold text-[var(--color-ink)]"
        >
          Sign in
        </a>
      )}
    </aside>
  )
}