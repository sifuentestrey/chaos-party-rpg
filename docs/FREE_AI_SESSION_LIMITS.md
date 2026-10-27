# Free AI session limits — October 27, 2026

The game has an additional **local safety allowance of 100 inference attempts per UTC day and four per rolling minute**. These are project limits in `src/free-ai-budget.mjs`, not a statement of Groq's account quota. The provider may impose other limits. Failed attempts count, interpretation and optional narration share the allowance, and phone reactions do not each call a model.

## What this means for game night

| Requests needed per turn | Maximum fully served turns from an unused local daily allowance |
| --- | --- |
| One interpretation, narration off | 100 |
| One interpretation and one narration | 50 |
| Native locked action without narration | No inference request for that action |

For illustration, three turns a minute for two hours is 360 turns. If each needs interpretation, that requires 360 requests; adding narration to each would require 720. Neither fits the current safety allowance. Two requests per turn at that pace also exceed four requests per rolling minute. These are arithmetic examples, not measured family play rates or a guarantee of free provider capacity.

The current approach keeps narration off and lets the game continue with deterministic rules if the model is unavailable, slow or rate limited. A full game night with continuous free AI interpretation **and** creative narration has not been established. Do not promise it from a handful of accurate answers or a fast median response time.

## Before live qualification

- Use the existing shared persistent test ledger. Do not delete it, raise limits, or point a live benchmark at a fresh directory to gain extra attempts.
- Read the UTC day and remaining allowance before requesting model metadata or inference. A later day can reset the normal daily count; a new chat is not a quota reset.
- Plan a small explicit request budget, test interpretation and narration separately, and stop after it. No automatic reruns or paid fallback.
- Judge the actual operation, exact target and canonical changes. Narration also needs human review for invented facts; JSON validation is insufficient.
- Keep credentials in the environment and disposable campaigns separate from the owner's saved game.

The original Mac ZIP, physical TV/two-phone experience, actual Mac performance, and reliable long-session live AI behavior remain separate acceptance gates.
