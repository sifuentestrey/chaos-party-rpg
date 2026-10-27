# AI qualification before gameplay activation

The creative Dungeon Master is a core product feature. A model must be tested for both faithful interpretation and useful response time before it becomes the default. Structured JSON alone is not a passing result.

## Reported real-model baseline

The owner brought results from a separate Codex verification task: official Qwen3-1.7B Q8 weights downloaded successfully with a matching hash, served on loopback in a Linux worker. That configuration met the 5.5-second deadline on 0/24 requests. With longer waits, 0/3 completed interpretations were correct and took 79.7–109.1 seconds. “Make that carpet mine” was interpreted as an attack on a bottle. The endpoint was stopped and no paid service was used.

These are the supplied report's results, not measurements rerun in this workspace. The linked report at `/workspace/chaos-ai-verification-20261026/REPORT.md` is absent from this task's filesystem. Prompt logs, exact runtime parameters, sampling settings and hardware utilization have therefore not been independently inspected here. The evidence rejects this configuration as a gameplay candidate; it does not establish that every Qwen configuration, a smaller quantization, a GPU, or a hosted model will perform the same way. It also establishes no Mac performance claim.

## Acceptance harness

`node scripts/benchmark-campaign-ai.mjs` uses a real already-running private endpoint selected by `CHAOS_AI_BASE_URL` and `CHAOS_AI_MODEL`. It never installs weights, starts a paid service or tests against a fabricated model. `CHAOS_AI_BENCHMARK_TIMEOUT_MS` sets a diagnostic timeout from 1–120 seconds (default 15 seconds); gameplay remains capped at 5.5 seconds. `CHAOS_AI_BENCHMARK_OUTPUT` selects the report file. No endpoint returns a failed qualification with `inferenceRun:false`.

The twelve fixed cases exercise rug ownership, social deception, explicit spell targeting, extinguishing a fire, a creative wearable, transferring a specific item, befriending a creature, harvesting an available part, treating an injury, and rejection of invented rewards, missing ingredients and remote objects. The scorer checks targets and relevant components/type/slot/color in addition to the verb. It validates proposals with the actual game rules. Order-independent source identity is checked, not merely source count. A fast wrong answer and a slow correct answer both fail qualification. Reports include individual cases, p50/p95 elapsed time, token counts when supplied and the number correct within the live budget.

This is a small conservative interpreter gate, not a statistical quality guarantee or a full-DM evaluation. Generated narration needs a separate evaluation: consistency with canonical outcomes, NPC characterization, memory across scenes, family-appropriate tone, and bounded proposals that cannot grant state through prose. Longer narration can arrive after the game resolves; animation and mechanical feedback must not wait for it.

## Deployment recommendation and remaining decision

For game night, use one adequately capable AI service for the group while the Mac runs the authoritative rules, multiplayer and pixel renderer. There is no need for a model per phone. The old Mac is not the baseline inference host. The current adapter only supports loopback/private HTTP; connecting a hosted provider requires an explicit server-side provider adapter, approved credentials and a usage budget. None has been activated or purchased.

A hosted option is the recommended next comparison if an approved budget is acceptable. Otherwise, compare a capable existing computer or a truly available free service. A Q4/non-thinking local retest may be useful diagnostically, but it is not assumed to solve the observed quality and latency failures. Do not replace the model test with more game features or present simulated endpoint tests as real inference.
