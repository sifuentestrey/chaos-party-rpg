# Chaos Party — The Tipsy Wyvern

A playable PartyFrame-based prototype of a phone-controlled party RPG, using actual Ninja Adventure animation artwork. One tavern, one crown heist, and up to 24 real players. Built separately from all existing projects.

## Play on a Mac

1. Unzip **Chaos_Party_Mac.zip**. Keep the entire folder together.
2. Double-click **Start Chaos Party.command**. The host screen opens in your browser.
3. Choose **Host a party → Create a private room**. Put the browser on your TV using HDMI or screen mirroring.
4. Everyone connects to the same Wi-Fi and scans the QR on the TV. They make a character on their phone. No player downloads or accounts.
5. On the TV, press **Start the heist**.

The Mac build includes both Intel and Apple Silicon runtimes. No Node installation, terminal commands, API key, or internet connection is needed to play. A browser tab alone cannot host the LAN server: keep the launcher’s terminal window open while playing. You can close it with Control+C when done; every accepted change is saved immediately.

If macOS blocks the downloaded launcher, use Finder’s **right-click → Open**. If your macOS version requires it, review the downloaded app under **System Settings → Privacy & Security**. Allow local network/incoming connections when macOS asks so phones can reach the Mac. The build is unsigned; this prototype has not been physically tested on a Mac.

If you also want to play, press **I’m playing too** on the host screen. It opens a second tab for your character. Leave the TV tab on the host screen.

## Try it alone

The separate private website runs a full solo practice heist in your browser, with five clearly labeled BOT companions. You control one character. Bots offer scripted reactions and do not represent remote players. The Mac build also has **Try a solo adventure** on its home screen.

## How the game works

- **First valid declaration received wins.** Write what your character attempts. Acceptance is immediate, timestamped, sequenced, and irrevocable. A fast typist briefly yields priority after leading a turn.
- Everyone else has **6–12 seconds** to help, intervene, flee, or write a reaction. The host chooses the window; the default party setup uses 10 seconds.
- **Help** gives +1 to the initiating roll, up to +4. **Intervene** subtracts 1 from a risky roll, up to −4, and lowers chaos. **Flee** hides the reacting player from a guard sweep. Custom reactions are batched in server acceptance order and mapped to these mechanics.
- A seeded **d20** and light rules decide success. Matching class skills give +3; the Charming perk adds +2 to social/performance attempts. Natural 20 succeeds; natural 1 fails. Lucky-ish rerolls a natural 1–3 once per action; Thick Skin adds 3 maximum HP.
- Find **3 clues** through successful investigation, conversation, performing, sneaking, magic, or unusual ideas. Then **steal the crown from the chest behind the bar** and **flee** to win together.
- Violence and risky magic raise **chaos**. At 10, guards sweep the room and deal 1 damage to exposed players. Fleeing reactors avoid that sweep.
- At 0 HP you can still **rest, eat, or drink** to recover. Nothing removes a player permanently.
- The host can pause, change the reaction timer, mute individual players, hide a declaration, reset an interrupted scene, or start another heist.

## Characters and saves

The creator has human/elf/orc bases, six skin tones, six hair styles and colors, four outfit shapes, six outfit colors, six accessories, six roles, and three perks. All are layered reusable pixel parts.

Your phone remembers its character token per room. Reopening that room rejoins the same character. A six-digit **recovery PIN** displayed on the phone lets you move the character to another phone; doing so revokes the old device’s control. Keep the room code and PIN private within your party. Class and perks lock during a story; appearance stays editable.

The Mac saves campaigns at `~/Library/Application Support/Chaos Party/campaigns.json`. Characters, health, inventory, coins, history, the current accepted declaration, and dice state survive a restart. Choose a saved room on the host setup screen and rejoin using the same room code. Returning to the exact same browser preserves each player’s device token.

## If a phone can’t join

Check that the Mac and phone are on the same Wi-Fi, the launcher window is still open, and the Mac is awake. A guest Wi-Fi network may isolate devices; use the normal household network. Temporarily disconnect a VPN if it routes local traffic away. You can manually enter the full address printed below the QR in the phone browser. The code alone is meaningful only after the browser has reached the Mac’s game address.

The host uses port 4747 by default. If it is already in use, the launcher selects another free port and the QR reflects it. Do not forward that port through your router. This release is designed for your trusted local network.

## What this prototype does not claim

The narrator is a fast **scripted DM**, not a generative AI model. Free text is classified by verbs/targets and resolved through templates and dice; it cannot understand every possible sentence. No API calls or paid services are used. There is one playable scene and one objective sequence. Effects are reusable recipes, not custom AI videos. Future campaigns, cloud multiplayer, voice narration, and generative narration are not implemented.

Twenty independent network clients and a browser host/player flow were tested in the development environment. Two physical phones, Safari, AirPlay, and the specific 2015 MacBook were not available for physical testing. The actual PartyFrame/Colyseus transport passed a 20-client integration test, including its latency simulator. Canvas renders at 960×540 and caps scene redraw at 30 fps; performance on that Mac remains unmeasured.

## For a future developer

Source is in the separate private project repository. `npm ci`, `npm test`, then `npm start` runs the Node source. `npm run build` makes the static private solo preview. `node scripts/package-release.mjs` makes a self-contained LAN release using the verified official Mac runtimes. See **FOUNDATION_AUDIT.md**, **TEST_REPORT.md**, **CREDITS.md**, and **RESEARCH.md**. The framework is pinned, MIT licensed and vendored with its change log. RPGJS was inspected and excluded to keep one multiplayer authority.
