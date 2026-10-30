# Chaos Party → Fracture: Feature-Parity Audit (2026-10-29)

## Native actor polling backpressure — October 30 (focused test passed; CI queued)

For 12–20 independent controllers, the bridge previously sent a fresh `chaos:state` query every second even if the previous query was still outstanding. A late reply could overwrite newer state after a retry/reconnect. Added a reusable one-in-flight-per-session refresh gate (`actor-refresh.mjs`) with a bounded 2-second retry deadline, monotonic ticket identity and epoch/parked/disconnected validation; the native bridge now ignores stale callbacks. Three isolated Node 22.16 regression tests **passed locally (3/3)** for overlapping polls, lost callbacks, reconnect, and benched actors. Offline GitHub Actions for test commit `463c34b9` was **queued** as run [41104100838](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41104100838) when checked; no full pinned Fracture CI or browser/Intel Mac validation has been established for this change. This is a reliability improvement, **not** new original campaign or 20-player capacity parity.


## Scenery identity / collision save safety — October 30 (focused local verification only)

Commits `95587caa` and `0b6916b4` harden the reusable authored-environment constructor: caller overrides can no longer replace the validated scenery ID, kind or tile; invalid durability, wetness and fire conditions are rejected before they enter a sidecar save. Two regressions were added to `environment-rules.test.mjs`. A reconstructed copy of the changed pure module passed three local Node 22.16 checks (identity, invalid states, and existing fire/damage behavior). **Full repository tests, pinned native CI, browser rehearsal and Mac packaging were not rerun for these new commits.** Earlier native/browser evidence remains valid only for the source revisions documented above.


## Independent reactive-world review and gameplay verification — October 30

The other ChatGPT session's work through `7a5f4cd` was present on the experimental remote branch and was fast-forwarded into this checkout, preserving its classes, declarations, trial/travel, SSE synchronization, NPC fire response and authored scenery. Review found real integration defects despite its passing tests: authored fire ignored native zone boundaries; batch catch-up lost the chronological relationship between ordinary and authored fires; players could not extinguish authored fire; failed authored-scenery saves did not roll back in-memory damage. These are fixed using the existing Chaos planner/resolver, native tile/zone validation and atomic sidecar transactions. Fire conducts in both directions, one hop per tick; a newly lit tree cannot instantly ignite a second tree. Displayed scenery IDs and live native NPC identities are grounded, with exact identities taking priority over similar names. Optional AI proposals may reference visible authored scenery, never invented IDs.

**Actual local browser/native evidence:** two independent phone forms and the shared native TV passed movable table/collision, ignition/extinguishing, unattended burn-through, original D20 repair, witnessed theft, personal quest refusal, innocent-player independence, social D20 and gift recovery. A separate two-phone run demonstrated dropped fuel igniting an authored tree, live refresh on the other phone, coordinated extinguishing preserving remaining HP, original-D20 direct ignition, unattended tree destruction, visible TV stump and real native walking through the cleared tile. A real guard warned about its burning owned rug through a native speech bubble, then autonomously extinguished that rug; ownership and its own response history persisted. Full launcher restart retained both characters, object state, tree destruction, NPC memory and canonical DM facts. See [sanitized evidence](../experiments/fracture-phone-tv/evidence/README.md).

**Validation:** 165 focused `.test.mjs` checks passed, with no skips when supplied the disposable pinned checkout. Native client/server compiled; all 3,329 existing native tests passed, followed by all nine actor regressions after the identity-selection refinement. Original `npm run verify` passed. These are executed local Linux results, not a new GitHub CI run or physical Mac acceptance. `verify-reactive.mjs` is the repeatable destructive-in-game browser rehearsal for a separate disposable world; it never resets saves. An initial sequential-extinguishing assertion failed because adjacent fires legitimately relit each other during the ten-second action windows; the successful rehearsal uses two players together rather than disabling propagation.

**Boundary:** these are real reactions of Chaos-owned objects and explicitly authored overlay trees. Native painted trees/buildings/terrain, playable weather and environmental damage to native character HP are not integrated. Full original campaign parity and the 2015 Mac/physical-phone group test remain open. The older CI-pending notices below describe earlier snapshots.


## Authored-tree fire propagation — October 30 (new code, CI pending)

Added `scenery-fire.mjs` and three regression scenarios. During the existing bounded Chaos fire tick, burning **ground** objects can ignite adjacent explicitly authored scenery in the same scene; authored fire reduces saved HP and eventually removes sidecar collision. Fire from carried objects or another scene is excluded. Burning authored scenery continues advancing even if the initiating Chaos object stops burning. This remains **sidecar-only**; native Fracture scenery/HP/weather are not changed. New tests and pinned CI have **not** been executed for commits through `79f49e73`, and browser/TV multi-device acceptance is unverified. Do not claim a verified gameplay milestone from this entry.


## Verified authored-tree game-night vertical slice — October 30, 2026

