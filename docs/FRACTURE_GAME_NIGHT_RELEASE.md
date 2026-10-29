# Chaos Party — Fracture game-night beta release tracker

October 29, 2026. Active branch: `spike/fracture-phone-tv`; issue [#12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12). No merge, public deployment, paid service, or original-game database change.

## Current acceptance

| Capability | Current evidence |
| --- | --- |
| Original Chaos preservation | `npm run verify` passes: offline tests, generated-output drift checks and static build. Original networking/data remain separate. |
| Separate phone actors | Real local Socket.IO server authenticated 20 distinct actors. Two browser phone contexts moved different actors. |
| Movement and personal cancellation | Shortest cardinal paths on the real map; cancellation families, per-actor ownership, no arbitrary phone MOVE/TELEPORT/HIT payloads. Runtime test confirms stable position after STOP and no cross-player cancellation. |
| Combat, damage and death | Real rat HP 29 → 0; player took damage; gold increased. Native combat handlers and formulas remain authoritative. No rat-stat nerf. |
| Interaction and equipment | Browser adventure passed NPC conversation, native quest offer, sword2 pickup and native equip. Scenery request truthfully blocked. |
| Travel | Real door `(27,209)` → Western Dwelling `(155,286)` → exit back outside. Travel to `(34,188)` entered Glitch Woods. No invented map. |
| Shared TV | Native Fracture renderer, automatic read-only spectator, follow selector, colored player sprites/names, full-screen control and corner receipts. QR only in the initial empty lobby; host QR always available. Final screenshot review pending. |
| Party pacing | Ten-second first declaration/reaction window; parallel actors, one committed declaration/reaction per player; movement/observation and personal STOP remain available. Native server combat randomness is retained; no new D20 system overrides Fracture damage. Timing regression checks pending. |
| Reconnect and recovery | Real reconnect retained account and saved position. Personal recovery links on private host page; passwords never reach phones. Native quest progress is session-scoped and can reset after restart. |
| Group capacity | Earlier 20-actor run exposed crowd blocking. After allowing native-valid player pass-through, 17/20 moved concurrently; remaining commands were blocked by terrain. The first endurance run failed at fifteen minutes because custom activity did not refresh Fracture's native idle deadline. The lifecycle fix now refreshes it for authenticated actor/TV activity; a regression test reproduces expiry and refresh with fake time. The final rerun is pending. No physical 12–20-player capacity claim. |
| Optional DM | Opt-in, existing-key-only Groq semantic fallback, strict grounding, short timeout, separate reused quota ledger; mocked off/429/timeout/invalid-target tests pass. Live provider quality/free-plan qualification not performed. |
| Mac delivery | Pinned, executable launcher reuses separate clone/config/database, caches unchanged builds for offline restart, and orders save → bridge stop → server stop. Actual launcher boot passed in Linux headless mode. Physical macOS launch/TV/iPhones not yet accepted. |

## Test evidence

- **Fracture:** pinned upstream `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`; latest full run: **70 files / 3,321 tests passed**. Server TypeScript and production client builds pass.
- **Focused adapter:** **19 tests passed**, including actual pinned-overlay refresh, refusal of local source edits, untouched config/database, parser families, path obstacles, identity isolation, AI fallback and ordered process shutdown. Node **22.23.4** focused tests passed (integration clone test separately run with `FRACTURE_TEST_ROOT`).
- **Original Chaos:** complete `npm run verify` passed without tracked generated-output drift; no original source changes.
- **Browser:** two phone contexts at 390×844 and TV at 1280×720. Real movement, rat death, loot/equip, conversation and door/forest flow; latest adventure reported no browser errors. Final release-build screenshots/recovery check pending.
- **Runtime:** twenty authenticated actors, concurrent movement, scoped interruption and real Socket.IO reconnect passed. Final soak/resource report pending; Linux measurements will not be presented as Intel Mac measurements.

## Remaining release gates

- [ ] Finish final 20-minute real-actor soak and record resource/latency measurements.
- [ ] Final browser screenshots, native quest completion/reward and recovered-phone check.
- [ ] Verify ordered launcher stop/restart saves and unchanged-build offline launch.
- [ ] Build source ZIP with SHA256/source ID and inspect it for accidental credentials or databases.
- [ ] Owner hardware acceptance: launch on 2015 Intel Mac, join two physical phones, move independently, attack/kill, STOP, visit a building and woods, reconnect, then try the family group while measuring responsiveness.

The target is a genuinely playable experimental beta. Hardware acceptance, a live creative storyteller, universal unsupported mechanics and a production-grade durable quest/campaign system are not claimed complete.

## Session continuation notes

The launcher now uses `party-bridge.mjs` and `apply-party-overlay.mjs`; historical one-actor files remain intact. New runtime modules live entirely under `experiments/fracture-phone-tv`. The separate disposable upstream checkout is `/workspace/fracture-chaos-beta` in this cloud session; it is not an original Chaos save location. Overlay edits are reconstructible and checked against the pinned base plus a hash manifest. The local QR library is MIT qrcode-generator 2.0.4; native upstream MPL/CC BY-SA notices stay in the clone.

A later lifecycle improvement also saves/logs out phones after 45 seconds of absence and defers saved-character login until the phone returns; the real-server presence/recovery check passed. Enemy minimum cooldowns are now extracted from the pinned native client rather than assigned one generic value.

Current final verification logs are in `/workspace/scratch`: `chaos-launcher-final.log` (private host link: do not publish), `chaos-runtime-load-release.log`, `chaos-runtime-report.json` (written on completion), `chaos-adventure-report.json`, `fracture-tests-final.log`, and `chaos-original-verify.log`. Publish only sanitized reports/screenshots, never room.json, launcher host URLs, database files or credentials.
