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
