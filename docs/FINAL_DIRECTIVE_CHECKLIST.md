# Final directive — verified completion checklist

Canonical branch: `luna/visual-game-night-release`. This checklist evaluates the owner's full directive, not just a prior milestone. Checked means implementation has demonstrated evidence; external acceptance is separate. Latest exact-source package/evidence is linked from START_HERE.md. No invented completion percentage.

## Implemented and demonstrated

- [x] One working branch, preserved main/old packages/saves, reversible commits and compact checkpoint.
- [x] Reuse PartyFrame/Colyseus, Ninja Adventure/Kenney artwork, existing rules, seeded regions, quest framework, crafting and save system; preserve license notices. No replacement engine or paid service.
- [x] Host room creation, QR/phone joining, distinct customization, persistent identity/inventory, reconnect/recovery and campaign resume.
- [x] First declaration locks; reactions, fairness cooldown and server dice/outcomes; duplicates, stale turns, unknown entities and unauthorized clients tested.
- [x] Native gameplay continues without AI, including both complete adventures and their endings.
- [x] Crown Job plus bounded Dawn Bell expedition: seventeen connected scenes, alternate woodland routes, river barrier, repaired bridge or ferryman cave crossing, town/inn, castle/cellar/vault, prerequisite quests and ending.
- [x] Majority shared travel using existing reaction window; one TV scene, no split phone adventures. Twenty real Colyseus clients tested.
- [x] Discoverable persistent graphical map reflecting actual visited/neighbor routes; hidden places remain undisclosed.
- [x] Shared take/drop/give/equip/craft/combine/separate, attack/heal/pacify/harvest, open/close/unlock, fire/extinguish and repair rules. Persistent materials, damage, containers, ownership and crossing consequences.
- [x] NPC identities, goals, trust, useful quest dialogue and inexpensive local turn-driven routines. Saved quest rewards cannot be collected repeatedly.
- [x] Quest outcomes and world consequences survive region unload/revisit, disk save, restart and rejoin; prior sandbox saves retain explored routes.
- [x] TV Canvas scene, character motion, licensed sprite/effect/audio resources, visible customization, compact phone sections, immediate canvas repaint and adequately sized Colyseus encoder buffer.
- [x] Actual browser journeys through both endings; real twenty-client concurrency/recovery/restart; isolated packaged server without development dependencies; checksum-verified pinned Mac runtimes.

## Current finishing work (check only after final integration evidence)

- [x] Distinct engine-owned scene-event recipes for outdoor physical effects, healing, fire, repair, sound and speech. Effects must target the actual victim, not a tool or missing-player fallback. Failed/blocked actions cannot show successful target damage.
- [x] Native theft of an actual NPC-owned item, visible NPC possessions, remembered attitude/trust consequences, failed-theft ownership protection, durable NPC witness memory and no player-inventory theft.
- [ ] Fresh full offline gate and packaged browser evidence for those additions; latest clean-source ZIP/checksum and source backup.

## Implemented infrastructure; external qualification blocked

- [ ] **Genuine creative AI DM accepted.** Existing typed interpretation, authority checks, canonical narrator context, bounded rolling memory, cancellation/timeouts, opt-in provider and shared 100/day + four/minute guard are implemented. Real-model accuracy, dialogue truthfulness/quality, latency and actual selective game-night capacity remain unqualified. Interpretation/narration preflights refused provider contact because the existing shared usage ledger is unavailable; do not invent/reset a replacement allowance. Narration remains off by default. Restore the existing ledger to run the prepared bounded cases.
- [ ] **Physical release acceptance.** Run the actual early-2015 Intel Mac/macOS, TV/audio, home Wi-Fi/firewall/QR, two real phones for at least 90 seconds, save/rejoin and performance checks; then test the intended family group. Cloud browsers and Linux Node cannot certify these.

## Missing external references, handled without copying

- [ ] Original `Chaos_Party_Mac.zip` equivalence/provenance: original archive unavailable. Recovered source and new packages do not establish equivalence.
- [ ] Anywhere RPG demo report/materials and scoped reuse/third-party permission verification: not present in the available checkout/files. No material was copied. Its described event-driven/validated-scene ideas are implemented using our existing engine and original code.

## Evidence anchors

- `docs/DAWN_BELL_RELEASE.md` and `docs/evidence/dawn-bell-release/`: clean source 06bcad3, 195-test baseline, twenty-client tests, two complete browser adventures, packaged Node 22 expedition, restart/rejoin, no blank canvas or encoder warnings.
- `tests/expedition*.mjs`, `tests/multiplayer.test.mjs`, `tests/travel-vote.test.mjs`: connected campaign, alternate routes, crossing damage/repair, final ending, memory/identity and real multiplayer.
- `tests/reactive-scenes.test.mjs`: six action-scene, canonical target, NPC-theft and memory regressions; source integration gate passed 201 tests and a complete two-controller browser adventure. Updated packaged evidence pending above.
