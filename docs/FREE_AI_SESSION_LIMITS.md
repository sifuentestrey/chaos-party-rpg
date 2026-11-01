# Free AI session limits — updated October 29, 2026

The game now has a provider-aligned **local request ceiling of 1,000 inference attempts per UTC day and 30 per rolling minute**. These are local ceilings in `src/free-ai-budget.mjs` aligned to Groq's published GPT-OSS Free Plan request defaults as of October 29, 2026, not a guarantee of this organization's actual quota. The former arbitrary 100/day and four/minute local caps were retired at the owner's request. The provider may impose other limits. Failed attempts count, interpretation and optional narration share the allowance, and phone reactions do not each call a model.

## What this means for game night

| Requests needed per turn | Maximum fully served turns from an unused local daily allowance |
| --- | --- |
| One interpretation, narration off | 1,000 local request slots (subject to provider token/request limits) |
| One interpretation and one narration | 500 local request pairs (subject to provider limits) |
| Native locked action without narration | No inference request for that action |

For illustration, three turns a minute for two hours is 360 turns. If each needs interpretation, that requires 360 requests; adding narration to each would require 720. 720 requests would fit the updated local request ceilings if spread across two hours, but the provider's 8,000 tokens/minute and 200,000 tokens/day published defaults may stop requests earlier. Each organization's actual limits can differ; the provider, not this counter, determines account-specific free availability. These are arithmetic examples, not measured family play rates or a guarantee of free provider capacity.

Groq currently publishes 1,000 requests/day, 30 requests/minute, 8,000 tokens/minute and 200,000 tokens/day for GPT-OSS 120B on its Free Plan; see https://console.groq.com/docs/rate-limits. Do not treat these as guaranteed organization limits. Groq's 429 responses still stop requests and trigger cooldown, without any paid fallback.

The current approach keeps narration off and lets the game continue with deterministic rules if the model is unavailable, slow or rate limited. A full game night with continuous free AI interpretation **and** creative narration has not been established. Do not promise it from a handful of accurate answers or a fast median response time.

## Before live qualification

- Use the existing shared persistent test ledger. Do not delete it, raise limits, or point a live benchmark at a fresh directory to gain extra attempts.
- Read the UTC day and remaining allowance before requesting model metadata or inference. A later day can reset the normal daily count; a new chat is not a quota reset.
- Plan a small explicit request budget, test interpretation and narration separately, and stop after it. No automatic reruns or paid fallback.
- Judge the actual operation, exact target and canonical changes. Narration also needs human review for invented facts; JSON validation is insufficient.
- Keep credentials in the environment and disposable campaigns separate from the owner's saved game.

The original Mac ZIP, physical TV/two-phone experience, actual Mac performance, and reliable long-session live AI behavior remain separate acceptance gates.
