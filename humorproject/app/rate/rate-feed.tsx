'use client'

import { useEffect, useRef, useState } from 'react'
import { castVote } from './actions'

type Vote = 'up' | 'down' | null
type Reason = 'similar' | 'trending' | 'fresh'

interface Item {
  id: string
  image_url: string
  caption: string
  created_at: string
  reason: Reason
  myVote: Vote
}

const PAGE_SIZE = 10

const REASON_LABEL: Record<Reason, string> = {
  similar: '🤝 People with your taste liked this',
  trending: '🔥 Trending',
  fresh: '✨ New',
}

export default function RateFeed({
  initialItems,
  loggedIn,
}: {
  initialItems: Item[]
  loggedIn: boolean
}) {
  // Frozen on first render so the order doesn't jump around while you vote
  const [items] = useState(initialItems)
  const [tab, setTab] = useState<'foryou' | 'latest'>('foryou')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [votes, setVotes] = useState<Record<string, Vote>>(() =>
    Object.fromEntries(initialItems.map((i) => [i.id, i.myVote]))
  )
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const list =
    tab === 'foryou'
      ? items
      : [...items].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

  const hasMore = visible < list.length

  // Infinite scroll: reveal 10 more whenever the bottom sentinel comes into view
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible((v) => v + PAGE_SIZE)
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, visible, tab])

  const switchTab = (next: 'foryou' | 'latest') => {
    setTab(next)
    setVisible(PAGE_SIZE)
  }

  const handleVote = async (id: string, type: 'up' | 'down') => {
    if (!loggedIn) {
      window.location.href = '/login'
      return
    }
    const previous = votes[id]
    setVotes((v) => ({ ...v, [id]: type })) // optimistic
    try {
      await castVote(id, type)
    } catch {
      setVotes((v) => ({ ...v, [id]: previous }))
    }
  }

  if (items.length === 0) {
    return (
      <div className="sticker rounded-2xl bg-[var(--color-surface)] p-8 text-center">
        <p className="mb-4 text-lg font-bold text-[var(--color-ink)]">No captions yet 👀</p>
        <a
          href="/generate"
          className="sticker inline-block rounded-full bg-[var(--color-skip)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)]"
        >
          Be the first to generate one
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex gap-3">
        {(['foryou', 'latest'] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`sticker rounded-full px-5 py-2 text-sm font-bold text-[var(--color-ink)] ${
              tab === t ? 'bg-[var(--color-skip)]' : 'bg-[var(--color-surface)]'
            }`}
          >
            {t === 'foryou' ? '✨ For You' : '🕒 Latest'}
          </button>
        ))}
      </div>
      {tab === 'foryou' && (
        <p className="mb-6 text-xs font-medium text-[var(--color-muted)]">
          Ranked by what people with similar taste, and the whole community, liked.
        </p>
      )}
      {tab === 'latest' && <div className="mb-6" />}

      <div className="flex flex-col gap-8">
        {list.slice(0, visible).map((item) => {
          const mine = votes[item.id]
          return (
            <article
              key={item.id}
              className="sticker overflow-hidden rounded-2xl bg-[var(--color-surface)]"
            >
              {tab === 'foryou' && !mine && (
                <div className="border-b-[3px] border-[var(--color-ink)] bg-[var(--color-skip)] px-4 py-1.5 text-xs font-bold text-[var(--color-ink)]">
                  {REASON_LABEL[item.reason]}
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt="" className="h-80 w-full object-cover" />
              <div className="p-5">
                <p className="mb-4 text-lg font-bold text-[var(--color-ink)]">
                  &ldquo;{item.caption}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(item.id, 'up')}
                    className={`sticker rounded-full px-6 py-2 text-lg font-bold ${
                      mine === 'up' ? 'bg-[var(--color-like)]' : 'bg-[var(--color-surface)]'
                    }`}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleVote(item.id, 'down')}
                    className={`sticker rounded-full px-6 py-2 text-lg font-bold ${
                      mine === 'down' ? 'bg-[var(--color-dislike)]' : 'bg-[var(--color-surface)]'
                    }`}
                  >
                    👎
                  </button>
                  {!loggedIn && (
                    <span className="text-xs font-semibold text-[var(--color-muted)]">
                      Sign in to vote
                    </span>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {hasMore ? (
        <div ref={sentinelRef} className="py-8 text-center text-sm text-[var(--color-muted)]">
          Loading more…
        </div>
      ) : (
        <p className="py-8 text-center text-sm font-semibold text-[var(--color-muted)]">
          You&apos;ve reached the end 🎉
        </p>
      )}
    </div>
  )
}