# Source snapshot

Foundry D&D5e: https://github.com/foundryvtt/dnd5e

Downloaded master source archive October 26, 2026. Archive SHA-256: `dbd3fbffc70168ff1ed84985b76a164205a728893e7e428f2669108740a77772`.

`basic-die.mjs` is the unchanged `module/dice/basic-die.mjs`, SHA-256 `067771399a616cc6ee6c65fda675a6e97d342ec67fb1cad2f186f4f5dbf2f03a`.

The build extracts only the body of `BasicDie.advantage`, removes its unnecessary async boundary, and supplies already-rolled deterministic results. No Foundry globals, proprietary core, or game compendium is included. MIT notice retained in LICENSE.txt and shipped browser/release notices. This is source reuse for selection of advantage/disadvantage dice, not reuse of the full D&D ruleset.
