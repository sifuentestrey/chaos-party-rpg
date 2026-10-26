# Source-level foundation audit — 2026-10-25

This audit inspects actual public source files, not merely project descriptions. **It does not claim any candidate was run or visually benchmarked.** The actual Work-created `Chaos_Party_Mac.zip` is not accessible from this chat, and the preview URL (`https://chaos-party-tavern.treysif.chatgpt.site`) could not be fetched.

## What source inspection established

| Candidate | Inspected evidence | What is genuinely reusable | Cost / risk |
|---|---|---|---|
| **PartyFrame** [source](https://github.com/msynk/bomb-party) | `package.json`, `partyframe/packages/runtime/package.json`, `README.md`, MIT `LICENSE` | Running Colyseus 0.16.24 runtime, protocol, room lifecycle, TV/phone connection and tests. Root package has `pnpm build`, `test`, `test:e2e`, `smoke`. | This is not a pixel fantasy RPG. *Keep existing networking if the delivered Work fork really uses it.* Its upstream root is still a relatively small framework. |
| **Ninja Adventure** [source](https://github.com/pixel-boy/NinjaAdventure), [CC0 art](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | Godot 4 `project.godot`, `world.gd`, `main.gd`, `system/character/character.gd`; `content/` and `system/` folders | Actual game/world scenes, actors, movement/animation logic, weather (rain, snow, fog), lighting, music, camera transitions, maps. Configured 1280×720, 60 fps, nearest-neighbor/pixel-snapped drawing. Art-pack assets CC0. | This is **GDScript/Godot**, while PartyFrame is **TypeScript/Colyseus/Phaser**. Copying its Godot code into the Phaser game will NOT work. Godot 4 project uses `Forward Plus`, which may require modification for web and Intel Iris 6100. Code license must be established independently of the CC0 art pack. |
| **Dungeonz** [source](https://github.com/Gamessystem/dungeonz) | `package.json`, `client/package.json`, `server/package.json`, `DEPLOYMENT.md`, MIT `LICENSE` | Actual browser multiplayer RPG; Phaser **3.55.2**, sprites packed by `free-tex-packer-cli`, React UI, websocket server, existing maps/items/game structures. Likely the nearest stack for reusing game mechanics with PartyFrame (both browser JS and Phaser). | Uses **React 17**, **react-scripts 4**, **node-sass 4.14.1**, MongoDB/Mongoose 5, `ws` 7, old dependencies. Rebuilding whole game may require dependency migration and security repairs. Contributor art rights need auditing. Don't simply copy all visuals. |
| **Source of Mana** [source](https://github.com/sourceofmana/sourceofmana) | Top-level `LICENSE.md` | Actual Godot 4 RPG and UI, code under MIT; may serve as visual/UX benchmark. | Art uses CC BY-SA 4.0 requiring share-alike/attributions. Godot-vs-Phaser mismatch. |
| **RPGJS** [website](https://rpgjs.dev/) | Not source-audited this session | Possible conventional RPG mechanics if a replacement is justified | Another complete engine likely duplicates PartyFrame's roles. |
| **Reverse Engineer Anything** [source](https://github.com/morluto/rea) | Public README from its official repo | Helps analyze binaries, JS/apps when permitted; Codex-compatible | Not a source-code license nor a replacement for actual existing source. No reason to run on DungeonBox when MIT projects already expose code. |

## Revised engineering hypothesis — **test before implementing**

**First choice to test:** Keep the (reportedly) functional PartyFrame/Colyseus 20-person room and existing saves from Work. Improve the TV scene with *actual* existing Ninja Adventure CC0 sprite sheets / map art using Phaser rendering. Don't import Godot components into Phaser. Improve phone controller styling separately.

**Alternative spike:** Borrow *specific existing Phaser rendering/mapping/animation code* from Dungeonz, not its entire server/account system. Inspect the code module-by-module for license and dependency concerns. Test that a small slice renders in the already-working PartyFrame TV shell.

**Fallback:** Investigate an end-to-end Godot-based variant only if both small visual spikes fail. The new Godot hosting/runtime and browser compatibility could require more work than improving a Phaser scene. Don't migrate simply because a screenshot looks good.

## Must validate before choosing
1. Obtain user-owned Work ZIP and archive its exact bytes/sha256; do not commit secrets or dependencies.
2. Run the Work original; capture *actual* video and screenshots of both host and phone; inspect which asset frames/animations are actually imported. Compare its behavior against the narrated TV-first gameplay requirement.
3. Extract one existing tavern backdrop and sprites under lawful licenses. Make one visible actor perform an expressive action (lunge / impact / knockback / reaction) **without generating it from scratch**. Benchmark host on real Mac if available.
4. Compare a tiny **existing Phaser code** visual spike from Dungeonz versus a **Ninja CC0 sprite** spike; choose by actual responsiveness, visual cohesiveness, ease of reuse.
5. Character creator: layered sprite appearance not merely palette-colored dots; do not promise infinite clothes/hair unless existing sheets support it or compatible licensed layers are obtained.
6. Require user-visible 90-second recording showing fun, *not just a green test run*.

## Evidence links
- https://github.com/msynk/bomb-party/blob/main/partyframe/packages/runtime/package.json
- https://github.com/pixel-boy/NinjaAdventure/blob/main/project.godot
- https://github.com/pixel-boy/NinjaAdventure/blob/main/world.gd
- https://github.com/pixel-boy/NinjaAdventure/blob/main/system/character/character.gd
- https://github.com/Gamessystem/dungeonz/blob/master/client/package.json
- https://github.com/Gamessystem/dungeonz/blob/master/server/package.json
- https://github.com/Gamessystem/dungeonz/blob/master/DEPLOYMENT.md
- https://github.com/sourceofmana/sourceofmana/blob/master/LICENSE.md