**Pinned native integration PASSED** on experimental source SHA `36de73fe69315d24eb9b1349a968195580ad8f15`: [GitHub Actions run 41088458211](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41088458211). The bridge suite reported **153 passed, 1 skipped, 0 failed**; the pinned Fracture clone compiled client/server and passed **3,329 native tests**. The disposable native server booted over HTTP, independently controlled two actors, and completed majority-voted round-trip travel between The Refuge and Glitch Woods. The separate `verify-native-objects.mjs` run confirmed a real actor sees a Chaos-authored tree, `attack tree` routes through the authenticated native bridge, four strikes reduce saved HP 12→0, a second native actor sees the broken tree, native movement reaches the newly unblocked tile, and the separate objects save retains destruction. The real 10-second reaction lock was respected rather than bypassed.

The same successful run generated [Mac source kit artifact 12992099172](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41088458211) (SHA-256 digest `64442e4ea822bd81f8c9fafda6fd4e2fde6e7e58f3cef3b64424043097eadb6d`; GitHub artifact expires November 6). Packaging verifies the launcher, source identity and exclusion of credentials/databases. **This is a CI-produced source kit, not a physical Mac-tested release.**

**Scope boundary:** The tree is a bounded, explicitly authored Chaos overlay placed only on passable native tiles near distinct actor spawn areas (maximum four), rendered as a tree/stump by the opt-in TV adapter. Native Fracture trees/buildings/terrain are **not** destructible; weather/water/terrain physics and native NPC HP hazards are **not** integrated. TV code compiled, but actual browser rendering, SSE latency, 12–20 players on the owner's Intel Mac, physical Mac/iPhone/TV acceptance, and original campaign/character/AI/party-vote parity remain unverified. No merge, deployment, original-save modification, or paid service occurred.


## Opt-in scenery adapter — October 30 (historical baseline; superseded by verified tree slice above)

The initial authored-only scenery bridge exposed persistent tree/structure durability and collision in the Chaos sidecar. `registerScenery(scene,id,kind,tile)` explicitly opts a fixture in; `strikeScenery(actor,id,damage)` enforces same-scene adjacency, persists damage, and removes sidecar collision after destruction. A text `attack/chop/break` action routes to registered scenery. Sidecar snapshots expose scenery and regression tests cover damage, scene isolation, JSON save/reload, and unknown-native-object refusal. **Historical state before the native-verified tree slice above.** A bounded authored tree now has a compiled TV adapter, native-verified damage and movement, and CI evidence; native Fracture scenery remains untouched and real-browser TV acceptance is still pending.


## Environmental rules library — October 30 (not gameplay parity)

An isolated pure-rules module defines 15 categories spanning vegetation, structures, furniture, water, terrain and NPCs, with deterministic damage, burning, wetness, adjacent spread, lightning and wind/rain effects. Pure-rules regression tests now pass in pinned CI. **This remains an unintegrated native-physics foundation**: native Fracture tiles, buildings, water, NPC HP, saves and rendering are unchanged. The separate authored-tree vertical slice above is native-verified; this general environment library is still not integrated with native scenery/weather/water/terrain. Physical Mac testing remains required.


## Native visible-world change notifications — October 30 (partial live-sync parity)

The Fracture bridge now compares successive **native-authoritative** actor snapshots for visible zone, ground-object, NPC, story and camp changes. It coalesces authenticated SSE change signals to other phones without transmitting world data or private inventory; each client refetches its own `/state`. This covers observed environmental fire/damage/movement and NPC changes **when they appear in a polled native snapshot**; no fabricated room-log event or new simulation authority is introduced. Existing 750-ms phone polling is preserved.

Focused tests in an isolated source-kit copy: **133 passed, 1 skipped** (Node 22.16, includes two-player HTTP SSE test). Branch `ae564529` [offline CI](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41076488495) passed 210 original-game checks; that job does not execute experimental Fracture tests. The exact code/test commit `ae564529` also passed [pinned Fracture integration CI 41076479106](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41076479106): experimental bridge **142 passed, 1 skipped**, pinned client/server compilation, native tests and HTTP boot succeeded, and CI generated a Mac source-kit artifact. Real multi-device browser/TV timing and physical Intel Mac acceptance are **not** verified. This does not restore original campaign/maps/saves, full NPC autonomy, or universal environment physics.


## Authenticated live event subscription lifecycle — October 30

The existing same-origin room SSE stream now checks active session membership on each broadcast and closes parked/removed player subscriptions. This prevents stale connections from continuing to receive room change signals. It does not yet prove full fire/damage/movement event delivery or native Fracture world synchronization; tests and pinned CI remain pending.


## Authenticated live room-event notifications — October 30

The experimental room bridge now provides authenticated same-origin SSE change notifications to active phones, triggered by authoritative room event recording. Phones refresh their state immediately on receipt while retaining their existing polling fallback. This is room-event push, **not** a complete environmental object event bus or native TV synchronization; native fire/object changes without a bridge record may still be observed only through polling. No live browser/native CI or physical Mac verification for this change yet.


## Live native NPC presence for physical collision — October 30

