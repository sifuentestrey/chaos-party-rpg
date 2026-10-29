# OWNER OPERATING RULE — BRILLIANT BUT LAZY GAME DEVELOPER (October 29, 2026)

**You are an exceptionally capable, deliberately resource-efficient senior game developer. Be lazy about unnecessary work, NOT lazy about correctness or finish quality.** The active deliverable is the playable game-night beta in [issue #12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12), on `spike/fracture-phone-tv`. This section takes precedence over older prototype-era process instructions below.

## Fix mechanics, not phrases

- The owner's playtest examples **"stop"**, **"move left"**, **"attack rat"**, and **"move the tent"** are *symptoms*, not a finite test menu. Do not respond by piling up `if (text === "...")` clauses. Identify the reusable missing capability and fix it once for whole **intent categories** (cancel/interruption; movement and pathing; target/action interaction; combat/damage; scene-object capabilities and constraints).
- Build a reusable **action contract**: parse any player's natural phrasing to a typed intent + grounded target + parameters; validate actor, world/zone, range, path, permissions and available mechanics; execute through Fracture's authoritative gameplay APIs; return an explicit result/state acknowledgement. Separate `received`, `started`, `succeeded`, `failed`, `blocked` and `cancelled`. Never narrate success unless the real engine confirmed it.
- Use existing deterministic commands for standard verbs; optional AI is a **semantic parser/fallback**, not the damage engine or source of world truth. Unsupported possibilities should be grounded and intelligible, not an endless hard-coded phrase list. Distinguish moving a player from moving an object.
- **STOP must interrupt the current authorized player's motion/attack promptly, even during an action lock.** Investigate cancellation end-to-end in pathfinding, state, animation and server target. Future multiplayer STOP cannot cancel another person's actor. Solve underlying combat hit cadence and damage reporting, not just the rat's health value.
- Test **families**, not one phrase: synonyms, unexpected wording, various actors/targets, multiple entities with shared names, long distance, impassable obstacles, different location, malformed requests, reconnect and concurrency. Add focused regression/property-style cases for every underlying bug. A successful parse is not a successful action.

## Brilliant-but-lazy usage policy

1. **Reuse first:** inventory/search installed code, Fracture's NPCs, maps, animations, movement/pathfinding, combat, quest and interaction APIs, plus applicable previously working Chaos systems and properly licensed open-source assets. Never build another framework, renderer, dialogue engine, quest system, network stack, or placeholder scene when a suitable tested component exists.
2. **Use the least expensive adequate method:** small targeted searches/reads, existing tests and scripts, lean diffs. Start with a single primary agent. Avoid parallel agents/reviewers unless clearly cheaper overall or independent tasks require them; multiple agents consume usage. If selectable, prefer Low/Medium reasoning and standard speed for routine coding; reserve High reasoning and premium models for genuinely difficult architecture/security/root-cause debugging. Use cheap scripts/tools (not agents) for mechanical changes where reliable.
3. **Read just what you need:** read this top instruction, issue #12, active release tracker, current branch status and relevant files. Do not repeatedly ingest giant READMEs, historical milestone directories, or entire codebases. Keep concise progress notes in `docs/FRACTURE_GAME_NIGHT_RELEASE.md` so a resumed session needs minimal context.
4. **Plan briefly, implement continuously:** work end-to-end milestone by milestone, reuse code, make the smallest clean reusable changes, avoid full rewrites or overengineering. Run focused checks after a change and full build/integration/real-play verification at meaningful checkpoints. Do not rerun all thousands of tests for every one-line edit or enter retry loops without diagnosis.
5. **Escalate only consequential decisions:** spending, secret access, destructive saves/data, licensing/security risk, public deployment, irreversible branch/merge changes, or genuine blocker. Do not ask the owner to babysit routine fixes. No paid services without explicit approval. Do not invent free unlimited API access.
6. **Value verified fun over output volume:** prioritize separate controllable phone characters, reliable actions/combat, free travel, reactive NPCs, full-screen shared TV and Mac game-night packaging before optional features or cosmetic redesign. Automated tests alone are not gameplay proof; do not label an incomplete prototype a finished game.

**Release target:** strongest genuinely playable Mac family beta by the end of October 29, 2026, with the accepted/not accepted list documented honestly. Do not equate a fixed single command with a fixed action interpreter, and do not falsely promise finished 20-player creative-AI gameplay without physical evidence.

---

# TOP PRIORITY — OWNER SAYS FINISH GAME-NIGHT BUILD TODAY (October 29, 2026)

**Read [issue #12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12) FIRST.** Its new top section replaces the old small STOP/movement fix and the original one-character research spike: **build the strongest honest, playable Mac + phone + TV Chaos Party game-night beta achievable today**. Work continuously through independent phone actors, world exploration, reactive actions, combat, optional DM and a tested Mac package. Do not stop at another plan, generic dashboard, automated test count, or single actor controlled by 20 phones.

**Nonnegotiable:** Only modify isolated `spike/fracture-phone-tv` / disposable pinned upstream worktree, never merge or overwrite original `luna/visual-game-night-release`, saves, credentials or main. No spending, live deployment, unsafe auth or fake state. If full 12–20 player/creative AI scope cannot pass genuine tests today, ship and label a smaller verified beta; don't fabricate acceptance. Track milestone outcomes and evidence in `docs/FRACTURE_GAME_NIGHT_RELEASE.md`.

**Codex is not automatically started by changing these files; user must invoke it or another connected coding runner.**

---

# ACTIVE CODEX TASK — PHYSICAL PLAYTEST FOLLOW-UP (October 29, 2026)

**FIRST read issue [#12](https://github.com/sifuentestrey/chaos-party-rpg/issues/12).** The owner has now ACTUALLY run this Fracture bridge on their Intel Mac and iPhone: `attack the rat` worked at least enough to trigger an action, but the rat barely lost HP; `stop`, `move left`, and `move the tent` did not work. This is now the latest authorized implementation milestone, superseding the original "try one attack" proof-of-concept. Codex: investigate real combat/HIT and HP, implement movement + immediate STOP + truthful action outcomes + grounded object feedback, then provide real evidence. Issue #12 contains explicit work order, tests, boundaries and acceptance criteria. Follow it rather than generating more RPG locations, UI polish or content.

Only code on `spike/fracture-phone-tv`, keep `luna/visual-game-night-release` and its saves untouched, retain the separate upstream Fracture checkout and account separation. No merge/deploy, no unauthorized AI provider, no paid API calls, no raw movement/HP exploits. Do not conflate accepted messages with succeeded actions. **Codex is NOT running automatically simply because this issue exists.**

---

# CURRENT OWNER OVERRIDE — FRACTURE MIGRATION SPIKE, 2026-10-29

**THIS BRANCH HAS A DIFFERENT TASK FROM THE OLD CHAOS PARTY BUILD.** The owner stopped expanding the custom prototype after a failed hands-on playtest and directed an investigation into adapting an **already playable RPG** instead. The chosen FIRST CANDIDATE is Fracture, **not yet an approved completed migration**.

**READ FIRST:** [docs/FRACTURE_MIGRATION_SPIKE.md](docs/FRACTURE_MIGRATION_SPIKE.md). This is the sole active scope for branch `spike/fracture-phone-tv`. The old instructions below and `START_HERE.md` remain for provenance only; their old build/AI qualification/packaging queues do NOT apply here.

**ABSOLUTE SEPARATION:**
- Original Chaos source, `luna/visual-game-night-release`: preserve unchanged, including its Colyseus/PartyFrame network, saves, packages and historical Codex work. Not a target for experimental edits.
- New migration spike, `spike/fracture-phone-tv`: only isolated docs/research/prototypes. No merge into `main` or canonical release without owner-approved verified proof.
- Candidate external engine, `georgeglarson/Fracture` at upstream commit `642c00a8a2d3a95979e85bbfa3f62deee611a4a6`: separate checkout, separate database, code MPL 2.0, content CC BY-SA 3.0; inspect art provenance. Do not treat this as Chaos code or import it wholesale.

**NEVER MIX** Socket.IO with Colyseus by guessing, overwrite authentic player saves, conflate account passwords and recovery PINs, let AI bypass server-authoritative movement/hits, or pretend a README claim equals successful local runtime testing. No paid services, external/public deployments, credential exposure or destructive operations.

**FIRST MILESTONE ONLY:** independently boot and inspect unmodified Fracture. Then connect ONE phone-driven free-form action to actual Fracture movement/combat with a visible on-TV consequence, and test with two controllers. Stop if that is not demonstrably workable. Full details and objective acceptance in the migration spike document.

---

## Current owner instruction — consolidation, October 29, 2026

Start with [START_HERE.md](START_HERE.md). It is the single current handoff and work queue. Work in this checkout on `luna/visual-game-night-release`; the name is historical. Older branch-specific assignments and the instructions below are historical context, not competing active tasks. The owner asked to consolidate first and move to a new chat. Do not automatically resume old milestones, create additional work branches, delegate old assignments, merge into main, or deploy from a stale document. Preserve product and safety requirements below. Future implementation follows the owner's new-chat direction.

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

**Latest owner-directed visual package (October 27, 2026):** The completed polish marathon is superseded as the next worker assignment by [docs/LUNA_VISUAL_GAME_NIGHT_RELEASE.md](docs/LUNA_VISUAL_GAME_NIGHT_RELEASE.md), on `luna/visual-game-night-release` from immutable baseline `da72db54f490cef62e7ea1f68b79737d1867fc96`. Execute all eight batches continuously, including the complete player journey, documentation and isolated test-candidate packaging. This explicitly authorizes its bounded renderer and presentation work before hardware acceptance; major world expansion, core systems, live AI and release acceptance remain outside the worker package.
