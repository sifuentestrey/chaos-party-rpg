# Codex handoff — Chaos Party experimental Fracture integration (October 30, 2026)

## October 30 update — verified reactive gameplay and current code gate

The earlier handoff below predates an independent **local Linux native/browser rehearsal** recorded at the top of `docs/FRACTURE_GAME_NIGHT_RELEASE.md` and in `experiments/fracture-phone-tv/evidence/README.md`. Do **not** repeat already verified work:
- Two real browser phone forms and a shared native TV exercised authored tree fire from dropped fuel, live second-phone refresh, coordinated extinguishing, unattended tree destruction, TV stump, and movement into the cleared tile; full launcher restart retained sidecar objects, native actors, NPC memories and DM facts.
- The latest documented **local Linux** checks were 165 focused tests, 3,329 pinned native tests, production client/server builds and original `npm run verify`. This is **not** a new GitHub Actions run or physical Mac acceptance. See the tracker/evidence for the exact test scope.
- Source-only safety hardening in commits `95587caa` and `0b6916b4` prevents caller overrides from changing validated authored scenery ID/kind/tile and rejects nonfinite durability/invalid wetness/fire states. Three local standalone Node checks passed against a reconstructed copy of the changed pure module; **the repository-wide tests and pinned CI have not been rerun at these commits**.

Next focus should be original Chaos campaign/character/creative action parity and measured physical Intel Mac game-night acceptance, not rebuilding the authored-tree demo. Preserve the strict branch/release gate below.


## Non-negotiable scope
- Read `AGENTS.md`, issue #12, `docs/CHAOS_TO_FRACTURE_PARITY.md`, and `docs/FRACTURE_GAME_NIGHT_RELEASE.md` before editing.
- Work **only** on `spike/fracture-phone-tv`. Protect original `luna/visual-game-night-release`, player saves, accounts, credentials. No merge, public deployment, spending, paid model, or physical-Mac acceptance claim.
- The Fracture adaptation is an **experimental technology demo**, not a migration of Crown Job, Dawn Bell, full character creator, classes, dice, AI memory, or majority voting.

## Verified native vertical slice — do not reimplement
Pinned native CI at source SHA `36de73fe69315d24eb9b1349a968195580ad8f15`:
https://github.com/sifuentestrey/chaos-party-rpg/actions/runs/41088458211
- Experimental tests: **153 passed, 1 skipped**; pinned Fracture native tests: **3,329 passed**; client/server built and disposable native HTTP boot succeeded.
- `verify-native-objects.mjs` controlled two real native actors, saw an authored tree, sent `attack tree` through the authenticated bridge (respecting reaction lock), reduced HP 12→0 in four strikes, observed broken state on the other actor, entered formerly blocked tile, and verified persisted sidecar save.
- CI produced Mac source kit artifact **12992099172**; not physically tested on the owner's Intel Mac, iPhone, or TV. GitHub artifact expiration **November 6, 2026**.
- Tree is an **explicit Chaos-authored overlay**, max four on passable native tiles near actor spawn areas, not destruction of Fracture's pre-existing native trees.
- Relevant files: `chaos-world.mjs`, `scenery-bridge.mjs`, `environment-rules.mjs`, `verify-native-objects.mjs`, `party-bridge.mjs`, TV overlay adapter, their tests.

## Priority next work (one vertical slice at a time)
1. **Actual browser TV + two-phone synchronization**: verify rendered tree/stump and SSE refresh after damage/destruction using a disposable server; test same room, two actors, no private inventory leaks, and a restart. Do not equate a compiled TV adapter with a rendered browser test.
2. **Native-world adapter boundary**: inventory Fracture's existing tile/object APIs and licenses. Add explicit opt-in registration for a *real* native door/furniture/tree only if Fracture safely exposes persistent object identity and collision invalidation; otherwise retain authored overlay and document the limitation. Never infer destructibility from visual tiles or rewrite upstream assets indiscriminately.
3. **Consequences**: connect one weather/fire/water rule to an authored object with authoritative ticks, bounded propagation, persistence, client synchronization, and NPC reaction; preserve native HP authority and anti-cheat validation.
4. **Feature parity over breadth**: restore actual original Chaos gameplay (campaign, character creation/classes, creative actions, D20/reaction, memory, voting, saved progression) rather than adding dozens of superficial environmental categories.
5. **Performance/acceptance**: 12–20 simultaneous phones, reconnect and latency measurements on owner's hardware; ask owner for physical Mac/iPhone/TV acceptance only when a tested source kit is ready.

## Verification and gates
- Experimental tests: `node --test --experimental-strip-types experiments/fracture-phone-tv/*.test.mjs` (Node 22+).
- Original game: `npm run verify`.
- Pinned native workflow must build Fracture client/server, run upstream tests, boot native server, exercise `verify-native-objects.mjs`, and produce a credential-free Mac source kit.
- The exact commit must be tested; if CI was run on an earlier SHA, do not transfer its pass status to later changes.
- Maintain both tracker documents with test evidence, run URL, commit SHA, remaining gaps, and honest release gate status.
- No claim of physical Mac acceptance without an actual owner test.

## Existing known limitations
Native Fracture scenery, buildings, rivers, weather, terrain deformation, NPC HP environmental hazards, 12–20-player performance, actual browser/TV rendering, and full original campaign/character/AI parity are **not** proven. Pure `environment-rules.mjs` has capability definitions but is not a native physics integration. Preserve separation of Chaos sidecar state from Fracture's authoritative map and combat.