Sidecar collision now filters saved NPC owners against the native NPCs actually present in the world. This prevents a stale NPC save record from keeping an owned object as a phantom obstacle after the native NPC leaves. Regression authored; not yet executed or native-CI verified. This does not affect native map terrain collision.


## NPC-owned physical fixture collision — October 30

The shared Chaos sidecar collision rule now recognizes an intact blocking NPC-owned floor fixture in its NPC's current scene, rather than excluding every owned object. Carried player items and absent NPCs do not become collision geometry; destroyed fixtures stop blocking. Added focused regression; CI and physical playtest pending. Native Fracture scenery still requires an explicit safe capability adapter and cannot be assumed destructible.


## Shared physical-object capability foundation — October 30

The Fracture sidecar now exposes derived movable, flammable, breakable, repairable, blocking and extinguishable flags for **Chaos-owned objects**. The same descriptor is used for sidecar collision and fire eligibility, avoiding per-object name special cases. Four focused regression scenarios were added; they have not been executed or validated by pinned CI in this pass. Native Fracture scenery is still authoritative and is not generally destructible or movable. NPC autonomy, hazards, weather, water, and instant multiplayer event broadcasting remain incomplete.


## Grounded NPC property firefighting (partial reactive-world parity) — October 30

The isolated Fracture sidecar now adds one **state-changing NPC response**: a nearby, living native NPC can extinguish its own burning physical floor object after one full warning tick. This reuses original Chaos object extinguishing semantics and the existing native-zone, identity, proximity and persistent NPC history projections. Other players see the saved object condition through existing state polling; the NPC does not teleport, receive fabricated native animation, gain items or rewrite native quests. An absent owner cannot retroactively witness a burn-through. Focused local source-kit tests: **131 passed, 1 skipped, 0 failed** under Node 22.16 with TypeScript stripping; [GitHub offline verification 41069105566](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41069105566) passed (`npm run verify`); the separate pinned native Fracture integration remains pending.

**Still absent:** native NPC autonomous navigation/goals, hazards affecting native character HP, full continuous background simulation, original Chaos campaign NPC routines and character relationships, complete multiplayer environmental event delivery semantics, Crown Job/Dawn Bell scene and save migration, and full original class/dice/AI/party-vote parity. This is **partial reactive-environment rule transfer**, not the original Chaos game.


## Environmental NPC awareness / repair acceptance — October 30 (partial parity)

The isolated Fracture adapter now records actual fire spread and heat-confirmed destruction in persistent nearby **native NPC witness** history, reusing the original Chaos environmental and D20 object rules. Native-zone and line-of-sight checks constrain witnesses; a fire's original igniter is attributed only to an NPC that previously witnessed the successful ignition of that exact source. Seeing fire alone never grants omniscient culprit knowledge. Native NPCs can warn about their burning property and ask for a repair after real burn-through. Players may extinguish/repair an NPC-owned **floor** object without taking ownership; NPC-carried items remain protected. This closes a bounded reactive-property/ownership gap, **not** the original NPC autonomy/goal system.

[Pinned CI 41061872992](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41061872992) at `d8c2b4a005d11ac8d2ee8fd1831871303e8e0f40` passed 122 focused Node checks (one skipped), 3,329 pinned Fracture upstream tests, client/server builds, native server boot/integration and Mac source packaging. The independently checked source ZIP is reproducible but not physical Mac acceptance; the new fire-alarm scenario has not yet been executed end-to-end in a real browser/native server session. Crown Job, Dawn Bell, character visual parity, full NPC autonomy and legacy saves remain unported.


## Grounded tile fire propagation (bounded partial parity) — October 30

The isolated Fracture bridge now reuses original Chaos material and burn rules to propagate fire **one adjacent ground tile per ten-second tick** within a valid native zone. It does not ignite carried inventory, distant objects, nonflammable material or scenery across a native zone boundary. Extinguishing a source prevents subsequent spread. NPC-owned rugs that ignite from a player-started fire generate a durable personal trust and witness-memory consequence, affecting the existing native quest gate. Three regression scenarios passed locally with the source kit (112 `.mjs` passes, one skip across 113 tests). This remains **partial object/environment rule reuse**, not a complete reactive world, autonomous background simulation, original campaign parity or physical Mac acceptance. Pinned Fracture integration and Mac source packaging passed at [run 41053082438](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41053082438) for source `6dd3c6c6` (including upstream tests and real native-server boot). The CI source artifact was independently checksum/CRC-verified and its extracted focused tests passed (112 passes, one skip). A native-server fire-spread journey, full browser flow and physical Mac acceptance remain open.


## Native two-way expedition acceptance — October 30 (partial parity)

A pinned real-server regression uncovered that the first Glitch Woods → The Refuge return vote dispatched a native path to an **unreachable destination** (`41,195`); the native engine correctly blocked it. The isolated Fracture adapter now targets the already traversed, walkable Refuge tile `34,210` using the same majority vote and per-actor native movement. [First CI failure](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41044650184) is preserved as evidence; [passing CI 41044865065](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41044865065) at `9f2be4b06f5403122845fd2820c6ddf1063720ca` confirmed **two independent authenticated native actors actually enter Glitch Woods and return to The Refuge** after two separate majority votes. No teleport, false arrival, original campaign save conversion or Fracture combat modification occurred. All 3,329 pinned upstream tests passed. This closes the **bounded reverse-route native verification gap**, not Dawn Bell's expedition/map/story parity or physical Mac/12–20-phone acceptance.

