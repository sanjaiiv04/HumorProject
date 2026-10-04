'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  location: string | null
  date_of_birth: string | null
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
  const [bio, setBio] = useState(initialProfile?.bio ?? '')
  const [phone, setPhone] = useState(initialProfile?.phone ?? '')
  const [location, setLocation] = useState(initialProfile?.location ?? '')
  const [dob, setDob] = useState(initialProfile?.date_of_birth ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

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
        bio,
        phone,
        location,
        date_of_birth: dob || null,
      })
      .eq('id', userId)

    setSaving(false)

    if (updateError) {
      setMessage(`Error saving profile: ${updateError.message}`)
    } else {
      setAvatarUrl(newAvatarUrl)
      setPreview(null)
      setMessage('Profile saved!')
      router.refresh()
    }
  }

  const inputClass =
    'rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white'

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col items-center gap-3">
        {preview || avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview || avatarUrl}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 text-2xl text-zinc-500 dark:bg-zinc-800">
            {firstName?.[0] ?? '?'}
          </div>
        )}
        <label className="cursor-pointer text-sm font-medium text-zinc-600 underline dark:text-zinc-400">
          Change photo
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          First name
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Last name
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Tell us a little about yourself..."
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="New York, NY"
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        Date of birth
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {message && (
        <p
          className={`text-sm ${
            message.startsWith('Error') || message.startsWith('Upload error')
              ? 'text-red-600'
              : 'text-green-600'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  )
}