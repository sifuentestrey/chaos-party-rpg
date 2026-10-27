# Instructions for Codex / development agents

**Current readiness:** Read [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md) alongside the dated handoff and issue #9. Historical test counts, environment observations and push status are snapshots, not current qualification.

## Owner product direction update (2026-10-27) — read before planning new work
The owner supplied a new conversation handoff. **Read [docs/OWNER_HANDOFF_REACTIVE_HYBRID_WORLD_2026-10-27.md](docs/OWNER_HANDOFF_REACTIVE_HYBRID_WORLD_2026-10-27.md), [docs/QA_INDEPENDENT_READONLY_2026-10-27.md](docs/QA_INDEPENDENT_READONLY_2026-10-27.md), and [issue #9](https://github.com/sifuentestrey/chaos-party-rpg/issues/9)** before selecting work. Crucial decisions: **one shared TV game with phones as remotes (not phone-side adventures), majority votes only for major shared-party travel, a bounded hybrid handcrafted/procedural reactive island as a later direction, and both creative AI narration and grounded action interpretation**. **Do not** force a permanent-versus-episodic campaign decision, start the island expansion, enable unqualified narration, or incur paid usage merely because these plans were documented. The owner wants a successful first game night before larger scope decisions.


## Highest priority
Recover and preserve the existing Work prototype before editing. The owner found it visually unattractive and difficult to play. Do NOT respond by creating yet another generic dashboard UI or one-shot scratch-built prototype.

## Before any new implementation
1. Acquire Chaos_Party_Mac.zip; if missing, explicitly report that limitation. Never invent baseline tests or visual observations.
2. Inventory the ZIP read-only, check for credentials, dependencies, assets and upstream licenses. Make an untouched archival copy.
3. Run the real application, evaluate the TV screen at 1280x720 and the phone UI in portrait, and capture evidence. Confirm what portions of PartyFrame and Ninja Adventure, if any, were actually reused.
4. Audit *complete playable open-source RPG games* as possible visual/gameplay foundations; inspect runnable code and asset licenses, not just marketing pages or README claims. Test compatibility before any engine change.
5. Preserve known-good phone lobby, concurrency, saves and characters whenever practical.

## Experience requirements
- Main TV display is a continuous coherent pixel-art scene, not a website with scattered cards.
- A character physically acts; target visibly reacts (lunge/hit/knockback/effects/sound). Animate promptly; don't wait for cloud AI.
- Individual character customization is mandatory and the preview must visibly respond to outfit/hair/skin changes.
- First valid free-form declaration accepted once on server, no takeback; player reactions follow. Dice determine outcome. AI may narrate but cannot silently rewrite game state.
- 15–20+ phone clients, reconnect, persistent characters and campaign, brief fairness cooldown, simple host control.
- Old MacBook performance must be measured, not assumed.

## Quality gates
No major feature development until a 90-second tavern sequence is visibly enjoyable and tested with two physical controllers. Iterative screenshots and gameplay inspection are required. Record poor visual elements explicitly and repair them.

## Boundaries
Family project; the owner explicitly approved keeping the source repository public on 2026-10-27. Never touch Family Board, Clinician Index, or unrelated apps. Do not purchase services, deploy the game publicly, expose secrets or live saves, or copy proprietary games/assets without permission. Keep proper third-party notices. REA is an optional code-analysis tool, NOT automatic permission to copy proprietary code. Save and test changes in small reversible commits.

## Owner-requested coding team
Use SOL 6.1 with max reasoning for delegated design/review and Luna 6 for bounded implementation/test tasks. The main chat model remains the owner's selection. Give workers explicit file ownership and acceptance criteria, review their diffs and test assumptions, and run the actual checks before accepting changes. This workflow does not authorize paid game services or bypassing request limits.

Read [docs/LUNA_WORKFLOW.md](docs/LUNA_WORKFLOW.md) before assigning a cheaper worker. Ordinary Luna tasks use the approved green lane and may not widen their own scope into mechanics, identities, saves, networking, AI authority, provider settings, validators or CI. Campaign text values have a validated JSON lane; hand-editing generated JavaScript is prohibited. Run `npm run build` to regenerate approved output, then `npm run verify` before claiming a change ready. `npm test` runs offline with an isolated default data directory; live model qualification is a separate explicitly budgeted task. Passing checks do not remove semantic review or the physical game-night gate.

For the green campaign-text lane, the reviewer records a full immutable base SHA before work. Require `node scripts/accept-content-task.mjs <approved-full-base-sha>`: it checks changed-file scope before and after offline verification. Do not let a worker redefine that base, allowlist, check scripts or golden expectations. Other lanes need separately specified acceptance.

**Owner workflow clarification (October 27, 2026):** Luna should complete substantial approved milestones continuously, without asking the owner between internal steps. The assigned presentation/QA work package is [docs/LUNA_MILESTONE_GAME_NIGHT.md](docs/LUNA_MILESTONE_GAME_NIGHT.md); follow its explicit paths, acceptance and escalation rules. Work through independent items and batch stronger review at the milestone boundary. This authorizes that specified yellow-lane package, not expansion into protected systems or removal of physical acceptance gates.

**Next owner-directed implementation package (October 27, 2026):** [docs/LUNA_PLAYABLE_BETA_MILESTONE.md](docs/LUNA_PLAYABLE_BETA_MILESTONE.md) supersedes the earlier QA-only assignment as the next Luna task. It explicitly permits presentation/integration of the already implemented clearing/ruins adventure and the specified boot-handler repair before hardware acceptance. Follow its code boundaries and continuous queue; the hardware acceptance and major-expansion gates remain.

**Latest owner-directed Luna package (October 27, 2026):** After playable-beta checkpoint `16e823c`, execute [docs/LUNA_POLISH_MARATHON.md](docs/LUNA_POLISH_MARATHON.md) on `luna/polish-and-accessibility`. Its 39-item continuous queue authorizes specified presentation/accessibility work and browser evidence within exact function/file boundaries. It supersedes the completed package as the next assignment; core mechanics, saves, networking and AI remain outside worker scope. Deliver for stronger review.

**Latest owner-directed visual package (October 27, 2026):** The completed polish marathon is superseded as the next worker assignment by [docs/LUNA_VISUAL_GAME_NIGHT_RELEASE.md](docs/LUNA_VISUAL_GAME_NIGHT_RELEASE.md), on `luna/visual-game-night-release` from immutable baseline `da72db54f490cef62e7ea1f68b79737d1867fc96`. Execute all six batches continuously. This explicitly authorizes its bounded renderer and presentation work before hardware acceptance; major world expansion, core systems, live AI and release acceptance remain outside the worker package.
