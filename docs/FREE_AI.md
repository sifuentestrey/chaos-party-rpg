# Strictly-free AI path

The owner's requirement is zero paid AI usage. No paid account, purchase, billing activation, paid fallback, or automatic provider switching is authorized. The failed Qwen CPU test does not qualify a replacement model.

## First candidate: Groq Free Plan

Official documentation consulted:

- https://console.groq.com/docs/billing-faqs — moving from Free to Developer requires an explicit upgrade and a payment method. Do not upgrade or add payment details for this project.
- https://console.groq.com/docs/rate-limits — currently lists GPT-OSS 20B/120B at 30 requests/minute, 1,000 requests/day, 8,000 tokens/minute and 200,000 tokens/day on the Free Plan. Actual organization limits and provider policy are authoritative and can change; free access is not an availability guarantee.
- https://console.groq.com/docs/structured-outputs — both GPT-OSS models support strict JSON-schema outputs.
- https://console.groq.com/docs/model/openai/gpt-oss-20b — model identifier `openai/gpt-oss-20b`; low/medium/high reasoning modes are documented.

One provider connection serves the group; phone reactions do not each invoke a model. The Mac hosts rules/rendering while the provider receives bounded game text for the accepted declaration. Tokens, PINs, host keys and RNG seed are excluded. Before activating, the owner must be comfortable sending scene/player text to that provider. Provider data policies apply.

## Implemented, not yet live-qualified

`CHAOS_AI_PROVIDER=groq-free` explicitly selects the fixed HTTPS Groq endpoint. `GROQ_API_KEY` is read only by the server and never projected into game state. Do not paste a key into chat, save it in source, or use a key from an organization with billing enabled. Starting the game without a key reports not configured and makes no provider request. `CHAOS_AI=off` overrides all providers. `CHAOS_AI_MODEL` may select GPT-OSS 20B or 120B; no other model/provider is silently selected on failure. The local Qwen path remains separate and unchanged by default.

The adapter uses the documented chat-completions structured-output protocol with low reasoning effort. It rejects redirects, bounds response bytes, reserves a persistent local request allowance before inference, performs no automatic retries, and pauses at least 60 seconds on HTTP 429 (longer when a numeric Retry-After requests it). The local allowance is 100 attempts per UTC day and four attempts in a rolling minute, shared by this game process/data directory and preserved in `ai-free-usage.json`. Failed requests count. Corrupt usage storage blocks requests rather than resetting the allowance. These are additional limits, not a billing guarantee, token budget, or substitute for the provider's quotas. One game process owns the data directory. Native rules continue on model/quota failure.

Important: the API endpoint cannot prove whether a key belongs to a Free or paid organization. The adapter cannot stop the provider from billing a paid organization. The strictly-free guarantee therefore requires an account/organization that remains on the Free Plan with no payment method/paid upgrade. If that cannot be confirmed, leave this adapter disabled.

## Next real test

1. Create or use a Groq Free Plan account, without activating billing or adding payment details. Check its model access and actual limits.
2. Create an API key. Put it in the cloud environment's Personal vault/secret configuration mapped to `GROQ_API_KEY`, never in chat. Set the non-secret `CHAOS_AI_PROVIDER=groq-free` variable.
3. Allow `api.groq.com` in the environment network policy. Preserve existing entries. A published environment change may require a fresh task. Preserve the latest source checkpoint before moving.
4. Run `node scripts/benchmark-campaign-ai.mjs` against the real configured service. Its hosted requests are spaced to respect the local four-per-minute allowance. Record model, accuracy of target/components/appearance, p50/p95, errors and token usage. Twelve semantic cases must pass within the live deadline before declaring the interpreter qualified.
5. Evaluate creative narration separately. No free provider has yet been live-qualified in this project, and no full creative narrator has yet been delivered.

A free account/key and the network grant are not configured in this task. Adapter tests use synthetic responses; they establish protocol and quota behavior, not actual model quality or speed.

## Other candidates researched

Google's official billing docs say new Gemini accounts begin on a Free Tier and a paid upgrade requires billing/prepayment: https://ai.google.dev/gemini-api/docs/billing . Model access and quota depend on account/model; no blanket daily allowance is promised here. Free-tier data terms differ from paid usage. Gemini is an alternative candidate, not a tested fallback.

OpenRouter's official FAQ documents 50 free-model requests/day for accounts without the qualifying credit purchase: https://openrouter.ai/docs/faq . A higher allowance requiring a credit purchase does not meet this project's zero-spend requirement. Fifty requests would be tight when interpretation and narration may need separate calls, so it is not the first test candidate.

A free API tier can be rate-limited, unavailable or discontinued. Offline play remains supported by game rules, but it does not provide the full AI-DM experience during an outage. Local models remain possible on suitable hardware; the reported Qwen3-1.7B Q8 CPU configuration was not suitable.
