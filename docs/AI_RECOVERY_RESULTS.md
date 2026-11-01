# Live AI recovery results

The uploaded bundle recovered commit 0951008 with complete history into a separate checkout. Original checkout and saves were preserved. No original Mac ZIP was supplied in this recovery; these are AI adapter fixes, not visual or physical-device acceptance.

## Changes

- Transfer/treatment wording reaches the world-action interpreter.
- World requests now include the actor's inventory and available player IDs, as well as scene objects and canonical memory.
- Prompts explain supported give, treat and harvest operations and prohibit invented actions.
- Narration schemas bind turn, outcome and available speaker IDs. Dialogue capacity is limited by the number of available NPCs.
- Provider errors expose only a bounded, restricted error code, never raw provider output or credentials. The observed HTTP 400 code was json_validate_failed.
- Explicit groq-free configuration now defaults to openai/gpt-oss-120b. There is no automatic provider/model fallback. Narration remains off by default.

## Results

The original 20B baseline passed 8/12 interpretation cases and 1/3 narration structure checks. Adapter fixes alone still left 20B at 8/12 interpretation cases, with semantic failures, a JSON validation failure and a slow request.

With the revised adapter and explicitly selected GPT-OSS-120B, all 12 interpretation cases passed the automated semantic checks and the 5.5-second deadline. Median 793 ms, p95 1245 ms. The final narration run passed 3/3 structural checks: median 1012 ms, p95 1022 ms.

Manual narration review still found invented rewards: the bartender scene granted a free round that the canonical outcome did not grant. Narration is therefore NOT qualified. Canonical rules/results remain authoritative, and narration remains off by default. The interpreter's summaries can also contain awkward wording. Twelve fixed cases are a small regression set, not a general accuracy guarantee or target-Mac performance result.

All 75 automated tests passed and the build succeeded after the final code changes. Synthetic adapter tests do not establish model quality. All live requests used disposable data and the same persistent request ledger; the account's Free Plan and disabled billing were based on the owner's confirmation.

## Running in the cloud worker

Use NODE_USE_ENV_PROXY=1 with the inherited proxy settings. Select CHAOS_AI_PROVIDER=groq-free, keep GROQ_API_KEY server-side, and use a separate CHAOS_AI_BENCHMARK_DATA_DIR for disposable tests. Never point benchmarks at campaign saves. The provider account must remain on its Free Plan with billing disabled. Quotas can still interrupt play.

Existing scripts: scripts/benchmark-campaign-ai.mjs and scripts/benchmark-dm-narration.mjs. The narrator script explicitly enables narration only for its standalone evaluation. No paid service, public deployment or automatic retry was introduced.
