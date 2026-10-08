'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Gen {
  id: string
  image_url: string
  caption: string
}
interface Message {
  id: string
  sender_id: string
  body: string | null
  created_at: string
  generations: Gen | null
}

const SELECT = 'id, sender_id, body, created_at, generations(id, image_url, caption)'

export default function Chat({
  conversationId,
  userId,
  initialMessages,
  partnerName,
  partnerUni,
  partnerAvatar,
}: {
  conversationId: string
  userId: string
  initialMessages: Message[]
  partnerName: string
  partnerUni: string | null
  partnerAvatar: string | null
}) {
  const [supabase] = useState(() => createClient())
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const addMessage = (m: Message) =>
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]))

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // Live incoming messages
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const { data } = await supabase.from('messages').select(SELECT).eq('id', payload.new.id).single()
          if (!data) return
          addMessage(data as unknown as Message)
          if (data.sender_id !== userId) {
            supabase.rpc('mark_conversation_read', { p_conversation: conversationId })
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversationId, userId])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: userId, body })
      .select(SELECT)
      .single()
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    setText('')
    addMessage(data as unknown as Message)
  }

  return (
    <div className="sticker flex h-[75vh] flex-col overflow-hidden rounded-2xl bg-[var(--color-surface)]">
      <div className="flex items-center gap-3 border-b-[3px] border-[var(--color-ink)] bg-[var(--color-skip)] p-4">
        <a href="/messages" className="text-xl font-bold text-[var(--color-ink)]" aria-label="Back to messages">
          ←
        </a>
        {partnerAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partnerAvatar} alt="" className="h-10 w-10 rounded-full border-2 border-[var(--color-ink)] object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-surface)] font-bold">
            {partnerName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-bold leading-tight text-[var(--color-ink)]">{partnerName}</p>
          {partnerUni && <p className="text-xs font-medium text-[var(--color-ink)] opacity-70">{partnerUni}</p>}
        </div>
      </div>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="m-auto text-sm font-medium text-[var(--color-muted)]">Say hi 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl border-[3px] border-[var(--color-ink)] p-3 ${
                  mine ? 'bg-[var(--color-skip)]' : 'bg-[var(--color-surface)]'
                }`}
              >
                {m.generations && (
                  <div className="mb-2 overflow-hidden rounded-xl border-[3px] border-[var(--color-ink)] bg-[var(--color-surface)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.generations.image_url} alt="" className="h-40 w-full object-cover" />
                    <p className="p-2 text-sm font-bold text-[var(--color-ink)]">
                      &ldquo;{m.generations.caption}&rdquo;
                    </p>
                  </div>
                )}
                {m.body && (
                  <p className="whitespace-pre-wrap break-words text-sm font-medium text-[var(--color-ink)]">{m.body}</p>
                )}
                <p suppressHydrationWarning className="mt-1 text-right text-[10px] font-semibold text-[var(--color-ink)] opacity-50">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={send} className="border-t-[3px] border-[var(--color-ink)] p-3">
        {error && <p className="mb-2 text-xs font-bold text-[var(--color-dislike)]">{error}</p>}
        <div className="flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="Type a message..."
            className="min-w-0 flex-1 rounded-lg border-[3px] border-[var(--color-ink)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="sticker rounded-lg bg-[var(--color-like)] px-5 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}