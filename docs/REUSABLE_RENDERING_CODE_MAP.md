# Actual reusable code locations — Dungeonz and PartyFrame

**Read before coding.** Verified paths in public repos on 2026-10-25. These are reference entrypoints, **not yet integrated or executed**. Reuse only suitable source under applicable license, keeping origin notices; audit per-asset rights.

## Dungeonz: browser Phaser RPG, candidates for targeted adaptation
- `client/src/game/Boot.js`: **real Phaser preloader**. Loads packed animated sprite atlas `game-atlas.png` + `game-atlas.json`, ground/statics 16px spritesheets, audio through `SoundManager`. Do not blindly import its bundled game art without confirming each contributor's license.
- `client/src/game/Game.js`: actual `class Game extends Phaser.Scene`, entities, authoritative render depth ordering `ground:1, statics:2, dynamics:3, particles:4, darkness:5, borders:6, fpsText:7`, animation setup per entity type, fullscreen target and resize handling.
- `client/src/game/Tilemap.js`: actual tiled layers using Phaser blitters (ground, darkness) and sprite containers, time-of-day alpha, flicker. Many routines are tied to `PlayerState.row/col` and camera movement, so **adapt rather than copy wholesale** for a fixed multi-actor tavern scene.
- `client/src/game/entities/Sprite.js`: lightweight `Phaser.GameObjects.Sprite` wrapper referencing global scene/atlas.
- `client/src/game/entities/characters/`: dozens of real player/NPC archetypes plus `Character.js`, `Player.js`, `Clothes.js` for layering possibilities. Audit `Clothes.js` to determine whether customization can be reused.
- `client/src/game/SoundManager.js`: ready-made **sound/music management** with crossfade, footsteps, punch, weapon equip and spell effect hooks. Favor code patterns, not blindly copying audio without asset rights.
- `client/src/network/`: websocket client intentionally **not** preferred if PartyFrame already has reliable Colyseus networking.

### Major version warning
Original Dungeonz client uses `phaser ^3.55.2`, `react ^17.0.1`, `react-scripts 4.0.1`, `node-sass ^4.14.1`. Its server uses MongoDB/Mongoose 5 and `ws ^7.4.6`, based on inspected package files. Those are **older dependencies**. Do NOT install or replace the working PartyFrame backend just to reuse map scenes or animations. Security/compatibility migration and resource effort may dwarf the visual benefits. Run dependency-audit in an isolated environment before considering their use.

## Ninja Adventure: complete visual logic reference, not a drop-in runtime
- `project.godot`: actual Godot v4 project with 1280x720 viewport, max FPS 60, pixel-snapped texture drawing, **Forward Plus** renderer. Browser export on 2015 Intel Mac not proven; render path may need Compatibility changes.
- `world.gd`: actual scene orchestration for music, weather, fog, lighting gradients, camera transitions.
- `system/character/character.gd`: character movement/velocity and animation state switching.
- `content/character/`: sprite/character folders and PNG assets. The itch asset pack is CC0 and is preferred source for redistributable art.
- The public repository is a Godot **example game**. Running it as a TV host might be visually strong, but it would demand a new bridge to PartyFrame or its replacement. Avoid swapping engines before a tested visual/phone prototype proves benefit.

## PartyFrame: preserve existing phone-session runtime
- `partyframe/packages/runtime/package.json`: Colyseus `@colyseus/core 0.16.24`, schema `3.0.76`, TypeScript build and typecheck.
- `apps/web/`: React + Phaser host and phone UI, to verify after receiving original Work fork.
- Root `package.json`: `test`, `test:e2e`, `smoke` scripts; don't cite them as passing until run.

## Prioritized narrow visual extraction task
1. Open the *actual delivered Work ZIP* and identify its Phaser version, canvas host renderer and pixel sprites import.
2. Test borrowing Dungeonz **sprite/actor animation architecture and rendering depth** in a *separate branch*, while using CC0 sprites/maps and SFX from Ninja Adventure. Avoid importing incompatible third-party bundles.
3. Prove one real character action with actual animation, motion and target reaction on TV, with the existing PartyFrame phone controller. Stop and review screenshot/video before proceeding.
4. Only after successful proof, expand outfits, classes, map variety and NPC count. Do not implement from scratch when a functioning module already exists.

## Verified upstream links
- https://github.com/Gamessystem/dungeonz/blob/master/client/src/game/Boot.js
- https://github.com/Gamessystem/dungeonz/blob/master/client/src/game/Game.js
- https://github.com/Gamessystem/dungeonz/blob/master/client/src/game/Tilemap.js
- https://github.com/Gamessystem/dungeonz/blob/master/client/src/game/entities/Sprite.js
- https://github.com/Gamessystem/dungeonz/tree/master/client/src/game/entities/characters
- https://github.com/Gamessystem/dungeonz/blob/master/client/src/game/SoundManager.js
- https://github.com/pixel-boy/NinjaAdventure/blob/main/project.godot
- https://github.com/pixel-boy/NinjaAdventure/blob/main/world.gd
- https://github.com/pixel-boy/NinjaAdventure/blob/main/system/character/character.gd
- https://github.com/msynk/bomb-party/blob/main/partyframe/packages/runtime/package.json
