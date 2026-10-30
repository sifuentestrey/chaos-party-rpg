# Sanitized beta evidence — October 29, 2026

These are observations from a disposable Linux x64 cloud checkout, not physical Intel Mac measurements. No credentials, room files, databases, private host URLs or provider keys are included.

- `runtime-20-actors.json`: 1,200 seconds with 20 distinct real authenticated Fracture actors. All 20 moved concurrently in the opening check. Eighty observation batches retained 20 connected actors; HTTP batch maximum 191 ms. This uses lightweight headless Socket.IO actors, not twenty browser iframes. It is a synthetic capacity check, not certification of twenty physical phones or simultaneous twenty-player combat on the Mac.
- `tv-idle.json`: actual native TV connection held for 960 seconds, beyond the original 15-minute timeout, with no timeout packet, socket close or browser error.
- `adventure.json`: two recovered browser phones; NPC conversation, native rat quest completed 3/3 with actual reward, real damage/death, sword pickup/equip, grounded scenery rejection, building entry/exit and forest travel. Human game-night pacing/fun is not established by automation.
- `authority.json`: wrong key, cross-actor identity, expired action, invented damage, arbitrary teleport and replay rejected by the actual server.
- `presence.json`: cold launcher leaves saved actors logged out; absent phone saves/logs out; returning phone resumes the same character/position.
- `ordered-save.json`: actual launcher Control-C, save acknowledgment before server stop, SQLite quick_check and exact saved positions/gold/levels of active characters.
- `runtime-final-receipts.json`: short follow-up with the final smaller result payload; real actions/reconnect/cancellation still pass. The full endurance test preceded the later spectator visibility/install-only refinements; those have separate checks.
- `spectators.json` and screenshots: two actual TV connections receive explicit observer IDs, and the renderer hides spectator roles while keeping both real players visible. No browser errors; native website HUD hidden. `colors.json` confirms separate Blue/Rose phone joins and feedback above the fold.
- `cloud-resources.json`: 60-second server-only CPU/RAM sample while the 20-actor run and a TV were active: mean approximately 3.8% of one cloud CPU core, maximum approximately 226.4 MiB server RSS. Bridge RSS in the endurance run was approximately 100–110 MiB. This excludes browser RAM/CPU and must not be extrapolated to the 2015 Mac.

Final automated checks: pinned server/client production builds; 71 upstream/adapter Vitest files, 3,326 passing tests; 21 focused Node checks including the pinned checkout protection test; original Chaos `npm run verify`; extracted source kit on Node 22.23.4 (20 passes, one optional checkout test skipped); actual offline cached-dependency rebuild and unchanged-build restart. `offline-launch.json` records the isolated launcher verification. Private raw logs stay outside the source kit.

The first endurance attempt exposed the real native idle-timer integration bug at fifteen minutes. It was fixed by refreshing Fracture's existing activity deadline for authenticated custom activity, then the full 20-minute run passed. This is not an omitted failed gate or a claim based on twenty phones controlling one character.

Gameplay screenshots are derived from Fracture/BrowserQuest content and are shared under CC BY-SA 3.0. Attribution: George Larson; Mozilla; Little Workshop (Franck and Guillaume Lecollinet). See the parent README and package third-party notices for links and licenses.

## October 30 fusion milestone

- `fusion.json`, `fusion-tv.png`, `fusion-phone.png`: two fresh real characters through browser phone forms. Original Chaos server-D20 craft, wear, nearby gift, recipient wear, drop at the real actor tile, walk away, native auto-approach pickup, equip and phone reload. The TV uses colored wearable bands over native sprites; this does not claim bespoke hat art or native combat bonuses. No browser errors.
- `fusion-rally.json`: repeat of real native two-actor majority vote and engine-confirmed movement after combining the crafting changes with newer room/rally fixes.
- `fusion-restart.json`: actual launcher Control-C and restart; both native characters retained exact position, gold, level and gear, and crafted bags/component IDs/worn state matched before shutdown without duplicate starters.
- `fusion-load.json`: new 60-second, 20-actor check with object snapshots enabled; all twenty actors moved, scoped STOP/reconnect passed and all sampled actors stayed connected. This supplements the earlier 1,200-second baseline; it is not another twenty-minute run or physical Mac capacity evidence.
- Native full suite now **71 files / 3,329 tests**, focused Node checks **45/45**, production builds and original Chaos offline verification passed. The native consumable regression delegates to the real native inventory/health handler, including keeping healing items at full health; a browser consumption flow is not claimed. Optional creative AI plans were tested with mocked providers only.

The object adapter reuses original Chaos pure rules and dependency modules without starting its old network or generating its old maps. Separate durable character UUID ownership, failed-save rollback, no starter-item duplication and boundary/range checks have focused regressions. Derived screenshots retain the CC BY-SA attribution above.

The fusion change was rebased onto the newer experimental branch (room bench/restore, event buffering, LAN selection, action receipt fences, straight directional movement and local rally). Those changes were preserved. The combined build passed 45 focused checks, 3,329 native tests, production builds, and the real native two-actor majority-rally verification. The 60-second 20-actor report was rerun on that combined build. Original `public`/`src` rules were unchanged by the branch synchronization.

## Core-mechanics follow-through — October 30

- `core.json`: two actual phone browser forms, server D20 misses/successes, table movement and real native path blocking, ignite/extinguish, **burn-through on the server clock without further commands**, repair, real guard rug theft, remembered quest refusal, innocent second player, actual gift and restored native quest access. No browser errors.
- `core-visual.json`, `core-fire-tv.png`: fresh TV after fixing icon loading; custom table/rug/fire render independently of optional sprite availability. The first screenshot exposed a missing-prop render defect and was replaced only after correction and visual inspection.
- `core-native-dm.json`, `core-npc-tv.png`, `core-memory-phone.png`: final fresh launch; actual native NPC conversation reflects saved memory, appears in the native speech bubble and produces an offline DM receipt after completion.
- `core-restart.json`: actual launcher stop/restart preserves native positions/items, moved/repaired table, per-player NPC trust/action memory and canonical DM facts.
- `core-load.json`: new 60-second 20-actor run with reactive-world snapshots enabled; native independent movement, scoped STOP, reconnect and continued activity. Not a new twenty-minute soak or Mac certification.
- Original Chaos offline verification passed. Current focused checks **51/51**, native full suite **3,329/71 files**, plus final actor lifecycle regressions after NPC speech integration. Production client/server builds passed. Optional provider narration uses original Chaos instructions/validator and was tested with mocks; no live model or free-plan quality claim.

NPC learning is bounded durable witnessed-action memory/reputation, with real per-player quest-access consequences. It is not an AI training claim or all original NPC routines. Native painted scenery, original campaigns/characters, full advantage/reaction simulation and native character fire damage are not ported. All derived screenshots retain the attribution/license stated above.

Concurrent branch work added original MIT D20 crafting assistance. It was preserved during rebase, including its helper-source fingerprint and license. The combined source passes **54 focused checks**. `core-assist.json` and `core-assist-phone.png` prove two real recovered browser phones, nearby help during the reaction window, two server-owned D20 values, selection of the higher through the original helper, and one-shot consumption. Additional checks retain invalid-craft help and reject self-help, stacking, expiry, distance and dead helpers. The preceding core 20-actor run predates this assistance integration; the new assistance has its own two-actor gameplay proof.
