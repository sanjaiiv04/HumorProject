# Caption generation history

The `/api/generate` server route records each new generation attempt in the shared
Supabase database. The admin app reads these records directly.

## Configuration

Keep the existing public Supabase URL/key and `GEMINI_API_KEY`. In this app's
`.env.local`, add **one** server-side Supabase credential for the same project:

```dotenv
SUPABASE_SECRET_KEY=your-project-secret-key
# Or, for a legacy service_role credential:
# SUPABASE_SERVICE_ROLE_KEY=your-project-service-role-key
```

Use an actual key from Supabase Settings → API Keys, not the placeholder above.
Never prefix this key with `NEXT_PUBLIC_`, commit it, or include it in browser code.
Add the same variable in your deployment's environment settings and redeploy.
Restart the local dev server after editing environment variables.

The server uses a separate client with no user session for history writes. Every
generation still requires a verified signed-in user. Images must be in that
user's path in the existing `generations` bucket and be at most 10 MB.

## What gets recorded

- `generation_requests`: one row per Generate/Try again operation, with the user,
  image, actual prompt/model snapshot, status, and completion/error information.
- `llm_responses`: one row per actual Gemini call, including automatic HTTP 503
  retries, non-success responses, network failures, and empty/blocked output.
- `images`: metadata for the existing uploaded object; retries reuse this record.

The actual prompt and returned caption are stored, along with token counts when
provided and elapsed milliseconds. Provider metadata is allowlisted. Keys,
request headers, and base64 image payloads are never stored in history.

A request is recorded before calling Gemini. If history cannot be initialized,
the server returns an availability error without making a paid model call.
Successful calls with empty/blocked output are failures, not fabricated captions.
If the database becomes unavailable after a provider call, an attempt may remain
in `running`; the server logs a request ID for reconciliation.

This phase preserves the current code-based Gemini prompt and model selection.
Its snapshot explicitly identifies that execution mode. It does not claim to
execute a database-configured chain, so chain/step/model foreign keys remain
unset until configuration-based execution is implemented.

Saved captions still enter `generations` only through **Keep this one**. History
does not backfill old attempts, publish discarded captions, or change signup.

## Verify

1. Start the user app, sign in, and generate a caption from a new uploaded image.
2. Open admin Generation requests; the request should be `succeeded`.
3. Open its responses to see the prompt, caption, model, latency, and token counts.
4. Choose Try again: this produces another request for the same image.
5. Keep this one: confirm the caption also appears in the existing media gallery.

Run offline tests with `node --test tests/generation-logging.test.mjs` (Node 22.18+).
Tests use fake fetch/database clients and never call Gemini or alter Supabase.
