import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import RateFeed from './rate-feed'
import { rankForUser, type GenerationRow, type VoteRow } from '@/lib/ml/recommend'
export default async function RatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('generations')
    .select('id, user_id, image_url, caption, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: votes } = await supabase
    .from('votes')
    .select('user_id, generation_id, vote_type')

  const allVotes = (votes ?? []) as VoteRow[]
  const ranked = rankForUser(user?.id ?? null, (generations ?? []) as GenerationRow[], allVotes)

  const myVotes = new Map(
    allVotes.filter((v) => v.user_id === user?.id).map((v) => [v.generation_id, v.vote_type])
  )

  const items = ranked.map((g) => ({
    id: g.id,
    image_url: g.image_url,
    caption: g.caption,
    created_at: g.created_at,
    reason: g.reason,
    myVote: myVotes.get(g.id) ?? null,
  }))

  // "For You": captions you haven't voted on come first, in ML-ranked order
  const forYou = [...items.filter((i) => !i.myVote), ...items.filter((i) => i.myVote)]

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-xl">
          <h1 className="mb-6 font-display text-3xl text-[var(--color-ink)]">
            Rate Captions
          </h1>
          <RateFeed initialItems={forYou} loggedIn={!!user} />
        </div>
      </main>
    </AppShell>
  )
}