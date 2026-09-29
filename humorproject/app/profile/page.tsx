import { getUserAndProfile } from '@/lib/supabase/getProfile'
import ProfileForm from '@/app/profile/profile-form'

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile()

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-50 py-16 px-4 dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-3xl font-semibold text-black dark:text-zinc-50">
          Your Profile
        </h1>
        <ProfileForm userId={user.id} initialProfile={profile} />
      </div>
    </main>
  )
}