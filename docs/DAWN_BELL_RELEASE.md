# Chaos Party — Dawn Bell game-night candidate

Latest candidate: `release/Chaos_Party_Mac_aa5bf51.zip` (about 72 MB, local workspace).
Source: `aa5bf5168bb4bda2577eb4f474b90b51aaeaba2d`, built with `sourceDirty:false`.
SHA-256: `b84f699cc22e1df497078babea6ff8f72a8356606075a85f6adee4bcc4207017`.
Old ZIPs and packaged folders remain intact. Source backup stays on `luna/visual-game-night-release`; no main merge or public game deployment.

## Start

Unzip into a new folder. Right-click **Start Chaos Party.command → Open** and keep the terminal open. Show the host on TV and connect phones on the same Wi-Fi using the QR code. Requires macOS 11 (Big Sur) or newer, confirmed from both bundled runtime binaries. Use a new test room first. Read bundled **DAWN_BELL.md** for commands and objectives. The launcher uses the existing Application Support save location; no installation or save data was replaced by cloud testing.

Play the Crown Job, then select **Begin The Dawn Bell**. Alternatively the host can begin the expedition from host controls between turns. Copy the tavern wall map from phone controls. **Travel / Explore requires majority approval** using Help them during the reaction window; ordinary actions do not.

For private AI connection setup, open host controls on the Mac and choose **Dungeon Master setup**. No terminal commands are needed. The private key stays outside the package and is never sent to phones; narration remains unqualified/off.

## Implemented and retained

- The crown-heist beginning and ending plus a complete bounded Dawn Bell campaign: seventeen connected scenes overall, woods and branch trails, river/repairable bridge or alternative ferryman cave, town/inn, castle grounds, cellar, vault and distinct quest ending. The group can explore after the finale.
- Persistent discovered graphical route map, actual crossing/prerequisite checks, once-only rewards, repair/damage consequences across region unloads, NPC goals/trust and inexpensive local routines.
- Existing PartyFrame/Colyseus authority, phone characters/customization, action/reaction locking, server dice, crafting/ownership/materials, saved campaigns and reconnect. Explored legacy sandbox routes are preserved.
- Canonical scene-event recipes now distinguish physical attacks/tool strikes, healing, fire, repair, speech and sound. Target recoil and effects use the actual victim; failure cannot fabricate a successful hit. NPC-owned possessions are visible; theft validates ownership, protects other players, and preserves NPC attitude/trust/witness memory.
- Existing licensed artwork/effects/audio; shipped CC0 Kenney trees/buildings reused. Idle TV panel and phone object/map/crafting sections compacted. TV paints newly attached canvases immediately; Colyseus buffer preallocated to avoid repeated resizing.

## Fresh verification

- `npm run verify`: **210 tests in 35 files**, seven generated outputs and static build. Original campaign golden hashes unchanged. Offline suite disables AI and uses disposable data.
- Twenty actual Colyseus controllers: first-declaration/reaction/recovery/restart coverage retained; new expedition test verifies failed abstention quorum, successful strict majority, duplicate votes and host authorization without splitting the party.
- Actual phone-browser journeys: complete crown heist and PARTY VICTORY; complete Dawn Bell crossing/town/castle/finale, graphical map, saved ending and restart/rejoin. TV 1280×720 and phone 390×844 for Dawn Bell; earlier retained layout checks cover 320×568, landscape and 1920×1080.
- Packaged Node 22.16.0 server copied outside repository: passed host/two-controller declaration/reaction/dice, assets, authorization and saving without node_modules. Intel/ARM Mac Node runtime archives matched official checksums. ZIP integrity verified.
- Final packaged-server Dawn Bell run under Linux Node 22.16.0: PASS. Two customized controllers completed crossing/town/castle/vault, map discovery, distinct victory and restart/rejoin. Every state-change canvas-paint and result-panel clearance assertion passed; no page errors or serialization-buffer warnings. The same packaged journey also exercised an actual tool strike and NPC possession/theft/witness memory.

Latest package evidence: `docs/evidence/ai-complete/` (private host setup is explicitly synthetic; no live model). Native action evidence: `docs/evidence/directive-release/`. Full directive checklist: `docs/FINAL_DIRECTIVE_CHECKLIST.md`. Earlier retained evidence: `docs/evidence/dawn-bell-release/`.

## External acceptance still blocked

**Genuine AI DM is not qualified.** The previous request counter was unavailable. On October 29 it was recovered conservatively: the entire current-day allowance is reserved, zero extra attempts granted, no prior file overwritten, and no provider contact or actual inference performed. This reservation does not represent 100 actual provider calls. The normal UTC-day rollover is unchanged; a bounded scheduler can use this same persistent counter after its normal renewal for six interpretation and three narration attempts. It requires an available workspace, clean unchanged source and a stopped local game server; no automatic retries or narration enablement. Scheduling/status/raw reports are under artifacts/scheduled-ai/. Real responses still require semantic/latency review, so a queued job is not acceptance. Fresh preflight correctly refused inference while today's remaining allowance was zero. No limits were raised, reset to gain attempts, or paid fallback used. Narration remains off. Actual semantic accuracy, truthful/funny dialogue, latency and selective full-session capacity still require real model evidence. Continuous interpretation plus narration for hundreds of turns cannot fit 1,000 requests/day and 30/minute. Unsupported creative stunts remain limited by native rules without AI.

**Physical acceptance requires the actual hardware:** early-2015 Intel Mac/macOS, TV readability/audio, home Wi-Fi/firewall/QR, two real phones for at least 90 seconds, save/rejoin and measured performance; then the larger family group. Linux Node 22 and browser tests do not certify bundled Mac executables or physical enjoyment/performance.

The original Mac ZIP and Anywhere RPG materials/report/scoped permissions were unavailable. No proprietary material was copied. The native adventures are implemented and verified; the full intended creative-AI product and release cannot honestly be declared accepted until the external gates pass.

## Request-limit update — October 29, 2026

The owner authorized removing the stricter 100/day and four/minute game-specific limits. `src/free-ai-budget.mjs` now uses Groq's published GPT-OSS free request ceilings of 1,000/day and 30/minute, subject to the provider's separate token ceilings, actual organizational limits and 429 cooldowns. Existing usage records are preserved; no new inference was run for this code change. This source change requires a new candidate package; the `aa5bf51` ZIP still contains the earlier limits. The prior AI-qualification schedule must be checked in the Codex workspace before resuming tests.
