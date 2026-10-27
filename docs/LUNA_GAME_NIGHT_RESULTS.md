# Luna milestone: game-night presentation and browser QA

**Run date:** October 27, 2026 UTC  
**Baseline:** `e14cabf55e226e524c97671907de997853f6dff0` (`fix/grounded-action-contract`)  
**Milestone branch:** `luna/game-night-presentation-qa`

## Delivery status

The scoped QA work is implemented. Browser behavior and layout checks reached the end of the host/two-controller sequence, but the new runner intentionally exits nonzero because it recorded repeated Content Security Policy console errors. That issue requires files explicitly outside this milestone. This checkpoint is for stronger review, not a clean browser-console acceptance.

No presentation defect in `public/style.css` was isolated during the tested views, so this milestone made no CSS changes. Avoid cosmetic changes without a reproducible defect and an acceptance case.

## Browser evidence

Added `tests/luna-game-night-browser.mjs`. It starts a loopback-only server with a private temporary campaign and AI explicitly disabled. It closes the server and deletes the temporary campaign in `finally`. It uses two independent controller browser contexts and writes screenshots/results only under ignored `artifacts/luna-game-night/`.

The completed run checked ten viewport/page-width cases: host/home at 1280×720 and 1920×1080, controller screens at 320×568 and 390×844, and the recovery dialog at 568×320 landscape. All ten had no horizontal page overflow. It exercised home help, host controls, recovery dialog, character entry, visible inventory, a first accepted declaration, the second player's reaction, and the host dice result. All functional assertions passed. The PIN is masked in controller screenshots. The magenta rectangle in full-page controller captures is Playwright's redaction mask over the recovery-PIN card, not a game rendering defect.

Evidence: ignored local `artifacts/luna-game-night/results.json` and screenshots. Screenshots and raw runner output are not committed; no save or credential data was included.

## Verification results

- `npm run verify`: **passed** — 184 offline tests, seven generated-output drift checks and static build. Game AI was disabled.
- `tests/luna-game-night-browser.mjs`: layout and game-state assertions completed; **command failed** at its clean-console assertion. It recorded five CSP violations across browser page loads. They say an inline script was blocked by `script-src 'self'`; no page JavaScript exceptions were recorded. Evidence is in `artifacts/luna-game-night/results.json` and `/workspace/chaos-party-recovery-5J3f2UBP/luna-qa-browser-final.log` in this workspace.
- `tests/dm-narrator-browser.mjs`: first parallel run hit a timing assertion (`ready` where the script expected `thinking`). Rerun alone **passed** with synthetic replies; no live inference.
- `tests/world-items-browser.mjs`: **passed** create/wear/transfer/drop/take, location changes, server restart and character rejoin.
- `tests/campaign-browser.mjs`: **passed** quest, crafted item, travel, region restore, server restart and character rejoin.
- `git diff --check`: passed.

## Escalation queue

1. `public/index.html` includes an inline boot-error handler, while `src/game-server.mjs` sends `script-src 'self'`. Browsers block the handler and log a CSP violation. This prevents the intended visible boot-failure message if the app fails to load. Both files are outside the approved paths. Review a narrowly scoped CSP-safe fix, then rerun the new browser check and the release checks.
2. In the 1920×1080 host screenshot, a long supported character name is visibly truncated in the TV canvas label (for example, “Sir Snacks the M”). That rendering logic lives in `public/render.js`, outside this milestone. Decide whether the existing 16-character label cap is acceptable or design a renderer change with a screenshot acceptance case.
3. Physical Mac/TV/iPhone/Android playtesting remains unverified; browser viewport simulation is not device acceptance. The original `Chaos_Party_Mac.zip` was not supplied. Real-model quality and live narration remain separate, unqualified gates.

## Scope and handoff

Only the new browser runner and this report were changed. `public/style.css`, game implementation, existing tests, CI, dependencies, save formats, AI configuration, and generated outputs were untouched. All checks used disposable data and synthetic/offline behavior. No runtime model request or deployment occurred.

The two code/render findings above need a stronger reviewer. Do not broaden Luna's file allowlist to clear the browser failure; update the task scope and acceptance criteria first. The physical game-night gate remains open.
