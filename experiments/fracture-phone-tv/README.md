# Chaos Party on Fracture — local game-night beta

Run **Start_Fracture_Chaos_Test.command** on the Mac (Node **22.18+ LTS or 24+**, Git). It reuses the separate `~/Fracture-Chaos-Spike` checkout, pins Fracture `642c00a8a2d3a95979e85bbfa3f62deee611a4a6` and pnpm `10.34.9`, and leaves original Chaos source and saves alone. First installation/build needs internet; subsequent unchanged launches reuse the build and work offline. Keep its Terminal open. Control-C saves phone characters, stops the bridge, then stops only the Fracture process this launcher started.

1. Open the private host link printed by the launcher; click **Open shared TV**. No Fracture sign-in is needed for the TV spectator.
2. Scan the host QR or open its join link on each phone on the same Wi-Fi. Choose a name, color and original Chaos class. Each phone gets a separate real actor; color tints that actor on TV without changing equipment stats. The chosen class is saved with that private character.
3. Choose the followed character on TV and click **Full screen**. The game uses the real Fracture renderer, map, sprites and enemies.
4. Try `look around`, `walk north three tiles`, `walk to guard`, `attack rat`, `stop running`, `talk to guard`, `ask guard for a quest`, `pick up sword2`, `equip sword2`, `enter building`, `leave building`, and `respawn` when knocked out.

Phone receipts distinguish received, started, succeeded, blocked, failed and cancelled. Walking/attacks are bounded and validated by Fracture. STOP interrupts only your actor, including during the ten-second declaration/reaction window. Other players act in parallel; no twenty-person turn queue. Ordinary movement and observations remain available during the window. Enemies can still attack a player who stops.

**Partial class mechanics:** The six original Chaos class names are selectable for new characters. **Rogue** gets +3 on original Chaos object-theft D20 checks; **Knight** gets +3 on original Chaos object-breaking D20 checks. The **Lucky-ish** perk rerolls an initial 1–3 once on original Chaos object checks, and natural 1/20 follows the original critical rules. Existing saved characters without a class remain unassigned, with no automatic bonus. Other class skills and perks are not yet active, and none of this changes Fracture combat damage, HP, equipment, native character sprites or XP. Your class is fixed to your private recovered character in this experiment.

**Optional group rally:** Open **Gather the party** on a phone and choose **Propose gathering at my position**. All ready, living, connected characters must be in the same Fracture area and within twelve tiles; at least two are needed. A ten-second strict-majority vote opens, with the proposer voting yes automatically. Each other player can vote yes or no exactly once. If approved, the game asks each available native character to walk to the proposer's actual position; it never teleports them. Each character can STOP, and obstacles/disconnects can prevent some arrivals. Rejected or expired votes move nobody. This is a small **local rally**, not the original Chaos Party expedition/major travel system.

## Experimental majority-approved travel (native route not yet qualified)

In **Gather the party**, players near the departure area may vote to walk together between **The Refuge** and **Glitch Woods**. The vote uses a frozen, strict majority of connected, ready, living characters within twelve tiles of the proposer. No arbitrary destination coordinates are accepted from phones. Approval asks each still-eligible native actor to walk toward a pinned waypoint; Fracture's own terrain, collisions, zone changes, and each player's STOP determine what actually happens. The TV and phone show the vote; the host log counts an arrival only when the native actor reports the destination zone. A vote is **not a teleport or a guarantee that the group arrives together**.

This is a separate reversible rule experiment from the local rally, not a port of the Dawn Bell scene graph or original majority-gated campaign. The disposable native integration run confirmed two distinct actors could walk into Glitch Woods after a majority vote; the first run still failed because the vote display expired before its arrival count could be checked. The vote now stays visible during a bounded 45-second travel window, with a new pinned CI run pending. Return travel, physical Mac and actual family group remain unverified. If native pathfinding blocks the route, travel must be completed with ordinary individual movement until the route is corrected.

## Optional cooperative mini-adventure: The Refuge Trial

This is a **new, bounded Fracture-side game-night objective**, not the original Crown Job or Dawn Bell campaign. After at least one living phone character has joined **The Refuge**, the Mac host can select **Start The Refuge Trial**. The host starts it once; the current room's saved trial is never silently reset.

