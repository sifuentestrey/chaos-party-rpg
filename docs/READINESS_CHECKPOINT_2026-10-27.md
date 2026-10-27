# Offline game-night readiness checkpoint — October 27, 2026

This completes the currently feasible software preparation for issue #9. It does **not** close the live-model or physical-device acceptance gates. The game rules remain the repaired checkpoint; this pass adds qualification tooling, package provenance, documentation, browser-test reliability and accurate victory balance wording.

## Results

- Final full `npm test`: **151 tests passed, zero failed**. `npm run build` and `git diff --check` passed.
- `tests/beta-browser-check.mjs`: two independent browser controllers, six opening rounds at normal reaction/reveal pace (**92,723 ms**), then full crown heist and escape; 13 actions total, no browser errors. Tests use the actual local game server and UI with AI off.
- `tests/world-items-browser.mjs`: 28 browser actions, arbitrary wearable creation, equip, transfer, drop/take, tool use, three locations, real server restart and saved-character rejoin; no browser errors.
- `tests/campaign-browser.mjs`: generated quest, pacification, coffer, crafted heirloom, recipient ownership, travel/region restoration, server restart and character rejoin; no browser errors. This validates the existing simple campaign, not a newly built island sandbox.
- `tests/dm-narrator-browser.mjs`: 1280×720 host and two 390×844 phone views, one retained reaction, exactly one synthetic narrator request, unchanged world, no browser errors. Story panel height/scroll height were **202/202 px**. No real model was tested.
- Standalone package built with official Node 22.23.4 Darwin x64/arm64 archives verified against both the pinned hashes and official checksum list. `CHAOS_AI=off node tests/release-smoke.mjs` exercised the bundled server outside the repository with no development `node_modules`, including assets, two controllers, authorization, a declaration/reaction/roll and persisted campaign. The Mach-O runtimes cannot be executed on this Linux worker; target-Mac startup remains unverified.

## Test-harness repairs discovered during this pass

Screenshot review also found the victory UI describing total XP/coins as newly “earned,” even though totals can include starting or previously held coins. It now says “You have”; the full heist browser check verifies both controllers against the actual saved totals. Reward mechanics were not changed.

The host controls dialog captures a snapshot when opened. Fast browser checks could open it before the browser received the current phase, leaving the skip button disabled; a short timer could also finish while a screenshot was captured. A shared helper now checks the actual phase, closes/reopens stale dialogs and never skips an already-ended timer. Three deterministic helper regressions pass. The alternating-controller check now waits for the next actor's input rather than waiting on the previous actor's fairness cooldown. These are test-fixture changes, not a production timer rewrite.

Inventory/campaign browser scripts closed the browser before the server, triggering reconnect waits during teardown. Server-first shutdown and disposable-directory cleanup now let successful runs exit normally. One campaign report also retained the initial quest snapshot even after asserting completion; it now records the restored current quest.

The first tavern video attempt lacked Playwright's private ffmpeg installation. The final run used the already installed system ffmpeg through a task-local tools directory. Later runs exposed the timer-control race. One timed run also missed a brief reveal while the full parallel Node suite and video capture competed for this worker; the final isolated run passed. Failed or interrupted attempts were not counted as completed passes. No physical-network or Mac-performance conclusion follows from cloud scheduling.

## Screenshots and visual observations

- [Reactive tavern](evidence/readiness-2026-10-27/tavern.png).
- [Phone controller, recovery PIN masked](evidence/readiness-2026-10-27/controller.png).
- [Synthetic narration layout](evidence/readiness-2026-10-27/synthetic-narration-host.png).
- [Sanitized browser result summary](evidence/readiness-2026-10-27/browser-results.json).

The tavern remains one continuous pixel-art scene, and the controller shows character/outcome/inventory rather than a separate playable world. The inspected synthetic story fit in the host panel. Small story/roll text still needs couch-distance review. The existing outdoor clearing is visually rudimentary, with simple block-shaped terrain/creature art and dense labels; it is not signed off as the later polished sandbox proof. Audio delivery, TV readability, enjoyment and actual 2015 Mac heat/frame pacing remain unmeasured here.

## Cost and remaining gates

No live game inference or provider-model discovery was performed. The existing shared test ledger remained at **100/100 for October 27 UTC**; its SHA-256 stayed `c8661b949db673d4499df4d400576a38e2d45e0d1617e7d346d2ba61fd991b32`. The guarded six-case live CLI was denied before provider contact. Six synthetic interpretation cases pass canonical checks; three synthetic narration fixtures remain pending semantic review and cannot pass automatically. [Qualification procedure](AI_QUALIFICATION.md) and [session-capacity arithmetic](FREE_AI_SESSION_LIMITS.md).

Generated narration stays off by default; the combined action contract stays opt-in. The original `Chaos_Party_Mac.zip` was not supplied. Live AI qualification after the normal allowance reset, adequate full-night free capacity, actual Mac/TV/two-phone play and later large-group acceptance remain open. World expansion and travel voting remain after those gates. Original files, checkouts and family saves were preserved; no paid service or public deployment was introduced.
