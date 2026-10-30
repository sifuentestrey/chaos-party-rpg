# Chaos Party — local Fracture beta acceptance

> **MIGRATION WARNING (owner correction, Oct 29): This is NOT the original Chaos Party game migrated to Fracture.** It is an isolated *Fracture multiplayer/phone-to-TV technology demo*. Major existing Chaos features—Crown Job, Dawn Bell's seventeen scenes, custom characters/classes, full dice/advantage, full NPC goals/routines, original campaign persistence, expedition travel voting and qualified creative storytelling—are **not** present here. The limited object/crafting and local rally experiments below are partial rule reuse. Passing tests do not establish gameplay equivalence. See [full parity audit](CHAOS_TO_FRACTURE_PARITY.md). Keep original Chaos project as canonical until approved migration/renderer decision.

Updated October 30, 2026. Experimental branch only: `spike/fracture-phone-tv`. Work order: [issue #12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12). **Playable beta prepared for physical Mac rehearsal; not a claim of completed hardware acceptance.** No merge, public game deployment or paid service was performed.

## Core mechanics milestone — October 30

- [x] Preserved the concurrent nearby-player assistance change: another live character can grant one D20 advantage craft/attachment roll for fifteen seconds. No self-help, stacking or absent/dead helper advantage; original MIT selection helper and its license are bundled.
- [x] Original Chaos entity planner/resolver now handles **move/push, ignite, extinguish and repair** on real custom objects in Fracture. A movable camp table blocks native phone-driver paths at its actual tile. Wall/character/object collisions block pushes; moving or burning through the table changes its collision. Painted native scenery remains unchanged.
- [x] Fire advances on a server-owned ten-second clock, including without further action submissions; three ticks burn an object through. Repair and extinguishing change actual saved object state. No fabricated native character fire damage is applied.
- [x] Real native NPCs get stable identities for custom possessions, observed actions and per-character reputation. Original theft resolution changes ownership/trust. Nearby visible witnesses remember; unseen NPCs do not learn the action. Private memories are bounded per NPC/player so another busy player cannot erase them.
- [x] A distrusted NPC refuses **new native quest requests** from that player. An innocent player remains eligible. Gifting an actual carried object restores trust; conversation reflects the saved relationship. Existing native quest progress/rewards remain native.
- [x] Original canonical DM memory and narration rules are reused. Completed/failed/blocked engine receipts provide offline narration for supported declarations. Optional opt-in Groq narration receives authoritative outcomes and relevant saved facts; schema/outcome/speaker validation rejects bad proposals. It cannot mutate gameplay. API errors/quota/timeouts retain offline play. **No live model quality qualification or provider calls were performed.**
- [x] Browser forms and actual native TV: table moves and blocks walking; real failed rolls; ignite → extinguish → timed burn-through → repair; witnessed rug theft → remembered refusal → independent innocent player → gift → native quest access restored. Restart retains moved/repaired props, ownership, NPC memory and canonical DM facts.

An actual screenshot caught a rendering defect: several old prop-icon names existed in the registry but were not loaded by Fracture. The fallback now uses loaded icons, and table/rug/fire rendering does not depend on an optional icon. Corrected fresh-TV evidence is included; the missing-object screenshot was not accepted as visual proof.

This strengthens a bounded core loop, **not** original campaign parity. NPC learning here means durable witnessed-action memory and reputation with real quest-access effects; it is not self-training AI or a port of all original NPC goals/routines. Live AI storytelling quality, full advantage/reaction consequences, full campaigns/custom characters and physical Mac acceptance remain unverified or missing.

## Current fusion milestone — October 30

The owner's latest direction is to merge the games creatively, with engineering choices made independently. Fracture remains the authoritative world/combat engine; the original Chaos object/material/crafting rules now operate on its real tiles. No original networking, campaign map generator, databases or saves are imported.

- [x] Reuse original `world-items.js` planning/resolution and PartyFrame RNG: server D20 crafting, ingredient ownership, failed rolls preserve ingredients, wear/equip, nearby player gifts, drop/take, inspection and separation. Repeated failed rolls consume the declaration window.
- [x] Each native character receives cloth/wood once. Initial shared materials and dropped objects have real collision-checked native tiles. Pickup can walk to an object; every operation revalidates current ownership/range. Inventory and colored wearable bands appear on the phone/TV.
- [x] Separate `server/data/chaos-party/objects.json`, keyed by durable native character UUID. Atomic writes, failed-save rollback, reconnect without duplicate starter objects. Original Chaos saves remain untouched.
- [x] Two fresh browser phones: craft → equip → give → recipient equips → drop → auto-approach pickup → equip → phone reload. Real engine receipts, server D20 and screenshots.
- [x] Native consumables use Fracture's own inventory/health handler; full-health use keeps healing items. Adapter/native-handler integration regression passes.
- [x] Actual launcher stop/restart preserves both characters’ native progression and crafted bag/component/worn state exactly.
- [x] Focused Node checks, pinned native tests/builds and original `npm run verify`. See fusion evidence for current counts and scope.
- [x] Native-zone and walkability enforcement for Chaos items: no gifts through blocked tiles or across native zones; out-of-zone floor items cannot be inspected, approached or picked up. Existing version-1 saves remain readable.
- [x] Source-backed NPC possession/theft rule slice: real native Fracture NPC entities may receive crafted Chaos items; the original D20 theft resolver changes ownership and persists the NPC's trust/history even on failed rolls. Node regression covers ownership, range, restart and memory. Native dialogue/AI remains unchanged; physical two-phone NPC interaction remains unaccepted.
- [x] Pinned Fracture CI now **boots with `CHAOS_WORLD_MODULE` enabled** and drives a real native actor through original Chaos crafting. Run [40983980128](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/40983980128) passed: 71 pinned test files / 3,329 tests, independent rally, real actor starter objects, D20 receipt, material preservation on a legitimate **failed** roll, separate durable object save, and source-only Mac kit packaging. This is real native-server proof of the object adapter, **not** a browser NPC-theft playtest or Mac acceptance.

Crafted Chaos wearables currently add colored bands to the native sprites; they do **not** grant invented Fracture armor/weapon/spell stats. Native equipment/loot and crafted objects remain distinct inventory systems behind one phone view. Native gear gifting, arbitrary terrain manipulation, the old campaigns and full NPC goals/routines are not ported. The newer bounded NPC/DM memory loop is described above. This is a playable integration slice, not completion of every mechanic in both games.

## Earlier October 30 object/NPC CI checkpoint (source 84d2178)

- **Core authority:** original Chaos crafting/ownership/advantage/theft rules execute in a separate Fracture object store. Native Fracture retains movement/combat authority. Objects cannot cross native zone boundaries or blocked two-step transfer paths. No original saves or Colyseus traffic were modified.
- **NPC consequence:** a real Fracture NPC can receive a crafted Chaos item, then a D20 theft attempt updates original Chaos trust/history even when the roll fails. Source-level regression verifies a native NPC entity fixture, range, ownership and restart persistence. That earlier checkpoint did not qualify native dialogue/quest reactions. The later browser core milestone above supplies that additional proof; physical Mac acceptance remains open.
- **Real native CI:** the disposable server's object module is explicitly enabled. A native actor actually received starter materials and submitted a craft; the D20 failure receipt matched its retained inventory and persisted save. [Passing integration and source-kit artifact](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/40983980128), source `84d217895b`. This tests honest failure handling, not a guaranteed successful craft.
- **Remaining gates:** original Crown Job/Dawn Bell/character classes, full fixture/fire/repair/NPC reactions, creative DM, and owner Mac/TV/12–20-physical-phone acceptance remain open.

## Verified behavior

| Capability | Evidence |
| --- | --- |
| Independent characters | Two browser phones controlled distinct real actors. Twenty real authenticated actors moved concurrently, then stayed connected through a 1,200-second synthetic run. No browser-per-phone simulation. |
| Reliable action contract | Typed intention → grounded target/capabilities → engine validation/execution → explicit receipt. Cancellation families, directions/paths, attack, talk, quests, chest/item interactions, equip, doors and respawn. No raw phone teleport, hit or HP authority. |
| Personal STOP | Cancels only its actor's path/combat immediately, including during the reaction window. Another phone cannot interrupt it; engine position remains still afterward. Damage already dealt is not rolled back. |
| Real combat | Rat HP 29 → 0, death, player damage and gold verified. Native formulas/range/stun/death rules retained; no rat-stat nerf. Enemy minimum cooldowns are read from the pinned native client. The earlier physical rat report is not conclusively classified as a single upstream bug versus cadence/balance. |
| Adventure | Native NPC response, optional rat quest completed 3/3 and awarded its real reward; sword pickup/equip; Western Dwelling entry/exit; Glitch Woods travel. A suggested twenty-minute route is in the adapter README. No forced Crown Job or invented map. |
| Shared TV | Native renderer/world, automatic read-only spectator, real player colors/names, follow/full-screen controls, corner log. Website HUD hidden; spectators hidden even with two TVs. QR in empty lobby and private host setup. |
| Party pacing | Ten-second declaration/reaction window with parallel actors and immutable declarations. Movement/observation and personal STOP remain available. Native combat randomness retained; Chaos crafting uses server D20 rolls without overriding Fracture combat. |
| Bounded local rally (experimental) | New opt-in phone vote: strict majority of a frozen electorate (2–20 nearby, living, same-zone actors) approves **native per-character movement** toward the proposer's real location, within twelve tiles. Rejected/expired votes do not move actors. Every character can STOP. Engine receipts, not the vote, establish actual arrival. This is **not** original Dawn Bell major travel or campaign voting parity. |
| NPC sidecar memory (experimental) | Native NPCs can receive original Chaos-crafted objects; original D20 theft rolls and persistent trust/history are verified with fixtures. The native Fracture NPC dialogue/AI and witnessed visual response do not consult that memory. This is not complete NPC parity. |
| Identity/recovery/presence | Server-held Fracture credentials; personal recovery links; same account and position after reconnect. Cold start does not spawn saved actors before phones return; absent phones save/log out after a 45-second grace period. |
| Host player rotation | New host-only bench/restore saves and disconnects an inactive actor, frees a live room slot, preserves player account, credentials, inventory/position and private recovery link; refused when restoring into a full room. Up to 20 *active* slots, with retained historical registrations. Automated full-room regression passed, physical Mac acceptance pending. |
| Busy-fight write load | Combat/event notifications now coalesce into a room-log write every 500 ms and flush on orderly shutdown; character saves and roster changes still persist immediately. Tested rapid 15-event batch and durable room identity. |
| Saves and launch | Actual Control-C saved active characters before server shutdown; exact positions/gold/levels retained; SQLite quick_check passed. Immediate restart waits for old process exit. Offline cached-dependency build and unchanged-build restart passed in Linux. |
| Original project protected | Original Chaos `npm run verify` passed, with no generated-output drift. No original game source/data or branch was modified. Fracture remains a separate pinned clone/database. |

## Checks completed

- [x] Pinned Fracture `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`, pnpm `10.34.9`, production client/server builds.
- [x] **71 Vitest files / 3,329 tests**, **54 focused Node checks**, original Chaos offline verification.
- [x] Actual browser phone/TV flow, recovered phones, real quest completion/reward, screenshots, no browser errors.
- [x] Real-server rejection of wrong keys, cross-actor identity, expired/replayed actions, invented damage and arbitrary teleport.
- [x] **New native majority-rally integration:** in disposable pinned Fracture, two distinct authenticated actors, one real tile movement, rejected outsider vote, strict two-person quorum, and separate native group `go` action **succeeded and reached the proposer**. [GitHub Actions integration run 40977145132](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/40977145132), October 29 local / October 30 UTC. This is cloud/Linux real-server proof, not a physical Mac playtest.
- [x] **20 actors / 20 minutes**, plus real reconnect, scoped interruption, smaller final result-payload follow-up and cloud resource sample.
- [x] Actual TV connection beyond the native fifteen-minute deadline: **960 seconds**, no timeout/disconnect.
- [x] Config/database preservation and refusal of unexpected local edits, including generated adapter edits.
- [x] Source-only packaging process, executable launcher, CRC/allowlist inspection and extracted-kit Node **22.23.4** checks. ZIP/source ID and SHA256 accompany the artifact.

Evidence: [sanitized reports and screenshots](../experiments/fracture-phone-tv/evidence/README.md). The first endurance attempt genuinely failed at fifteen minutes because custom actions bypassed the native activity timer; that lifecycle defect was fixed and the full rerun passed. Later spectator-role/install refinements have their own targeted/browser checks.

## Explicit remaining limits

- [ ] **Owner hardware acceptance:** double-click the kit launcher on the 2015 Intel Mac; join two physical phones, move separately, kill a rat, STOP, visit a building/woods, reconnect, then try the family group while measuring responsiveness. Cloud/Linux tests do not establish Mac CPU/RAM or 12–20 physical-player capacity.
- [ ] **Live creative DM qualification:** Groq semantic fallback is wired, explicitly opt-in and off by default. Existing key only, grounded proposals, separate quota ledger, timeout/429/invalid-plan fallback tested with mocks. No live provider calls or free-plan quality claim. A fully qualified creative storyteller is not shipped.
- Native quests are session-scoped and may reset on server/bridge restart. Equipment, inventory, level, gold and saved position persist. No legacy Chaos save migration or full campaign port is claimed; only the bounded Chaos object rules above are projected onto Fracture.
- Deterministic text handling covers supported intent categories; unsupported mechanics receive truthful rejection. It is not universal natural-language world simulation.
- Local party rally votes are ephemeral, deliberately reset on restart and restricted to nearby same-zone characters. Approval may produce partial native movement if an actor disconnects, moves away or encounters blocked geometry. **No teleport or all-arrived claim.** This is a bounded group-coordination experiment, not migration of the original Chaos majority-travel/scene system.
- Automated adventure completion and the supplied twenty-minute route do not replace a human pacing/fun playtest. A dedicated tavern/campaign expansion was not invented; the route reuses the actual town, dwelling and woods.

## Latest bounded feature-parity experiment

The controller now includes **Gather the party (optional vote)**. A nearby player proposes a ten-second rally at their actual server position. Other active members vote once. Strict majority dispatches separate native `go` requests; a declined/expired vote dispatches none. STOP remains immediate for each actor. TV displays the vote tally in the corner. Vote identity, origin and replay are checked server-side, and host benching prevents an unavailable character from being commanded.

The pure vote tests and multiplayer bridge regression suite cover frozen quorums, 2–20 players, timeouts, failed votes, token isolation, native per-actor dispatch and bench/STOP behavior. CI results are tracked on the corresponding commit; **no new physical Mac acceptance or original campaign parity is implied**. See [architecture/parity decision](CHAOS_TO_FRACTURE_PARITY.md).

## Delivery and continuation

Run the source kit's **Start_Chaos_Party.command**, or the repository's `experiments/fracture-phone-tv/Start_Fracture_Chaos_Test.command`. Stop any older test launcher first. Requires Node **22.18+ LTS or 24+**, Git and first-install internet; existing `~/Fracture-Chaos-Spike` is reused. New room credentials stay in that separate clone, never in the ZIP. Optional upstream Venice/Fish Audio providers are forced off by the launcher.

The active modules are `party-bridge.mjs`, `action-contract.ts`, `chaos-actor.ts`, `chaos-tv.ts`, `chaos-world.mjs` and `apply-party-overlay.mjs`; historical one-actor files remain intact. Changes reconstruct from the pinned upstream and a hash manifest. Do not merge PR #11, modify `main`/`luna/visual-game-night-release`, mix databases, or infer hardware acceptance from these logs.

For a resumed cloud session, the disposable upstream is `/workspace/fracture-chaos-beta`. Private raw logs are in `/workspace/scratch`; do not publish launcher host URLs, room.json or databases. Publicly reviewable evidence is already curated in the source tree. The packaging script creates an immutable source ZIP from the committed branch; it does not bundle native dependencies or raw upstream assets. Derived screenshots retain CC BY-SA attribution.
