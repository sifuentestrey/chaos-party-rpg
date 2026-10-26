# Instructions for Codex / development agents

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
Private family project. Never touch Family Board, Clinician Index, or unrelated apps. Do not purchase services, deploy publicly, expose secrets, or copy proprietary games/assets without permission. Keep proper third-party notices. REA is an optional code-analysis tool, NOT automatic permission to copy proprietary code. Save and test changes in small reversible commits.
