import { getUserAndProfile } from '@/lib/supabase/getProfile'
import ProfileForm from './profile-form'
import AppShell from '@/components/AppShell'

export default async function ProfilePage() {
  const { user, profile } = await getUserAndProfile()

  return (
    <AppShell>
      <main className="flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-md">
        <h1 className="mb-1 font-display text-3xl text-[var(--color-ink)]">            Your Profile
          </h1>
          <ProfileForm userId={user.id} initialProfile={profile} />
        </div>
      </main>
    </AppShell>
  )
}