'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export default function ProfileForm({
  userId,
  initialProfile,
}: {
  userId: string
  initialProfile: Profile | null
}) {
  const supabase = createClient()
  const router = useRouter()

  const [firstName, setFirstName] = useState(initialProfile?.first_name ?? '')
  const [lastName, setLastName] = useState(initialProfile?.last_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user);

    let newAvatarUrl = avatarUrl

    if (file) {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        setMessage(`Upload error: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      newAvatarUrl = publicUrlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        avatar_url: newAvatarUrl,
      })
      .eq('id', userId)

    setSaving(false)

    if (updateError) {
      setMessage(`Error saving profile: ${updateError.message}`)
    } else {
      setAvatarUrl(newAvatarUrl)
      setMessage('Profile saved!')
      router.refresh()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black"
    >
      {avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt="Profile"
          className="h-20 w-20 rounded-full object-cover"
        />
      )}

      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        First name
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Last name
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Profile photo
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-black px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      )}
    </form>
  )
}