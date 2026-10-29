# Chaos Party — October 29 game-night release tracker

> **Owner directive:** finish the strongest honestly playable Fracture-powered family game-night beta today. This tracker is not a claim that the game is finished. Codex's active implementation acceptance and work order is [issue #12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12); coordination draft [PR #11](https://github.com/sifuentestrey/chaos-party-rpg/pull/11).

## Current verified baseline (as of owner Mac/iPhone test, October 29)

| Feature | Evidence / status |
| --- | --- |
| Old Chaos source and data preserved | YES — work confined to `spike/fracture-phone-tv`; original `luna/visual-game-night-release` unchanged |
| Fracture upstream fetched and built on Intel Mac | YES — Node 22, pnpm 10; dependencies installed, server/client ran |
| Private host / LAN phone joins | YES — owner displayed host and connected an iPhone on Wi-Fi |
| Phone command can trigger game action | PARTIAL — owner confirmed `attack the rat` had an effect |
| Real, repeatable hit and death | UNVERIFIED — owner reports rat barely lost health |
| Directional movement and STOP | FAIL — `move left` and `stop` not handled in existing adapter |
| Real scene/environment action | FAIL — `move the tent` did not work; identify whether tent exists/movable |
| 2+ independent phone characters | NOT IMPLEMENTED — current version has one TV character receiving actions from shared phone link |
| 12–20 independent family players | NOT IMPLEMENTED OR LOAD VERIFIED |
| Full-screen shared TV/world/camera | NOT ACCEPTED |
| Quest/interaction/scene transitions | Fracture provides these in native game; not end-to-end validated through phone actions |
| Creative AI DM | NOT WIRED for Fracture; optional and no unapproved costs |
| Game-night release | NOT READY |

## Release gates — must be evidenced, not assumed

- [ ] **1. Core action loop:** phone commands move, stop, talk, pick up, fight, exit/enter. Grounded success/failure acknowledgment. Real enemy HP damage/kill, no fabricated outcomes. Server validations intact.
- [ ] **2. Individual players:** two separately paired phones control two different authenticated actors, simultaneous visibility on a shared TV, no credentials in phone URL, no cross-control, reconnect works. Then scale test.
- [ ] **3. Party interaction:** action/reaction race timing with immediate personal STOP, dice resolution and persistent consequences without 20-person serialized waiting.
- [ ] **4. World flow:** one enjoyable 20-minute path through existing areas and NPCs, ending with a real consequence/reward; *free exploration*, no forced Crown Job, no fake props.
- [ ] **5. TV/phone UX:** 16:9 full screen with minimal overlay; QR in lobby; action log and clear phone input/response.
- [ ] **6. DM fallback:** optional approved free AI interpretation (if configured), safety/grounding; works with AI off and under slow/429 conditions.
- [ ] **7. Quality:** reproducible pinned build, offline/unit/integration/browser checks, two independent controllers, restart/load, synthetic 12–20 concurrency and measured resource usage on 2015 Intel Mac. Do not infer physical performance from CI.
- [ ] **8. Mac install:** one-click downloadable rehearsal artifact, SHA/source ID, no destructive overwrite or foreign credential leakage, owner confirmation from physical TV/phones.

## Rules

- No merging PR #11 or changing `main` / `luna/visual-game-night-release` until owner explicitly accepts real gameplay.
- Preserve MPL 2.0 source and CC BY-SA 3.0 assets and credits; audit third-party art provenance.
- Keep Fracture Node/Socket.IO/SQLite separate from legacy Chaos Colyseus/data. Do not paste entire frameworks together or disable combat/range validations.
- Never claim a test passed without logs. No paid APIs, surprise hosting, user credential exposure, new accounts without need, or deployment.
- Keep this table updated as evidence appears and report first failed acceptance quickly.

**If today runs out:** report the smallest fully verified playable beta plus exact unimplemented requirements; don't label the original one-character bridge a finished multiplayer game.
