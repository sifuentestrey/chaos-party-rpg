# First playable prototype — v0.2 test report

Tested October 25–26, 2026, in the managed development environment. The live multiplayer implementation is the actual adapted PartyFrame runtime, running Colyseus.

## Automated rules and framework checks

`npm test` passes **18 tests**: 13 game-rule tests, four reused-framework checks, and a real 20-client integration test.

| Check | Observed result |
| --- | --- |
| 20 independent Colyseus clients in the actual PartySessionRoom | 20 persistent characters connected; upstream eight-player ceiling successfully extended |
| Concurrent initiating declarations | Exactly one accepted attempt; its text and server sequence remain fixed |
| Duplicate request | Original receipt; no second action or roll |
| All 19 other clients react | 19 accepted reactions, each once, in server sequence order |
| Framework latency simulation | Configured at 250ms during the race/reactions; no lost state or extra initiator |
| Framework reconnect token | Same Colyseus seat and same persistent game character restored |
| Recovery PIN | Same character moved to a new connection; old token loses both custom and native command control |
| Full process shutdown/restart | Campaign, 20 characters, dice result and identity restored from the atomic save |
| Actual framework schema | Host receives the game result through PartyFrame’s Colyseus session projection |
| Guest host commands | Rejected through both the acknowledgment channel and native session-action channel |
| Public projections | No host key, character tokens, recovery PINs, request receipts or random seed |
| Clock synchronization | Reused ClockSync corrects a one-minute skew and ignores an excessive-delay sample |
| Reused token bucket | Per-client isolation and timed refill verified |
| Reused RNG | Exact next draws preserved across snapshot/restore; game consumes and checkpoints framework RNG |
| Full objective | Three clues → steal crown → successful party escape → ended state |
| Pause, fair cooldown, reaction expiry, one reaction per character | Authoritative constraints verified |
| Health, guard sweep, recovery, moderation, character edits | Verified, with HP bounded at zero and class/perk locked during play |

The latency setting is the framework’s simulator configuration, not a measured guarantee of home Wi-Fi performance. The integration test takes about one second in this environment.

## Actual Ninja Adventure artwork checks

`node tests/ninja-render-check.mjs` passes **78 Canvas/Skia checks** against the original PNG files: 37 appearance-option cases, 28 pose/direction cases, and 13 animated-effect recipes. All required images load. Every creator option changes the rendered sprite. Walk/idle use different real source frames, and effects preserve the caller’s drawing state. Exact Canvas runtime dependency and rerun instructions are in the test script.

## Packaged release check

`node tests/release-smoke.mjs` copies the actual bundled server and shipped assets outside the repository before running them, so missing dependencies cannot resolve from development node_modules. It checks a PartyFrame host and two real controller connections, first action, reaction, roll, saved campaign, authorization and served JavaScript/art assets. The release runs without a package install. The launcher is checked with `bash -n`.

Both official Intel and Apple Silicon Node runtimes passed SHA256 verification before packaging. The Mach-O binaries cannot run on the Linux test host; this test verifies their packaged server logic using the available Node runtime.

## Browser verification

Chrome was used to customize the actual Ninja-based character, create a PartyFrame room, join from a separate player tab, start the story and submit a phone declaration that appears on the TV screen. A 390px-wide controller and 20 simultaneous named actor layout fixtures were visually inspected. The fixtures are explicitly labeled layout fixtures; the separate 20-client transport test provides multiplayer evidence. QA pages are excluded from the release and hosted output.

The private hosted website is solo practice with five explicitly labeled scripted BOT companions. It uses the same rules, artwork and effects. Real no-account phone multiplayer is in the Mac LAN release.

## Physical and scope limits

- No two physical phones, iPhone Safari, AirPlay, macOS download prompts, physical TV, or actual 2015 MacBook were available for testing.
- Scene redraw is capped at 30fps at 960×540 and skips hidden tabs; actual old-Mac performance remains unmeasured.
- The narrator is scripted and uses keyword intent matching, seeded dice and templates. No generative cloud AI, voice narrator or per-action video is connected.
- One tavern and one complete crown-heist sequence are implemented.
- Ninja actor sheets are monolithic; customization reuses stock crops/palettes plus small overlays. The hit pose adapts the source jump/recoil pose.
- PartyFrame/Colyseus uses WebSockets. Devices must share a network that permits local device connections, and the Mac stays awake during play. Development does not use the user’s computer.

Source versions, license evidence and exact adaptations are in FOUNDATION_AUDIT.md and CREDITS.md. No paid service was created and no existing project was modified.
