# Luna marathon: make the existing adventure easier to play

Assigned October 27, 2026. Owner requests a substantial, continuous queue of low-consequence work for Luna. Gameplay baseline: `16e823cb8d5d5fdfd19f1c9d352490efc966103f`. Work on `luna/polish-and-accessibility`; record the assignment commit before editing. Read AGENTS.md, docs/CURRENT_STATUS.md, docs/LUNA_WORKFLOW.md, and docs/LUNA_PLAYABLE_BETA_RESULTS.md first.

This assignment explicitly authorizes the bounded presentation changes below before physical hardware acceptance. The original Mac archive is still unavailable. No claim about its equivalence, physical playability, model accuracy, or completion percentage follows from this work.

## Work continuously

Complete all six batches without asking the owner between items. Prioritize visible improvements over reports. Inspect existing behavior first: if an item already works, retain it and record the observation instead of making a needless edit. Each item ends as implemented, already satisfied with evidence, or blocked with a concrete reason. Continue independent items when blocked; do not invent extra features to fill time. Save reversible commits per meaningful batch. Deliver for stronger review; no merge or deployment.

## Exact file ownership

- `public/style.css`: presentation and responsive/accessibility styles only. Preserve visibility of controls, disabled behavior, canvas dimensions and coordinate mapping. Add a clearly labeled section rather than reformatting the entire file.
- `public/app.js`: markup, copy, classes and accessibility attributes in `home`, `creator`, `joinScreen`, `hostSetup`, `header`, `questCard`, `regionalQuestCard`, `regionControllerGuide`, `joinCard`, `roster`, `hostScreen`, `controllerContent`, `itemControls`, and `environmentControls` only. Preserve current function signatures, reads, existing element IDs, selectors, data attributes, escaping, loops, conditions and command strings. A small pure display helper adjacent to those functions is allowed; it must read current public state only. No event handling, state assignment, networking, timers, audio, routes, identity or new action dispatch.
- `public/render.js`: `fitName`, `label`, and the label calls within `person` only. No scene update/render-loop, sprite position, movement, timing, impact or simulation changes.
- `tests/luna-game-night-browser.mjs`: extend this assigned browser runner using existing helpers. Preserve all existing functional assertions and failure checks. Temporary campaigns only; mask recovery PINs in screenshots.
- New `docs/LUNA_POLISH_MARATHON_RESULTS.md`: one concise delivery report with a numbered disposition for each queue item.
- Other files are read-only. The normal approved build may regenerate its existing outputs; inspect drift and never hand-edit generated code. Do not change dependencies, assets, content JSON, test helpers, validators, goldens, CI, AGENTS.md or this assignment.

If a listed function name differs in the checked-out source, locate its actual definition and record that before editing; the file and behavior boundaries still apply. Do not perform blanket replacements or refactor app.js to make presentation work easier.

## Batch 1 — phones that are comfortable to use

1. Make existing primary action and reaction buttons comfortably tappable, aiming for 44 CSS pixels, without overlapping neighbors or changing available reactions.
2. Give keyboard users a clearly visible focus indicator on buttons, links, inputs, selects and summary elements; preserve browser focus behavior.
3. Make hover, active, selected and disabled states distinguishable with more than a subtle color shift. Keep disabled controls disabled.
4. Prevent long player names, item names, quest titles and saved-room text from pushing the phone page sideways. Use wrapping where useful; preserve the actual strings and identities.
5. Check existing dialogs at 320×568 and landscape 568×320: scrolling must reach their existing close/submit controls, and content must stay inside the viewport. No dialog event changes.
6. Check input typography and spacing on narrow screens so text entry remains readable and the declaration submit button is reachable by ordinary scrolling. Do not promise software-keyboard behavior without testing real devices.
7. Give decorative motion a reduced-motion CSS treatment where needed. Preserve gameplay feedback and all authoritative deadlines; no renderer animation changes in this batch.

## Batch 2 — clearer existing inventory and travel

8. Give existing pockets/items sections consistent heading, spacing and visual hierarchy; keep them subordinate to the declaration control.
9. Show a friendly empty-state sentence only when the relevant existing inventory/list is actually empty. Do not substitute an empty-state claim when data is missing.
10. Make the existing equipped/carried distinction readable wherever current public item state supplies it; add no slots, equipment logic or actions.
11. Improve wrapping of existing item descriptions and condition labels; do not infer additional material properties or capabilities.
12. Make existing inspect/take/drop/use/equip controls visually distinct and consistently spaced. Preserve every command and existing availability condition.
13. Make the current-location heading and existing path controls easy to find within environmentControls; phones remain remotes, with no phone-side world scene.
14. Make existing path destination names readable and clarify that travel moves the shared party. Do not add votes, split parties, confirmation dialogs or new travel commands.
15. Improve readability of the existing nearby people/creature/object lists without changing order, targeting, filtering or what is discoverable.

## Batch 3 — readable quests and TV presentation

