import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { fixtures, BASE_PROMPT, CAPTION_MODEL } from './configuration-fixtures.mjs'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === './configuration') return { url: new URL('../lib/generation/configuration.ts', import.meta.url).href, shortCircuit: true }
    if (specifier === '../ml/recommend') return { url: new URL('../lib/ml/recommend.ts', import.meta.url).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})
const { MAX_IMAGE_BYTES, CaptionError, generateLoggedCaption, uploadedImagePath, parseGeminiResponse } = await import('../lib/generation/caption-service.ts')
const project = 'https://example.supabase.co'
const userId = '11111111-1111-4111-8111-111111111111'
const storagePath = `${userId}-photo.png`
const imageUrl = `${project}/storage/v1/object/public/generations/${storagePath}`

function setup({ responses = [], image = null, failTable = null, failRequestStart = false, configure = () => {}, failRead = null } = {}) {
  const catalog = fixtures()
  configure(catalog)
  const writes = []
  const calls = []
  const sleeps = []
  const userClient = {
    from: () => {
      const query = { select: () => query, order: () => query, limit: () => query, then: resolve => Promise.resolve({ data: [], error: null }).then(resolve) }
      return query
    },
  }
  const logClient = {
    from(table) {
      const write = { table, operation: '', values: null, filters: [] }
      const query = {
        insert(values) { write.operation = 'insert'; write.values = structuredClone(values); return query },
        update(values) { write.operation = 'update'; write.values = structuredClone(values); return query },
        upsert(values) { write.operation = 'upsert'; write.values = structuredClone(values); return query },
        eq(key, value) { write.filters.push([key, value]); return query },
        select() { return query },
        order() { return query }, limit() { return query }, in() { return query }, or() { return query },
        overrideTypes() { return query },
        async single() {
          writes.push(write)
          if (table === failTable || (failRequestStart && table === 'generation_requests' && write.operation === 'insert')) return { data: null, error: { message: 'fake database error' } }
          return { data: { id: table === 'images' ? 'image-id' : 'request-id' }, error: null }
        },
        then(resolve) {
          if (!write.operation) return Promise.resolve({data: catalog[table] ?? [], error: table === failRead ? {message:'read failed'} : null}).then(resolve)
          writes.push(write)
          return Promise.resolve({ error: table === failTable ? { message: 'fake database error' } : null }).then(resolve)
        },
      }
      return query
    },
  }
  const fetcher = async (url, options) => {
    calls.push({ url, options })
    if (url === imageUrl) return image ?? new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } })
    const response = responses.shift()
    if (typeof response === 'function') return response(options)
    if (response instanceof Error) throw response
    return response ?? new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'A funny caption.' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4 }, modelVersion: CAPTION_MODEL }))
  }
  return {
    writes, calls, sleeps,
    run: () => generateLoggedCaption({ userClient, logClient, userId, storagePath, imageUrl, userPrompt: 'sarcastic', apiKey: 'test-private-key', fetcher, sleep: async ms => { sleeps.push(ms) } }),
  }
}

test('accepts both existing user-owned upload formats and rejects external/other-user paths', () => {
  assert.equal(uploadedImagePath(imageUrl, project, userId), storagePath)
  assert.equal(uploadedImagePath(`${project}/storage/v1/object/public/generations/${userId}/photo.png`, project, userId), `${userId}/photo.png`)
  for (const value of [
    'https://evil.example/image.png',
    `${project}/storage/v1/object/public/generations/someone-else.png`,
    `${imageUrl}?redirect=evil`,
    `${project}/storage/v1/object/public/generations/${userId}/%2e%2e%2fother.png`,
    `${project}/storage/v1/object/public/generations/${userId}/%5cother.png`,
  ]) assert.throws(() => uploadedImagePath(value, project, userId), CaptionError)
})

test('extracts captions without thoughts and allowlists provider metadata', () => {
  const parsed = parseGeminiResponse({ candidates: [{ content: { parts: [{ text: 'private reasoning', thought: true }, { text: '  Caption ' }, { text: 'text. ' }] } }], apiKey: 'do-not-store', usageMetadata: { promptTokenCount: -1, candidatesTokenCount: 3.5 } })
  assert.equal(parsed.caption, 'Caption text.')
  assert.equal(parsed.inputTokens, null)
  assert.equal(parsed.outputTokens, null)
  assert.equal(JSON.stringify(parsed.metadata).includes('do-not-store'), false)
})

