# Mechanics foundation audit — 2026-10-26

The owner wants existing gameplay foundations, not only reused networking and art. Custom prop expansion is paused pending a mechanics integration proof. No candidate below is integrated into production. Sources were inspected locally; full games were not run in this pass.

| Source | Actual code inspected | Finding and reuse boundary |
| --- | --- | --- |
| [Dungeonz](https://github.com/Gamessystem/dungeonz) | `server/src/entities/classes/statics/interactables/Interactable.js`, `breakables/Breakable.js`, `breakables/WoodDoor.js` | MIT root license, Johnathan Fisher. Working door checks active state and energy, deactivates, clears blocking, and reactivates only when unobstructed. **Much of breakable damage/repair is commented out.** Not a ready-made destructible-world foundation. Server package also declares ISC; resolve notice provenance before importing. |
| [Flare](https://github.com/flareteam/flare-engine) | `src/EventManager.cpp`, `src/Hazard.h`, source inventory | GPL-3.0-or-later engine. Event activation supports interaction, entry/exit and map load, with status/level/currency prerequisites and loot. Hazards represent attacks that affect creatures. Strong world-event reference, but C++/SDL is a major runtime mismatch with the current browser host. Not a D&D engine. |
| [Ancient Beast](https://github.com/FreezingMoon/AncientBeast) | `src/damage.ts`, `src/effect.ts`, package and license | Actual browser tactical game, AGPL-3.0 code; assets have separate terms. Typed damage, defenses, triggered effects, lifetimes and stacking. Suitable combat proof candidate, not automatically a fit for freeform tabletop play. Requires an explicit license-compatible integration decision before copying into the game. |
| [Foundry D&D5e](https://github.com/foundryvtt/dnd5e) | `module/dice/d20-roll.mjs`, `LICENSE.txt`, `README.md`, package | MIT software; SRD content has CC-BY-4.0 attribution requirements. Actual checks/saves/attack rolls, advantage/disadvantage and activity machinery. **Requires proprietary Foundry runtime APIs** (`CONFIG`, dialogs, base Roll), so the whole system is not a free standalone replacement. Most promising source to investigate for selective tabletop rules reuse; no paid Foundry purchase authorized or made. |

## Executed proof

Downloaded upstream source archives into `/workspace/chaos-foundations/` (GitHub git clone failed; codeload archives worked). Transpiled the **actual unchanged Ancient Beast `src/damage.ts`** using the project's installed esbuild, outside the game, to `/tmp/ancient-damage.mjs`. Imported that class with no Phaser/game runtime. With attacker offense 20/frost 10, target defense 10/frost 5, input frost 20 and pure 3, actual output was `{total:26,frost:23,pure:3}`. Assertion passed. This establishes extractability of one real mechanic, not that the full game runs or that it has been adopted.

## Decision

Do not describe the current game as based on an existing RPG rules engine. It currently reuses PartyFrame/Colyseus infrastructure and licensed artwork, while gameplay rules remain mostly custom.

Next integration gate: isolate a useful MIT tabletop rules component from Foundry D&D5e, inventory its runtime dependencies and attribution, and execute it against our authoritative seeded RNG with save/reload equivalence. In parallel scope, prove Dungeonz's actual door behavior against a minimal board adapter before claiming world-system reuse. If either needs most of its original runtime, reject the extraction rather than rewriting it and calling it reuse. Compare larger foundation changes only through isolated playable prototypes; preserve current multiplayer, characters and campaigns.

These candidates do not establish unlimited natural-language world simulation. Full gameplay and visual comparisons, physical-controller checks, and real Mac performance remain unverified.
