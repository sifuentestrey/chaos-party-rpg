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
| Character identity and appearance | Name, customizable sprite, outfit, class, equipment, progression and recovery | Name + 4 color tints, native Fracture equipment/progression, recovery link | **NOT PORTED** customizable sprite/class/Chaos inventory and save identity |
| 12–20 simultaneous actors | Original PartyFrame/Colyseus with source-backed multiplayer/reconnect and tests | 20 synthetic Fracture actors, 2 browser controllers; real Mac group unverified | **ALTERNATE IMPLEMENTATION**, not retained original networking/authority |
| Free-form action + grounded planning | Chaos action proposal / native planner, object/capability validation, create/craft/transfer/ownership | Deterministic Fracture intent families with optional Groq semantic fallback; unknown actions rejected | **NOT PORTED**, partial narrow substitutes |
| Creative AI Dungeon Master | Optional narrator foundations; still **not qualified live** | Optional AI is semantic action parser only; no equivalent creative story/canonical memory | **NOT PORTED** |
| Dice, advantage, reactions, consequence rules | Server dice/rolls, advantages/disadvantages, 8–12s reactions and persistent consequences | Native Fracture combat RNG; 10s declaration window but no Chaos D20/advantage/consequence engine | **NOT PORTED** |
| Interactive scenery and physical actions | Material/ownership/containment/crafting, fire/damage/repair, moving tables, stolen objects | Native Fracture loot/chest/doors/combat; tent and other scenery explicitly immovable | **NOT PORTED** systemic interaction |
| NPC awareness | Chaos NPC goals, trust, witness, possession/theft memory; source-backed acceptance checks | Native Fracture NPC talk/quest, without Chaos trust and memory logic | **NOT PORTED** |
| Crown Job | Complete tavern heist with targets/clues, alternate tactics, state and ending | Absent; no equivalent imported campaign | **NOT PORTED** |
| Dawn Bell story / connected world | Seventeen scenes overall incl. woods, river/bridge, ferryman cave, town/inn, castle, vault, finale | Fracture town, dwelling, Glitch Woods and native rat quest | **NOT PORTED** |
| Major travel majority vote | Strict-majority approval documented/tested in original expedition | No equivalent travel-vote system in Fracture | **NOT PORTED** |
| Persistent world state and maps | Campaign and discovered-map persistence, regional objects, bridge repair, NPC consequence memory | Fracture native save: character position, HP, gear, level, inventory; native quest state may reset | **NOT PORTED** world/campaign persistence |
| Host controls | Chaos host tools including pause/moderation, campaign flow, private DM setup | Basic Fracture host/QR, spectator, bench/restore | **PARTIAL / not equivalent** |
| Licensed cohesive look and effects | Ninja Adventure/Kenney and custom Chaos art/effects/sounds | Fracture/BrowserQuest and its independently licensed assets | **VISUAL FOUNDATION REPLACED**; Chaos art not imported |
| Mac first-launch/QR | Original candidate Mac ZIP and setup; physical check pending | Separate Fracture source ZIP/launcher and QR; physical check pending | **SEPARATE TRIAL**, no parity claim |

## Correct shipping gate

The existing Fracture beta can be shared only as an **engine/integration playtest**. A passing Fracture test suite, 20 synthetic characters, and a functional Mac launcher DO NOT prove the original game or its story has been moved. Until migration is substantially complete, do not call this the finished Chaos Party game or claim gameplay equivalents.

**Two viable paths, to compare before doubling down:**

1. **Retain original Chaos as gameplay authority and improve its renderer/presentation using appropriately licensed Fracture/other proven techniques/assets**, preserving the 17 scenes, old characters/saves, action grammar, dice, world simulation, campaigns and AI plumbing. This may be the lower-risk way to keep existing investment, but engine/asset integration needs a bounded live proof.
2. **Continue Fracture as authoritative engine and port original Chaos game systems systematically** through a documented boundary: actors/saves/characters, action and dice contracts, world objects, owner/visibility, NPC attitudes, campaigns/scenes/travel votes, canonical persistence, AI narration. Each step must include a source→destination semantic parity test and visually observable end-to-end gameplay. **Do not** assume importing files makes Colyseus and Socket.IO compatible or that Fracture can implement arbitrary world mechanics without redesign.

**Recommendation pending a short architectural spike:** Protect both branches and **prioritize preserving what already exists**. Avoid yet another rewrite. Benchmark integration of one real, differentiating Chaos scenario on the chosen visual engine (e.g. move a table, steal a rug with real visibility/ownership/dice and persistence, and have an NPC react). If this cannot be reproduced efficiently in Fracture, keep the original rules engine and upgrade only visual/audio presentation instead.

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
