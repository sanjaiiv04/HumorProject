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
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })

    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [supabase])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Shared classes for any text that should fade/shrink away when collapsed
  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-200 ${
    collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
  }`

  return (
      <aside
        className={`sticky top-0 flex h-screen shrink-0 flex-col justify-between self-start border-r-[3px] border-[var(--color-ink)] bg-[var(--color-surface)] py-6 transition-[width,padding] duration-300 ease-in-out ${
        collapsed ? 'w-20 px-2' : 'w-56 px-4'
        }`}
      >
      <button
        onClick={toggleCollapsed}
        className="sticker absolute -right-3 top-8 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-skip)] text-sm font-bold transition-transform duration-300"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className={`inline-block transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
          ←
        </span>
      </button>

      <div>
        <h2 className="mb-8 flex items-center gap-2 px-2 font-display text-lg text-[var(--color-ink)]">
        <a href="/" className="flex items-center gap-2"><span>🎭</span><span className={labelClass}>CapRate</span></a>
        </h2>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'border-[var(--color-ink)] bg-[var(--color-skip)] text-[var(--color-ink)]'
                    : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span className="shrink-0">{link.icon}</span>
                <span className={labelClass}>{link.label}</span>
              </a>
            )
          })}
        </nav>
      </div>

      {loggedIn ? (
        <button
          onClick={handleLogout}
          title={collapsed ? 'Log out' : undefined}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <span className="shrink-0">🚪</span>
          <span className={labelClass}>Log out</span>
        </button>
      ) : (
        <a
          href="/login"
          title={collapsed ? 'Sign in' : undefined}
          className="sticker flex items-center justify-center gap-2 rounded-lg bg-[var(--color-skip)] px-3 py-2 text-sm font-bold text-[var(--color-ink)]"
        >
          <span className={collapsed ? '' : 'hidden'}>→</span>
          <span className={labelClass}>Sign in</span>
        </a>
      )}
    </aside>
  )
}