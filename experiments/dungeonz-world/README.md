# Existing-world gameplay proof

Run `node experiments/dungeonz-world/build.mjs`, serve the repository root locally, and open `/experiments/dungeonz-world/`. Use WASD/arrows to walk and E to open a nearby door. This isolated proof never reads or writes Chaos Party campaigns. It is not the production game or a multiplayer replacement.

## Actual reuse

- Dungeonz commit `4f16ab19093ae4ce07d754d2e10690eeb202807b`, https://github.com/Gamessystem/dungeonz . Original authored `tutorial.json` map and ground/statics tile sheets copied without edits.
- Original `WoodDoor`, `Breakable`, `Interactable`, `Static`, and `Entity` classes execute through their actual inheritance chain. Energy checks, blocking, five-second reactivation, and occupied-door checks use upstream behavior. The original Damage model is also bundled, but not used by this walk/door proof.
- Source files under `upstream/` are unchanged. `build.mjs` disables server filesystem writes and supplies a minimal warning setting in place of reading server configuration. The board adapter and keyboard/camera renderer in `play.js` are new compatibility code. General static collision is deliberately conservative (every non-door static blocks); this is not the original full movement engine.
- Character rendering reuses Chaos Party's existing Ninja Adventure compositor (CC0 assets), not a new character implementation.

## Notices and limitations

Dungeonz code/map: MIT, copyright 2021 Johnathan "Arcan" Fisher; full license in `upstream/LICENSE`. Original credits are preserved in `UPSTREAM-CREDITS.html` as evidence, not a local navigation page.

Tile sheets include work credited upstream to DragonDePlatino (DawnLike), DawnBringer (palette), and Joe Williamson (Roguelike Dungeon/World Tiles). Preserve CC-BY and CC-BY-SA attribution and share-alike terms for applicable artwork. DawnLike's bundled README specifies CC-BY-SA 3.0 while the game's credits specify CC-BY 4.0; retain both notices and treat it conservatively under share-alike terms pending asset-by-asset provenance confirmation. Licenses: https://creativecommons.org/licenses/by-sa/3.0/ and https://creativecommons.org/licenses/by/4.0/ . Assets remain separate from MIT code. No artwork has been modified.

This is a local evaluation, excluded from the shipped `public/` build. Do not present it as a finished Chaos Party world, full Dungeonz execution, integrated tabletop rules, or verified physical-controller gameplay. Full asset provenance and a complete collision adapter remain gates before shipping these world assets. No accounts, paid services, or public deployment are required.
