'use client'

import { useState } from 'react'

interface Vote {
  id: string
  vote_type: string
  generations: {
    image_url: string
    caption: string
  } | null
}

export default function RecentVotes({ votes }: { votes: Vote[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="sticker flex w-full items-center justify-between rounded-xl bg-[var(--color-surface)] px-5 py-3 text-left text-sm font-bold text-[var(--color-ink)]"
      >
        <span>Recent Votes ({votes.length})</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {votes.length === 0 && (
            <p className="text-sm font-medium text-[var(--color-content-ink)] opacity-70">
              You haven&apos;t voted on anything yet — head to the Rate page!
            </p>
          )}

          {votes.map((vote) => (
            <div
              key={vote.id}
              className="sticker flex items-center gap-3 rounded-xl bg-[var(--color-content-bg)] p-3"
            >
              {vote.generations?.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vote.generations.image_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <p className="flex-1 truncate text-sm font-medium text-[var(--color-content-ink)]">
                &ldquo;{vote.generations?.caption}&rdquo;
              </p>
              <span className="text-lg">{vote.vote_type === 'up' ? '👍' : '👎'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}