import { createClient } from '@/lib/supabase/server'
import { topRated, type VoteRow } from '@/lib/ml/recommend'
import ColumbiaNotice from '@/components/ColumbiaNotice'

const steps = [
  { icon: '📸', title: 'Upload a photo', body: 'Any photo works: your dorm room, a bodega cat, the 1 train at 8am.', color: 'bg-[var(--color-skip)]' },
  { icon: '🤖', title: 'AI writes the caption', body: 'Not feeling it? Retry until it lands, then keep the one you like.', color: 'bg-[var(--color-like)]' },
  { icon: '👍', title: 'The crowd votes', body: 'Everyone rates captions up or down. The best ones rise to the top.', color: 'bg-[var(--color-dislike)]' },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: generations } = await supabase
    .from('generations')
    .select('id, image_url, caption')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: votes } = await supabase
    .from('votes')
    .select('user_id, generation_id, vote_type')

  const top = topRated(generations ?? [], (votes ?? []) as VoteRow[], 3)

  return (
    <main className="page-fade-in min-h-screen text-[var(--color-ink)]">
      <ColumbiaNotice />
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <a href="/" className="font-display text-xl">🎭 CapRate</a>
        <nav className="flex items-center gap-4">
          <a href="/rate" className="hidden text-sm font-semibold underline sm:inline">
            Browse captions
          </a>
          <a
            href={user ? '/dashboard' : '/login'}
            className="sticker rounded-full bg-[var(--color-skip)] px-5 py-2 text-sm font-bold"
          >
            {user ? 'Dashboard' : 'Sign in'}
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <p className="sticker mb-6 inline-block rounded-full bg-[var(--color-like)] px-4 py-1 text-xs font-bold">
          AI captions · community votes
        </p>
        <h1 className="mb-6 font-display text-5xl leading-tight md:text-7xl">
          Caption it. <span className="bg-[var(--color-skip)] px-2">Rate it.</span> Repeat.
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg font-medium text-[var(--color-muted)]">
          Upload a photo, let AI write the caption, then vote on what actually makes you
          laugh. The funniest captions rise to the top, and your feed learns your taste.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/rate"
            className="sticker rounded-full bg-[var(--color-skip)] px-8 py-4 text-base font-bold"
          >
            Start rating →
          </a>
          <a
            href={user ? '/generate' : '/login'}
            className="sticker rounded-full bg-[var(--color-surface)] px-8 py-4 text-base font-bold"
          >
            {user ? 'Generate a caption' : 'Sign in with Google'}
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-center font-display text-3xl">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className={`sticker rounded-2xl p-6 ${s.color}`}>
              <p className="mb-3 text-3xl">{s.icon}</p>
              <h3 className="mb-2 font-display text-xl">
                {i + 1}. {s.title}
              </h3>
              <p className="text-sm font-medium">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top-rated right now */}
      {top.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-2 font-display text-3xl">Top-rated right now</h2>
          <p className="mb-8 font-medium text-[var(--color-muted)]">
            Ranked by the community, not by us.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {top.map((g) => (
              <article
                key={g.id}
                className="sticker overflow-hidden rounded-2xl bg-[var(--color-surface)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image_url} alt="" className="h-52 w-full object-cover" />
                <p className="p-4 font-bold">&ldquo;{g.caption}&rdquo;</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a href="/rate" className="font-bold underline">See the full feed →</a>
          </div>
        </section>
      )}

      {/* Smart features */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="sticker rounded-2xl bg-[var(--color-lavender,#B8A9FA)] p-6">
            <h3 className="mb-2 font-display text-xl">A feed that learns your taste</h3>
            <p className="text-sm font-medium">
              Vote a few times and CapRate finds people with your sense of humor, then
              surfaces what they loved first.
            </p>
          </div>
          <div className="sticker rounded-2xl bg-[var(--color-focus,#74B9FF)] p-6">
            <h3 className="mb-2 font-display text-xl">Captions that get funnier</h3>
            <p className="text-sm font-medium">
              New captions are written using the styles the community rated highest, and
              steer away from the ones people downvoted.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="sticker rounded-2xl bg-[var(--color-skip)] p-10 text-center">
          <h2 className="mb-3 font-display text-3xl">Ready to find the funniest caption?</h2>
          <p className="mb-6 font-medium">Takes ten seconds. Nothing to install.</p>
          <a
            href={user ? '/rate' : '/login'}
            className="sticker inline-block rounded-full bg-[var(--color-surface)] px-8 py-3 font-bold"
          >
            {user ? 'Go to the feed →' : 'Sign in with Google →'}
          </a>
        </div>
      </section>

      <footer className="px-6 pb-10 text-center text-xs font-semibold text-[var(--color-muted)]">
        CapRate · caption it, rate it, repeat.
      </footer>
    </main>
  )
}