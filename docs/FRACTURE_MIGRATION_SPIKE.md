# Chaos Party -> Fracture: isolated migration spike (OWNER-DIRECTED, 2026-10-29)

**STATUS: started as an investigation only. NO Fracture code has been imported, run, adapted, or verified locally. This is not a completed migration.**

## Authority and branch ownership

- **Old Chaos Party implementation and saves:** `sifuentestrey/chaos-party-rpg`, branch `luna/visual-game-night-release`. Treat as immutable source/reference during this spike. Preserve its commit history and the packaged release. Its legacy `START_HERE.md`, `AGENTS.md`, dated milestone checklists, and issue #9 describe the previous implementation. Do NOT resume their old development backlog.
- **New integration experiment:** same repository, branch `spike/fracture-phone-tv`, created from Chaos commit `639808b1134e2ff791529d11c6ab181d682f01fe`. This document and the topmost notice in this branch's `AGENTS.md` override old task instructions for this branch only.
- **Potential new RPG foundation:** upstream `georgeglarson/Fracture`, branch `master`, inspected at commit `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`. Its source, protocol, player database, map, assets, account passwords, and licensing are NOT Chaos Party's existing source/state.
- **Do not merge or rename `main`, switch production, deploy, delete branches, publish family saves, or overwrite the packaged Mac release.** Any playable import/large replacement awaits a verified proof-of-concept and owner acceptance.

## Why we changed course

The owner did not ask for another bespoke RPG engine. They want **an existing, genuinely playable RPG world** with recognizable environments, NPCs who talk and react, character movement, enemies, combat, doors and traversal, on the TV; **Chaos Party's twist** is 12-20 people using phones to submit free-text actions with first-accepted-action and reaction timing and an AI Dungeon Master. Build *on* a playable game's engine; do not reconstruct its world, animations and combat with random shapes.

2026-10-29 owner playtest blockers in old prototype:
- TV not full-screen: QR codes, heist panels, 'Tavern Chaos', mechanical turn copy occupy the screen.
- Spoils objective at startup ('Crown Job'); forces crown completion before truly leaving the tavern; owner wants free exploration.
- Phone is verbose: 'Commit to the Bit', 'floor is open', suggestions, 'Interact with Room', 'The Job', confusing object lists. Simplify to character + text input + Send; inventory and PIN secondary.
- After 'tackle the fiddler', character didn't move. Show typed intention above actor, animate approach/action/hit/miss/response.
- Actions vanish; keep tiny unobtrusive last 2-3 event log, history accessible.
- Moonlit Clearing/Ruins/Silver Marsh look like the same scattered placeholder scene; irrelevant location objects appear to follow character.
- 'Attack the crow' fails despite visible Briar Crow. Resolve aliases/natural references and make enemies react.
- Combat pacing (turn-based vs simultaneous) not yet decided; do not force individual 20-player turns.

## What is worth transferring, and what is not

Transfer **behavior/interface contracts, not wholesale old engine internals**:
- **KEEP/ADAPT:** Chaos's phone room code + controller UX, unique identity/reconnect concept, action first-lock and 8-12 sec reaction window, dice fairness/authority, AI interpretation and narration rules, owner-oriented game-night flow, compact recent events.
- **INTEGRATE THROUGH AN ADAPTER:** translation of validated phone intentions into Fracture's permitted movement/interaction/combat actions; single shared-TV spectator/camera rendering; event projection; joining and linking sessions to Fracture players.
- **DO NOT BLINDLY TRANSPLANT:** Chaos Colyseus/PartyFrame networking into Fracture Socket.IO; old Crown Job story/quest restrictions; old Canvas tile renderer/world generation; JSON save format into Fracture SQLite; old avatar sprite IDs into Fracture sprites; old item IDs into Fracture item IDs.
- **NEVER** make a phone controller able to impersonate another player's server actor, trust text from an AI as an authoritative state mutation, expose Fracture account passwords or Chaos recovery credentials, or turn off existing anti-exploit/range rules just to make a demonstration pass.

## Confirmed upstream technical touchpoints (read-only inspection of pinned source)