## Cooperative trial choice: a real majority-selected story branch (partial parity) — October 30

The independent Refuge Trial now optionally lets nearby, living, authenticated Fracture characters vote for a **fight or craft** objective after an actual native NPC interaction. The bridge reuses the existing strict-majority/frozen-electorate vote logic rather than adding a second voting engine. Approval persists with the current trial instance; an actual native kill cannot fulfill a voted craft objective, nor can a successful original Chaos craft fulfill a voted fight. No vote preserves the previous either/or path. The phone and TV show the choice, and replay resets only the trial choice/checkpoints, not character state. Vote ballots and private tokens are not written into the room save. Local and independently extracted source-kit regressions: **109 passed, 1 skipped, 0 failed**. Pinned Fracture integration, native server checks and Mac packaging passed at [CI 41037550217](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41037550217) for `1338a9906fbb4fb63ff49c3f01e772aef694e687`; physical hardware and full browser story-choice acceptance remain pending.

**Parity boundary:** This is a bounded, meaningful **branching objective** in a *new* four-step Fracture trial. It is **not** Crown Job, Dawn Bell's seventeen scenes, the original campaign choice graph, a port of expedition maps, or a full migration of the Chaos party-vote system. The original game remains canonical.

## Bounded majority-approved native travel (outbound native pass; return pending) — October 30

The experimental adapter now offers two **server-defined Fracture waypoint** travel votes, The Refuge ↔ Glitch Woods, using the existing strict-majority electorate and native per-actor `go` authority. Proposers and voters must be real nearby living characters in the departure zone. A vote never teleports, grants story completion or claims everyone arrived; only a later native destination-zone report can count an arrival. STOP and disconnections still apply. The updated local mock/contract suite passed **106/107 checks (one skipped)**. A disposable native CI run [41031502100](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41031502100) proved two distinct actors actually entered Glitch Woods after a majority vote, but the workflow failed because the vote view expired after eight seconds before arrival-count verification. That lifecycle bug was corrected, and [pinned integration run 41031711687](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41031711687) **passed**: two independent native actors actually entered Glitch Woods after a strict-majority vote, with 3,329 upstream Fracture tests passing and an independently verified source-only Mac ZIP (SHA-256 `3715250587942311654935e7785fc5c95e5ef57ccb732823499380deefbaa12d`). Reverse native travel, original story-scene prerequisites and physical Mac/group-phone acceptance remain outstanding. This is **partial rule transfer**, not original Dawn Bell majority travel, campaign map or story-scene migration.


## Opt-in original D20 reactions, not full original party reactions — October 30

The Fracture sidecar now supports a **real optional ten-second pre-execution window** for original Chaos world checks. A player types `declare ...`, and the server queues the request without claiming success. Other nearby, living, separately authenticated characters may help (higher of two original D20 rolls) or hinder (lower of two), but cannot stack modifiers. The actual native actor revalidates world reach, object ownership and available mechanics when the window ends. STOP/disconnect/bench/zone change cancels the pending declaration; no world action is fabricated. Ordinary movement and combat remain immediate, and native combat RNG is unchanged. This uses the already bundled MIT-licensed original Chaos D20 selection, not a new dice engine.

**Parity boundary:** Original Chaos reaction rules, universal first-valid free-form resolution, campaign-specific reactions, native combat advantage, group travel voting and story/world migration are **not ported**. This is a bounded cooperative/competitive world-check mechanic, not complete reaction parity. The pinned Fracture integration workflow [41025027173](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41025027173) passed real two-actor native D20 hindrance after a ten-second announcement. Its source ZIP checksum and extracted 98-check focused suite were independently verified (97 passes, one existing skip). The additional parallel-declaration/STOP regression also passed in [pinned integration run 41025316200](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41025316200) at `bcc3211e4d`; its Mac source ZIP was independently checksum/CRC-verified and the extracted 99-check suite passed (98 passes, one skip). Physical Mac and original campaign/reaction parity remain unaccepted.


## Native NPC reconciliation and Bard/Healer social D20 — October 30

The experimental Fracture sidecar now accepts **apologize to / make amends with / make peace with / persuade [visible NPC]** when that real native NPC personally distrusts the authenticated character. The original Chaos `social` skill grants Bard and Healer **+3** on a server-owned D20 check (including the existing Lucky-ish/critical rules); a successful check repairs up to two negative trust points, never above neutral. The existing native quest gate reads that same durable trust, so successful amends can restore eligibility to request an actual Fracture quest without minting rewards or changing native combat. Failed checks leave trust unchanged. Attempts are restricted to a visible, unambiguous, same-zone NPC within two walkable tiles, and a per-NPC/per-character **30-second cooldown persists across restarts**. A private original Chaos DM-memory entry records the true result.

