# Chaos Party on Fracture — local game-night beta

Run **Start_Fracture_Chaos_Test.command** on the Mac (Node **22.18+ LTS or 24+**, Git). It reuses the separate `~/Fracture-Chaos-Spike` checkout, pins Fracture `642c00a8a2d3a95979e85bbfa3f62deee611a4a6` and pnpm `10.34.9`, and leaves original Chaos source and saves alone. First installation/build needs internet; subsequent unchanged launches reuse the build and work offline. Keep its Terminal open. Control-C saves phone characters, stops the bridge, then stops only the Fracture process this launcher started.

1. Open the private host link printed by the launcher; click **Open shared TV**. No Fracture sign-in is needed for the TV spectator.
2. Scan the host QR or open its join link on each phone on the same Wi-Fi. Choose a name and color. Each phone gets a separate real actor; color tints that actor on TV without changing equipment stats.
3. Choose the followed character on TV and click **Full screen**. The game uses the real Fracture renderer, map, sprites and enemies.
4. Try `look around`, `walk north three tiles`, `walk to guard`, `attack rat`, `stop running`, `talk to guard`, `ask guard for a quest`, `pick up sword2`, `equip sword2`, `enter building`, `leave building`, and `respawn` when knocked out.

Phone receipts distinguish received, started, succeeded, blocked, failed and cancelled. Walking/attacks are bounded and validated by Fracture. STOP interrupts only your actor, including during the ten-second declaration/reaction window. Other players act in parallel; no twenty-person turn queue. Ordinary movement and observations remain available during the window. Enemies can still attack a player who stops.

**Optional group rally:** Open **Gather the party** on a phone and choose **Propose gathering at my position**. All ready, living, connected characters must be in the same Fracture area and within twelve tiles; at least two are needed. A ten-second strict-majority vote opens, with the proposer voting yes automatically. Each other player can vote yes or no exactly once. If approved, the game asks each available native character to walk to the proposer's actual position; it never teleports them. Each character can STOP, and obstacles/disconnects can prevent some arrivals. Rejected or expired votes move nobody. This is a small **local rally**, not the original Chaos Party expedition/major travel system.

## Chaos crafting on the Fracture map

Every character starts with a cloth strip and wood splinter, once per saved character. Try `make blue hat from cloth strip and wood splinter`, then `equip blue hat`. The original Chaos rules roll a server D20 against DC 10. A failed roll keeps your materials; wait for the reaction window before trying again. Wearables show as colored bands on the actual TV sprites. They do not grant native combat stats.

`give blue hat to <friend's full name>` transfers ownership to a nearby living player. `drop blue hat` places it at your actual tile; `take blue hat` walks to a visible nearby object and collects it. `look around` lists nearby floor objects. `inspect blue hat`, `unequip blue hat` and `separate blue hat` use the same original object rules. Use the `[item-N]` ID shown under Gear and quest when names repeat. Native gear still uses its native names: `equip sword2`. Use `eat burger` or `drink flask` for native consumables in your bag.

Crafted possessions and their ingredients persist separately in the Fracture clone's `server/data/chaos-party/objects.json`. Reconnecting does not duplicate starter supplies. Only pure Chaos object modules and their dependency closure are reused; original saves, map generation and networking remain separate. Native gear gifting and the rest of the original campaign are not yet integrated.

## A 20-minute game-night route

This is an optional route through existing content, not a forced campaign or a newly invented map:

- **Meet and learn (0–4 minutes):** meet in The Refuge, choose colors, try movement and personal STOP; use `look around` to find an NPC. Names printed in the look result are valid targets.
- **Choose a job (4–8):** talk to the guard near `(41,195)` or `(47,195)`. Ask for a quest if desired. Explore or help another player instead of taking a job.
- **Fight and equip (8–13):** hunt rats together, collect real loot, equip earned gear. A sword2 can be found near `(34,210)` when another player has not already taken it. Use the actual look result rather than assuming an item is still there. Native quests grant real rewards on completion.
- **Visit and travel (13–18):** `walk to 27,209` enters the Western Dwelling through its real door. `leave building` returns outside. Travel north toward `(34,188)` to enter Glitch Woods. The woods are more dangerous; retreat or respawn if needed.
- **Finish your way (18–20):** complete the offered job or return to town with earned equipment and gold. The optional goal is the quest's own engine-confirmed completion/reward, not DM narration.

