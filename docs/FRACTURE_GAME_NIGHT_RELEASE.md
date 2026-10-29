# Chaos Party — local Fracture beta acceptance

> **MIGRATION WARNING (owner correction, Oct 29): This is NOT the original Chaos Party game migrated to Fracture.** It is an isolated *Fracture multiplayer/phone-to-TV technology demo*. Major existing Chaos features—Crown Job, Dawn Bell's seventeen scenes, custom characters/classes, server dice/advantage, ownership/crafting/fire/repair, NPC memory, campaign persistence, group travel voting and qualified creative storytelling—are **not** present here. Passing tests do not establish gameplay equivalence. See [full parity audit](CHAOS_TO_FRACTURE_PARITY.md). Keep original Chaos project as canonical until approved migration/renderer decision.

October 29, 2026. Experimental branch only: `spike/fracture-phone-tv`. Work order: [issue #12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12). **Playable beta prepared for physical Mac rehearsal; not a claim of completed hardware acceptance.** No merge, public game deployment or paid service was performed.

## Verified behavior

| Capability | Evidence |
| --- | --- |
| Independent characters | Two browser phones controlled distinct real actors. Twenty real authenticated actors moved concurrently, then stayed connected through a 1,200-second synthetic run. No browser-per-phone simulation. |
| Reliable action contract | Typed intention → grounded target/capabilities → engine validation/execution → explicit receipt. Cancellation families, directions/paths, attack, talk, quests, chest/item interactions, equip, doors and respawn. No raw phone teleport, hit or HP authority. |
| Personal STOP | Cancels only its actor's path/combat immediately, including during the reaction window. Another phone cannot interrupt it; engine position remains still afterward. Damage already dealt is not rolled back. |
| Real combat | Rat HP 29 → 0, death, player damage and gold verified. Native formulas/range/stun/death rules retained; no rat-stat nerf. Enemy minimum cooldowns are read from the pinned native client. The earlier physical rat report is not conclusively classified as a single upstream bug versus cadence/balance. |
| Adventure | Native NPC response, optional rat quest completed 3/3 and awarded its real reward; sword pickup/equip; Western Dwelling entry/exit; Glitch Woods travel. A suggested twenty-minute route is in the adapter README. No forced Crown Job or invented map. |
| Shared TV | Native renderer/world, automatic read-only spectator, real player colors/names, follow/full-screen controls, corner log. Website HUD hidden; spectators hidden even with two TVs. QR in empty lobby and private host setup. |
| Party pacing | Ten-second declaration/reaction window with parallel actors and immutable declarations. Movement/observation and personal STOP remain available. Native combat randomness retained; a new D20 system does not override Fracture. |
| Identity/recovery/presence | Server-held Fracture credentials; personal recovery links; same account and position after reconnect. Cold start does not spawn saved actors before phones return; absent phones save/log out after a 45-second grace period. |
| Host player rotation | New host-only bench/restore saves and disconnects an inactive actor, frees a live room slot, preserves player account, credentials, inventory/position and private recovery link; refused when restoring into a full room. Up to 20 *active* slots, with retained historical registrations. Automated full-room regression passed, physical Mac acceptance pending. |
| Busy-fight write load | Combat/event notifications now coalesce into a room-log write every 500 ms and flush on orderly shutdown; character saves and roster changes still persist immediately. Tested rapid 15-event batch and durable room identity. |
| Saves and launch | Actual Control-C saved active characters before server shutdown; exact positions/gold/levels retained; SQLite quick_check passed. Immediate restart waits for old process exit. Offline cached-dependency build and unchanged-build restart passed in Linux. |
| Original project protected | Original Chaos `npm run verify` passed, with no generated-output drift. No original game source/data or branch was modified. Fracture remains a separate pinned clone/database. |

## Checks completed

- [x] Pinned Fracture `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`, pnpm `10.34.9`, production client/server builds.
- [x] **71 Vitest files / 3,326 tests**, **21 focused Node checks**, original Chaos offline verification.
- [x] Actual browser phone/TV flow, recovered phones, real quest completion/reward, screenshots, no browser errors.
- [x] Real-server rejection of wrong keys, cross-actor identity, expired/replayed actions, invented damage and arbitrary teleport.
- [x] **20 actors / 20 minutes**, plus real reconnect, scoped interruption, smaller final result-payload follow-up and cloud resource sample.
- [x] Actual TV connection beyond the native fifteen-minute deadline: **960 seconds**, no timeout/disconnect.
- [x] Config/database preservation and refusal of unexpected local edits, including generated adapter edits.
- [x] Source-only packaging process, executable launcher, CRC/allowlist inspection and extracted-kit Node **22.23.4** checks. ZIP/source ID and SHA256 accompany the artifact.

Evidence: [sanitized reports and screenshots](../experiments/fracture-phone-tv/evidence/README.md). The first endurance attempt genuinely failed at fifteen minutes because custom actions bypassed the native activity timer; that lifecycle defect was fixed and the full rerun passed. Later spectator-role/install refinements have their own targeted/browser checks.

## Explicit remaining limits

- [ ] **Owner hardware acceptance:** double-click the kit launcher on the 2015 Intel Mac; join two physical phones, move separately, kill a rat, STOP, visit a building/woods, reconnect, then try the family group while measuring responsiveness. Cloud/Linux tests do not establish Mac CPU/RAM or 12–20 physical-player capacity.
- [ ] **Live creative DM qualification:** Groq semantic fallback is wired, explicitly opt-in and off by default. Existing key only, grounded proposals, separate quota ledger, timeout/429/invalid-plan fallback tested with mocks. No live provider calls or free-plan quality claim. A fully qualified creative storyteller is not shipped.
- Native quests are session-scoped and may reset on server/bridge restart. Equipment, inventory, level, gold and saved position persist. No legacy Chaos save migration or full Chaos D20/campaign port is claimed.
- Deterministic text handling covers supported intent categories; unsupported mechanics receive truthful rejection. It is not universal natural-language world simulation.
- Automated adventure completion and the supplied twenty-minute route do not replace a human pacing/fun playtest. A dedicated tavern/campaign expansion was not invented; the route reuses the actual town, dwelling and woods.

## Delivery and continuation

Run the source kit's **Start_Chaos_Party.command**, or the repository's `experiments/fracture-phone-tv/Start_Fracture_Chaos_Test.command`. Stop any older test launcher first. Requires Node **22.18+ LTS or 24+**, Git and first-install internet; existing `~/Fracture-Chaos-Spike` is reused. New room credentials stay in that separate clone, never in the ZIP. Optional upstream Venice/Fish Audio providers are forced off by the launcher.

The active modules are `party-bridge.mjs`, `action-contract.ts`, `chaos-actor.ts`, `chaos-tv.ts` and `apply-party-overlay.mjs`; historical one-actor files remain intact. Changes reconstruct from the pinned upstream and a hash manifest. Do not merge PR #11, modify `main`/`luna/visual-game-night-release`, mix databases, or infer hardware acceptance from these logs.

For a resumed cloud session, the disposable upstream is `/workspace/fracture-chaos-beta`. Private raw logs are in `/workspace/scratch`; do not publish launcher host URLs, room.json or databases. Publicly reviewable evidence is already curated in the source tree. The packaging script creates an immutable source ZIP from the committed branch; it does not bundle native dependencies or raw upstream assets. Derived screenshots retain CC BY-SA attribution.