16. Style the recently added regional-objective and regional-progress markup deliberately; make status and checklist readable at 1280×720.
17. Separate undiscovered, in-progress and completed quest presentation using existing saved quest status/steps. Preserve disclosure conditions; do not reveal a keepsake/tool/location before existing UI would reveal it.
18. Improve spacing and wrapping of long canonical quest titles and progress labels; never change rewards, objectives, IDs or counts.
19. Keep TV overlay text readable over both clearing and ruins backgrounds using panel contrast and restrained styling. Do not move world entities or change the camera/canvas mapping.
20. Ensure room code, join instructions and existing QR stay legible and unobstructed in the TV layout. No QR generation or address changes.
21. Improve wrapping of long roster names and existing connected/reconnecting/muted labels while preserving roster order and moderation wiring.
22. Correct canvas name fitting to measure with the actual font used to draw the label. The current fitName call can inherit a previous canvas font; inspect that before changing it.
23. Avoid splitting a Unicode code point in an ellipsized canvas name. Keep fitting bounded, respect the chosen width, and preserve the stored name. No new dependency; prefer standard language features compatible with the current runtime.

## Batch 4 — help and accessibility within existing screens

24. Improve existing landing/setup copy so a first-time host understands TV + same-Wi-Fi phones, room code/QR, and the existing recovery PIN. Keep text short and preserve all flows.
25. Clarify the existing distinction between submitting a declaration, reacting to someone else, and waiting for the result in controllerContent copy. Do not add timers or change phase logic.
26. Make visible XP, coins and HP labels understandable without relying on decorative symbols alone; preserve the exact canonical values.
27. Add or repair accessible names for icon-only controls in allowed markup functions. Prefer native labels; do not add global keyboard listeners or invent interactive roles.
28. Make the existing scene canvas accessible description reflect its current saved location and player count rather than always claiming it is a tavern. Escape dynamic names and preserve the canvas selector and dimensions.
29. Review heading/label associations in the allowed creator/join/setup markup; improve missing associations without changing validation, IDs or focus management.
30. Keep connection/recovery help readable at narrow widths. Present only current public connection state; do not claim a reconnect succeeded, reveal tokens, or expose stack traces.

## Batch 5 — close the remaining browser-evidence gap

31. Extend the assigned browser runner so two independent phone contexts participate in ONE complete existing supported quest journey, not just a separate travel-only session. Use the real browser controls and unchanged canonical quest mechanics; reuse existing helpers. Inspect campaign-browser.mjs read-only for a supported journey. Both phones must submit at least one meaningful accepted action. Do not patch live room state to manufacture completion.
32. In that same disposable campaign, travel away and revisit after quest completion; assert canonical quest/item consequences persist, and check the corresponding UI after the page has received the new snapshot.
33. Verify restart/rejoin of that same campaign through the existing server/join helpers and real saved identity; preserve tokens only in the disposable test context. Recheck quest status and at least one changed item/creature fact. Do not expose credential values in logs.
34. Capture and inspect TV 1280×720 clearing/ruins/completed-quest views and phone 320×568 and 390×844 inventory/travel/quest views. Give screenshots descriptive filenames under ignored artifacts/luna-polish-marathon/. Mask PINs. Fix in-scope overflow or readability problems; record engine defects for stronger review.
35. Add a focused browser check for keyboard focus visibility, long display text, and reduced-motion styling where actually changed. Use disposable user-entered long names rather than modifying engine name limits. Avoid assertion-only test duplication or screenshots with no actual inspection.

For 31–33, a failing engine invariant is a blocker for that item, not permission to repair core rules. Keep the failure visible, record the exact action sequence, and continue the presentation queue. Do not weaken an assertion, replace a real browser flow with direct state mutation, retry failed random rolls indefinitely, or hardcode randomly generated place/person names. Bound retries using existing harness practice and report exhaustion honestly. Reaching canonical server state is insufficient for a UI screenshot: wait for the browser's corresponding DOM state before capturing it.

## Batch 6 — deliver a reviewable package cheaply

36. Review every changed line against the ownership list. Confirm no command strings, event handlers, authority/identity logic, defaults, secrets or save behavior changed. Explain any pure helper added.
37. Run focused checks while iterating, then one successful integrated `npm run verify` near delivery. Run the assigned browser runner and existing campaign/world-items browser checks sequentially. Re-run a failure only after diagnosing it or making a relevant change. Preserve failures in the report, including timing flakes and environmental blockers.
38. Write one results report: starting/final source identifiers, changed paths, concise visible improvements, numbered item dispositions, exact checks and real outcomes, remaining defects, and physical/live-AI limitations. Keep full logs and screenshots in ignored artifacts, not chat or Git history.
39. Commit and push the assigned branch for stronger review. Confirm the remote branch head matches the local commit. Preserve other branches and installations; do not merge, deploy or package a new release.

## Usage limits and definition of done

No delegation, live game-model requests, model downloads, paid services, new dependencies, new artwork or external research. Read relevant files once and implement coherent batches. Avoid repeated whole-repository searches, repeated full-suite runs after cosmetic edits, new process documents, and lengthy chat narration. A brief update per completed batch is enough while still keeping the owner informed during long work.

This queue has 39 concrete items, not a promise that 39 code changes are needed. Finished means every independent in-scope improvement is delivered, already-satisfied items are evidenced, genuine blockers are recorded, required checks are reported honestly, and the branch is pushed for review. The reviewer decides acceptance. Physical game-night acceptance and live AI quality remain separate open gates.
