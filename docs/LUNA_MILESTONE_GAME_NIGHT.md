# Luna milestone: finish the existing game-night presentation and browser QA

**Assigned October 27, 2026. Owner direction:** work continuously through a substantial milestone, without asking the owner to approve each small task. Use small reversible commits internally, but deliver the completed milestone for one stronger review. This is coding-assistant workflow, not a game AI/provider change.

## What you may finish independently

Improve and verify the existing first-game-night experience end to end: home/join, lobby/customization, TV scene, phone declaration/reaction/roll, inventory, results, reconnect and recovery UI. Keep the current coherent pixel-art scene and game behavior. This is presentation and QA of existing features, not new mechanics or island expansion.

Read AGENTS.md, CURRENT_STATUS.md and LUNA_WORKFLOW.md. The original Mac ZIP is unavailable; use the recovered checkout as the explicitly identified baseline. Do not claim Mac/physical-phone acceptance. Record the full starting commit and create a milestone branch; preserve unrelated changes. Do not reset or replace another checkout or saves.

### Exact manual file scope

- `public/style.css`: presentation only. Preserve hidden/disabled states, pointer behavior, scene hit areas, existing selectors, canvas dimensions/coordinate mapping and animation/game timing. Do not broadly restyle the game or replace the TV scene with cards. CSS can break controls; behavioral browser checks are required.
- `tests/luna-game-night-browser.mjs`: a new browser QA runner, using existing server/browser helpers as read-only examples. Use loopback-only server binding, a private temporary data directory and AI explicitly off or an explicitly synthetic adapter. Close server before browser, clean temporary data, exit nonzero on failed assertions. Do not modify existing tests, helpers or expected results. Never print tokens/PINs or publish raw private storage.
- `docs/LUNA_GAME_NIGHT_RESULTS.md`: one durable progress/evidence report, including an escalation queue. No blanket edits to historical evidence.
- Local screenshots/reports under ignored `artifacts/luna-game-night/`; redact recovery PINs/session secrets before sharing. These are local evidence, not public uploads.

Do not modify `public/app.js`, `public/index.html`, renderer modules, engine/server, content JSON, generated modules, schemas, provider settings, package/lockfiles, CI, existing tests or fixtures in this milestone. If a real issue needs those files, record it for review and proceed to another independent item. Do not turn a narrow scope limit into repeated owner questions.

## Continuous work queue

1. **Baseline and reproduce:** run the existing app with disposable data. Capture home/join, lobby/customization, TV and controller states. Record actual defects: clipping, unreadable text, inaccessible controls, long names, small-screen scrolling. Do not invent visual findings or change screens that already meet the criteria.
2. **Phones:** fix reproducible CSS defects at 320x568 and 390x844. Keep primary controls reachable by scrolling, avoid horizontal page overflow, keep disabled/locked controls distinct, retain visible keyboard focus and readable errors. Exercise the actual declaration, reaction and roll controls after edits. Check layout with a focused input; browser viewport simulation does not establish real iOS keyboard behavior.
3. **TV:** check 1280x720 and 1920x1080 at normal zoom. Preserve continuous scene, character visibility and room interactions. Ensure existing lobby/join instructions, timer, story/results and host controls are readable and not clipped. For a long supported story/name, make content accessible without covering essential controls. Do not add new rendering effects, animations, assets or narrative behavior.
4. **Dialogs and edge layouts:** verify existing inventory, recovery, help and host dialogs with portrait/landscape layouts and long supported input. Preserve escape/close/focus behavior and existing command routing. Fix presentation within scope; record behavioral defects separately.
5. **Regression evidence:** implement the new browser runner for the actual observed critical presentation cases. Assert no unintended horizontal page overflow, reachable controls and clean console/page errors, and exercise real host + two independent controller contexts. Include assertions that an accepted declaration remains locked, a different player can react, and result UI arrives. Use existing authoritative behavior and fixtures as references; do not invent a new expected mechanic. Screenshots alone are not assertions.
6. **Integrated acceptance:** run the existing automated verification and relevant existing browser regressions, inspect before/after screenshots, then prepare one concise milestone report. Do not keep adding cosmetic changes once the criteria are met. If everything already passes, report that finding rather than generating busywork.

## Checks and delivery

Use the existing browser harness setup and module paths; do not install new dependencies. If the browser runtime is unavailable, complete independent work and report the missing evidence; never fabricate screenshots or call the milestone verified. Existing browser scripts have differing runtime environment variable names; read each script before invoking it.

Run focused checks while iterating. At milestone completion run `npm run build`, `npm run verify`, the new browser runner, and the existing `tests/dm-narrator-browser.mjs`, `tests/world-items-browser.mjs` and `tests/campaign-browser.mjs` checks. Their model responses are synthetic, not live qualification. Record exact commands, exit codes and evidence paths. If a check fails, diagnose within scope; never delete/skip assertions to obtain green results.

`accept-content-task.mjs` deliberately rejects this broader milestone: its allowlist is only for campaign-text work. Do not alter that checker. A stronger reviewer compares all changed paths against this milestone's exact list and inspects the diff before acceptance. The new browser test is worker-authored evidence and requires review too.

Keep full logs in ignored files. Commit meaningful checkpoints with clear messages. Continue through independent queue items without asking for approval between them. Push the milestone branch as source backup once verified, preserving license/secret/save boundaries. Do not merge into the tested recovery branch, deploy, or call the game accepted. Update the report with source commits, before/after observations, actual check results, known issues and remaining physical/live-AI gates. Do not invent a success percentage.

## Escalation without stalling the whole milestone

Record: failing screen/action, minimal reproduction, expected behavior grounded in existing requirements, actual result, relevant evidence and the file/mechanic needed. Move to the next independent item. Stop dependent work if a regression threatens saved data, authority or identity; do not invent a workaround. Ask one concise question only if all remaining useful work is blocked by an owner decision.

Stronger review happens at this milestone boundary, or earlier for a core defect that blocks everything. Luna does not approve its own protected-system changes. Existing rules/save/network/AI authority and physical acceptance gates remain unchanged. Larger later milestones need their own design and acceptance contract after those gates are satisfied.
