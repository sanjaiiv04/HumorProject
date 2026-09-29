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
          Welcome, {user.email}
        </p>

        {needsProfile && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <p className="mb-3">Please complete your profile.</p>
            <Link
              href="/profile"
              className="inline-block rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Complete Profile
            </Link>
          </div>
        )}

        <Link
          href="/profile"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          Go to Profile
        </Link>
      </div>
    </main>
  )
}