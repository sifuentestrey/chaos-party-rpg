# Playable beta milestone results

Completed October 27, 2026 on branch `luna/game-night-presentation-qa`, starting from `a889bf29a596acc3b4edbc08c947f709916245dd`.

## Changes

- Extracted startup recovery into same-origin `public/boot-error.js`, loaded after the app container and before the module runs. The message is generic and does not expose exception details, stack traces, or credentials; server CSP is unchanged.
- Reworked existing outdoor scenery primitives so forests/clearings, marshes, and ruins have distinct silhouettes, ground, paths, and landmarks while retaining saved decor positions and gameplay targeting.
- Made long TV character labels fit the available space and improved outdoor quest cards and controller guidance using canonical saved quest state.
- Extended the game-night browser check to intercept a failed app load, exercise two independent phone controllers, travel clearing-to-ruins and back to the tavern, and capture the 1280×720 outdoor scenes.

## Verification

- `npm run verify`: passed; 184 tests, generated-output drift check, and static build passed with AI disabled.
- `tests/luna-game-night-browser.mjs`: passed; failed-boot recovery, 13 layout checks, two phone controllers, declaration/reaction/result, clearing and ruins presentation, and travel/return. No browser errors. Screenshots and result data are in ignored `artifacts/luna-playable-beta/`.
- `tests/campaign-browser.mjs`: passed; existing keepsake quest, creature interaction, crafting/equipping/returning the heirloom, travel to ruins and back, save/restart, and character rejoin.
- `tests/world-items-browser.mjs`: passed; item creation, equipment, transfer, drop/take, travel across all three areas, restart, and identity rejoin.
- Syntax checks passed for the edited JavaScript modules and browser runner.

The two-phone browser run verified independent controllers during a separate travel/return session; the full keepsake quest/restart script currently drives its quest actions from one controller. The app-side quest mechanics, save identity, and return behavior were unchanged. No live model, paid service, or physical hardware was used, so real-model qualification and physical acceptance remain open.
