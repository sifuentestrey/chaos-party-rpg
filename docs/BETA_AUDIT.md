# Beta acceptance audit — October 26, 2026

This is a playable **0.3 beta candidate**, not a claim that every original hardware/subjective acceptance gate is complete.

| Owner requirement | Implemented and observed | Remaining limit |
| --- | --- | --- |
| Preserve the existing game | Existing PartyFrame/Colyseus authority, character creation, tokens/PINs, campaigns and host controls retained. Old campaigns initialize object state lazily. | The owner's actual Mac campaign file is unavailable and was not touched. |
| Reuse existing games and mechanics | Actual Dungeonz door/entity-damage methods run in production; actual Foundry D&D5e advantage-selection body runs on seeded dice; actual ROT.js A* routes actors around furniture. Existing Ninja Adventure sprites, poses, effects and sound remain. | These are explicit source extractions with compatibility adapters, not a whole borrowed RPG engine. |
| Reuse an existing world | Dungeonz's unmodified tutorial map and original door class hierarchy run in the isolated playable world extraction. | Its mixed-license artwork is not shipped in production pending asset-level clearance. Production tavern uses cleared CC0 assets. |
| Reactive environment | 46 registered objects cover rug, four tables, seven barrels, eight chairs, shelves, bottles, sideboards, candles, lamps, fireplace, windows, chest, door, chandelier, sign, beams, bunting, floor and wall. Shared rules persist taking, breaking, shifting, opening, lighting, extinguishing, spills and repairs where supported. | Objects have defined affordances. This is not unrestricted physical simulation; individual decorations on a grouped shelf/table follow that fixture. |
| Meaningful RPG play | Material-dependent checks, class training, help/intervention, actual advantage/disadvantage selection, dim-light stealth, guard distraction, NPC HP, cover, hazards and fire progression. Easy interactions skip dice. Unsupported attempts report a limit instead of awarding fake progress. | Local intent parser, not a generative DM or full D&D 5e implementation. |
| Visible actions | Actor paths avoid intact furniture. Object state directly controls visible flame/light, furniture, debris, spills, taken items and open doorways. NPCs react and can be knocked out. Victory moves/fades the party through the exit. | Old Mac animation/GPU smoothness still needs actual hardware. |
| Playable heist | Real multiplayer host and two independently created browser controllers completed clues → risky crown theft → party escape. Screenshots and full gameplay recording captured in `artifacts/beta-release/`. Prior corrected run recorded 124.56 seconds. | Browser controllers are not two physical phones. |
| Concurrency and saves | 33 automated tests pass, including an actual 20-client race with 19 reactions, stale-device revocation, reconnect, PIN recovery, restart, and persistence of an opened door to another observer and after restart. | Real LAN/router behavior remains unmeasured. |
| Character customization | Original asset render checks pass 78 cases: 37 appearance, 28 pose, 13 effects. Existing creator retained. | Visual distinctness of a room full of human-selected similar appearances remains a playtest question. |
| Runnable delivery | Self-contained Intel/Apple Silicon Mac package uses official Node 22.23.4 archives checked against SHA-256. Bundled server smoke-tested outside the repository without local node_modules. A branch-specific GitHub workflow produces the downloadable Mac artifact. | Actual macOS launcher, audio and OS prompts are not executable on this Linux worker. Workflow outcome must be checked separately from local packaging. |

## Audit fixes made before delivery

- Hiding initially expired before the following guard sweep. Cover now persists until the actor's next declaration, including save/reload.
- The generic fallback could report invented success and award coins. Unsupported attempts now fail explicitly without coins, XP or clues.
- A heavy-object feasibility rule accidentally made crown theft automatic. A dedicated regression preserves the crown's risky DC 13 check.
- A removed rug could briefly redraw on a later failed attempt. Visibility now comes from persistent object state; repeated theft identifies the missing rug.
- The party initially remained in the room after victory. The ending now visibly takes them through the doorway.

## Performance evidence and limits

Cloud Chromium CPU-only draw microbenchmark with 24 characters: initial 160-frame sample mean 7.95 ms, p95 56.8 ms; warm 180-frame sample mean 8.54 ms, p95 47.6 ms. These are synchronous Canvas CPU measurements, not end-to-end FPS, GPU results, or a 2015 Mac benchmark. A subsequent benchmark paced by actual requestAnimationFrame (20 warm-up + 180 measured frames, 24 characters) measured mean CPU draw 1.50 ms, p95 3.0 ms, mean frame interval 17.13 ms and p95 16.7 ms. The earlier tight-loop samples queue draws without presentation and should not be read as real frame pacing. These cloud results still do not clear the target Mac. The two-controller recorded playthrough was inspected separately.

## Physical acceptance still required

Two actual controllers completing the loop; early-2015 Mac CPU/GPU/frame pacing; TV overscan/readability; LAN QR access and reconnect; audio output; and whether a family finds the 90-second sequence enjoyable. These cannot be honestly signed off from this cloud machine. Outdoor chapters remain future scope as originally requested.
