# Next Luna milestone: a connected playable beta

Assigned October 27, 2026. Owner wants sustained gameplay progress at low assistant usage. The earlier game-night QA package is finished as a review checkpoint; this is the next implementation assignment. Read AGENTS.md and CURRENT_STATUS.md, then work through this entire queue without approval between internal steps. Record the full starting SHA and work on a separate branch. Preserve existing checkouts, installations and saves.

## Deliverable

Make the EXISTING tavern, clearing and ruins feel like one coherent playable adventure: distinct readable pixel-art environments on the shared TV, visible existing objects and characters, understandable existing quest progress, working existing travel/return controls, and persistent consequences on revisits. Use the already implemented quest/crafting/creature/travel systems. The deliverable is one complete supported quest and return journey, not new region types, arbitrary physics, underwater play or an infinite island.

This is explicitly approved presentation/integration work on existing outdoor features before physical hardware acceptance. The physical gate still applies to acceptance and major world expansion; it does not block this package. Phones remain remotes for the shared TV. Current travel behavior is not authorization to design party-splitting or voting mechanics.

## Continuous queue

1. Fix the known boot-message/CSP mismatch: move the existing inline error handler in `public/index.html` into `public/boot-error.js`, load it as an external same-origin script in an order that catches app startup failure, and preserve its escaped error display. Keep the server's CSP unchanged. Prove normal startup has no CSP error and an intentionally intercepted failed app load produces a useful boot error. Do not expose stack traces or credentials in user-facing messages.
2. Inspect actual screenshots of the existing clearing and ruins, then improve their scenery/readability with existing licensed tiles/sprites and rendering primitives. Each should be visibly distinguishable from the tavern and each other. Draw real saved objects/creatures at their real positions; show meaningful existing conditions. Do not decorate unsupported interactive content as if it were usable. Preserve canvas coordinate mapping, collision/action targeting and prompt local feedback.
3. Present existing canonical quest status, objective and supported next steps clearly on the shared TV and controller. Use saved quest data and known supported interactions. Preserve IDs, escaping, first-declaration lock, event wiring, disabled states, and authoritative results. Avoid revealing undiscovered information. Make existing travel/return and inventory affordances easy to find without changing their commands.
4. Complete one actual existing quest journey using two independent controllers, travel between existing areas and return. Verify the same campaign survives restart/rejoin and that changes remain visible on revisit. Fix presentation defects within scope. Record engine/AI defects with a reproduction and continue independent items.
5. Review screenshots at TV 1280x720 and phone 320x568/390x844. Run appropriate focused checks while iterating; run one integrated `npm run verify` at delivery, plus the new game-night browser check and existing campaign/world-items browser checks. Run browser scripts sequentially to reduce timer-related flakiness. Keep an existing test failure visible; never weaken an assertion to obtain green results.

## Allowed changes

- `public/index.html` and new `public/boot-error.js`: only the boot-handler extraction described above.
- `public/render.js`, `public/environment-render.js`, `public/world-render.js`, `public/style.css`: presentation of existing canonical state; existing licensed assets only. No simulation or timing changes. Long canvas-name labels may receive a readable presentation treatment without changing character names/identity.
- `public/app.js`: presentation markup/helper changes for existing quest/travel/inventory views only. Preserve all event handlers, network calls, command payloads, selectors used by existing tests, sanitization and route/identity/state-management code. If an improvement requires editing those sections, queue it for stronger review.
- `tests/luna-game-night-browser.mjs`: extend the assigned QA runner for actual boot behavior and presentation cases; preserve current functional assertions. Existing tests/helpers/fixtures stay read-only.
- `docs/LUNA_PLAYABLE_BETA_RESULTS.md`: one concise delivery report, not a series of new process documents. Screenshots/logs go in ignored `artifacts/luna-playable-beta/` with PINs masked.

Rules/physics/rewards, campaign generation, saves/migrations, multiplayer/credentials, AI/model settings, CI, package/dependencies, validators and golden expectations require stronger design/review outside this assignment. Do not hand-edit generated files; regenerate only via the approved build and inspect drift.

## Usage and completion

Read the relevant modules once, keep a short task list, implement meaningful batches, and save small reversible commits internally. Do not rerun the whole suite after every cosmetic adjustment. Prefer existing tests. Keep full logs out of chat. Rerun a failed check only after understanding the failure or changing something relevant; do not cycle blindly. Do not delegate to additional agents or call live AI for this package.

Continue until all independent implementation items are delivered or genuinely blocked. Push the milestone branch for source backup with honest check results; do not merge or deploy. Stronger review is required at delivery. Do not call the game a physically accepted beta or estimate a completion percentage. Report visible gameplay improvements, actual checks, remaining defects and exact source commit. Existing Mac archive provenance and real-model qualification remain open.
