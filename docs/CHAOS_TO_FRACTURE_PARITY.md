# Chaos Party → Fracture: Feature-Parity Audit (2026-10-29)

> **Owner correction:** The current Fracture build is **NOT** a full Chaos Party migration and must not be called a finished Chaos Party game. "Game-night beta" here means *experimental Fracture gameplay with an independent multi-phone bridge*, not parity with the original Chaos Party. Do not promote, merge or replace the original release based on Fracture CI success.

## Authoritative source snapshots and limits

- **Original Chaos Party:** branch `luna/visual-game-night-release`, its `START_HERE.md`, `docs/DAWN_BELL_RELEASE.md`, `docs/GAME_COMPLETION_CHECKPOINT.md`, `docs/BETA.md` and `docs/OWNER_HANDOFF_REACTIVE_HYBRID_WORLD_2026-10-27.md`. Original campaign verification reports 210 tests/35 files and packaged two-browser journeys. Reports are evidence of that branch's behavior, **not a passing Fracture migration**.
- **Fracture adapter:** branch `spike/fracture-phone-tv`, `docs/FRACTURE_GAME_NIGHT_RELEASE.md`, `experiments/fracture-phone-tv/README.md`, `party-bridge.mjs`, `chaos-actor.ts`, `chaos-tv.ts`, `action-contract.ts`, `optional-dm.mjs`. Tests exercise isolated Fracture, NOT original Chaos feature preservation. The pinned external engine has separate maps, quests, code, art and save database.
- **Architecture conflict:** original PartyFrame/Colyseus + custom Canvas/render/game-rule engine vs Fracture Socket.IO + native RPG world/rule engine. Similar-looking feature labels do NOT mean feature parity. Do not copy databases or mix message protocols.
- **Not fully accepted on owner hardware:** Neither branch has been certified on the early-2015 Intel Mac + TV + actual intended 12–20 phones. No live creative-DM qualification.

## Parity matrix (compare actual code and behavior, not README labels)

| Product requirement | Original Chaos Party (reported and source-backed) | Fracture experiment now | Migration status |
| --- | --- | --- | --- |
| One shared 16:9 TV world, phone remotes | Custom tavern/connected scenes, authored Chaos visuals and mechanics; phone remotes | Fracture's own pixel maps, sprites, TV spectator and phones | **PARTIAL / replacement, not migration** |
| Character identity and appearance | Name, customizable sprite, outfit, class, equipment, progression and recovery | Name + 4 color tints, native Fracture gear/progression, separate Chaos-crafted inventory and visible wearable bands | **PARTIAL INVENTORY ONLY**; original sprite/class/save identity not ported |
| 12–20 simultaneous actors | Original PartyFrame/Colyseus with source-backed multiplayer/reconnect and tests | 20 synthetic Fracture actors, 2 browser controllers; real Mac group unverified | **ALTERNATE IMPLEMENTATION**, not retained original networking/authority |
| Free-form action + grounded planning | Chaos action proposal / native planner, object/capability validation, create/craft/transfer/ownership | Native intent routing plus original object/entity planners for bounded crafting, ownership, transfer, furniture, fire and repair; optional Groq fallback | **PARTIAL CORE RULE REUSE**, not universal natural-language world actions |
| Creative AI Dungeon Master | Original canonical memory/narration rules; still **not qualified live** | Original canonical DM memory and outcome validation reused for object events; native-confirmed mob defeats now enter the same durable ledger. Optional Groq narration unqualified live | **PARTIAL OFFLINE MEMORY/NARRATION**, not a qualified creative DM |
| Dice, advantage, reactions, consequence rules | Server dice/rolls, advantages/disadvantages, 8–12s reactions and persistent consequences | Native combat RNG, original D20 for object actions, real nearby-helper advantage on crafting/attachment, 10-second declarations and bounded NPC consequences | **PARTIAL DICE/ADVANTAGE**, not full original consequence/reaction semantics |
| Interactive scenery and physical actions | Material/ownership/containment/crafting, fire/damage/repair, moving tables, stolen objects | Native loot/chest/doors/combat plus original craft/wear/give/drop/take rules on tiles; custom table movement/collision, fire, extinguish and repair; native scenery remains static | **PARTIAL CORE TRANSFER**, not all original fixtures |
| NPC awareness | Chaos NPC goals, trust, witness, possession/theft memory; source-backed acceptance checks | Native NPCs with durable object-theft/gift witnesses, personal trust and quest refusal/amends; confirmed native mob deaths can also become witnessed memories | **PARTIAL CORE TRANSFER**, not all original goals/routines |
| Crown Job | Complete tavern heist with targets/clues, alternate tactics, state and ending | Absent; no equivalent imported campaign | **NOT PORTED** |
| Dawn Bell story / connected world | Seventeen scenes overall incl. woods, river/bridge, ferryman cave, town/inn, castle, vault, finale | Fracture town, dwelling, Glitch Woods and native rat quest | **NOT PORTED** |
| Major travel majority vote | Strict-majority approval documented/tested in original expedition | New **bounded local rally** votes use a frozen electorate, strict majority and native per-actor walking; **no original major-travel gating, destinations or scene transitions** | **PARTIAL RULE SPIKE, NOT EXPEDITION PARITY** |
| Persistent world state and maps | Campaign and discovered-map persistence, regional objects, bridge repair, NPC consequence memory | Native character save plus separate durable crafted objects, movable furniture, fire, NPC reputation and canonical DM story ledger; native quests may reset | **PARTIAL WORLD/MEMORY SAVE**, no original campaign/map migration |
| Host controls | Chaos host tools including pause/moderation, campaign flow, private DM setup | Basic Fracture host/QR, spectator, bench/restore | **PARTIAL / not equivalent** |
| Licensed cohesive look and effects | Ninja Adventure/Kenney and custom Chaos art/effects/sounds | Fracture/BrowserQuest and its independently licensed assets | **VISUAL FOUNDATION REPLACED**; Chaos art not imported |
| Mac first-launch/QR | Original candidate Mac ZIP and setup; physical check pending | Separate Fracture source ZIP/launcher and QR; physical check pending | **SEPARATE TRIAL**, no parity claim |

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
