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
