'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { saveGeneration } from './actions'

export default function GenerateForm() {
  const supabase = createClient()
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ caption: string; prompt: string } | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
    setResult(null)
    setUploadedUrl(null)
    setSaved(false)
    setError('')
  }

  const generateCaption = async (imageUrl: string) => {
    setLoading(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, userPrompt }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    setResult({ caption: data.caption, prompt: data.prompt })
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      return
    }

    // Upload once; reused for retries
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('generations')
      .upload(filePath, file)

    if (uploadError) {
      setError(`Upload error: ${uploadError.message}`)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('generations')
      .getPublicUrl(filePath)

    setUploadedUrl(publicUrlData.publicUrl)
    await generateCaption(publicUrlData.publicUrl)
  }

  const handleRetry = async () => {
    if (!uploadedUrl) return
    await generateCaption(uploadedUrl)
  }

  const handleSave = async () => {
    if (!uploadedUrl || !result) return
    setSaving(true)
    try {
      await saveGeneration(uploadedUrl, result.prompt, result.caption)
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="sticker flex flex-col gap-4 rounded-2xl bg-[var(--color-content-bg)] p-6 text-[var(--color-content-ink)]"
      >
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Upload an image
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="max-h-64 rounded-lg object-contain" />
        )}

        <label className="flex flex-col gap-1 text-sm font-semibold">
          Optional style/context
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g. sarcastic, college-student energy"
            className="rounded-lg border-2 border-[var(--color-ink)] px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={!file || loading}
          className="sticker rounded-lg bg-[var(--color-skip)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Caption'}
        </button>

        {error && <p className="text-sm font-semibold text-[var(--color-dislike)]">{error}</p>}
      </form>

      {result && (
        <div className="sticker rounded-xl bg-[var(--color-surface)] p-4">
          <p className="mb-4 text-lg font-bold text-[var(--color-ink)]">
            &ldquo;{result.caption}&rdquo;
          </p>

          {saved ? (
            <p className="text-sm font-semibold text-[var(--color-like)]">
              ✅ Saved to your generations!
            </p>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="sticker rounded-full bg-[var(--color-like)] px-5 py-2 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✅ Keep this one'}
              </button>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="sticker rounded-full bg-[var(--color-surface)] px-5 py-2 text-sm font-bold text-[var(--color-ink)] disabled:opacity-50"
              >
                {loading ? 'Retrying...' : '🔁 Try again'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}