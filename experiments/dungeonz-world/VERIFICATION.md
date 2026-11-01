# Local verification — October 26, 2026

Built original upstream class hierarchy with esbuild and ran `node experiments/dungeonz-world/check.mjs`. Verified energy rejection, energy consumption, collision change, occupied-door protection, activation events and damage-type immunity.

Chromium at 1280×720 loaded the actual map and tile sheets. Keyboard gameplay verified:

1. Right from (37,13) is blocked by the original map door.
2. E opens it and energy changes from 10 to 9.
3. Right enters (38,13).
4. After 5.2 seconds the occupied door remains open.
5. Right leaves the door; after another 5.1 seconds it closes.
6. No browser page errors.

Inspected `evidence/world-before.png` and `evidence/world-after.png`: authored interior connects to an outdoor path; walls, shelves, tables and foliage are from the existing map, not newly generated layout. Character scale is larger than the source tiles and needs art-direction tuning before integration. Tiles are currently conservatively blocked; do not claim full original pathfinding or combat. This is a useful world/interaction extraction proof, not the finished tavern deliverable.

Production code and campaign paths were not changed by this experiment. Reusable source provenance and art notices are in README.md. Full world art clearance remains incomplete; do not deploy this evaluation publicly.
