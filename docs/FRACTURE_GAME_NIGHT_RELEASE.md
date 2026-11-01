# Chaos Party — Fracture game-night acceptance checklist

This is the current acceptance checklist for `main`. It describes the native Fracture/Refuge product and records what still needs proof. Historical branch instructions, old tavern milestones, and superseded PR work are not active requirements.

## Product identity

- [x] The game-night target is the native Fracture world, starting in the Refuge village.
- [x] The TV is the shared world view; each phone controls its own character.
- [x] The original Chaos Party source, saves, accounts, and networking remain preserved separately.
- [x] `main` is the sole active source of truth.

## Authority and play

- [x] Fracture owns authoritative movement, combat, world state, dice, inventory, and persistence.
- [x] The bridge accepts phone actions and publishes shared TV state without fabricating engine outcomes.
- [x] The first valid action locks on the server; confirmed consequences persist.
- [x] The AI DM interprets and narrates grounded requests only. It cannot invent loot, stats, objects, geometry, damage, movement, or success.
- [x] Live Groq and the offline fallback use the same grounded state contract; the active mode is reported explicitly.
- [ ] Verify the complete contract on the owner's 2015 Intel Mac, family Wi-Fi, TV, and physical phones.

## Discovery and pacing

- [x] NPC contact, observation, native combat, and confirmed world changes can drive the Refuge adventure.
- [x] Meaningful confirmed outcomes can appear as short, disappearing TV story events while phone mechanics remain private.
- [ ] Remove or reconcile any remaining objective, waypoint, route-marker, tracker, or fixed-destination behavior so discovery stays NPC/DM-led.
- [ ] Verify that ordinary exploration remains responsive without unnecessary planning waits.
- [ ] Run a human four-to-six-player fun session before claiming a larger party experience.

## Reactive native world

- [x] Existing Fracture actors, enemies, maps, objects, animations, and collisions are reused.
- [x] Supported interactions are validated by the native engine and persist when the underlying capability supports persistence.
- [x] Unsupported scenery and invented props are rejected with truthful contextual feedback.
- [ ] Verify the important Refuge interactions on physical devices and confirm that visible consequences remain after restart.

## TV and phones

- [x] The TV presents the native scene and a compact story timeline rather than mechanical dice receipts.
- [x] Phones retain personal action receipts, dice, modifiers, abilities, gear, and inventory.
- [ ] Verify readability at the intended TV resolution and common phone sizes on the owner's hardware.
- [ ] Verify keyboard, safe-area, reconnect, and simultaneous-input behavior on real phones.

## Multiplayer and release gates

- [x] Software checks cover independent actors, reconnect/persistence paths, and bounded multi-actor scenarios recorded in the repository evidence.
- [ ] Measure the actual old-Mac frame rate, bridge latency, and thermal behavior during a game-night session.
- [ ] Test the intended physical party size; software actors do not prove twelve-to-twenty physical phones.
- [ ] Confirm that a complete adventure is enjoyable and understandable to family players without technical explanation.
- [ ] Package or distribute only after the physical gates above pass and the owner approves.

## How to update this checklist

Record each new result with the exact `main` commit, actual Fracture scene, AI mode, test scope, and any limitation. Do not copy a branch name, draft PR, or historical report into the current status. Keep unresolved items open until they are genuinely verified.
