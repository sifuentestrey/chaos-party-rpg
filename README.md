# Chaos Party RPG

Private project for a family TV-and-phones, AI-assisted, chaotic fantasy party game.

**Status: recovered playable prototype, with an iterative tavern presentation pass.** Source and archive provenance are recorded in [docs/PROTOTYPE_IMPORT.md](docs/PROTOTYPE_IMPORT.md). See [docs/TAVERN_PRESENTATION.md](docs/TAVERN_PRESENTATION.md) for the current rendering work, actual checks, and remaining physical-device quality gates.

Use Node 22+, run `npm ci`, then `npm start`. Open the host screen on the server machine at port 4747 and join from phone browsers on the same LAN. `npm test` exercises multiplayer and saves; `npm run build` produces the separate solo preview. No paid API or account is required.

## Target experience
- One shared full-screen 16:9 pixel-art tavern on TV; 12–20+ players connect from phone browsers using a QR or room code.
- Every player creates and keeps a personalized sprite character, clothing, name, class, equipment and progression.
- No phone joystick controls. Players type or dictate free-form, chaotic actions. First valid action locks and is announced; others get 8–12 seconds to react. Actions may fail on a fair dice roll and consequences persist.
- Actual animated character motions, hits, knockback, effects, sound, and short entertaining narration. AI interprets free-text; deterministic server owns game state. Run without paid AI credentials using a transparently labeled fallback.
- Host on an early-2015 13-inch Intel MacBook Pro (dual-core i5, 8 GB RAM, Iris 6100) via HDMI if performance allows; benchmark before promising it will work.

## Critical development constraint
**Reuse first. Never blindly generate another generic game-looking website from scratch.** Find and actually run complete existing games, evaluate their licenses and architecture, compare before selecting the playable foundation. Preserve existing working multiplayer code while replacing inadequate visual/gameplay sections. No copyrighted DungeonBox extraction.

## Instructions
1. Read AGENTS.md and docs/REUSE_CANDIDATES.md.
2. Read docs/CODEX_KICKOFF.md and docs/PROTOTYPE_IMPORT.md. Preserve the recovered source and existing saves. If the original archive becomes available, keep a pristine copy and scan before committing.
3. Run and visually evaluate both TV and phone experiences; capture screenshots/video.
4. Make a runnable *visual* tavern spike. Compare it with an actually running licensed game. Favor reusing character animations and world rendering from an established playable game.
5. Demonstrate a complete 90-second chaotic interaction on two real phone browsers with the TV screen, plus 20-client simulated load tests.
6. Do not claim the game is finished solely on tests passing. No new costs, public deployments, or changes to unrelated repositories without authorization.

Useful foundations and license considerations: see docs/REUSE_CANDIDATES.md.
