'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Contact {
  contact_id: string
  nickname: string
  uni: string | null
  avatar_url: string | null
}

const UNI = /^[a-z]{2,3}[0-9]{1,4}$/
const cleanUni = (s: string) => s.trim().toLowerCase().split('@')[0]
const byName = (a: Contact, b: Contact) =>
  a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase())

export default function FriendsPanel({ initialContacts }: { initialContacts: Contact[] }) {
  const [supabase] = useState(() => createClient())
  const [contacts, setContacts] = useState(initialContacts)
  const [uni, setUni] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const openChat = async (friendUni: string) => {
    setBusy(true)
    setError('')
    const { data, error } = await supabase.rpc('start_conversation', { p_uni: friendUni })
    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    window.location.href = `/messages/${data}`
  }

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = cleanUni(uni)
    const nick = nickname.trim()
    if (!UNI.test(clean)) return setError('Enter a valid UNI, like sv2851')
    if (!nick || nick.length > 30) return setError('Nickname must be 1 to 30 characters')

    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('save_contact', { p_uni: clean, p_nickname: nick })
    if (error) {
      setError(error.message)
      setBusy(false)
      return
    }
    await openChat(clean)
  }

  const rename = async (c: Contact) => {
    const next = window.prompt('New nickname', c.nickname)?.trim()
    if (!next || next === c.nickname) return
    if (next.length > 30) return setError('Nickname must be 30 characters or less')

    const { data, error } = await supabase
      .from('contacts')
      .update({ nickname: next })
      .eq('contact_id', c.contact_id)
      .select('contact_id')
    if (error || !data?.length) {
      setError(error?.code === '23505' ? 'You already have a friend with that nickname' : 'Could not rename')
      return
    }
    setError('')
    setContacts((prev) =>
      prev.map((x) => (x.contact_id === c.contact_id ? { ...x, nickname: next } : x)).sort(byName)
    )
  }

  const remove = async (c: Contact) => {
    if (!window.confirm(`Remove ${c.nickname} from your friends? Your chat history stays.`)) return
    const { error } = await supabase.from('contacts').delete().eq('contact_id', c.contact_id)
    if (error) return setError(error.message)
    setError('')
    setContacts((prev) => prev.filter((x) => x.contact_id !== c.contact_id))
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 font-display text-xl text-[var(--color-ink)]">Friends</h2>
        {contacts.length === 0 ? (
          <p className="text-sm font-medium text-[var(--color-muted)]">
            No friends saved yet. Add one below. You only type their UNI the first time.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <div
                key={c.contact_id}
                className="sticker flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] p-3"
              >
                <button
                  onClick={() => c.uni && openChat(c.uni)}
                  disabled={busy || !c.uni}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-skip)] font-bold text-[var(--color-ink)]">
                      {c.nickname[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-[var(--color-ink)]">{c.nickname}</span>
                    <span className="block truncate text-xs font-medium text-[var(--color-muted)]">{c.uni}</span>
                  </span>
                </button>
                <button
                  onClick={() => rename(c)}
                  title="Rename"
                  aria-label={`Rename ${c.nickname}`}
                  className="rounded-lg border-2 border-[var(--color-ink)] px-2 py-1 text-xs font-bold text-[var(--color-ink)]"
                >
                  ✎
                </button>
                <button
                  onClick={() => remove(c)}
                  title="Remove"
                  aria-label={`Remove ${c.nickname}`}
                  className="rounded-lg border-2 border-[var(--color-ink)] px-2 py-1 text-xs font-bold text-[var(--color-ink)]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={addFriend} className="sticker rounded-2xl bg-[var(--color-skip)] p-4">
        <p className="mb-2 text-sm font-bold text-[var(--color-ink)]">Add a friend</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={uni}
            onChange={(e) => setUni(e.target.value)}
            placeholder="UNI (e.g. sv2851)"
            className="min-w-0 flex-1 rounded-lg border-[3px] border-[var(--color-ink)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
          />
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            placeholder="Nickname"
            className="min-w-0 flex-1 rounded-lg border-[3px] border-[var(--color-ink)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
          />
          <button
            type="submit"
            disabled={busy || !uni.trim() || !nickname.trim()}
            className="sticker rounded-lg bg-[var(--color-surface)] px-5 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50"
          >
            {busy ? '...' : 'Add & chat'}
          </button>
        </div>
      </form>

      {error && <p className="text-sm font-bold text-[var(--color-dislike)]">⚠️ {error}</p>}
    </div>
  )
}