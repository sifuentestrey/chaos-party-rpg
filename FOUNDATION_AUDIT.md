# Foundation audit and implementation record

Build 0.2.0, October 25–26, 2026. Actual source and asset files were downloaded and inspected before this decision. This document records what is running, rather than a proposed architecture.

| Foundation | Inspected version and license | Decision |
| --- | --- | --- |
| PartyFrame, `msynk/bomb-party` | Commit `e73cc35bfa561048cd9728991bafeeca5548e953`; framework packages 0.1.0; MIT, copyright 2026 Saleh Yusefnejad | Adopt its working server runtime, protocol, client connection, clock, validation, rate limiter, registry, schema and RNG. Register the tavern rules as a game plugin. |
| Ninja Adventure by Pixel-boy and AAA | Official Update 8 main asset pack, March 29/30, 2026; CC0 1.0; archive SHA256 `95a06f4fdcfd1882f061a45ff313b7c905dbe2de1e8512b281d7937df62a7b15` | Reuse original character frames, outfit/hair crops, palette channels, and animated VFX. Preserve the existing creator through a layered compositor. |
| RPGJS, `RSamaium/RPG-JS` | Commit `1284f277c06336b9b9870ac4b7c2e995971f1f77`; root package 5.0.0-beta.7, server package 5.1.1; MIT, copyright Samuel Ronce | Inspected and excluded from this vertical slice. Its separate room, sync, input, map and rendering stack would duplicate PartyFrame’s authority and our functioning presentation. |

## PartyFrame: actual reuse

Sources: https://github.com/msynk/bomb-party and its `docs/adding-a-game.md`.

The vendored source is in `vendor/partyframe/`. The production server’s `ChaosPartyRoom` **extends the real `PartySessionRoom`**. It calls the upstream room’s lifecycle, roster, registry, message validation, clock synchronization, session status, state projection, rate limiting, reconnection, metadata and controller-envelope code. Colyseus is the sole live multiplayer transport. The previous Socket.IO server is no longer active or shipped.

The browser uses PartyFrame’s actual framework-independent `SessionConnection`, `ClockSync`, and credential storage. It does not require PartyFrame’s React shell or Phaser renderer: the source explicitly separates the connection class from both. The existing readable controller UI and Canvas tavern renderer are preserved around it.

The shared deterministic engine is installed as a `PartyGame` named `chaos-tavern`, with an action schema, `start`, `handleAction`, `update`, player hooks, controller/public projections and a Colyseus session schema. Dice now use the reused PartyFrame `Rng`, with an explicit persistence extension. Scores are projected through PartyFrame’s player registry.

### Limits found and addressed

- Upstream has a hard ceiling of **8**. The vendored protocol and room capacity were adapted to **24**, and 20 real clients were tested against this runtime.
- Upstream keeps sessions in memory and expires disconnected player seats after its reconnection grace. We added durable character tokens/PINs and atomic campaign checkpoints; a restored campaign binds to a fresh Colyseus room without duplicating characters.
- A short-term network reconnect uses PartyFrame/Colyseus’s original reconnection mechanism and restores the same framework seat. A later reconnect after a process restart restores the saved character by durable token.
- The original host-role join policy was strengthened with the Mac’s host credential. The first phone is not allowed to control the session through either custom or native framework commands. Recovering a character revokes old device control on both paths.
- Accepted attempts retain idempotency receipts and a server sequence. A correlated acknowledgment channel was added around the existing action path so an interrupted acknowledgment cannot execute an attempt twice.
- Projection work is skipped when the game revision is unchanged. This avoids bumping the game projection ten times per second for an idle tavern.
- Framework methods used by the game extension were changed from TypeScript `private` to `protected`. Those changes are explicitly retained in the fork; this build is pinned to the inspected commit.

PartyFrame is a small 0.1 codebase, not evidence of large-scale production deployment. Its useful implementation was reused and then tested for this game’s specific requirements. Its native bot scheduler remains in the framework; the private browser practice mode’s five companions are explicitly scripted local bots.

## Ninja Adventure: actual artwork and animation

Source: https://pixel-boy.itch.io/ninja-adventure-asset-pack . The official GitHub Godot demo was also inspected at `6ac78232d5aedcc85ce5f27d060ea92366f7c24a`, but it contains older, limited example content. The full free Update 8 pack was obtained from the creator’s normal download flow.

Original selected PNG/WAV bytes and license evidence are in `public/assets/ninja/`, with per-file hashes, dimensions, frame contracts and provenance in `manifest.json` and `SOURCES.md`. Runtime rendering in `public/ninja.js` uses the actual PNGs: a Villager body/face, Villager3 hair texture, clothing crops from Villager3/Noble/SorcererOrange/Knight, and original slash, magic, fire, heal, smoke and other effect strips. It is called by the creator, portraits and TV scene.

The pack supplies complete characters, not separately layered customization parts. The compositor extracts reusable stock layers, recolors their documented palette channels, and combines them with small reusable ear/accessory overlays. All existing base, skin, hair, outfit and accessory choices remain functional. It does not generate a new image per player or per action.

The standard actor sheet uses 16×16 cells, four directional columns and seven pose rows. Walk uses real four-frame source animation. Attack, item, casting and knockout use source poses; the hit animation adapts the stock recoil/jump pose because this actor does not have a dedicated hit cycle. VFX use their original finite frame strips. Chibi proportions are preserved. Existing CC0 Kenney environment art remains useful and licensed.

## Why RPGJS is not combined with PartyFrame

Sources: https://rpgjs.dev/ and https://github.com/RSamaium/RPG-JS . The MIT license, package manifests, `RpgServerEngine.ts`, room contracts and map/input implementation were inspected.

At the pinned checkout, `RpgServerEngine` extends the `@signe/room` server and uses `@signe/sync`, a separate room registry and map/input lifecycle. The client stack adds CanvasEngine/PixiJS and RPG map, collision, movement and GUI systems. These are appropriate for a world-exploration RPG, but the brief uses text/action controllers around one shared TV scene. Installing that engine alongside PartyFrame would create two networking/state authorities and a second renderer without resolving an unmet prototype requirement. Its commercial Studio is unnecessary; no Studio account, generation credits, or paid hosting was created.

## Preserved work and proof

The first implementation’s game rules, crown-heist objective, creator UI, layered appearance choices, tavern layout, moderation, idempotency and durable-save semantics were preserved and adapted. A source checkpoint was retained before the framework migration. Transport, session handling, PRNG and actor/effect rendering now reuse the named foundations.

`npm test` exercises actual PartyFrame/Colyseus networking with 20 independent clients and the full server restart path. `node tests/ninja-render-check.mjs` renders the original asset bytes through Canvas and checks 78 appearance, pose and VFX cases. The packaged server and browser flow are checked separately. See `TEST_REPORT.md` for evidence and physical-device limits.
