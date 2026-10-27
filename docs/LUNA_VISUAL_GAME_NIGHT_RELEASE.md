# Luna: make the first adventure look like a finished game

Assigned October 27, 2026. Owner explicitly requests another substantial visual implementation assignment and a path to a full game. Work continuously on `luna/visual-game-night-release`. Approved implementation baseline: `da72db54f490cef62e7ea1f68b79737d1867fc96`. Record the assignment commit separately; do not move the baseline. Read AGENTS.md, docs/LUNA_WORKFLOW.md and the previous marathon results, then execute this entire queue without asking between batches. This is an expressly authorized presentation milestone before physical acceptance, not permission for major world expansion.

## Product target and release scope

The longer goal remains a reactive fantasy world and creative grounded AI DM. This assignment delivers a substantial visual upgrade to the EXISTING playable adventure, not the full island or qualified AI. First game-night release means: attractive TV scene, distinctive customizable characters, easy phone controls, understandable declaration/reaction/dice flow, a complete crown heist with a clear ending, optional existing outdoor quest/travel/return, and working save/rejoin. No invented playtime, completion percentage, or guarantee of fun.

Do the actual visual work first. Another checklist of already-satisfied accessibility details is insufficient. Prioritize batches 1–4; tests and documentation support the deliverable. If all art remains the same large rectangles with more CSS around it, the visual target is not met.

## Exact ownership

Allowed manual files:

- `public/world-render.js`: bodies of drawGeneratedLocation, drawBeast and drawItemGlyph and adjacent pure rendering helpers. Preserve export names/signatures, canonical anchors, saved positions, item appearance semantics, species, attitude, condition and shape distinctions. Read state only; no randomness, simulation or mutation.
- New `public/scene-art.js`: rendering helpers and bounded asset loading/caching ONLY, using already shipped assets and existing asset URL convention. No networking other than same-origin image loads, no storage, timers, event listeners, state mutation or game imports. A small static map of verified sprite crop coordinates is permitted here.
- `public/render.js`: imports of those pure helpers; visual drawing statements inside draw, label and person only. Keep draw order, entity counts, sprite selection, positions, targeting and existing effect/animation calculations. No constructor, setState, loop, position, avatarCanvas or drawPortrait changes. Do not change animation duration or action mappings.
- `public/style.css`: presentation only. Preserve canvas dimensions/aspect/coordinate mapping, readable controls, disabled states, focus and reduced-motion support. Consolidate conflicting rules you add rather than layering repeated overrides.
- `public/app.js`: presentation markup/copy/classes in header, home, questCard, regionalQuestCard, regionControllerGuide, chaosCard, joinCard, roster, hostScreen, controllerContent, itemControls, environmentControls and resultsCard only. Keep existing function signatures, state reads/assignments, branch conditions, loops, escaping, IDs, data attributes, command strings and element selectors used by code/tests. Keep current parent-child relationships where handlers depend on them. Native details/summary groups may wrap existing inventory/environment sections, with visible descriptive summaries and item counts from current arrays. Preserve their existing control elements and order. Do not move recovery information into an inaccessible disclosure. No event/state/route/network/audio/timer/identity changes.
- `tests/luna-game-night-browser.mjs`: extend assigned runner with existing helpers; preserve all prior assertions. Existing other tests/helpers are read-only.
- `docs/LUNA_VISUAL_GAME_NIGHT_RESULTS.md`: one final report. Artifacts/logs remain ignored under `artifacts/luna-visual-release/`.

Everything else is read-only, including assets/licenses, content, simulation, save schema, AI/provider settings, package/build/verification/CI and test oracles. Approved build may regenerate existing output; inspect drift and never hand-edit output. No dependency, art download, engine swap, paid service, live AI, model download or delegation. Never change real campaigns or replace installations. Original Mac archive remains unavailable.

## Batch 1 — establish and improve the actual art

