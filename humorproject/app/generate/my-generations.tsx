'use client'

import { useState } from 'react'

interface Generation {
  id: string
  image_url: string
  prompt: string | null
  caption: string
  created_at: string
}

export default function MyGenerations({ generations }: { generations: Generation[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-10">
      <button
        onClick={() => setOpen((o) => !o)}
        className="sticker flex w-full items-center justify-between rounded-xl bg-[var(--color-surface)] px-5 py-3 text-left text-sm font-bold text-[var(--color-ink)]"
      >
        <span>
          My Generations ({generations.length})
        </span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {generations.length === 0 && (
            <p className="text-center text-sm font-medium text-[var(--color-muted)]">
              You haven&apos;t saved any generations yet.
            </p>
          )}

          {generations.map((gen) => (
            <div
              key={gen.id}
              className="sticker flex gap-3 rounded-xl bg-[var(--color-content-bg)] p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gen.image_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--color-content-ink)]">
                  &ldquo;{gen.caption}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}