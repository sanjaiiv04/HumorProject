import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import RateStack from './rate-stack'

export default async function RatePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: myVotes } = await supabase
    .from('votes')
    .select('generation_id')
    .eq('user_id', user?.id ?? '')

  const votedIds = new Set((myVotes ?? []).map((v) => v.generation_id))
  const unvoted = (generations ?? []).filter((g) => !votedIds.has(g.id))

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center font-display text-3xl text-[var(--color-content-ink)]">
            Rate Captions
          </h1>
          <RateStack generations={unvoted} loggedIn={!!user} />
        </div>
      </main>
    </AppShell>
  )
}