- `client/ts/player/interaction-controller.ts`: existing `makePlayerGoTo`, `movePlayerInDirection`, `makeNpcTalk`, `makePlayerAttack`; uses game pathfinding/map/camera context.
- `client/ts/game.ts`: connects interaction controller, entity manager, map, player, renderer, network client and pathfinder.
- `server/ts/player/message-router.ts`: server Socket.IO message dispatch, validated `MOVE` with maximum three tiles/message and `isValidPosition`.
- `server/ts/player/combat.handler.ts`: validates melee proximity and applies real mob damage. Must remain authoritative.
- `server/ts/player/auth.handler.ts`: character names/password-based login + stored state; **must not expose credentials in QR or phone UI.** Need a secure binding strategy.
- `server/ts/player/venice.handler.ts`: NPC dialogue, quest/narrator and static fallback integration. Live provider is off by default; no claim that live AI is functional.
- `client/ts/network/gameclient.ts`: `Socket.IO` client message handling.
- `package.json`: pnpm, Node/TypeScript, better-sqlite3 native dependency; expected startup around port 8000, not Chaos's 4747. Hardware/Node compatibility needs checking.
- Fracture `LICENSE`: code MPL 2.0, content CC BY-SA 3.0. Upstream BrowserQuest heritage and any third-party art need a provenance and notices audit before copying/redistributing. No automatic permission to relicense art.
- Fracture README currently describes a post-apocalyptic RPG modernization and claims a playable demo and 3,198 tests. Those claims are **not independently validated by this spike**. Visual fit for a fantasy party game remains an owner acceptance gate.

## Work plan: smallest useful integration proof, then decide

### Phase 0 — Verify existing game without modifying either codebase
1. In a **separate sibling working directory**, clone pinned Fracture, record commit hash and license inventory; do not place Fracture directly under Chaos `public/`, `src/`, `vendor/` or `data/`.
2. Check Node/pnpm/macOS requirements and license provenance. Run upstream tests/build offline if dependencies are available. Do not assume an older Intel Mac can run `better-sqlite3` without verifying.
3. Run on loopback with disposable accounts/database, no AI keys, no paid providers or public deployment. Verify existing click-to-move, NPC interaction, enemy aggro, battle and map transitions. Obtain actual 16:9/phone observations.
4. If source cannot be cloned/dependencies cannot be installed in this execution environment, **report precisely and stop**; do not call it tested or move on to speculative porting.

### Phase 1 — ONE thin vertical slice
1. Implement *separate* prototype code (prefer in an isolated experimental directory or independently cloned upstream worktree) that binds one authenticated phone player to exactly one Fracture character.
2. Phone sends a plain action (e.g. 'walk to the goblin' or 'attack that goblin'). Resolve a nearby visible target securely. Movement must use Fracture's existing pathfinding and validated incremental move protocol; attack uses its actual combat flow and range checks.
3. TV shows actual character walking, attacking; NPC/mob responds; a two/three-line small action log appears. **No fake sprite movement or narrator text substituting for effects.**
4. Test two controllers, no cross-control; test reconnect and wrong actor; verify action acknowledgments and at least one blocked action.
5. Reuse the old first-lock/reaction mechanism only after the core movement/combat demo is convincing. Add AI only after deterministic outcomes and structured target binding are sound.

### Phase 2 — Gate and decision
- Owner evaluates the demo against a 90-second sequence: join by phone -> enter full-screen scene -> approach and attack visible enemy -> NPC reacts -> leave building -> enter visually distinct next area; two phones stay consistent.
- If Fracture is a poor artistic or technical fit, **stop and propose a different playable base** without attempting a large import. Do not spend more time adding generic RPG features.
- Only after owner approval: stage proper Fracture fork/source integration with full attribution, tests and migration strategy. Existing Chaos repo remains a backup.

## Repro/commands for an environment that actually has GitHub network access

```bash
# Run OUTSIDE your existing Chaos Party working tree.
git clone https://github.com/georgeglarson/Fracture.git chaos-party-fracture-upstream
cd chaos-party-fracture-upstream
git checkout 642c00a8a2d3a95979e85bbfa3f62deee611a4a6
git rev-parse HEAD
node --version
pnpm --version
# After checking scripts and dependencies:
pnpm install --frozen-lockfile
pnpm run build:server
pnpm run build:client
pnpm test
pnpm start
```

Never source old Chaos `.env` or place any real family/player credential in Fracture's environment. Keep their databases separate.

## Evidence / nonclaims

This spike's initial codebase inspection was read-only via GitHub. It verified *source paths* and upstream metadata, not functional runtime behavior. The current ChatGPT container cannot resolve github.com for git clone, so no Fracture build, live game, or two-phone test occurred here. The existing Chaos source and saves are unchanged.

**Codex handoff**: Switch intentionally to `spike/fracture-phone-tv`; read this document and the top notice in `AGENTS.md` before making changes. Do not continue old milestone prompts. Preserve `luna/visual-game-night-release` as a read-only reference. First report the upstream game baseline and a working movement/interaction test, not a new feature list.
