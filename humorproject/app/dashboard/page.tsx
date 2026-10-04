import { getUserAndProfile } from '@/lib/supabase/getProfile'
import AppShell from '@/components/AppShell'

export default async function Dashboard() {
  const { profile } = await getUserAndProfile()

  const needsProfile = !profile?.first_name || !profile?.last_name

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-lg">
        <h1 className="mb-1 font-display text-3xl text-[var(--color-ink)]">            {profile?.first_name ? `Welcome, ${profile.first_name}!` : 'Welcome!'}
          </h1>
          <p className="mb-8 text-zinc-500 dark:text-zinc-400">
            Here&apos;s your profile at a glance.
          </p>

          {needsProfile ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <p className="mb-4">You haven&apos;t completed your profile yet.</p>
              <a
                href="/profile"
                className="inline-block rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Complete Profile
              </a>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-4 border-b border-zinc-200 p-6 dark:border-zinc-800">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl dark:bg-zinc-800">
                    {profile?.first_name?.[0] ?? '?'}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-black dark:text-zinc-50">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  {profile?.location && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      📍 {profile.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 text-sm">
                <div>
                  <p className="text-zinc-400">Phone</p>
                  <p className="text-black dark:text-zinc-50">
                    {profile?.phone || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400">Date of birth</p>
                  <p className="text-black dark:text-zinc-50">
                    {profile?.date_of_birth || '—'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-zinc-400">Bio</p>
                  <p className="text-black dark:text-zinc-50">
                    {profile?.bio || '—'}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <a
                  href="/profile"
                  className="text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
                >
                  Edit Profile
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  )
}