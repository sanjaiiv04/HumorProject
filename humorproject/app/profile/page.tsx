import { getUserAndProfile } from '@/lib/supabase/getProfile'
import ProfileForm from './profile-form'

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile()

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 py-16 px-4 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Your Profile
          </h1>
          <div className="flex gap-2">
            <a
              href="/dashboard"
              className="rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
            >
              Dashboard
            </a>
            <a
              href="/"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Groceries
            </a>
          </div>
        </div>
        <ProfileForm userId={user.id} initialProfile={profile} />
      </div>
    </main>
  )
}