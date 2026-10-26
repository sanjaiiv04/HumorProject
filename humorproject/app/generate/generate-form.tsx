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
    setResult(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, userPrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setResult({ caption: data.caption, prompt: data.prompt })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate a caption. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || loading || saving) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Please use an image smaller than 10 MB.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in.')
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('generations').upload(filePath, file)
      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`)
      const { data: publicUrlData } = supabase.storage.from('generations').getPublicUrl(filePath)
      setUploadedUrl(publicUrlData.publicUrl)
      await generateCaption(publicUrlData.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload this image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!uploadedUrl || loading || saving) return
    await generateCaption(uploadedUrl)
  }

  const handleSave = async () => {
    if (!uploadedUrl || !result || loading || saving) return
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
      <div className="flex flex-col gap-2">
        <label htmlFor="image-upload" className="text-sm font-semibold">
          Upload an image
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          disabled={loading || saving}
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className="sticker w-fit cursor-pointer rounded-full bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)]"
        >
          {file ? '📷 Change Image' : '📷 Choose Image'}
        </label>
      </div>

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
            maxLength={2000}
            disabled={loading || saving}
            className="rounded-lg border-2 border-[var(--color-ink)] px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={!file || loading || saving}
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
                disabled={saving || loading}
                className="sticker rounded-full bg-[var(--color-like)] px-5 py-2 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✅ Keep this one'}
              </button>
              <button
                onClick={handleRetry}
                disabled={loading || saving}
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