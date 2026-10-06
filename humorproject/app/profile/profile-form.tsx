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
    'rounded-lg border-2 border-[var(--color-ink)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-skip)]'

  return (
    <form
      onSubmit={handleSubmit}
      className="sticker flex flex-col gap-5 rounded-2xl bg-[var(--color-surface)] p-6"
    >
      <div className="flex flex-col items-center gap-3">
        {preview || avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview || avatarUrl}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover ring-2 ring-[var(--color-ink)]"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-bg)] text-2xl text-[var(--color-muted)]">
            {firstName?.[0] ?? '?'}
          </div>
        )}
        <label htmlFor="avatar-upload" className="cursor-pointer text-sm font-medium text-[var(--color-ink)] underline">
          Change photo
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-ink)]">
          First name
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-ink)]">
          Last name
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-ink)]">
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
        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-ink)]">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-ink)]">
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

      <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-ink)]">
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
        className="sticker rounded-full bg-[var(--color-skip)] px-4 py-2.5 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {message && (
        <p
          className={`text-sm font-semibold ${
            message.startsWith('Error') || message.startsWith('Upload error')
              ? 'text-[var(--color-dislike)]'
              : 'text-[var(--color-like)]'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  )
}