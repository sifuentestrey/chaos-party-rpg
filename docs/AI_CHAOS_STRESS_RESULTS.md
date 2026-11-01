# Fresh chaos stress tests

Source under test: 5331fe7, GPT-OSS-120B on Groq using the owner's confirmed free account. Sixteen fresh interpretation requests and three maliciously worded narration requests were run with disposable rooms and the existing shared local usage ledger. No production saves, public deployment or paid fallback was used.

## Results

- Fifteen interpretation cases had preselected expected answers; one chained-action case was exploratory.
- Raw exact-check score: 12/15. One false negative used attack on a bottle instead of break, but the canonical engine correctly broke the intended bottle. After that explicit equivalence review, interpretation was correct on 13/15. The persisted raw evidence remains unchanged; the runner now accepts either verb for that future case.
- One of those thirteen correct interpretations still failed in normal gameplay: the native parser locked an invalid target before the correct AI treatment proposal could apply. Therefore interpretation accuracy alone overstates playable success.
- Interpretation median: 876 ms; p95/slowest scored case: 2916 ms. All requests, including narration, completed within 5.5 seconds. No provider errors.
- No mechanical state changes occurred during interpretation/validation before the normal game application/resolution stage, in all sixteen cases. Unsupported reward/power requests resolved blocked with no reported changes. This is evidence for these cases, not a proof against all adversarial input.
- The chained carpet theft/fire attack/escape request became one carpet-taking action; it did not execute three actions.
- Narration: all three responses passed structural validation. Manual review still failed the bartender scene for invented free drinks, and the blocked-power scene described a fizzling spell and wounds without adequate canonical support. The returning-wayfarer story stayed grounded. Narration remains disabled by default.

## Actual failures to fix next

1. Blue headwear: rejected legitimate crafting, claiming a new result needed an existing item ID. The server can create a new item from carried components.
2. Soothing rap: selected treating the wolf with a cloth instead of pacifying with a voice. The engine then consumed the treatment action; this is an intent error with real mechanical consequences.
3. Bandaging the wayfarer's sprained arm: AI returned the correct target and treatment. Native parsing treated the whole description as an unknown entity and locked that failed interpretation. Application returned false and resolution reported that entity was not here.
4. Narration: continued fabricated rewards and events despite correct schema fields. Structural checks do not establish truthful story content.

## Scope and evidence

Raw output: ai-evidence/chaos-stress.json. This includes proposals and normal applyAIPlan/advance results; native locks were not forced open. These are component/engine tests, not a browser, physical-controller, long-session, full-DM or target-Mac acceptance test. The original Mac ZIP remains unavailable in this recovery.

Runner: scripts/benchmark-ai-chaos.mjs. Set CHAOS_CHAOS_OUTPUT to a report path, CHAOS_AI_BENCHMARK_DATA_DIR to the shared disposable request ledger, CHAOS_AI_PROVIDER=groq-free, CHAOS_AI_MODEL=openai/gpt-oss-120b, CHAOS_AI_NARRATION=on, and NODE_USE_ENV_PROXY=1 for this cloud worker. Keep the key in the environment. Narration is enabled only for the test process, not the game configuration. Future runs include the documented bottle-verb scoring correction and capture elapsed time on error paths.