Typing an unsupported action gives a grounded rejection. Scenery is not movable just because it appears on the map. Door travel only uses map-authored destinations. You can freely explore; there is no Crown Job requirement.

## Running a large party: host bench and restore

The host page now lists each registered character with a **Bench player** or **Restore player** button. Up to **20 unbenched characters** can occupy live slots; former guests do not permanently fill the room. Benching saves the character, disconnects its game socket and frees the slot. The player retains their private recovery link, Fracture identity, equipment, position and progression; they cannot send actions until the host restores the slot.

If the room has 20 active slots, the host must bench someone before restoring another character or adding a new one. **Benching is not deletion.** The private host link controls this feature; do not share it with guests. Rapid host bench/restore also waits safely for outstanding save acknowledgments rather than disconnecting a newly restored player.

The room's transient event log now writes at most twice per second during busy combat, with a final flush on clean shutdown. Character saves, new-player credentials and host slot changes remain immediate and separate from that optimization. These fixes are validated with isolated tests; physical Intel Mac performance has not yet been measured.

## Recovery and optional AI

Saved actors connect only when their phone returns. Closing a phone saves/logs out its actor after a 45-second grace period, so inactive characters are not left fighting unattended. Reopening the same phone/room restores its personal controller from browser storage. The private host page also lists personal recovery links for lost browser storage or another phone. Give each link only to that player. Fracture passwords remain on the Mac in the isolated room file, never on a phone. Native progression, equipment, inventory and position persist; **native quest progress is currently session-scoped and can reset on server/bridge restart**.

Optional Groq semantic interpretation is **off by default**, requires an already configured `GROQ_API_KEY`, and is explicitly enabled from the private host page. It proposes only grounded supported actions. The engine owns outcomes. A separate local quota ledger, short timeout and deterministic fallback keep play available on errors or quota exhaustion. No paid upstream Venice or Fish Audio connection is enabled. Live Groq quality/free-plan qualification is not claimed by mocked tests.

## Verification and limits

Read [the release tracker](../../docs/FRACTURE_GAME_NIGHT_RELEASE.md) and the sanitized evidence alongside this file. Cloud/Linux browser and concurrency tests do **not** establish performance on the 2015 Intel MacBook or physical iPhones/TV. That hardware check remains the owner's final acceptance.

Offline focused checks: `node --test experiments/fracture-phone-tv/*.test.mjs`. Optional real-server load verification: run `verify-runtime.mjs` only against a disposable Fracture database, with `CHAOS_BETA_TEST=1`, `FRACTURE_ROOT`, and matching private runtime keys. It creates test characters; never run it against family saves. Browser verification requires Playwright Core and Chromium separately and is not a runtime dependency.

The old `bridge.mjs`, `chaos-remote.ts`, and `apply-overlay.mjs` remain intact as the historical single-character experiment. The launcher now uses `party-bridge.mjs` and `apply-party-overlay.mjs` instead. The overlay refuses unexpected versions or local edits and records hashes of its own applied changes.

## Credits and licenses

Fracture by George Larson, pinned above: https://github.com/georgeglarson/Fracture. Code: MPL 2.0; content: CC BY-SA 3.0. Originally based on Mozilla BrowserQuest, with sprites/map by Little Workshop (Franck and Guillaume Lecollinet): https://github.com/mozilla/BrowserQuest. Native source headers, LICENSE and credits remain in the separate checkout. This kit obtains raw upstream assets separately and does not bundle databases. Included derived gameplay screenshots are CC BY-SA 3.0 with the attribution above.

QR Code Generator 2.0.4 by Kazuhiko Arase is reused under MIT; source and notice are in `vendor/`. Pure object rules reuse the original Chaos modules, PartyFrame RNG (Saleh Yusefnejad, MIT; `vendor/partyframe/LICENSE`) and the Dungeonz dependency (Johnathan "Arcan" Fisher, MIT; `public/vendor/Dungeonz-LICENSE.txt`). The optional AI quota ledger is reused from original Chaos code with a separate data directory; original networking and databases are never imported.

Fusion browser regression (disposable data only): set `CHAOS_BETA_TEST=1`, `CHAOS_TEST_ROOM_FILE`, `CHAOS_BROWSER_TOOLS` (external Playwright Core directory), `CHAOS_TV_KEY` and optional `CHAOS_BROWSER_REPORT_DIR`, then run `node experiments/fracture-phone-tv/verify-fusion.mjs`. It creates two new characters and exercises crafting/giving/drop/pickup through real phone forms; no browser dependency is bundled in the game.
