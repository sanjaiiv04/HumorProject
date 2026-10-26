import type { SupabaseClient } from '@supabase/supabase-js'
import { preferenceExamples, type VoteRow } from '../ml/recommend'

export const CAPTION_MODEL = 'gemini-3.5-flash-lite'
export const BASE_PROMPT = 'Write one short, funny meme-style caption for this image. Keep it under 15 words. Return ONLY the caption text, no quotes, no extra commentary.'
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export class CaptionError extends Error {
  status: number
  requestId?: string
  constructor(message: string, status = 502, requestId?: string) {
    super(message)
    this.status = status
    this.requestId = requestId
  }
}

export function uploadedImagePath(imageUrl: string, projectUrl: string, userId: string): string {
  try {
    const url = new URL(imageUrl)
    const prefix = '/storage/v1/object/public/generations/'
    const path = decodeURIComponent(url.pathname.slice(prefix.length))
    if (url.origin !== new URL(projectUrl).origin || !url.pathname.startsWith(prefix)
      || url.username || url.password || url.search || url.hash
      || !(path.startsWith(`${userId}-`) || path.startsWith(`${userId}/`))
      || path.split('/').some(part => part === '..' || part === '.' || part === '')
      || /[\\\x00-\x1f]/.test(path)) throw new Error('Invalid image')
    return path
  } catch {
    throw new CaptionError('Choose an image uploaded through your account.', 400)
  }
}

type JsonRecord = Record<string, unknown>
const object = (value: unknown): JsonRecord => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
const tokenCount = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2_147_483_647 ? value : null
const shortText = (value: unknown) => typeof value === 'string' ? value.slice(0, 200) : null

export function parseGeminiResponse(raw: unknown) {
  const body = object(raw)
  const candidate = object(Array.isArray(body.candidates) ? body.candidates[0] : undefined)
  const content = object(candidate.content)
  const parts: unknown[] = Array.isArray(content.parts) ? content.parts : []
  const caption = parts.map(object).filter(part => part.thought !== true)
    .map(part => typeof part.text === 'string' ? part.text : '').join('').trim()
  const usage = object(body.usageMetadata)
  return {
    caption,
    inputTokens: tokenCount(usage.promptTokenCount),
    outputTokens: tokenCount(usage.candidatesTokenCount),
    metadata: {
      finish_reason: shortText(candidate.finishReason),
      model_version: shortText(body.modelVersion),
      response_id: shortText(body.responseId),
      block_reason: shortText(object(body.promptFeedback).blockReason),
    },
  }
}

async function readImage(response: Response) {
  if (!response.ok) throw new CaptionError('The uploaded image could not be read.', 400)
  const mimeType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? ''
  if (!mimeType.startsWith('image/')) throw new CaptionError('The uploaded file is not an image.', 400)
  const length = Number(response.headers.get('content-length'))
  if (length > MAX_IMAGE_BYTES) throw new CaptionError('Please use an image smaller than 10 MB.', 413)
  const reader = response.body?.getReader()
  if (!reader) throw new CaptionError('The uploaded image is empty.', 400)
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel()
      throw new CaptionError('Please use an image smaller than 10 MB.', 413)
    }
    chunks.push(value)
  }
  if (!size) throw new CaptionError('The uploaded image is empty.', 400)
  return { mimeType, size, base64: Buffer.concat(chunks).toString('base64') }
}

interface GenerationOptions {
  userClient: SupabaseClient
  logClient: SupabaseClient
  userId: string
  imageUrl: string
  storagePath: string
  userPrompt: string
  apiKey: string
  fetcher?: typeof fetch
  sleep?: (ms: number) => Promise<void>
}

