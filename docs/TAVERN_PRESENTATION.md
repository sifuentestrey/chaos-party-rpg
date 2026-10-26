# Playable tavern presentation pass

Run the real multiplayer server with `npm ci` and `npm start` (Node 22+).
Open `/host` on the server machine, create a private room, and join the displayed
room code from phone browsers on the same LAN. The TV layout activates above
900 CSS pixels; a 1280×720 host fills the screen with the existing Canvas world.
Enable sound using the speaker control. No paid API, account or deployment is used.
`npm run build` remains the separate solo preview, not a multiplayer release.

The server, Colyseus/PartyFrame connection, campaign storage, character identities,
class rules and creator remain in place. Presentation uses the existing Ninja
Adventure compositor, frame animations, effects and CC0 sound files. Declarations
approach the server-selected target immediately; the outcome drives the strike,
target recoil, licensed effect and return. These movements do not change positions
or results in authoritative game state. Reduced-motion users skip travel/recoil.

The existing renderer now sorts actors and furniture by floor position, uses
animated NPCs, adds hearth/window/woodwork details, and reserves the lower screen
for dialogue. The host's existing room, quest and chaos information sits at the
edges rather than shrinking the scene into a website column. Existing moderation
is available in Host controls. The phone creator and controller are preserved.

A longer browser playthrough exposed an existing recursive controller render:
controllerContent marked cooldown active outside the open phase, while
updateTimers cleared it and immediately rendered again. Both now use the open
phase condition. The six-round browser sequence covers the previously failing
transition between different players' declarations.

## Foundation decision and limits

Inspected Dungeonz commit `4f16ab19093ae4ce07d754d2e10690eeb202807b`:
`client/src/game/Game.js`, `entities/Sprite.js`, and
`entities/characters/Character.js`. Its MIT license is copyright 2021 Johnathan
“Arcan” Fisher. Its layered scene, directional sprite animation, and transient
effects are useful patterns. A separate Phaser 3.55.2 Canvas slice ran a tweened,
frame-animated shipped CC0 Knight above a prop. This was a compatibility proof,
not an execution of the complete Dungeonz RPG or an asset-license audit of its
entire distribution. No Dungeonz code or artwork was copied into this game.

The current game already has a working Canvas compositor and authoritative
Colyseus backend. Keeping them avoids a new runtime and preserves customization.
Godot NinjaAdventure is a different runtime; no engine migration was attempted.
The ZIP's recovery and hash are recorded in PROTOTYPE_IMPORT.md; the archive
itself was not attached to this machine. No claim of a new ZIP inventory is made.

## Repeatable checks

- `npm test`: rules, real 20-client transport/save/reconnect, and motion contracts.
- `npm run build`: existing solo build.
- `node tests/ninja-render-check.mjs`: 78 original-image compositor checks;
  see that script for the external Canvas test dependency.
- `node tests/tavern-browser.mjs`: real host and two isolated 390×844 browser
  controllers; creates a separate test campaign and records at least 90 seconds,
  six declarations with reactions/outcomes and screenshots. This script needs
  external Playwright (`PLAYWRIGHT_MODULE`), Chromium (`CHROMIUM_PATH`), and its
  ffmpeg runtime; these are test tooling, not gameplay dependencies.
  `CHAOS_TEST_ORIGIN` defaults to the local server on port 4747;
  `CHAOS_EVIDENCE_DIR` defaults to a temporary directory. Use a dedicated test
  data directory via `CHAOS_DATA_DIR` when running the server for QA.

Browser simulations do not meet the two-physical-phone gate. Physical TV,
iPhone Safari, audio listening and early-2015 Mac performance remain unverified.
The renderer retains the original approximate 30fps draw cap. The narrator is
still scripted/keyword-based. These changes are a presentation iteration, not
a claim that all QUALITY_GATES.md items have been completed.
