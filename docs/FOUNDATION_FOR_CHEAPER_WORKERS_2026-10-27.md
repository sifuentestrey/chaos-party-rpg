# Foundation for cheaper coding workers — October 27, 2026

Baseline before this work: `840ba59`. This is maintenance of the existing game, not an island expansion or a completed creative DM. SOL reviewed the architecture and the content extraction; Luna implemented the bounded verification/CI work; the main agent reviewed the code, independently checked the old baseline and ran the integrated checks.

## Assessment and changes

The existing tested core is a useful foundation for scoped work. Many apparently cosmetic definitions also control targeting, seeded generation or rules, so arbitrary edits to “configuration” are not automatically low risk.

1. **One ordinary offline test path.** `npm test` now disables inherited game AI/provider configuration and removes credential variables before starting child processes. It supplies a temporary default data directory and cleans it up on success or failure. This protects a test that forgets its own data directory from falling back to the development campaign. It is not a filesystem/network sandbox, and it cannot make an explicitly unsafe test path harmless.
2. **A real generated-output gate.** `npm run verify` snapshots seven tracked generated files before tests rebuild anything, fails on missing/untracked/stale output, then checks again after the static build. Previously, rebuilding inside tests could conceal an omitted generated file update.
3. **A small data-only content lane.** The existing eight procedural location prefixes, three ambient rumors and three keyed quest titles live in strict JSON. Unknown fields, changed counts, duplicates, invalid types, markup/control characters and excessive/empty text are rejected. The generator validates first, writes atomically, uses `JSON.stringify` rather than code evaluation, and exports a frozen browser module. All original values/order remain unchanged. Rewards, objectives, identities, NPC/item names, materials, travel and saves remain in the reviewed engine.
4. **An offline CI workflow and task guide.** The workflow uses read-only repository permissions and runs verification without deployment, model calls or secrets. [LUNA_WORKFLOW.md](LUNA_WORKFLOW.md) defines green/yellow/red tasks, allowed manual versus generated paths and escalation rules. This is not a branch-protection ruleset or automatic approval to merge.

## Evidence

- Integrated `npm run verify`: **169/169 tests passed**, seven generated files stayed byte-identical through tests/build, and the static build passed.
- A reversible end-to-end probe deliberately made the generated content module stale. All 169 tests still passed after rebuilding it, but the verifier correctly rejected the changed bytes and returned failure. Original bytes were restored. This checks the actual failure mode, not only a mocked comparator.
- Pre-extraction golden data covers four seeds and 24 regions across recovery, rescue and repair quests. The main agent independently loaded the original `840ba59` campaign source in an isolated copy, checked its source SHA-256, and reproduced all four original full-state hashes.
- A valid alternative text catalog was run through the actual copied campaign module. Selected text followed the new catalog while normalized behavioral hashes stayed fixed. Only the approved display fields and their exact discovery-name echo are normalized; IDs, RNG effects, decor, objectives, rewards, item/NPC names and other state remain checked. Future legitimate text edits do not require weakening these fixtures.
- Rejection/immutability tests cover unknown mechanics fields, field/count/type errors, invalid text, duplicates, inert quoted/code-looking text, output reproducibility and preservation of the previous artifact after invalid JSON/schema input. Offline-wrapper tests cover credential/config removal, disposable default data and cleanup after build/test failure.
- A real local browser host/two-controller smoke check with synthetic narration verifies the added browser module loads through the normal app. It does not measure real model quality.

No extra game inference, new paid services, new maps or save migrations were introduced. The shared test allowance remains exhausted for October 27. Live interpretation/narration qualification, full-night free capacity, original Mac archive provenance and physical Mac/TV/phone acceptance remain open.

## Delegation decision

Use Luna for approved text data, documentation, regression cases and tightly specified implementation pieces. Inspect the diff and assertions; batch low-risk review to save usage. Keep new mechanics, state/save/network boundaries, AI authority/provider configuration, schemas and the checks themselves under strong-model or human review. Text still needs a semantic/editorial glance, and visual work still needs screenshots and physical acceptance. These guardrails reduce common mistakes; they do not make broad unsupervised development reliable.
