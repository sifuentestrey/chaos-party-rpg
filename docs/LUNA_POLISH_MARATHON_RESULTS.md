# Luna polish marathon results

Date: October 27, 2026. Branch: `luna/polish-and-accessibility`. Baseline: `79ccd7c8565f51d06d9ccec343bf204189e0f95c`.

## Implemented

- Items 1–7: improved small-screen tap targets and wrapping, visible focus, hover/pressed/selected states, readable mobile input size, dialog bounds, and reduced-motion handling in `public/style.css`.
- Items 8–15: clarified empty inventory and travel together copy, added empty pockets text, improved equipment details/readability and phone layout in `public/app.js` and CSS. Existing actions and their command strings were preserved.
- Items 22–23: name fitting now measures using the label's actual font size and iterates Unicode code points in `public/render.js`.
- Items 26–27: health, coin and experience labels are explicit for assistive technology; existing icon controls retain their accessible names.
- Item 34: captured and visually inspected clearing and ruins at 1280×720 in `artifacts/luna-polish-marathon/`. The assigned browser runner also covers both phone sizes and landscape dialog.

## Existing behavior or partial evidence

- Items 2, 9, 10, 13, 14, 16–18, 20, 24, 27 and 29 were already substantially present; no redundant markup rewrite was made. The new CSS improves their narrow layout. Existing regional quest status already uses saved quest steps and disclosure checks.
- Items 19 and 21 received general wrapping/contrast styles, but a focused crowded roster and post-completion TV screenshot were not produced.
- Item 25 has existing separate declaration/reaction/result states; copy was not changed without a focused browser review.
- Item 28 still describes the host canvas as a tavern in the inspected `hostScreen` markup; changing this needs an additional dynamic description check and remains open.
- Item 30 existing recovery text remains in place; no dedicated narrow connection-loss screenshot was captured.
- Item 35 remains open: no browser assertions were added for focus outline, injected long names, or reduced-motion computation.

## Blocked and remaining

- Items 31–33 remain incomplete. The campaign browser script that exercises quest completion, revisit, restart and rejoin is explicitly read-only per this assignment; the assigned runner's two-phone travel check does not itself complete a quest. A dual-controller full-quest restart flow was not added, so this core evidence gap remains for stronger review.
- Item 34 is partial: no completed-quest TV capture or dedicated 320×568 and 390×844 quest/inventory/travel captures were inspected.
- Items 36–39: this report records only the performed review/checks. Final stronger review is pending.

## Checks performed

- `node --check public/app.js` and `node --check public/render.js`: passed.
- `git diff --check`: passed.
- `node tests/luna-game-night-browser.mjs` with AI disabled and isolated evidence directory: passed, 13 layout checks, two controllers, travel/return, no browser errors.
- `npm run verify`: passed, 184 tests, seven generated outputs checked, static build passed with AI disabled.
- Campaign and world-items browser scripts were not rerun during this marathon.

No live model, paid service or physical device was used. The original Mac archive, physical acceptance and live AI qualification remain open. This branch is for stronger review; not all 39 items are complete.
