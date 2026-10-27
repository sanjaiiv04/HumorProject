import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLoggingClient } from '@/lib/supabase/admin'
import { CaptionError, generateLoggedCaption, uploadedImagePath } from '@/lib/generation/caption-service'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  let input: unknown
  try { input = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const { imageUrl, userPrompt = '' } = input as Record<string, unknown>
  if (typeof imageUrl !== 'string' || imageUrl.length > 2048 || typeof userPrompt !== 'string' || userPrompt.length > 2000) {
    return NextResponse.json({ error: 'Provide an uploaded image and style/context of at most 2000 characters.' }, { status: 400 })
  }

  try {
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const apiKey = process.env.GEMINI_API_KEY
    if (!projectUrl || !apiKey) return NextResponse.json({ error: 'Caption generation is temporarily unavailable.' }, { status: 503 })
    const storagePath = uploadedImagePath(imageUrl, projectUrl, user.id)
    let logClient: ReturnType<typeof createLoggingClient>
    try { logClient = createLoggingClient() } catch {
      console.error('generation_logging_configuration_missing')
      return NextResponse.json({ error: 'Caption generation is temporarily unavailable.' }, { status: 503 })
    }
    const result = await generateLoggedCaption({
      userClient: supabase, logClient, userId: user.id, imageUrl,
      storagePath, userPrompt: userPrompt.trim(), apiKey,
    })
    // Only "Keep this one" writes to generations; logging never publishes a caption.
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof CaptionError) return NextResponse.json({ error: error.message, requestId: error.requestId }, { status: error.status })
    console.error('generation_unexpected_error')
    return NextResponse.json({ error: 'Caption generation failed. Please try again.' }, { status: 500 })
  }
}