1. Run the existing app with AI off and disposable data. Capture baseline TV tavern/clearing/ruins and phone open/reaction/result views. Reuse existing browser harness. Inspect actual images; do not infer visual quality from passing tests.
2. Inspect shipped Kenney and Ninja Adventure atlases and their license/source notices read-only. Use a temporary labeled contact sheet in ignored artifacts if needed. Record exact image and crop coordinates for any reused sprite; verify dimensions visually. Do not guess atlas indices. If no suitable outdoor art exists, use detailed pixel primitives within the current renderer, not a new asset acquisition project.
3. Use a coherent pixel scale, palette, outlines and grounded shadows. Turn the clearing's flat square canopies into layered irregular tree silhouettes with trunks, grass clusters, path edging and foreground/background depth. Keep decor anchored to location.decor and keep actors/targets clear. Decorative variation must be deterministic from existing coordinates/kind, never newly saved state.
4. Make ruins visibly different in structure, not just color: broken masonry silhouettes, cracked paving, partial columns/arches and restrained moss at existing decor anchors. Do not imply new interactive doors, treasure or traversable routes. Retain bounded, lightweight fallbacks for all current location kinds.
5. Replace the generic block animal treatment with recognizable distinct boar/wolf/crow pixel silhouettes, readable faces/legs/wings and grounding shadows. Preserve hp/dead, hit and friendly/hostile state meaning; do not invent species or behavior. Improve existing chest/gate/spring/item glyph detail without losing appearance colors, worn identity, open/locked/broken/burning/liquid indicators.

## Batch 2 — compose a readable TV game

6. Keep the continuous scene visually dominant. Align room code/join cluster, location/chapter heading and objective in a consistent perimeter layout. Reduce opaque UI covering the action while keeping controls, QR and code legible at 1280x720. Never hide the objective, reaction deadline or outcome to obtain a clean screenshot.
7. Fix crowded/low-contrast canvas labels using bounded backgrounds/outlines, typography and label-only offsets. Entity positions and anchors stay fixed. Keep names and condition information available; no hardcoded names or position-dependent action targeting changes. Avoid labels sitting directly under opaque panels when presentation adjustments can solve it.
8. Style the existing reaction and result panels as a concise readable game HUD: actor/attempt, dice outcome and actual changes remain clear. Do not change storyCard/storyteller code, dice calculations, timer logic or existing result data. If improvement requires those files/functions, report the exact blocker and continue.
9. Give tavern, clearing and ruins coherent warm/cool lighting and contrast using static bounded drawing. Preserve existing flames, action effects and prompt movement; no new full-screen animated filters, particle loops or per-frame asset creation. Never cover character customization with color overlays.
10. Check tavern idle, declaration/reaction, hit/failure/result and outdoor quest views, not just an empty scene. With the existing full-heist runner, inspect the ending as well. Don't add idle movement or combat behavior.

## Batch 3 — phones that feel like controllers

11. Keep character identity, current phase, declaration/reaction controls and submit button ahead of optional reference lists. Shorten repeated instructional copy without changing rules or claiming broader understanding. Primary controls must remain reachable at 320x568 and 390x844 by normal scrolling.
12. Reduce the long inventory/environment wall with native details sections around existing secondary information; visible summaries must identify the current place and inventory purpose. Preserve all existing item/travel commands, discoverability conditions and target names. Keep travel destinations easy to find without opening several nested groups. No tabs, custom disclosure state or new event code.
13. Repair cramped rows such as `Wayfarer6/10 HP` and `Wood Splinteritem-6 · Intact` with actual spacing, wrapping and visual hierarchy. Keep canonical names/IDs/values, and make no fabricated descriptions. Keep 44px primary targets and visible focus.
14. Make empty, full, long-name, disconnected, paused and accepted/waiting screens fit the same visual language. Preserve truthful connection status and locked declarations. Mask recovery PINs in evidence; never remove recovery controls to simplify the page.

