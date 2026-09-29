import { getUserAndProfile } from '@/lib/supabase/getProfile'
import Link from 'next/link'

export default async function Dashboard() {
  const { user, profile } = await getUserAndProfile()

  const needsProfile = !profile?.first_name || !profile?.last_name

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 py-16 px-4 dark:bg-black">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 text-3xl font-semibold text-black dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Welcome, {profile?.first_name ? profile.first_name + "!": 'Guest'}
        </p>

        {needsProfile ? (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <p className="mb-3">Please complete your profile.</p>
            <a
              href="/profile"
              className="inline-block rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Complete Profile
            </a>
          </div>
        ) : (
          <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
            {profile?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <p className="text-lg font-medium text-black dark:text-zinc-50">
              {profile?.first_name} {profile?.last_name}
            </p>
            <a
              href="/profile"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Edit Profile
            </a>
          </div>
        )}

        <a
          href="/"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          Back to Groceries
        </a>
      </div>
    </main>
  )
}