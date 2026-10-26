# Credits and licenses — Chaos Party 0.3 beta

## Reused gameplay mechanics

**Dungeonz**, copyright 2021 Johnathan "Arcan" Fisher, MIT. https://github.com/Gamessystem/dungeonz at `4f16ab19093ae4ce07d754d2e10690eeb202807b`. The production environment executes the original `WoodDoor.interaction` and `Entity.onDamage` code through authoritative-state adapters. Original entity inheritance and damage model are bundled in `public/vendor/dungeonz.js`; original sources remain in `experiments/dungeonz-world/upstream/`. Full notice: `public/vendor/Dungeonz-LICENSE.txt`. No mixed-license Dungeonz world artwork ships in the production tavern; its authored map is only in the isolated local extraction experiment.

**Foundry D&D5e**, copyright 2021 Andrew Clayton, MIT. https://github.com/foundryvtt/dnd5e . The actual `BasicDie.advantage` selection body is extracted by `scripts/build-game-foundations.mjs`, made synchronous (it contains no awaits), and run against deterministic PartyFrame dice. Original source: `vendor/dnd5e/basic-die.mjs`. Full notice: `public/vendor/DnD5e-LICENSE.txt`. No proprietary Foundry runtime or D&D content compendium is shipped. The remaining tavern rules and integration are game-specific, not the entire Foundry/D&D engine.

**ROT.js 2.2.1**, BSD-3-Clause, by Ondřej Žára and contributors. https://github.com/ondras/rot.js . Actual A* pathfinding routes actors around tavern furniture. Full notice: `public/vendor/ROT-LICENSE.txt`.

## Working framework code

**PartyFrame**, by Saleh Yusefnejad. MIT. Source: https://github.com/msynk/bomb-party at commit `e73cc35bfa561048cd9728991bafeeca5548e953`. The real PartySessionRoom runtime, protocol, client SessionConnection, clock, roster, validation, rate limiting and RNG are adapted and used. Full notice: `vendor/partyframe/LICENSE`; release copy: `licenses/PartyFrame-LICENSE.txt`. Changes are recorded in `vendor/partyframe/CHANGES.md` and `FOUNDATION_AUDIT.md`.

**Colyseus** core 0.16.24, schema 3.0.76, ws-transport 0.16.5 and browser client 0.16.22. MIT. https://github.com/colyseus/colyseus . This is the only live multiplayer transport.

## Original licensed artwork

**Ninja Adventure Update 8**, by Pixel-boy and AAA. Creative Commons CC0 1.0 Universal. https://pixel-boy.itch.io/ninja-adventure-asset-pack . Actual character, hair, garment and animation frames plus finite animated VFX are used by the creator and TV renderer. Original license, creator README, file hashes and frame contracts: `public/assets/ninja/`. The release includes `licenses/Ninja-Adventure-CC0.txt`. Small additional ears and accessories are original reusable overlays.

**Kenney Tiny Dungeon / Tiny Town**. CC0 1.0. https://kenney.nl/assets/tiny-dungeon and https://kenney.nl/assets/tiny-town . Scene tiles, NPCs, furniture, items and props. Original notices: `public/assets/kenney/dungeon-LICENSE.txt` and `town-LICENSE.txt`.

The creator palette choices, game-specific UI, deterministic tavern rules, crown objective, scene composition and moderation/save extensions are original work for this project. No graphics were extracted from DungeonBox. No generated image/video is requested during play.

## Other components

- qrcode-generator 2.0.4 — MIT. https://github.com/kazuhikoarase/qrcode-generator
- Zod 4.4.3 — MIT. https://github.com/colinhacks/zod
- Node.js 22.23.4 official Darwin x64 and arm64 binaries, checked against official SHA256 values. https://nodejs.org/dist/v22.23.4/ . Full Node license and third-party notices are included as `licenses/Node-LICENSE.txt`.
- esbuild 0.28.2 — MIT, build-time only. https://github.com/evanw/esbuild
- Synthesized Web Audio tones; system fonts and Georgia.

Installed dependency notices are collected in the release’s `licenses/THIRD_PARTY_NOTICES.txt`. Dependency versions are locked in package-lock.json. RPGJS was audited but is not bundled. No paid service or proprietary asset pack is required.