**Parity boundary:** This is a new bounded social recovery action built from original Chaos role/dice/memory code and Fracture NPC/quest authority. It is not the original full NPC goal system, Charming perk, all-class abilities, or campaign dialogue. The separate real-browser regression now exercises one actual native NPC apology; physical Mac acceptance remains outstanding.

## Partial character-class / original D20 port — October 30

New Fracture phone registrations can select one of the six **original Chaos role identifiers**. The private room save binds that role to the character's recovery identity; the bridge passes it only over the authenticated local native-actor connection. The original Chaos **+3 matching-skill rule** is now active for supported Chaos-object checks (currently Rogue theft, Knight break, and Bard/Healer social amends). The original **Lucky-ish reroll of an initial D20 1–3** and natural-1/natural-20 outcomes apply to those original object checks. Existing unassigned saved actors keep their original behavior; their credentials and saves are not migrated. Native Fracture combat, HP, native equipment, classes and loot are **unchanged**. Other original role skills, Tough/Charming perks, portrait/outfit customization and full class progression are **not ported**. This is partial class/dice parity, not a finished character creator.

## Repeatable objective boundary

The optional **Refuge Trial** is now replayable after a confirmed completion. The private host must explicitly start another run; the bridge archives a bounded summary of the prior run, resets only trial checkpoints, and binds native action receipts to the run in which they were issued. A delayed attack or NPC conversation from an earlier run cannot advance the next one. Unknown-version and unfinished saves are not overwritten. This reuses Fracture's actual combat/NPC/zone state and the original Chaos crafting result without modifying either authority.

**Parity limit:** A replayable four-step trial is not the original Crown Job or seventeen-scene Dawn Bell campaign, not original quest/world-map persistence, and not proof of fun or group-scale Mac performance. Original Chaos remains canonical.

> **Owner correction:** The current Fracture build is **NOT** a full Chaos Party migration and must not be called a finished Chaos Party game. "Game-night beta" here means *experimental Fracture gameplay with an independent multi-phone bridge*, not parity with the original Chaos Party. Do not promote, merge or replace the original release based on Fracture CI success.

## Authoritative source snapshots and limits

- **Original Chaos Party:** branch `luna/visual-game-night-release`, its `START_HERE.md`, `docs/DAWN_BELL_RELEASE.md`, `docs/GAME_COMPLETION_CHECKPOINT.md`, `docs/BETA.md` and `docs/OWNER_HANDOFF_REACTIVE_HYBRID_WORLD_2026-10-27.md`. Original campaign verification reports 210 tests/35 files and packaged two-browser journeys. Reports are evidence of that branch's behavior, **not a passing Fracture migration**.
- **Fracture adapter:** branch `spike/fracture-phone-tv`, `docs/FRACTURE_GAME_NIGHT_RELEASE.md`, `experiments/fracture-phone-tv/README.md`, `party-bridge.mjs`, `chaos-actor.ts`, `chaos-tv.ts`, `action-contract.ts`, `optional-dm.mjs`. Tests exercise isolated Fracture, NOT original Chaos feature preservation. The pinned external engine has separate maps, quests, code, art and save database.
- **Architecture conflict:** original PartyFrame/Colyseus + custom Canvas/render/game-rule engine vs Fracture Socket.IO + native RPG world/rule engine. Similar-looking feature labels do NOT mean feature parity. Do not copy databases or mix message protocols.
- **Not fully accepted on owner hardware:** Neither branch has been certified on the early-2015 Intel Mac + TV + actual intended 12–20 phones. A bounded live Groq interpretation/narration loop was tested, but full creative campaign quality and group-scale provider capacity remain unqualified.

## Parity matrix (compare actual code and behavior, not README labels)