export async function generateLoggedCaption({
  userClient, logClient, userId, imageUrl, storagePath, userPrompt, apiKey,
  fetcher = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
}: GenerationOptions) {
  // Preserve the existing prompt and community-rating behavior. Catalog/mix
  // execution is a separate integration; do not falsely associate a configured
  // chain that this code did not execute.
  const [{ data: generations }, { data: votes }] = await Promise.all([
    userClient.from('generations').select('id, caption').order('created_at', { ascending: false }).limit(200),
    userClient.from('votes').select('user_id, generation_id, vote_type'),
  ])
  const { liked, disliked } = preferenceExamples(generations ?? [], (votes ?? []) as VoteRow[])
  let prompt = BASE_PROMPT
  if (liked.length) prompt += `\n\nCaptions the community rated highly (match their tone, length and humor):\n${liked.map(caption => `- ${caption}`).join('\n')}`
  if (disliked.length) prompt += `\n\nCaptions the community disliked (avoid this style):\n${disliked.map(caption => `- ${caption}`).join('\n')}`
  if (userPrompt) prompt += `\n\nStyle/context from the user: ${userPrompt}`

  const startedAt = new Date().toISOString()
  const { data: request, error: requestError } = await logClient.from('generation_requests').insert({
    user_id: userId, user_context: userPrompt || null, status: 'running', started_at: startedAt,
    configuration_snapshot: {
      source: 'user-facing /api/generate', execution_mode: 'existing-single-call',
      provider_slug: 'google', model_identifier: CAPTION_MODEL, prompt_text: prompt,
      image: { storage_bucket: 'generations', storage_path: storagePath },
      community_examples: { liked, disliked },
    },
  }).select('id').single()
  // Do not pay for a provider call if its request cannot be recorded first.
  if (requestError || !request) throw new CaptionError('Caption generation is temporarily unavailable. Please try again later.', 503)
  const requestId = request.id as string
  const finishedAt = () => new Date(Math.max(Date.now(), Date.parse(startedAt))).toISOString()

  async function finish(status: 'succeeded' | 'failed', message: string | null) {
    const { data, error } = await logClient.from('generation_requests')
      .update({ status, error_message: message, completed_at: finishedAt() })
      .eq('id', requestId).eq('user_id', userId).select('id').single()
    if (error || !data) throw new CaptionError('Could not finalize this generation. Please try again.', 503, requestId)
  }

  try {
    const imageResponse = await fetcher(imageUrl, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15_000) })
    const image = await readImage(imageResponse)
    const { data: imageRow, error: imageError } = await logClient.from('images').upsert({
      uploaded_by: userId, storage_bucket: 'generations', storage_path: storagePath,
      mime_type: image.mimeType, size_bytes: image.size,
    }, { onConflict: 'storage_bucket,storage_path' }).select('id').single()
    if (imageError || !imageRow) throw new CaptionError('Could not record the uploaded image. Please try again.', 503, requestId)
    const { data: linkedRequest, error: linkError } = await logClient.from('generation_requests')
      .update({ image_id: imageRow.id }).eq('id', requestId).eq('user_id', userId).select('id').single()
    if (linkError || !linkedRequest) throw new CaptionError('Could not record this generation. Please try again.', 503, requestId)

    const body = JSON.stringify({ contents: [{ parts: [
      { text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.base64 } },
    ] }] })

    for (let attempt = 1; attempt <= 4; attempt++) {
      const callStarted = Date.now()
      let response: Response | undefined
      let parsed = parseGeminiResponse(null)
      let failure: string | null = null
      try {
        // Keep credentials out of URLs, error messages, and recorded metadata.
        response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${CAPTION_MODEL}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body, signal: AbortSignal.timeout(25_000),
        })
        if (!response.ok) failure = `Gemini returned HTTP ${response.status}.`
        else {
          parsed = parseGeminiResponse(await response.json())
          if (!parsed.caption) failure = 'Gemini returned no caption.'
        }
      } catch (error) {
        failure = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'The Gemini request timed out.' : 'The Gemini response could not be read.'
      }
      const { error: responseError } = await logClient.from('llm_responses').insert({
        generation_request_id: requestId, step_position: 1, attempt,
        provider_slug: 'google', model_identifier: CAPTION_MODEL, prompt_text: prompt,
        response_text: failure ? null : parsed.caption, status: failure ? 'failed' : 'succeeded',
        http_status: response?.status ?? null, error_message: failure,
        input_tokens: parsed.inputTokens, output_tokens: parsed.outputTokens,
        latency_ms: Math.min(2_147_483_647, Math.max(0, Date.now() - callStarted)),
        response_metadata: parsed.metadata,
      })
      if (responseError) throw new CaptionError('Could not record the model response. Please try again.', 503, requestId)
      if (!failure) {
        await finish('succeeded', null)
        return { caption: parsed.caption, prompt, requestId }
      }
      if (response?.status === 503 && attempt < 4) {
        await sleep(1500)
        continue
      }
      throw new CaptionError(failure, 502, requestId)
    }
    throw new CaptionError('Gemini is temporarily unavailable.', 502, requestId)
  } catch (error) {
    const failure = error instanceof CaptionError ? error : new CaptionError('Caption generation failed. Please try again.', 502, requestId)
    try { await finish('failed', failure.message) } catch {
      // Avoid dumping database/provider errors that could contain credentials.
      console.error('generation_request_finalize_failed', { requestId })
    }
    throw new CaptionError(failure.message, failure.status, requestId)
  }
}
