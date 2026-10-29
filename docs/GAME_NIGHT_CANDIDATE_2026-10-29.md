> Superseded by the [Dawn Bell candidate](DAWN_BELL_RELEASE.md). This report describes the preserved earlier 9a3417b package.

# October 29 game-night candidate

**Playable candidate; not the fully accepted final game.**

Build: `release/Chaos_Party_Mac_9a3417b.zip` (local workspace).
Clean source: `9a3417b053c02b7758143a989e6f4a8def7b7d5e`.
SHA-256: `bc1bb42b39015df3b2bb9b1afa3fe09fa66550d47b8bc90e4e072a31b1e713db`.

Unzip into a new folder. Right-click **Start Chaos Party.command → Open**. Leave its terminal open. Show host page on TV; phones scan the QR on the same Wi-Fi. Use a disposable room first; existing installation/save data is not replaced. No dev dependencies or internet are required for native gameplay. On the phone, copy the tavern wall map under object controls. For Travel/Explore, a strict majority must approve with **Help them** before the reaction window closes.

This session adds majority shared travel, persistent discovered route map and a smaller idle TV story panel. Existing crown heist, regional quests, character appearance, crafting, authoritative dice, reactions, saves and reconnect are retained.

## Fresh checks

- `npm run verify`: 189/189 tests in 30 files, seven generated outputs, static build; AI disabled. Includes twenty real Colyseus clients, action race, reactions, recovery and restart.
- Final two-phone-browser regional adventure: 18 layout checks (TV 1280×720 and 1920×1080; portrait/landscape phone layouts), declaration locking, reaction, dice display, map discovery, majority travel, completed quest, revisit, restart/rejoin. No browser errors. Evidence in `docs/evidence/game-night-final`.
- Standalone bundle copied outside repository: host + two controllers, real action/reaction/roll, assets, authorization and saved campaign passed without node_modules. Also passed under checksum-verified Linux Node 22.16.0, matching bundled Mac runtime version.
- Official Intel and ARM Node 22.16.0 archives matched official SHA-256 manifests. ZIP integrity and checksum passed. Mac executables cannot be run on Linux.
- Complete crown-heist browser journey passed: two customized phone controllers, six normally paced opening rounds, reactive fireplace/table/barrel/door/rug, three clues, crown theft and PARTY VICTORY; no browser errors.

## Honest remaining requirements

AI is **not qualified**: both bounded interpretation (6-request budget) and narration (3-request budget) preflights refused the missing shared usage ledger before provider contact. No live inference ran, ledger was not replaced/reset, narration stays off. Recover the existing shared ledger to run qualification; then assess exact targets/outcomes, prose truthfulness, latency and selective whole-night capacity. The existing 100/day and 4/minute limits cannot serve continuous interpretation+narration over hundreds of turns.

The larger requested bounded geographical campaign (river/bridge/town/castle/dungeon), broader NPC schedules and general scene-command execution remain unfinished. Existing outdoor regional quests and crown-heist ending are playable; the new map is a route chart, not an illustrated geographical map. Anywhere RPG source/report and scoped redistribution permission were unavailable in this checkout; no material was copied.

Physical acceptance remains required: early-2015 Intel Mac/macOS, TV couch readability/audio, LAN/firewall/QR, two real phones for 90 seconds, save/rejoin, measured performance, then the larger family group. Original Chaos_Party_Mac.zip is still unavailable. Prior packages and family saves were not modified. No public deployment or paid service.