| Product requirement | Original Chaos Party (reported and source-backed) | Fracture experiment now | Migration status |
| --- | --- | --- | --- |
| One shared 16:9 TV world, phone remotes | Custom tavern/connected scenes, authored Chaos visuals and mechanics; phone remotes | Fracture's own pixel maps, sprites, TV spectator and phones | **PARTIAL / replacement, not migration** |
| Character identity and appearance | Name, customizable sprite, outfit, class, equipment, progression and recovery | Name, six saved Chaos class identifiers, four color tints, native Fracture gear/progression, separate Chaos-crafted inventory and visible wearable bands | **PARTIAL CLASS/INVENTORY**; Rogue theft, Knight break and Bard/Healer social-amends bonuses plus Lucky-ish object-check reroll are functional; original sprite/outfit, other class skills, full perks and legacy save identity not ported |
| 12–20 simultaneous actors | Original PartyFrame/Colyseus with source-backed multiplayer/reconnect and tests | 20 synthetic Fracture actors, 2 browser controllers; real Mac group unverified | **ALTERNATE IMPLEMENTATION**, not retained original networking/authority |
| Free-form action + grounded planning | Chaos action proposal / native planner, object/capability validation, create/craft/transfer/ownership | Native intent routing plus original object/entity planners for bounded crafting, ownership, transfer, furniture, fire and repair; optional Groq fallback | **PARTIAL CORE RULE REUSE**, not universal natural-language world actions |
| Creative AI Dungeon Master | Original canonical memory/narration rules and optional hosted provider | Original canonical DM memory/outcome validation, native-confirmed combat facts, and bounded live Groq interpretation/narration tested through phone/native/TV | **PARTIAL LIVE QUALIFICATION**, not the original full campaign DM or 20-player quality guarantee |
| Dice, advantage, reactions, consequence rules | Server dice/rolls, advantages/disadvantages, 8–12s reactions and persistent consequences | Native combat RNG, original D20 object checks with matching-role +3, Lucky-ish reroll and critical 1/20, one-use nearby-helper advantage **or opponent disadvantage** on valid Chaos world checks (crafting, theft, object actions and NPC amends), opt-in 10-second **pre-execution** announcements with STOP/zone/disconnect safety, and bounded NPC consequences | **PARTIAL DICE/CLASS/REACTIONS**, not full original consequence/reaction semantics |
| Interactive scenery and physical actions | Material/ownership/containment/crafting, fire/damage/repair, moving tables, stolen objects | Native loot/chest/doors/combat plus original craft/wear/give/drop/take rules on tiles; custom table movement/collision, fire, extinguish and repair; native scenery remains static | **PARTIAL CORE TRANSFER**, not all original fixtures |
| NPC awareness | Chaos NPC goals, trust, witness, possession/theft memory; source-backed acceptance checks | Native NPCs with durable theft/gift/fire witnesses, ignition-origin-grounded blame, personal trust/quest refusal, social-D20 amends, contextual burning-property/repair concerns, and native-confirmed witnessed monster defeats | **PARTIAL CORE TRANSFER**, not the original autonomous NPC goals/routines |
| Crown Job | Complete tavern heist with targets/clues, alternate tactics, state and ending | Absent; no equivalent imported campaign | **NOT PORTED** |
| Dawn Bell story / connected world | Seventeen scenes overall incl. woods, river/bridge, ferryman cave, town/inn, castle, vault, finale | Fracture town, dwelling, Glitch Woods, native rat quest, plus a new optional four-step cooperative Refuge Trial using actual receipts and zones, with an opt-in majority-chosen fight/craft objective | **DAWN BELL NOT PORTED**; Refuge Trial is an independent small adventure, not a scene/campaign migration |
| Major travel majority vote | Strict-majority approval documented/tested in original expedition | New **bounded local rally** votes use a frozen electorate, strict majority and native per-actor walking; **no original major-travel gating, destinations or scene transitions** | **PARTIAL RULE SPIKE, NOT EXPEDITION PARITY** |
| Persistent world state and maps | Campaign and discovered-map persistence, regional objects, bridge repair, NPC consequence memory | Native character save, durable crafted objects/furniture/fire/NPC memory, canonical DM ledger and separate Refuge Trial progress; native quests may reset | **PARTIAL WORLD/MEMORY/NEW OBJECTIVE SAVE**, no original campaign/map migration |
| Host controls | Chaos host tools including pause/moderation, campaign flow, private DM setup | Basic Fracture host/QR, spectator, bench/restore | **PARTIAL / not equivalent** |
| Licensed cohesive look and effects | Ninja Adventure/Kenney and custom Chaos art/effects/sounds | Fracture/BrowserQuest and its independently licensed assets | **VISUAL FOUNDATION REPLACED**; Chaos art not imported |
| Mac first-launch/QR | Original candidate Mac ZIP and setup; physical check pending | Separate Fracture source ZIP/launcher and QR; physical check pending | **SEPARATE TRIAL**, no parity claim |

## October 30 cooperative world-check advantage extension

The original Chaos D20 advantage helper is now shared across valid Fracture-side Chaos world checks, including social NPC reconciliation and NPC theft, rather than only craft/attach. It is a 15-second, one-use assist from a separate live, nearby, same-zone player; the authoritative roll, NPC trust and item ownership still decide results. Focused regressions were added, and the native-server integration check now requires two distinct Fracture actors to produce and consume an actual advantage roll. The pinned integration build passed at `7ac1d48198226f39a117fad9c82e81db7e3d57b4`, including the real two-actor assistance receipt; the source-only Mac ZIP was checksum-verified and its extracted focused tests passed. This remains native-server/automated evidence, not a real-phone/TV or hardware playtest.

**Parity remains partial.** This does not import original free-form reactions, class abilities, native Fracture combat advantage, expedition voting, Crown Job, Dawn Bell, legacy saves, or the original campaign world.

## Correct shipping gate

The existing Fracture beta can be shared only as an **engine/integration playtest**. A passing Fracture test suite, 20 synthetic characters, and a functional Mac launcher DO NOT prove the original game or its story has been moved. Until migration is substantially complete, do not call this the finished Chaos Party game or claim gameplay equivalents.

**Two viable paths, to compare before doubling down:**

