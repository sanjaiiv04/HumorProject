import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import FriendsPanel, { type Contact } from './friends-panel'

interface Conversation {
  conversation_id: string
  partner_uni: string | null
  partner_nickname: string | null
  partner_first_name: string | null
  partner_last_name: string | null
  partner_avatar_url: string | null
  last_body: string | null
  unread_count: number
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: convos }, { data: contacts }, { data: me }] = await Promise.all([
    supabase.rpc('my_conversations'),
    supabase.rpc('my_contacts'),
    supabase.from('profiles').select('uni').eq('id', user.id).single(),
  ])
  const list = (convos ?? []) as Conversation[]

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-lg">
          <h1 className="mb-1 font-display text-3xl text-[var(--color-ink)]">Messages</h1>
          <p className="mb-6 text-sm font-medium text-[var(--color-muted)]">
            {me?.uni ? (
              <>
                Your UNI is <span className="font-bold text-[var(--color-ink)]">{me.uni}</span>.
                Share it so friends can find you.
              </>
            ) : (
              <>This account has no UNI, so friends can&apos;t look you up.</>
            )}
          </p>

          <FriendsPanel initialContacts={(contacts ?? []) as Contact[]} />

          <h2 className="mb-3 mt-10 font-display text-xl text-[var(--color-ink)]">Conversations</h2>
          <div className="flex flex-col gap-3">
            {list.length === 0 && (
              <p className="text-center text-sm font-medium text-[var(--color-muted)]">
                No conversations yet. Tap a friend above to start one.
              </p>
            )}
            {list.map((c) => {
              const name =
                c.partner_nickname ||
                [c.partner_first_name, c.partner_last_name].filter(Boolean).join(' ') ||
                c.partner_uni ||
                'Unknown'
              return (
                <a
                  key={c.conversation_id}
                  href={`/messages/${c.conversation_id}`}
                  className="sticker flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] p-4"
                >
                  {c.partner_avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.partner_avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-skip)] font-bold text-[var(--color-ink)]">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[var(--color-ink)]">
                      {name}
                      {c.partner_uni && (
                        <span className="ml-2 text-xs font-medium text-[var(--color-muted)]">{c.partner_uni}</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-[var(--color-muted)]">{c.last_body ?? 'No messages yet'}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="sticker rounded-full bg-[var(--color-dislike)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-ink)]">
                      {c.unread_count}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      </main>
    </AppShell>
  )
}