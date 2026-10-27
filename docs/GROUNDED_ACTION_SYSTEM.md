# Grounded action system checkpoint

## General changes

AI world actions now keep their structured operation and arguments through validation and resolution. They are no longer turned into natural-language commands and parsed a second time. Native inventory grammar and typed AI proposals share the same authoritative item planner. Entity proposals use the existing entity planner. Ownership, feasibility and availability are checked again at resolution, so a previously valid action cannot use a source whose ownership changed in the meantime. Arbitrary crafted names containing words such as "from", "and", or command-like text remain labels rather than parser instructions. A second model reply cannot overwrite an already applied interpretation.

World proposal validation explicitly checks current entity availability and carried ingredients. Existing local rules still bypass inference for locked native actions. No additional model judge, automatic retry or paid provider was added. The existing keyword-based vocal guard remains as a limited defense; this work does not claim universal semantic understanding.

## Experimental prompt contract

CHAOS_AI_ACTION_CONTRACT=on enables one combined hosted action schema, avoiding the old keyword decision between world and tavern interpretation. The schema is generated from current visible entities, carried items, source IDs and adjacent destinations. A capability table explains operation roles, creation versus existing identities, and supported effects. The engine derives the namespace from the actual operation and target identity instead of discarding arguments when a model labels the domain incorrectly. A named color-to-palette mapping now supplies the meaning of every allowed color.

This new prompt contract is opt-in pending wider evaluation. The normal launch/default hosted prompt selection remains the previously tested path. Local-model prompts remain unchanged. The typed execution/validation fixes apply to world proposals in both paths. Generated narration remains off by default and is not qualified.

## Live comparison and quota

Five fresh cases were run per explicitly selected free Groq model before the final palette and namespace corrections:

- GPT-OSS-20B: 4/5 passed; median 776 ms, p95 2305 ms. Crafting returned HTTP 400 (json_validate_failed).
- GPT-OSS-120B: 3/5 passed; median 1271 ms, p95 1529 ms. It chose the wrong puppet color and labeled a transfer as a tavern operation, causing item arguments to be discarded and validation to reject it.

These five-case samples do not establish which model is generally more reliable. The smaller model is not promoted to default. Both models are available on the owner's confirmed Free Plan; no paid system was used.

The engine namespace correction and palette mapping were added after the comparison. The transfer case was then explicitly retested on 120B and correctly transferred the existing splinter in 1439 ms. The palette mapping is covered by local tests but has not yet been qualified with a fresh full live suite. Raw comparison evidence remains unchanged in ai-evidence/contract-models.json; the follow-up is ai-evidence/contract-routing-final.json.

The shared additional local allowance reached 100 request attempts for the UTC day. It was not reset, raised, or bypassed. Additional live qualification must wait for the normal reset. The five-case comparison did not run after each subsequent deterministic correction.

## Regression evidence

All 90 tests passed in the normal parallel suite, and the build passed. The full serial suite also passed. An earlier parallel run failed at multiplayer reconnection: its test used a fixed 70 ms delay. The test now waits for the server to observe the disconnect before attempting reconnection. The isolated 20-client test passed before that synchronization change, and the complete parallel suite passed afterward. Physical-device network reliability remains unmeasured.

New tests cover entity scoping, credential-free context, arbitrary creation labels, owned sources, stale ownership, sixteen operation-family parity checks against native planning, namespace consistency, and immutable accepted proposals. This is a refactor of existing capabilities, not a new RPG engine, custom fine-tune, or unlimited world simulator. The original Mac ZIP and physical controllers were not available in this recovery. Existing original files/saves were preserved in their original checkout.

## Running experiments

scripts/benchmark-contract-models.mjs uses explicit shared disposable ledger and report paths. CHAOS_CONTRACT_MODELS can select explicitly allowed model IDs; CHAOS_CONTRACT_CASES can select named cases. It enables the experimental contract for those test processes only. Keep credentials in the environment, use NODE_USE_ENV_PROXY=1 in this cloud worker, and keep the provider account on its Free Plan without billing enabled. Neither this benchmark nor the game verifies provider billing status through the inference API.