The phone shows a shared four-step checklist. **Talk to any real NPC** and either **defeat a native monster** or **successfully craft an original Chaos item** (two alternate ways to prove the party's readiness). After both are done, a party member must **reach Glitch Woods** and that same woods visitor must **return to The Refuge**. Different players may contribute the NPC and proof steps. Multiple people can visit the woods; any verified visitor can return to finish. All steps come from authoritative native receipts, original crafting outcomes or native zone state. A typed claim, missed hit, failed D20 roll, DM story, or teammate waiting in town cannot finish the trial.

Progress and the final completion are saved in the isolated room data and survive restart. The TV event log announces milestones, and each phone shows the checklist. The trial awards **no invented native XP, loot or quest flags**; Fracture's existing rewards remain independent. The full original campaigns, their maps, character classes and save migration are still absent. Physical Mac and real group pacing have not been accepted.

## Reactive objects, NPC memory and DM

Use `look around` and **World and people** on your phone to find custom objects, their IDs, owners and nearby NPC trust. The first camp contains a **camp table**: `push camp table east`, `ignite camp table`, `extinguish camp table`, and `repair camp table`. The table occupies a real tile and blocks walking until moved or broken. Pushes cannot overlap walls, characters or another blocking object. These capabilities belong to the displayed Chaos props; native painted buildings/tents are not silently converted.

Fire ticks every ten seconds on the server and burns an object through after three ticks. Extinguish it before then, or repair it afterward. Fire changes objects, not native character HP.

**Reactive NPC property:** If fire reaches a native NPC's visible rug, that NPC can warn about the actual burning object, remember its destruction, and ask for a repair. `look around` shows their current concern; `talk to guard` gives a contextual response. Players can extinguish or repair an NPC-owned **floor** object without taking ownership. NPC inventory, native scenery, native health and unobserved events remain protected. This is bounded witness/concern behavior, not a full NPC autonomy system. Dice resolve risky actions; failed rolls preserve state but still use your declaration window.

Native NPCs have displayed owned rugs. `steal <rug item ID>` attempts real ownership transfer. The owner and visible nearby witnesses remember, lose trust toward that character, and may refuse new quests. Other players keep their own reputations. `talk to guard` reflects that memory; `give <owned item ID> to <NPC ID>` makes amends with a real inventory transfer. Use IDs when NPC names repeat. NPC identities, personal memories and trust survive reconnect and restart. This is bounded action memory/reputation, not autonomous AI training.

The DM always has canonical offline results and saved facts. Optional Groq now supports both grounded interpretation and short post-result narration using the original Chaos narration instructions/validator. It remains off by default, uses only an existing configured key and the shared free-quota ledger, and never owns game outcomes. Live phone-to-engine-to-TV interpretation/narration is verified; broad campaign storytelling and group-scale quality remain unqualified.

## Chaos crafting on the Fracture map

A nearby friend can type `help <your full character name> craft` before your next craft. Within fifteen seconds, while they stay alive and nearby, the server rolls two D20s and uses the higher once. Invalid crafts keep the help; real attempts consume it, including failures.

**Actual opt-in D20 reaction window:** Type `declare make green hat from cloth strip and wood splinter`, `announce steal guard's rug` or `declare apologize to guard`. The world action waits **10 seconds**; the phone and TV show a countdown. Other living characters within two clear tiles can type `help Ada` to grant **advantage** (higher of two D20s), or `hinder Ada` / `interfere with Ada` to impose **disadvantage** (lower of two D20s). Only one help/hinder modifier may be active for a target, it lasts 15 seconds, and a blocked world action does not consume it. The real native actor rechecks position, target, ownership and original Chaos D20 rules when the countdown expires. `stop` cancels your queued declaration; disconnect, host benching or changing areas cancels it automatically. Pending declarations are not saved or replayed after a restart. **Ordinary actions remain immediate** and native combat damage is unchanged. A queued announcement is not an accepted success, and this is **not full original Chaos reaction/party combat parity**.\n\n

Every character starts with a cloth strip and wood splinter, once per saved character. Try `make blue hat from cloth strip and wood splinter`, then `equip blue hat`. The original Chaos rules roll a server D20 against DC 10. A failed roll keeps your materials; wait for the reaction window before trying again. Wearables show as colored bands on the actual TV sprites. They do not grant native combat stats.

`give blue hat to <friend's full name>` transfers ownership to a nearby living player. `drop blue hat` places it at your actual tile; `take blue hat` walks to a visible nearby object and collects it. `look around` lists nearby floor objects. `inspect blue hat`, `unequip blue hat` and `separate blue hat` use the same original object rules. Use the `[item-N]` ID shown under Gear and quest when names repeat. Native gear still uses its native names: `equip sword2`. Use `eat burger` or `drink flask` for native consumables in your bag.

Crafted possessions and their ingredients persist separately in the Fracture clone's `server/data/chaos-party/objects.json`. Reconnecting does not duplicate starter supplies. Only pure Chaos object modules and their dependency closure are reused; original saves, map generation and networking remain separate. Native gear gifting and the rest of the original campaign are not yet integrated.

**NPC possession and theft (experimental):** Real nearby native NPCs can hold explicitly created Chaos objects; they receive a custom rug once and can accept gifts. This does not invent native weapons, gold or combat inventory. Both failed and successful theft use original Chaos trust/history rules, while only a successful roll transfers ownership. Native zone/geometry checks protect pickup and gifts. Current memory changes conversations and access to new quests; native combat AI, existing quest progress and reward rules remain unchanged.

## Reactive objects on the native map

Chaos floor objects support real pushing, burning, extinguishing, repair, ownership and original D20 checks. **60 validated existing map trees** can be chopped or ignited; its saved HP and fallen state control phone-driver collision and appear on the shared TV. Use its displayed ID when names repeat. `put out tree` and `extinguish <object ID>` use the same existing Chaos action rules. A rooted tree cannot be pushed, and a felled tree cannot be repaired into a living tree.

Fire spreads only between adjacent eligible objects on valid tiles in the same native zone. Adjacent fires can relight each other: two players can extinguish both during the same interval. Nearby native NPCs warn about their burning Chaos property and can extinguish it after a warning tick; absent NPCs cannot rescue it. Native painted scenery and character HP remain under Fracture's own rules. Weather definitions are not a playable weather system.

Developer browser check (disposable saves only): `verify-reactive.mjs` uses two existing isolated characters, a carried wood item, an intact native tree and the pinned guard's intact rug. Supply `CHAOS_BETA_TEST=1`, `CHAOS_TEST_ROOM_FILE`, `CHAOS_BROWSER_TOOLS`, `CHAOS_TV_KEY`, and optionally `CHAOS_BROWSER_REPORT_DIR`. It submits actual phone forms and captures TV/phone evidence; it consumes real materials and tree HP, so use a new disposable world rather than resetting player saves.

## Replaying the optional Refuge Trial

After the party completes The Refuge Trial, the private Mac host page offers **Start another trial**. This requires host confirmation, archives the previous completion in a private bounded summary, and starts a fresh four-step objective. It does **not** restart the Fracture server, reset character equipment/levels, erase native quests, alter original Chaos saves, or replay Crown Job/Dawn Bell. An active trial cannot be restarted or erased by a phone; late actions from a previous run cannot earn progress in the new run. The original campaign and class systems remain unported.

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

Optional Groq semantic interpretation is **off by default**, requires an already configured `GROQ_API_KEY`, and is explicitly enabled from the private host page. It proposes only grounded supported actions. The engine owns outcomes. A separate local quota ledger, short timeout and deterministic fallback keep play available on errors or quota exhaustion. No paid upstream Venice or Fish Audio connection is enabled. The live GPT-OSS path has bounded browser/provider evidence; this does not establish unlimited free usage or general storytelling quality.

## Native combat now informs persistent NPC/DM memory

When a real native Fracture HIT defeats a monster, the separate Chaos object sidecar records a canonical encounter fact with the **actual HP transition and location**. Nearby NPCs who could see it may remember that character fighting when the creature fell, even after a restart. A submitted attack, miss, failed hit or narrative suggestion cannot create a victory. This adds no native damage, gold, XP or reputation, and it does not turn Fracture's native quests into the original Chaos campaigns.

The pure combat-memory regressions and pinned Fracture adapter compile pass. The disposable browser adventure includes a new assertion that a real rat defeat appears in DM memory; **do not claim that assertion passed until the full browser journey is actually run**. The physical Intel Mac/phone/TV test and live creative-model qualification remain separate and outstanding.

## Verification and limits

Read [the release tracker](../../docs/FRACTURE_GAME_NIGHT_RELEASE.md) and the sanitized evidence alongside this file. Cloud/Linux browser and concurrency tests do **not** establish performance on the 2015 Intel MacBook or physical iPhones/TV. That hardware check remains the owner's final acceptance.

Offline focused checks: `node --test experiments/fracture-phone-tv/*.test.mjs`. Optional real-server load verification: run `verify-runtime.mjs` only against a disposable Fracture database, with `CHAOS_BETA_TEST=1`, `FRACTURE_ROOT`, and matching private runtime keys. It creates test characters; never run it against family saves. Browser verification requires Playwright Core and Chromium separately and is not a runtime dependency.

The old `bridge.mjs`, `chaos-remote.ts`, and `apply-overlay.mjs` remain intact as the historical single-character experiment. The launcher now uses `party-bridge.mjs` and `apply-party-overlay.mjs` instead. The overlay refuses unexpected versions or local edits and records hashes of its own applied changes.

## Credits and licenses

Fracture by George Larson, pinned above: https://github.com/georgeglarson/Fracture. Code: MPL 2.0; content: CC BY-SA 3.0. Originally based on Mozilla BrowserQuest, with sprites/map by Little Workshop (Franck and Guillaume Lecollinet): https://github.com/mozilla/BrowserQuest. Native source headers, LICENSE and credits remain in the separate checkout. This kit obtains raw upstream assets separately and does not bundle databases. Included derived gameplay screenshots are CC BY-SA 3.0 with the attribution above.

QR Code Generator 2.0.4 by Kazuhiko Arase is reused under MIT; source and notice are in `vendor/`. Pure object rules reuse the original Chaos modules, PartyFrame RNG (Saleh Yusefnejad, MIT; `vendor/partyframe/LICENSE`) and the Dungeonz dependency (Johnathan "Arcan" Fisher, MIT; `public/vendor/Dungeonz-LICENSE.txt`). The optional AI quota ledger is reused from original Chaos code with a separate data directory; original networking and databases are never imported.

Fusion browser regression (disposable data only): set `CHAOS_BETA_TEST=1`, `CHAOS_TEST_ROOM_FILE`, `CHAOS_BROWSER_TOOLS` (external Playwright Core directory), `CHAOS_TV_KEY` and optional `CHAOS_BROWSER_REPORT_DIR`, then run `node experiments/fracture-phone-tv/verify-fusion.mjs`. It creates two new characters and exercises crafting/giving/drop/pickup through real phone forms; no browser dependency is bundled in the game.

Core gameplay regression: use the same disposable-browser environment variables as `verify-fusion.mjs`, then run `verify-core.mjs`. It expects an unclaimed native guard rug in a disposable world, creates two characters, and tests native movement/collision, timed fire, NPC trust, quest refusal/amends and reload. Never reset family possessions to rerun a test.

## Enable the live AI DM

On the private host page, open **Configure free Groq connection** and save your own existing free-account key (or use an already configured `GROQ_API_KEY`). Click **Test AI connection**, then turn **Live AI DM** on. The host shows real connection/quota errors. The key stays in the separate Fracture clone's `server/data/chaos-party/dm-config.json` with private permissions; it is not copied from original Chaos or included in this kit. Live AI is off at startup; offline game rules always remain available.

Live verification is explicit and bounded: `verify-live-dm.mjs` requires `CHAOS_BETA_TEST=1`, `CHAOS_LIVE_DM_TEST=1`, a disposable room, external browser tools and TV key. It uses the host controls and existing approved free connection, then disables AI afterward. Use an actor with two expendable carried materials; it performs a real craft rather than resetting saves.

## Optional majority story choice (experimental)

After the host starts The Refuge Trial and the group actually talks to a native NPC, nearby living phone characters in The Refuge can open **Choose the trial objective**. Propose **fight** or **craft**, then a strict majority of the frozen electorate must approve within ten seconds. This uses the same original-style majority vote as group travel. The chosen objective persists for that trial run and only a genuine native monster death or confirmed original Chaos crafting success of the selected kind counts. If no vote succeeds, either route still works. A completed trial may be replayed by the host; the new run starts with no choice. No original Dawn Bell/Crown Job migration, invented loot or native damage changes are implied.

## Family beta acceptance

Start the optional Refuge Trial from the private host page. Phones show a current goal and nearby actions; typed instructions remain available. The native TV shows the objective and authoritative action feedback. Existing oak trees support persistent chopping/fire, clear their actual native trunk cells on destruction, and provide wood. Other painted scenery has its native Fracture behavior; no arbitrary building or terrain destruction is implied.

`verify-family-night.mjs` replays the complete adventure through two real phone browsers and records timestamped TV footage when `CHAOS_RECORD_VIDEO=1`. It requires disposable accounts/world state and external browser tools; it consumes real ingredients and tree HP. Use a fresh separate world to rerun it. Do not reset family saves. Regular launches run the game directly; set `CHAOS_VERIFY_START=1` to run the developer test suite on launch.