## Batch 4 — a clear beginning, middle and ending

15. Polish existing landing/setup and host lobby visually so a new family member understands: TV shows the world; phones submit attempts; others react; dice decide. No onboarding wizard, new mode, rules or fake feature claims. Retain host, join, solo and resume routes.
16. Make existing quest steps and completed states legible on TV and phone. The heist must clearly communicate clues → crown → escape using existing disclosure rules. Outdoors must show the actual generated quest and its completion, not a generic heist label.
17. Polish existing resultsCard as a satisfying end screen using the actual participant names/stats and existing continue/restart controls. Do not invent achievements, rewards, narrative events or an ending for unfinished quests. Preserve buttons and their commands. Give existing successful outdoor chapter status a clear completed treatment without auto-opening a modal.
18. Confirm visibly different existing avatar hair/skin/outfit selections survive the TV and phone styling, and inspect existing action feedback and sound behavior. Reuse current controls; record missing or broken feedback for stronger repair instead of editing protected animation/audio logic.

## Batch 5 — prove the visible improvement

19. Extend the existing two-controller full quest/revisit/restart journey; preserve canonical consequences and identity assertions. If a new details wrapper affects selectors, open it via browser interaction rather than bypassing the UI or weakening assertions.
20. Capture matching before/after TV frames at 1280x720 for tavern/clearing/ruins and phone frames at 320x568/390x844. Inspect each image. Include open floor, reaction, result, complete quest and ending evidence. Show actual players/entities, not only the landing page. Mask PINs and retain no real save data.
21. Check landscape 568x320 dialogs, keyboard focus, reduced motion and long text. Assert no horizontal page overflow, startup/browser errors or missing loaded sprites. Keep asset-load fallback useful; test a failed relevant image request if new atlas loading is introduced. No golden image threshold generated from current output.
22. Give a concise visual verdict in the report: what is materially better, which screenshot shows it, and what still looks poor. Passing browser checks does not establish artistic quality or physical couch readability. Use a small before/after comparison sheet in ignored artifacts to make stronger review inexpensive.

## Batch 6 — delivery, then stronger review

23. Review every changed line against ownership and the immutable baseline. Remove debug controls, raw errors and accidental gameplay changes. Record any renderer helper cache bound and confirm no new requestAnimationFrame/timer/random/state-writing path exists. Record all in-scope unresolved defects; don't silently call them completed.
24. Run focused checks after changes, then one successful `npm run verify`, plus assigned game-night browser runner and existing campaign/world-items browser runners sequentially with AI off and disposable data. Diagnose failures before rerunning. Don't change other tests/helpers to get green. Existing matching screenshot baselines and final changes, not test counts, establish completion of this visual assignment.
25. Commit and push the branch for stronger review. Confirm GitHub head equals local HEAD. Report exact baseline/final SHAs, changed files, visible improvements, checks/failures and genuine blockers in the single results file. No merge, deployment or release packaging. Continue every independent batch even if one protected-system issue is blocked. No owner approval between internal steps.

## What still separates this from the complete game

Stronger reviewer owns, after this delivery: accept or repair visuals; inspect consequential renderer/markup changes; fix any demonstrated core gameplay defects; qualify live interpretation and narration within the established free limits; determine whether free capacity supports the intended session; build a reviewed candidate from the accepted source. Narration remains off until qualified. This worker cannot mark those gates passed.

Owner hardware acceptance: Mac + TV + two physical phones, then intended family group, checking sound, couch text, responsiveness, enjoyment, save/rejoin and Mac performance. Cloud browser evidence cannot close this gate. A release candidate is ready for this rehearsal only after stronger review and packaging of the actual accepted source.

Larger world completion is a separate subsequent implementation program: supported locations, reusable interactions, character/NPC progression and qualified grounded storytelling, designed and reviewed in bounded milestones. Do not promise it is delivered by changing visuals or mark the whole game finished after this task.