test('records a request, uploaded image, exact prompt, real response, and completion', async () => {
  const app = setup()
  const result = await app.run()
  assert.equal(result.caption, 'A funny caption.')
  assert.equal(result.requestId, 'request-id')
  assert.equal(result.prompt, `${BASE_PROMPT}\n\nStyle/context from the user: sarcastic`)
  const request = app.writes.find(row => row.table === 'generation_requests' && row.operation === 'insert')
  assert.equal(request.values.user_id, userId)
  assert.equal(request.values.configuration_snapshot.execution_mode, 'configuration-loading')
  const configured = app.writes.find(row => row.values?.configuration_snapshot?.execution_mode === 'configured-chain')
  assert.equal(configured.values.prompt_chain_id, 'chain-1')
  assert.equal(configured.values.configuration_snapshot.steps[0].model.model_identifier, CAPTION_MODEL)
  const response = app.writes.find(row => row.table === 'llm_responses')
  assert.equal(response.values.status, 'succeeded')
  assert.equal(response.values.input_tokens, 12)
  assert.equal(response.values.output_tokens, 4)
  assert.equal(response.values.response_text, result.caption)
  assert.equal(app.writes.at(-1).values.status, 'succeeded')
  assert.ok(app.writes.at(-1).values.completed_at)
  assert.equal(app.writes.some(row => row.table === 'generations'), false)
  const providerCall = app.calls.find(row => row.url.includes('googleapis.com'))
  assert.equal(providerCall.url.includes('test-private-key'), false)
  assert.equal(providerCall.options.headers['x-goog-api-key'], 'test-private-key')
  const recorded = JSON.stringify(app.writes)
  assert.equal(recorded.includes('test-private-key'), false)
  assert.equal(recorded.includes('inline_data'), false)
})

test('logs each actual 503 retry and only succeeds after the real caption arrives', async () => {
  const app = setup({ responses: [new Response('private provider error', { status: 503 }), new Response('busy', { status: 503 })] })
  await app.run()
  const responses = app.writes.filter(row => row.table === 'llm_responses')
  assert.deepEqual(responses.map(row => [row.values.attempt, row.values.status]), [[1, 'failed'], [2, 'failed'], [3, 'succeeded']])
  assert.deepEqual(app.sleeps, [1500, 1500])
  assert.equal(JSON.stringify(app.writes).includes('private provider error'), false)
})

test('caps retries at the existing maximum of four calls', async () => {
  const app = setup({ responses: Array.from({ length: 4 }, () => new Response('busy', { status: 503 })) })
  await assert.rejects(app.run(), /HTTP 503/)
  assert.equal(app.writes.filter(row => row.table === 'llm_responses').length, 4)
  assert.equal(app.sleeps.length, 3)
  assert.equal(app.writes.at(-1).values.status, 'failed')
})

test('does not turn blocked or empty model output into a fabricated successful caption', async () => {
  const app = setup({ responses: [new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }))] })
  await assert.rejects(app.run(), /no caption/)
  const response = app.writes.find(row => row.table === 'llm_responses')
  assert.equal(response.values.status, 'failed')
  assert.equal(response.values.response_text, null)
  assert.equal(response.values.response_metadata.block_reason, 'SAFETY')
  assert.equal(app.writes.at(-1).values.status, 'failed')
})

test('records network and malformed-response failures without leaking request secrets', async () => {
  for (const response of [new Error('https://example?key=private-key'), new Response('invalid JSON')]) {
    const app = setup({ responses: [response] })
    await assert.rejects(app.run(), /could not be read/)
    assert.equal(app.writes.find(row => row.table === 'llm_responses').values.status, 'failed')
    assert.equal(JSON.stringify(app.writes).includes('private-key'), false)
  }
})

test('image failures mark the request failed without claiming a provider call occurred', async () => {
  const app = setup({ image: new Response('missing', { status: 404 }) })
  await assert.rejects(app.run(), /image could not be read/)
  assert.equal(app.writes.filter(row => row.table === 'llm_responses').length, 0)
  assert.equal(app.calls.filter(row => row.url.includes('googleapis.com')).length, 0)
  assert.equal(app.writes.at(-1).values.status, 'failed')
})

test('limits uploaded image size before sending it to Gemini', async () => {
  const app = setup({ image: new Response('data', { headers: { 'content-type': 'image/png', 'content-length': String(MAX_IMAGE_BYTES + 1) } }) })
  await assert.rejects(app.run(), /10 MB/)
  assert.equal(app.calls.length, 1)
})

