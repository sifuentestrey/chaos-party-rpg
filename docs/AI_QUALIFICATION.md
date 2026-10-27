# AI qualification before gameplay activation

The creative Dungeon Master is a core product feature. A model must be tested for both faithful interpretation and useful response time before it becomes the default. Structured JSON alone is not a passing result.

## Current bounded preparation — October 27, 2026

The shared local allowance is exhausted at **100/100 for October 27 UTC**. No live inference was run for this preparation. The existing free provider adapter is available in source; narration and the combined action contract remain opt-in. Earlier baseline and broad benchmark descriptions below are historical evidence, not instructions to spend more requests today.

Use `scripts/ai-qualification.mjs` for the next bounded batch. It defaults to an explicit synthetic dry run. Point `CHAOS_AI_BENCHMARK_DATA_DIR` (or `CHAOS_DATA_DIR`) at the **existing shared persistent ledger directory**, and keep evidence outside that directory. Missing, malformed, future-dated, exhausted or insufficient ledgers stop live execution before model discovery or inference. The runner does not create a replacement allowance. Run it with the game server stopped; the existing budget implementation assumes one process owns its data directory.

```sh
node scripts/ai-qualification.mjs --dry-run --output artifacts/qualification-dry.json
```

The six fresh interpretation cases cover a named white wearable, indirect vocal calming, an explicitly selected medical cloth, transfer with an entity-ID/display-name collision, an impossible remote action, and a harmless item label containing malicious instructions. They use disposable in-memory campaigns, preserve native locks, apply a reply at its actual completion time, and inspect canonical ownership, materials, appearance, HP, rewards, location and blocked effects. The 5.5-second inference budget and accepted turn's actual animation deadline both matter. A valid schema or a correct proposed verb alone cannot pass.

Once the normal allowance is available and an already approved free provider is configured, run interpretation and narration separately with explicit budgets:

```sh
CHAOS_AI_PROVIDER=groq-free node scripts/ai-qualification.mjs --live --budget 6 --output artifacts/qualification-live.json
CHAOS_AI_PROVIDER=groq-free node scripts/ai-qualification.mjs --live --narration --budget 3 --output artifacts/narration-live.json
```

Live calls share the existing 100/day and 4/minute local protection, use one selected model, pause 26 seconds between cases and recheck allowance. There are no retries, provider fallbacks or automatic reruns. A smaller explicit budget runs a partial set and cannot mark the six-case batch complete. This script enables the action contract or narration only inside its standalone adapter; it does not change game defaults or campaign saves.

Evidence includes source commit/dirty status, UTC timestamp, immutable attempts, exact expected and actual arguments, raw successful model replies, canonical before/after state, applied/blocked results, latency and supplied token usage. Authorization headers are excluded. Partial evidence is saved after each case. Synthetic/injected runs always have `inferenceRun:false` and `qualified:false`; a six-case live success is only a bounded batch result, not general reliability or Mac qualification.

Narration reuses the three existing canonical scenarios and records context, story and a pending manual review. There is no keyword hallucination judge. Structural validity, unchanged state and latency do not establish truthful or entertaining prose: compare every sentence with canonical outcomes, reactions, injuries, ownership and memories. Live narration exits with code 2 when evidence is captured but semantic review remains pending; failures use code 1. All reports remain `qualified:false`, and gameplay narration stays off by default.

Offline preparation verification on October 27: six interpretation fixtures passed canonical checks; all three narration fixtures retained pending manual review. The six runner regression tests cover preflight before metadata, wrong-but-valid plans, real deadline rejection, raw evidence without credentials and stopping on a simulated rate limit. The full suite passed **151/151**, and the build and diff checks passed. Dry runs read the real exhausted ledger without changing its bytes; no game inference or model-discovery request was made.

## Reported real-model baseline

The owner brought results from a separate Codex verification task: official Qwen3-1.7B Q8 weights downloaded successfully with a matching hash, served on loopback in a Linux worker. That configuration met the 5.5-second deadline on 0/24 requests. With longer waits, 0/3 completed interpretations were correct and took 79.7–109.1 seconds. “Make that carpet mine” was interpreted as an attack on a bottle. The endpoint was stopped and no paid service was used.

These are the supplied report's results, not measurements rerun in this workspace. The linked report at `/workspace/chaos-ai-verification-20261026/REPORT.md` is absent from this task's filesystem. Prompt logs, exact runtime parameters, sampling settings and hardware utilization have therefore not been independently inspected here. The evidence rejects this configuration as a gameplay candidate; it does not establish that every Qwen configuration, a smaller quantization, a GPU, or a hosted model will perform the same way. It also establishes no Mac performance claim.

## Acceptance harness

The older twelve-case diagnostic below does not provide the new preflight and canonical outcome gate. Use the bounded runner above for the next allowed batch; these legacy commands are retained for provenance.

`node scripts/benchmark-campaign-ai.mjs` uses a real already-running private endpoint selected by `CHAOS_AI_BASE_URL` and `CHAOS_AI_MODEL`. It never installs weights, starts a paid service or tests against a fabricated model. `CHAOS_AI_BENCHMARK_TIMEOUT_MS` sets a diagnostic timeout from 1–120 seconds (default 15 seconds); gameplay remains capped at 5.5 seconds. `CHAOS_AI_BENCHMARK_OUTPUT` selects the report file. No endpoint returns a failed qualification with `inferenceRun:false`.

The twelve fixed cases exercise rug ownership, social deception, explicit spell targeting, extinguishing a fire, a creative wearable, transferring a specific item, befriending a creature, harvesting an available part, treating an injury, and rejection of invented rewards, missing ingredients and remote objects. The scorer checks targets and relevant components/type/slot/color in addition to the verb. It validates proposals with the actual game rules. Order-independent source identity is checked, not merely source count. A fast wrong answer and a slow correct answer both fail qualification. Reports include individual cases, p50/p95 elapsed time, token counts when supplied and the number correct within the live budget.

This is a small conservative interpreter gate, not a statistical quality guarantee or a full-DM evaluation. Generated narration needs a separate evaluation: consistency with canonical outcomes, NPC characterization, memory across scenes, family-appropriate tone, and bounded proposals that cannot grant state through prose. Longer narration can arrive after the game resolves; animation and mechanical feedback must not wait for it.

## Deployment recommendation and remaining decision

For game night, use one adequately capable AI service for the group while the Mac runs the authoritative rules, multiplayer and pixel renderer. There is no need for a model per phone. The old Mac is not the baseline inference host. Source now includes the explicitly selected `groq-free` adapter alongside local/private HTTP, with shared local request protection and no paid/provider fallback. Earlier local-only readiness statements are superseded by the dated recovery and stress reports; those reports still leave narration unqualified.

A hosted option is the recommended next comparison if an approved budget is acceptable. Otherwise, compare a capable existing computer or a truly available free service. A Q4/non-thinking local retest may be useful diagnostically, but it is not assumed to solve the observed quality and latency failures. Do not replace the model test with more game features or present simulated endpoint tests as real inference.
