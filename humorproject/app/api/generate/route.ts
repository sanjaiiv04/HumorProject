import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function callGeminiWithRetry(url: string, body: object, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.status !== 503) return res
    await new Promise((r) => setTimeout(r, 1500))
  }
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { imageUrl, userPrompt } = await request.json()

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 })
  }

  const imageRes = await fetch(imageUrl)
  const imageBuffer = await imageRes.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  const mimeType = imageRes.headers.get('content-type') || 'image/jpeg'

  const basePrompt =
    'Write one short, funny meme-style caption for this image. Keep it under 15 words. Return ONLY the caption text, no quotes, no extra commentary.'

  const finalPrompt = userPrompt
    ? `${basePrompt} Style/context from the user: ${userPrompt}`
    : basePrompt

  const geminiRes = await callGeminiWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [
            { text: finalPrompt },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
    }
  )

  if (!geminiRes.ok) {
    const errText = await geminiRes.text()
    return NextResponse.json({ error: `Gemini error: ${errText}` }, { status: 500 })
  }

  const geminiData = await geminiRes.json()
  const caption =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    'Could not generate a caption.'

  // No DB insert here anymore — just return the result for the user to review
  return NextResponse.json({ caption, prompt: finalPrompt })
}