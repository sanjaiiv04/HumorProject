'use client'

import { useState, useEffect } from 'react'
import { castVote } from './actions'

interface Generation {
  id: string
  image_url: string
  caption: string
}

export default function RateStack({
  generations,
  loggedIn,
}: {
  generations: Generation[]
  loggedIn: boolean
}) {
  const [queue, setQueue] = useState(generations)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    setQueue(generations)
  }, [generations])

  const current = queue[0]

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!loggedIn || !current || voting) return
    setVoting(true)
    try {
      await castVote(current.id, voteType)
      setQueue((q) => q.slice(1))
    } finally {
      setVoting(false)
    }
  }

  if (!current) {
    return (
      <div className="sticker rounded-2xl bg-[var(--color-content-bg)] p-8 text-center">
        <p className="text-lg font-bold text-[var(--color-content-ink)]">
          You&apos;re all caught up! 🎉
        </p>
        <p className="mt-2 text-sm text-[var(--color-content-ink)] opacity-70">
          No more captions to rate right now.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="sticker overflow-hidden rounded-2xl bg-[var(--color-content-bg)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.image_url}
          alt="Generated"
          className="h-80 w-full object-cover"
        />
        <div className="p-5">
          <p className="text-lg font-bold text-[var(--color-content-ink)]">
            &ldquo;{current.caption}&rdquo;
          </p>
        </div>
      </div>

      {loggedIn ? (
        <div className="mt-5 flex justify-center gap-4">
          <button
            onClick={() => handleVote('up')}
            disabled={voting}
            className="sticker rounded-full bg-[var(--color-like)] px-8 py-3 text-xl font-bold disabled:opacity-50"
          >
            👍
          </button>
          <button
            onClick={() => handleVote('down')}
            disabled={voting}
            className="sticker rounded-full bg-[var(--color-dislike)] px-8 py-3 text-xl font-bold disabled:opacity-50"
          >
            👎
          </button>
        </div>
      ) : (
        <div className="sticker mt-5 flex flex-col items-center gap-2 rounded-xl bg-[var(--color-surface)] p-4 text-center">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Sign in to vote on this caption
          </p>
          <a
            href="/login"
            className="sticker rounded-full bg-[var(--color-skip)] px-5 py-2 text-sm font-bold text-[var(--color-ink)]"
          >
            Sign in with Google
          </a>
        </div>
      )}

      <p className="mt-4 text-center text-sm font-medium text-[var(--color-content-ink)] opacity-60">
        {queue.length} left
      </p>
    </div>
  )
}