test('unavailable request logging prevents a paid provider call', async () => {
  const app = setup({ failRequestStart: true })
  await assert.rejects(app.run(), error => error instanceof CaptionError && error.status === 503)
  assert.equal(app.calls.length, 0)
})

test('response logging failures do not report a successful recorded generation', async () => {
  const app = setup({ failTable: 'llm_responses' })
  await assert.rejects(app.run(), /record the model response/)
  assert.equal(app.writes.at(-1).values.status, 'failed')
})

test('configured steps run in order with distinct models, flags, references, and previous output',async()=>{
 const app=setup({configure(c){
  const first=c.prompt_chain_steps[0]
  first.include_image=false; first.use_community_examples=false;first.include_user_context=false
  first.prompt_template='Describe the situation.'
  c.prompt_chain_steps.push({...structuredClone(first),id:'step-2',position:2,prompt_template:'Write the final caption.',include_image:true,use_terms:true,use_curated_examples:true,include_user_context:true,model:{...structuredClone(first.model),id:'model-2',model_identifier:'gemini-custom'}})
  c.terms=[{id:'term-1',term:'Finals',definition:'Exam season',example:'Study marathon'}]
  c.ai_generation_examples=[{id:'example-1',caption:'Library is home',context:'Students',sentiment:'positive',image_id:null,prompt_chain_id:null}]
 }})
 const result=await app.run()
 const calls=app.calls.filter(c=>c.url.includes('googleapis.com'))
 assert.equal(calls.length,2);assert.match(calls[1].url,/gemini-custom:/)
 const first=JSON.parse(calls[0].options.body).contents[0].parts
 assert.equal(first.length,1);assert.equal(first[0].text,'Describe the situation.')
 const second=JSON.parse(calls[1].options.body).contents[0].parts
 assert.equal(second.length,2);assert.match(second[0].text,/Finals: Exam season/)
 assert.match(second[0].text,/positive: Library is home/);assert.match(second[0].text,/Previous step output:\nA funny caption/)
 assert.match(second[0].text,/sarcastic/);assert.equal(result.prompt,second[0].text)
 assert.deepEqual(app.writes.filter(w=>w.table==='llm_responses').map(w=>[w.values.step_position,w.values.prompt_chain_step_id,w.values.llm_model_id]),[[1,'step-1','model-1'],[2,'step-2','model-2']])
})
test('configuration errors are logged and prevent paid model calls without hardcoded fallback',async()=>{
 for(const options of [{configure:c=>{c.prompt_chain_mix=[]}},{failRead:'prompt_chain_steps'},{configure:c=>{c.prompt_chain_steps[0].model.provider.slug='unsupported'}}]){
  const app=setup(options)
  await assert.rejects(app.run(),error=>error.status===503 && error.requestId==='request-id')
  assert.equal(app.calls.length,0);assert.equal(app.writes.at(-1).values.status,'failed')
 }
})
test('failure in an intermediate step stops the chain',async()=>{
 const app=setup({configure:c=>{c.prompt_chain_steps.push({...structuredClone(c.prompt_chain_steps[0]),id:'step-2',position:2})},responses:[new Response('failure',{status:400})]})
 await assert.rejects(app.run(),/HTTP 400/)
 assert.equal(app.calls.filter(c=>c.url.includes('googleapis.com')).length,1)
 assert.equal(app.writes.at(-1).values.status,'failed')
})

test('Gemini gets 60 seconds per call and the 110-second chain deadline still cancels it', async t => {
  for (const [duration, status] of [[60000, 502], [110000, 504]]) {
    const controllers = new Map()
    const timeout = t.mock.method(AbortSignal, 'timeout', milliseconds => {
      const controller = new AbortController()
      controllers.set(milliseconds, controller)
      return controller.signal
    })
    try {
      const app = setup({ responses: [options => {
        assert.equal(controllers.has(60000), true)
        assert.equal(controllers.has(110000), true)
        assert.equal(controllers.has(25000), false)
        assert.equal(options.signal.aborted, false)
        controllers.get(duration).abort(new DOMException('Test timeout', 'TimeoutError'))
        assert.equal(options.signal.aborted, true)
        throw options.signal.reason
      }] })
      await assert.rejects(app.run(), error => error.status === status && /timed out/.test(error.message))
      assert.equal(app.writes.filter(row => row.table === 'llm_responses').length, 1)
      assert.equal(app.writes.at(-1).values.status, 'failed')
      assert.equal(app.sleeps.length, 0)
    } finally {
      timeout.mock.restore()
    }
  }
})
