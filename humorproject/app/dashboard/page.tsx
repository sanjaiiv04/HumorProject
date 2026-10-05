import { getUserAndProfile } from '@/lib/supabase/getProfile'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import RecentVotes from '@/app/dashboard/recent-votes'

export default async function Dashboard() {
  const { user, profile } = await getUserAndProfile()
  const supabase = await createClient()

  const needsProfile = !profile?.first_name || !profile?.last_name

  const { data: myVotes } = await supabase
    .from('votes')
    .select('*, generations(id, image_url, caption)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { count: generationCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const upVotes = myVotes?.filter((v) => v.vote_type === 'up').length ?? 0
  const downVotes = myVotes?.filter((v) => v.vote_type === 'down').length ?? 0

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-lg">
          <h1 className="mb-1 font-display text-3xl text-[var(--color-content-ink)]">
            {profile?.first_name ? `Welcome, ${profile.first_name}!` : 'Welcome!'}
          </h1>
          <p className="mb-8 text-[var(--color-muted)]">
            Here&apos;s your profile and activity.
          </p>

          {/* --- Profile Info --- */}
          {needsProfile ? (
            <div className="sticker mb-8 rounded-2xl bg-[var(--color-content-bg)] p-6 text-[var(--color-content-ink)]">
              <p className="mb-4 font-semibold">You haven&apos;t completed your profile yet.</p>
              <a
                href="/profile"
                className="sticker inline-block rounded-full bg-[var(--color-skip)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)]"
              >
                Complete Profile
              </a>
            </div>
          ) : (
            <div className="sticker mb-8 overflow-hidden rounded-2xl bg-[var(--color-content-bg)]">
              <div className="flex items-center gap-4 border-b-2 border-[var(--color-ink)] p-6">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-skip)] text-xl font-bold">
                    {profile?.first_name?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-[var(--color-content-ink)]">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  {profile?.location && (
                    <p className="text-sm text-[var(--color-content-ink)] opacity-70">
                      📍 {profile.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 text-sm">
                <div>
                  <p className="text-[var(--color-muted)]">Phone</p>
                  <p className="font-semibold text-[var(--color-content-ink)]">
                    {profile?.phone || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-muted)]">Date of birth</p>
                  <p className="font-semibold text-[var(--color-content-ink)]">
                    {profile?.date_of_birth || '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[var(--color-muted)]">Bio</p>
                  <p className="font-semibold text-[var(--color-content-ink)]">
                    {profile?.bio || '—'}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-[var(--color-ink)] p-4">
                <a
                  href="/profile"
                  className="text-sm font-semibold text-[var(--color-content-ink)] underline"
                >
                  Edit Profile
                </a>
              </div>
            </div>
          )}

          {/* --- Voting Stats --- */}
          <h2 className="mb-4 font-display text-xl text-[var(--color-content-ink)]">
            Your Stats
          </h2>
          <div className="mb-8 grid grid-cols-3 gap-3">
            <div className="sticker rounded-xl bg-[var(--color-like)] p-4 text-center">
              <p className="text-2xl font-bold">{upVotes}</p>
              <p className="text-xs font-semibold">👍 Upvotes</p>
            </div>
            <div className="sticker rounded-xl bg-[var(--color-dislike)] p-4 text-center">
              <p className="text-2xl font-bold">{downVotes}</p>
              <p className="text-xs font-semibold">👎 Downvotes</p>
            </div>
            <div className="sticker rounded-xl bg-[var(--color-skip)] p-4 text-center">
              <p className="text-2xl font-bold">{generationCount ?? 0}</p>
              <p className="text-xs font-semibold">🎨 Generated</p>
            </div>
          </div>

          {/* --- Recent votes --- */}
          <h2 className="mb-4 font-display text-xl text-[var(--color-content-ink)]">
            Recent Votes
          </h2>
          <RecentVotes votes={myVotes?.slice(0, 5) ?? []} />
        </div>
      </main>
    </AppShell>
  )
}