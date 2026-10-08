import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Chat from '@/app/messages/chat'

// Type matching Chat component's expected Message shape
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

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: convos } = await supabase.rpc('my_conversations')
  const convo = (convos ?? []).find((c: { conversation_id: string }) => c.conversation_id === id)
  if (!convo) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, generations(id, image_url, caption)')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  await supabase.rpc('mark_conversation_read', { p_conversation: id })

  const name =
    convo.partner_nickname ||
    [convo.partner_first_name, convo.partner_last_name].filter(Boolean).join(' ') ||
    convo.partner_uni ||
    'Unknown'

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">
          <Chat
            conversationId={id}
            userId={user.id}
            initialMessages={(messages as unknown as Message[]) ?? []}
            partnerName={name}
            partnerUni={convo.partner_uni}
            partnerAvatar={convo.partner_avatar_url}
          />
        </div>
      </main>
    </AppShell>
  )
}