1. **Retain original Chaos as gameplay authority and improve its renderer/presentation using appropriately licensed Fracture/other proven techniques/assets**, preserving the 17 scenes, old characters/saves, action grammar, dice, world simulation, campaigns and AI plumbing. This may be the lower-risk way to keep existing investment, but engine/asset integration needs a bounded live proof.
2. **Continue Fracture as authoritative engine and port original Chaos game systems systematically** through a documented boundary: actors/saves/characters, action and dice contracts, world objects, owner/visibility, NPC attitudes, campaigns/scenes/travel votes, canonical persistence, AI narration. Each step must include a source→destination semantic parity test and visually observable end-to-end gameplay. **Do not** assume importing files makes Colyseus and Socket.IO compatible or that Fracture can implement arbitrary world mechanics without redesign.

**Recommendation pending a short architectural spike:** Protect both branches and **prioritize preserving what already exists**. Avoid yet another rewrite. Benchmark integration of one real, differentiating Chaos scenario on the chosen visual engine (e.g. move a table, steal a rug with real visibility/ownership/dice and persistence, and have an NPC react). If this cannot be reproduced efficiently in Fracture, keep the original rules engine and upgrade only visual/audio presentation instead.


## Bounded rule-transfer experiment: local majority rally

The isolated Fracture adapter now has an **opt-in group rally** on the phone controller, not a port of the original Dawn Bell travel system. This is a reversible test of whether a useful original Chaos rule can be adapted without mixing Colyseus and Socket.IO.

- The proposer offers their **actual server-reported position**; at least two connected, living, ready characters must be in the same native zone and within twelve Manhattan tiles. No phone-supplied arbitrary teleport coordinate is accepted.
- A ten-second vote snapshots eligible character identities. The proposer counts as yes; a strict majority is `floor(n/2)+1`. One authenticated vote per member, immutable once cast. Missing votes are not yes; an impossible or expired quorum declines without moving anyone.
- Approval sends a **separate validated `go` request** to each still-eligible native Fracture actor. Native collision, pathing, receipt and personal STOP still apply. An approved vote is **not proof that everyone arrived**; actors who disconnected, were benched, changed zone or moved out of range are skipped and reported.
- Votes are ephemeral and deliberately reset after a bridge restart. They do not alter Chaos campaign files, native Fracture quests, character saves, or the canonical original branch.
- Focused tests cover 2/3/4/20-member quorums, replay/outsider/expiry, rejected travel, per-actor native dispatch and benched-player protection. CI and actual hardware results must be recorded separately in the release tracker.

This does **not** satisfy the original product's majority-controlled expedition scene travel, region persistence, NPC memory, world-object ownership, or D20 advantage rules. Those gates remain unchecked.

## Architecture decision checkpoint: preserve original rules by default

Source-backed comparison, not a new engine commitment:

| Criterion | Original Chaos authority + improve renderer | Fracture authority + port original mechanics |
| --- | --- | --- |
| Already implemented | Crown Job, seventeen Dawn Bell scenes, original saves, object ownership/crafting/fire/repair, NPC witness/trust, D20/advantage, travel vote and reactions | Native walkable maps, animated combat, NPC/quest loop, doors, equipment, plus experimental phone/TV bridge |
| Largest remaining work | Fix the original TV/phone visual presentation and verify physical feel/performance; re-use already included CC0 Ninja Adventure and Kenney sheets/audio/effects | Rebuild original world state, custom characters, quest graph, object capabilities, campaign persistence, dice/advantage, NPC memory and votes in a second rules engine |
| Data/protocol risk | Existing Colyseus and campaign files remain authoritative; no conversion needed | Distinct Socket.IO, SQLite native character state and Chaos JSON campaigns; requires explicit versioned migration and rollback |
| Licensing | Original assets have source manifests and CC0 notices; preserve provenance | Fracture MPL 2.0 code and CC BY-SA 3.0 art/content require separate attribution and derivative-sharing review |
| Best next proof | Original **move/steal rug + NPC witnesses + saved consequence** visibly works in a focused 90-second TV scene with two phone controllers | The same exact scenario must be genuinely implemented and saved through Fracture native authority, not merely narrated in a sidecar |

**Default recommendation:** preserve `luna/visual-game-night-release` as the canonical gameplay authority, and investigate a bounded renderer/presentation upgrade before attempting wholesale migration. The local rally is useful isolated research, **not** evidence that the more difficult original mechanics can be moved cheaply. No automatic merge, save conversion, paid provider, or public deployment follows from this checkpoint.

## October 30 bounded transfer: original object rules on native tiles

Owner direction in the active session broadened to combining the games with engineering discretion. The existing phone/native renderer makes a narrow pure-rule adapter cheaper to verify than another renderer rewrite today. This does not change the recommendation to preserve the original canonical game or establish that a complete Fracture port is affordable.

`chaos-world.mjs` imports the original object planner/resolver and RNG, projecting a small item state onto actual Fracture coordinates. Two real phone actors crafted with server D20, wore a colored band, transferred ownership, dropped/picked up the same object through native movement, and retained it across a real restart. Materials, components and owner UUIDs persist in separate Fracture-only JSON; original networking, campaign generation and saves are excluded. The native engine still owns movement, combat, gear and damage.

