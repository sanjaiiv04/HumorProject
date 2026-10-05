'use client'

import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/profile', label: 'Profile', icon: '👤' },
  { href: '/generate', label: 'Generate', icon: '🎨' },
  { href: '/rate', label: 'Rate', icon: '⭐' }
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col justify-between border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="mb-8 px-2 text-xl font-display tracking-tight text-[var(--color-ink)]">
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
                    ? 'border-[var(--color-ink)] bg-[var(--color-skip)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]'
                    : 'border-transparent text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="sticker rounded-lg bg-[var(--color-skip)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)]"
      >
        <span>🚪</span>
        Log out
      </button>
    </aside>
  )
}