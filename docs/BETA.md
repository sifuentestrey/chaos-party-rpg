# Chaos Party 0.3 beta candidate

## Play on the Mac

Unzip the Mac build and double-click **Start Chaos Party.command**. Open the host screen on the Mac/TV. Phones join its QR on the same Wi-Fi. Create characters and start the crown heist. Keep the launcher open during play. Existing campaign storage remains `~/Library/Application Support/Chaos Party/campaigns.json`.

The source checkout also runs with Node 22+: `npm ci`, `npm start`. No account or paid AI service is required. The static `dist` build is solo practice, not the multiplayer server.

## What to try

- “Steal the rug”: approach, attempt a Sleight of hand check, remove it on success, keep it in inventory.
- “Push the upper right table”: the table shifts and pathfinding respects its position.
- “Smash barrel 1”: debris and ale remain; risky physical actions have disadvantage on the slippery floor.
- “Hide behind the table”: remain protected from guard sweeps until your next action.
- “Extinguish the fireplace” / “Light the fireplace”: flame and light respond without a meaningless roll to douse it.
- “Burn the rug”: the fire persists and raises chaos; after three resolved actions it burns through unless extinguished.
- “Steal chair 1”, “Smash the right window”, “Repair the upper left table”, “Open the door”.
- Talk to Marnie, investigate behind the bar or the chest, gather three clues, steal the crown, and escape. Distracting the guards gives advantage on theft and escape. Class training adds +3; helpers and interveners affect the roll.

Controller **Interact with the room** lists all registered targets and fills an attempt for you. Free-form input still uses local deterministic intent matching. Unsupported attempts are explicitly identified, not reported as imaginary successes. The beta does not understand every possible sentence or simulate every conceivable physical action. Numbered objects and directional table/window names disambiguate targets.

## Existing code actually used

PartyFrame/Colyseus: multiplayer and persistence integration. Ninja Adventure/Kenney: licensed art, poses, effects and sound. Dungeonz: actual door-interaction and entity-damage code, through serialization-safe adapters. Foundry D&D5e: actual advantage/disadvantage selection body, extracted without its proprietary runtime. ROT.js: actual A* pathfinding around furniture. [Credits and exact boundaries](../CREDITS.md).

The separate Dungeonz world extraction proves that an existing authored map and original interaction classes can run with the current characters. It is not the production tavern: its mixed-license artwork still needs asset-level clearance. The production build uses the already-cleared CC0 scene art.

## Compatibility and limits

Older campaign objects initialize lazily; characters, tokens, PIN recovery and old inventories remain supported. Reset scene restores fixtures and NPCs; a new heist also clears quest progress and scores. Host mute/redact/pause and first-declaration fairness remain in place.

This is a beta candidate, not a claim that the original quality gates are all complete. Two browser controllers and simulated multiplayer can be tested here; two physical phones and the early-2015 MacBook Pro cannot. Real Mac GPU/CPU performance, LAN discovery, audio output and physical-controller usability remain hardware acceptance checks. No outdoor chapter, generative DM, paid service, or public deployment was added.