This advances **only** crafting/material ownership and that subset's dice/persistence from absent to partial source reuse. It does not port moving tables/rugs, fire/repair, witnessed theft, NPC trust/memory, advantage, Crown Job, Dawn Bell, original character customization or save identity. Native gear gifting and crafted combat effects are also absent. The wearable-only milestone did not establish the differentiating object/NPC scenario; the later core-mechanics proof below advances that boundary without establishing full campaign parity.

## Core mechanics follow-through — October 30

The owner explicitly prioritized reactive environment, remembered NPC consequences and the DM. The adapter now reuses original generic entity reactions and theft/trust rules for movable blocking furniture, fire/burn-through, extinguishing and repair. It attaches custom possessions and durable per-character observed-action memory to **actual native NPC identities**. The browser scenario demonstrated theft of a real displayed rug, remembered quest refusal, an unaffected innocent player, a real gift and restored native quest access. Restart preserves those consequences.

Original canonical DM memory and narration instructions/validation are also reused; deterministic engine facts remain available offline. Optional free-provider narration is nonauthoritative and unqualified live. This is a source-backed partial transfer of the differentiating object/NPC loop, not the original Crown Job/Dawn Bell campaigns, all NPC routines, full advantage/reaction simulation, original custom characters or save migration. Native painted scenery and native character fire damage are not fabricated. The original game remains canonical.

## Native combat memory boundary — October 30

Fracture's native server remains the **only** combat authority. The authenticated headless actor now forwards an event to original Chaos canonical DM memory only when a real native HIT confirms a mob at zero HP. The mob's pre-destruction tile, observed NPCs, actor identity and authoritative before/after HP are recorded; an unsuccessful attack cannot create a kill memory. Nearby NPC dialogue may remember the witnessed encounter without inventing native XP, trust or loot. This is reversible: the integration is a single optional `recordNativeDefeat` hook into the separate object sidecar, not a change to Fracture damage calculations or Chaos's original branch.

Focused regressions and the pinned Fracture build passed in [CI run 40989546900](https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/40989546900). A browser rat-quest assertion was added but must still be executed in a disposable live-browser environment; no physical Mac acceptance or full original story migration is implied. Crown Job, Dawn Bell, original class/character visuals, all NPC routines and fully qualified creative narration remain open.

## Independent cooperative adventure proof — October 30

A new **The Refuge Trial** provides a bounded, optional start-to-finish group objective on Fracture's existing maps. The Mac host starts it only when a living native character is in The Refuge. Its four verified steps are: speak to a real NPC; defeat a real native monster **or** succeed at an original Chaos craft; enter Glitch Woods; have a character who actually visited the woods return to The Refuge. Other players can contribute the talk/proof steps. It never invents Fracture rewards, items, combat outcomes, quests or story locations.

The adapter accepts only native action receipts (a zero-HP monster death with before/after values; a successful NPC interaction), original Chaos canonical craft outcomes, and server-reported native zones. A typed claim, missed hit, failed craft, AI prose, or an idle teammate in town cannot complete it. Private controller identity links the woods visit to the return, and a durable versioned room checkpoint preserves milestones. Phone checklist and TV event log report the real status; the host cannot silently restart a saved trial. This is a reversible sidecar, not imported Chaos campaign state.

Focused reducer/bridge tests and pinned Fracture CI must be distinguished from a real family session. No physical Intel Mac acceptance or original Crown Job/Dawn Bell migration is established by this addition. It is a **new small campaign-like loop**, not parity with the existing seventeen-scene original.

## Objective parity acceptance

- [ ] Two distinct, customized **Chaos** characters and original saves survive an engine change or a supported explicit migration; no loss/corruption.
- [ ] Existing Crown Job from start to actual server-confirmed finale, TV visuals and phone actions.
- [ ] Existing Dawn Bell expedition, seventeen connected locations/paths, strict-majority travel voting, map, outcomes, region persistence and at least one alternate route.
- [ ] Real generic object interaction: move table, steal/burn rug, extinguish fire, craft or repair object, preserve results on leaving/rejoining.
- [ ] Real NPC consequences: theft witness/trust, correct memory when returning.
- [ ] Reusable action contract, validated dice/advantage and 10-second reaction semantics, server-authoritative outcomes, truthful AI/fallback.
- [ ] Visually coherent TV character customization, animations, feedback and readable 16:9 experience.
- [ ] 12–20 actual phones with Mac CPU/RAM performance acceptable; no per-phone heavy browser rendering and no shared actor.
- [ ] Optional hosted free AI narrator/action interpreter tested live against intent semantics and truthfulness, within limits, with zero-cost fallback.
- [ ] Dedicated original-save backup, restoration/reconnect, licensing/asset provenance, no main merge without owner approval.

**Immediate instruction for future agents:** Read this audit before interpreting issue #12 or `docs/FRACTURE_GAME_NIGHT_RELEASE.md` as a declaration of completion. Be brilliant but lazy: reuse more of the original working Chaos code, not just Fracture's default rat quest. Solve the structural integration once, not individual utterances.
