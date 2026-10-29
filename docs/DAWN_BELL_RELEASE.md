# Chaos Party — Dawn Bell game-night candidate

Latest candidate: `release/Chaos_Party_Mac_06bcad3.zip` (about 72 MB, local workspace).
Source: `06bcad34227f78a8150a28e48bb9acca356c0185`, built with `sourceDirty:false`.
SHA-256: `6dde5afc541a8ceebfc1c805b17fa1178e5e6149d8ef7689dd40ff0631ae93db`.
Old ZIPs and packaged folders remain intact. Source backup stays on `luna/visual-game-night-release`; no main merge or public game deployment.

## Start

Unzip into a new folder. Right-click **Start Chaos Party.command → Open** and keep the terminal open. Show the host on TV and connect phones on the same Wi-Fi using the QR code. Use a new test room first. Read bundled **DAWN_BELL.md** for commands and objectives. The launcher uses the existing Application Support save location; no installation or save data was replaced by cloud testing.

Play the Crown Job, then select **Begin The Dawn Bell**. Alternatively the host can begin the expedition from host controls between turns. Copy the tavern wall map from phone controls. **Travel / Explore requires majority approval** using Help them during the reaction window; ordinary actions do not.

## Implemented and retained

- The crown-heist beginning and ending plus a complete bounded Dawn Bell campaign: seventeen connected scenes overall, woods and branch trails, river/repairable bridge or alternative ferryman cave, town/inn, castle grounds, cellar, vault and distinct quest ending. The group can explore after the finale.
- Persistent discovered graphical route map, actual crossing/prerequisite checks, once-only rewards, repair/damage consequences across region unloads, NPC goals/trust and inexpensive local routines.
- Existing PartyFrame/Colyseus authority, phone characters/customization, action/reaction locking, server dice, crafting/ownership/materials, saved campaigns and reconnect. Explored legacy sandbox routes are preserved.
- Existing licensed artwork/effects/audio; shipped CC0 Kenney trees/buildings reused. Idle TV panel and phone object/map/crafting sections compacted. TV paints newly attached canvases immediately; Colyseus buffer preallocated to avoid repeated resizing.

## Fresh verification

- `npm run verify`: **195 tests in 32 files**, seven generated outputs and static build. Original campaign golden hashes unchanged. Offline suite disables AI and uses disposable data.
- Twenty actual Colyseus controllers: first-declaration/reaction/recovery/restart coverage retained; new expedition test verifies failed abstention quorum, successful strict majority, duplicate votes and host authorization without splitting the party.
- Actual phone-browser journeys: complete crown heist and PARTY VICTORY; complete Dawn Bell crossing/town/castle/finale, graphical map, saved ending and restart/rejoin. TV 1280×720 and phone 390×844 for Dawn Bell; earlier retained layout checks cover 320×568, landscape and 1920×1080.
- Packaged Node 22.16.0 server copied outside repository: passed host/two-controller declaration/reaction/dice, assets, authorization and saving without node_modules. Intel/ARM Mac Node runtime archives matched official checksums. ZIP integrity verified.
- Final packaged-server Dawn Bell run under Linux Node 22.16.0: PASS. Two customized controllers completed crossing/town/castle/vault, map discovery, distinct victory and restart/rejoin. Every state-change canvas-paint assertion passed; no page errors or serialization-buffer warnings.

Evidence: `docs/evidence/dawn-bell-release/` and local `artifacts/dawn-bell-release/`.

## External acceptance still blocked

**Genuine AI DM is not qualified.** The existing shared `ai-free-usage.json` ledger is unavailable in this environment. Explicit six-request interpretation and three-request narration preflights refused provider contact. No live inference ran; no ledger was reset/replaced, no limits raised, no paid service used. Narration remains off. Restore the existing ledger to measure exact action semantics, truthful dialogue, latency and selective full-session capacity under the existing 100/day and four/minute shared guard. Continuous interpretation plus narration for hundreds of turns cannot fit that allowance. Unsupported creative stunts remain limited by native rules without AI.

**Physical acceptance requires the actual hardware:** early-2015 Intel Mac/macOS, TV readability/audio, home Wi-Fi/firewall/QR, two real phones for at least 90 seconds, save/rejoin and measured performance; then the larger family group. Linux Node 22 and browser tests do not certify bundled Mac executables or physical enjoyment/performance.

The original Mac ZIP and Anywhere RPG materials/report/scoped permissions were unavailable. No proprietary material was copied. The native adventures are implemented and verified; the full intended creative-AI product and release cannot honestly be declared accepted until the external gates pass.
