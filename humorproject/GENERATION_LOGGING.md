# Configured caption generation

CapRate reads the shared Supabase configuration on every Generate/Try again request. Deploy this update together with the admin changes. No database migration is required.

Keep `GEMINI_API_KEY` and one server-only Supabase credential (`SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`) configured in local and deployment environments. Never use a `NEXT_PUBLIC_` prefix for these credentials. The privileged client reads configuration and writes history; the cookie-backed client verifies the user and reads community ratings.

## Execution

An enabled mix entry must reference an active chain with 1–4 executable steps. Every step must have an active model/provider, provider slug `google`, a Gemini model identifier, and image support when Include image is enabled. An invalid step excludes its whole chain. Selection is random with probability equal to weight divided by the total eligible weight. If no chain qualifies or configuration cannot load, the request fails without calling Gemini; there is no hardcoded prompt/model fallback.

Steps run in ascending position order. Each prompt starts with its configured literal prompt text (no template interpolation). Enabled switches add community-rated captions, up to 20 active terms ordered by term, the 10 newest active global/current-chain curated example captions and context, and user style/context. Curated image links are references, not additional image inputs. Each later step receives the previous output; the final output is the returned caption. Only Include image sends the user's uploaded image to that step.

Edit the prompt, model, and switches from Admin → Chain steps → step → Edit prompt and step settings. Terms and examples remain unused until their step switches are enabled. Changes apply to subsequent requests; an in-progress request retains the configuration it loaded. Multi-query configuration loading is not an atomic database snapshot, but the selected values are fixed for the request and recorded before any model call.

Limits: 100 enabled mix entries, fewer than 1000 total loaded steps, four steps per chain, 64000 prompt characters, 16000 output characters per step, 10 MB user image. Overall provider/image work has a 110-second deadline and route `maxDuration=120`; deployment plans may impose shorter limits. Each step retries HTTP 503 at most four times. Other failures stop the chain, retain completed step history, and mark the request failed.

## History and saved captions

`generation_requests` is created before configuration loading. Before calling Gemini it records the selected chain ID and a snapshot of the mix, steps, models/providers, terms, curated examples, community examples, and limits. `llm_responses` records the real step/model IDs, exact prompt, real response or error, retry number, token counts, and latency for every actual call. Keys, auth headers, and image base64 are never logged. Uploaded images retain the existing ownership validation and metadata recording.

If history cannot initialize, no paid provider call is made. Database outages after a provider call can leave a request running; the server logs its request ID for reconciliation. Only Keep this one publishes to `generations`; intermediate outputs and discarded captions are history only.

## Verify

Generate once using the default chain, then inspect its request snapshot and step responses in admin. Change a step prompt or enable terms/examples, generate again, and compare recorded prompts. Disabling every eligible mix entry should produce an error and no Gemini response. Tests use fake clients/fetch and never modify Supabase or call Gemini:

`node --test tests/configuration.test.mjs tests/generation-logging.test.mjs tests/signup-access.test.mjs`
