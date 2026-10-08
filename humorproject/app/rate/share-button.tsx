'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  contact_id: string
  nickname: string
  uni: string | null
}

const UNI = /^[a-z]{2,3}[0-9]{1,4}$/
const cleanUni = (s: string) => s.trim().toLowerCase().split('@')[0]

export default function ShareButton({
  generationId,
  loggedIn,
}: {
  generationId: string
  loggedIn: boolean
}) {
  const [supabase] = useState(() => createClient())
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [uni, setUni] = useState('')
  const [nickname, setNickname] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ convId: string; to: string } | null>(null)

  const toggle = async () => {
    if (!loggedIn) {
      window.location.href = '/login'
      return
    }
    const next = !open
    setOpen(next)
    setSent(null)
    setError('')
    if (next && contacts === null) {
      const { data } = await supabase.rpc('my_contacts')
      const list = (data ?? []) as Contact[]
      setContacts(list)
      if (list.length === 0) setAddingNew(true)
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    let targetUni: string
    let label: string

    if (addingNew) {
      const clean = cleanUni(uni)
      const nick = nickname.trim()
      if (!UNI.test(clean)) return setError('Enter a valid UNI, like sv2851')
      if (!nick || nick.length > 30) return setError('Nickname must be 1 to 30 characters')

      setSending(true)
      const { data: friendId, error: saveError } = await supabase.rpc('save_contact', {
        p_uni: clean,
        p_nickname: nick,
      })
      if (saveError) {
        setError(saveError.message)
        setSending(false)
        return
      }
      targetUni = clean
      label = nick
      setContacts((prev) => [
        ...(prev ?? []).filter((c) => c.contact_id !== friendId),
        { contact_id: friendId as string, nickname: nick, uni: clean },
      ])
      setSelected(friendId as string)
    } else {
      const c = contacts?.find((x) => x.contact_id === selected)
      if (!c?.uni) return setError('Pick a friend first')
      setSending(true)
      targetUni = c.uni
      label = c.nickname
    }

    const { data: convId, error: convError } = await supabase.rpc('start_conversation', {
      p_uni: targetUni,
    })
    if (convError) {
      setError(convError.message)
      setSending(false)
      return
    }

    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: convId,
      generation_id: generationId,
      body: note.trim() || null,
    })
    setSending(false)
    if (msgError) {
      setError(msgError.message)
      return
    }

    setSent({ convId, to: label })
    setAddingNew(false)
    setUni('')
    setNickname('')
    setNote('')
  }

  const chip = (active: boolean) =>
    `sticker rounded-full px-4 py-1.5 text-sm font-bold text-[var(--color-ink)] ${
      active ? 'bg-[var(--color-skip)]' : 'bg-[var(--color-surface)]'
    }`

  return (
    <>
      <button
        onClick={toggle}
        className="sticker rounded-full bg-[var(--color-surface)] px-5 py-2 text-sm font-bold text-[var(--color-ink)]"
      >
        ✉️ Send
      </button>

      {open && (
        <div className="mt-3 w-full basis-full">
          {sent ? (
            <p className="text-sm font-bold text-[var(--color-ink)]">
              Sent to {sent.to}!{' '}
              <a href={`/messages/${sent.convId}`} className="underline">Open chat →</a>
            </p>
          ) : contacts === null ? (
            <p className="text-sm font-medium text-[var(--color-muted)]">Loading friends...</p>
          ) : (
            <form onSubmit={send} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {contacts.map((c) => (
                  <button
                    type="button"
                    key={c.contact_id}
                    onClick={() => {
                      setSelected(c.contact_id)
                      setAddingNew(false)
                    }}
                    className={chip(!addingNew && selected === c.contact_id)}
                  >
                    {c.nickname}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAddingNew((a) => !a)}
                  className={chip(addingNew)}
                >
                  + New friend
                </button>
              </div>

              {addingNew && (
                <div className="flex flex-col gap-2 sm:flex-row">
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
                </div>
              )}

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="Add a note (optional)"
                className="rounded-lg border-[3px] border-[var(--color-ink)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
              />
              {error && <p className="text-xs font-bold text-[var(--color-dislike)]">{error}</p>}
              <button
                type="submit"
                disabled={sending || (!addingNew && !selected)}
                className="sticker self-start rounded-lg bg-[var(--color-skip)] px-5 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send caption'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}