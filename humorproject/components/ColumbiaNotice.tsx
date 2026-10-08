'use client'

import { useEffect, useState } from 'react'

export default function ColumbiaNotice() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'columbia') {
      setOpen(true)
      // Clean the URL so refreshing doesn't bring the pop-up back
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="columbia-notice-title"
        onClick={(e) => e.stopPropagation()}
        className="sticker w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-8 text-center"
      >
        <p className="mb-3 text-4xl">🎓</p>
        <h2
          id="columbia-notice-title"
          className="mb-2 font-display text-2xl text-[var(--color-ink)]"
        >
          Columbia email required
        </h2>
        <p className="mb-6 text-sm font-medium text-[var(--color-muted)]">
          Please use your Columbia email (@columbia.edu) to sign in.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            autoFocus
            onClick={() => setOpen(false)}
            className="sticker rounded-full bg-[var(--color-skip)] px-6 py-2.5 text-sm font-bold text-[var(--color-ink)]"
          >
            Got it
          </button>
          <a
            href="/login"
            className="sticker rounded-full bg-[var(--color-surface)] px-6 py-2.5 text-center text-sm font-bold text-[var(--color-ink)]"
          >
            Try again
          </a>
        </div>
      </div>
    </div>
  )
}