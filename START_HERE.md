> **Latest implementation — October 29, 2026:** The owner’s final-game directive superseded the consolidation backlog below. Continue from this canonical branch. The Crown Job and bounded **Dawn Bell** expedition are implemented. Current build, source/checksum and acceptance evidence: [Dawn Bell release](docs/DAWN_BELL_RELEASE.md). Compact resumption state: [checkpoint](docs/GAME_COMPLETION_CHECKPOINT.md). Creative live AI qualification and physical hardware acceptance remain blocked; do not treat the historical queues below as unfinished active assignments.

# Chaos Party — start here

Updated October 29, 2026. Single current handoff for the next chat.

## One working home

Repository: https://github.com/sifuentestrey/chaos-party-rpg
Canonical working branch: `luna/visual-game-night-release` (historical name; use it for all ongoing work).
Local checkout: `/workspace/chaos-party-rpg`.
Inherited source checkpoint: `df9f03883080944a469ab93c6028fb65f4c45e78`.

The owner asked to consolidate first, then move to a new chat. Consolidation is complete at the source-history level: every other source branch is an ancestor of this branch. No source merge was needed. Keep older branches as historical backups, not active work locations. The download branch has independent history and contains a ZIP and README, not missing source to merge. No branch was deleted. Main remains the old baseline; do not use it as the current game or push it forward automatically, because its workflow can publish a preview.

## Owner's vision

One coherent animated pixel-art world on a shared TV; phones are remotes, not separate adventures. Roughly 12–20 family players with distinctive customizable persistent characters. First accepted declaration locks; others react; deterministic rules/dice own outcomes. Surprising free-text attempts should produce understandable visible consequences. The intended DM both interprets attempts and gives funny, truthful, context-aware storytelling. AI cannot award facts by prose. Preserve saves, reconnect, fairness and simple host controls.

Target: early-2015 Intel MacBook Pro, TV, home Wi-Fi and phones. No paid services, public game deployment, credential exposure, live-save uploads or unrelated-app changes. Source backup is already owner-approved. Longer-term direction is a bounded hybrid authored/procedural reactive world with persistent discoveries. Shared-party travel voting is desired but details remain undecided. Permanent campaign versus episodic adventures remains undecided.

## What exists

PartyFrame/Colyseus multiplayer and persistence; Canvas rendering; licensed Ninja Adventure/Kenney art; tavern/crown heist; item/material/ownership/crafting/containment rules; generated connecting regions and simple outdoor quests; travel, saved regional consequences and rejoin. Optional AI interpretation/narration infrastructure exists. This is a working foundation, not a finished reactive sandbox or qualified creative DM.

Fresh consolidation verification on October 29 passed `npm run verify`: 184 tests across 29 files, seven generated outputs checked, and static build, with AI disabled. Prior reports also record browser adventure/restart checks. Those are dated evidence, not fresh hardware or live-model qualification. The visual-release checkpoint made only a small outdoor-renderer change and browser-runner cleanup; the full assignment was not completed.

## One current backlog

The owner has paused the competing historical queues. Do not automatically execute them from their imperative wording. This consolidation changes no gameplay and does not approve the previous assistant's recommendations as new product requirements.

1. Agree the next bounded milestone in the new chat using this source and the owner's vision. Recommended candidate: finish the existing adventure's presentation and delivery, preserving mechanics.
2. Known presentation gaps: crude outdoor art/creature silhouettes, story panels covering actors, lengthy phone scrolling/cramped item metadata, incomplete first-session/end-to-end release polish. Use the old visual assignment as detailed reference only after choosing scope.
3. AI remains a separate acceptance gap: qualify actual action semantics and truthful narration, measure latency and full-session free capacity. Narration remains off by default. The local project allowance is 100 requests/day and four/minute shared across interpretation/narration; this is not the provider's quota. Do not reset ledgers or raise limits to evade limits. Old Qwen CPU experiments failed their deadline; no promise that local inference suits the Mac.
4. Produce/identify one exact-source candidate and test Mac/TV/two physical phones, then the intended group. Physical performance, readability, audio, LAN behavior and enjoyment remain unverified here.
5. Defer major island/underwater/world-simulation expansion and campaign-format decisions until an enjoyable game night; retain existing code and owner options.

Original `Chaos_Party_Mac.zip` remains unavailable; recovered Git source and new packages do not prove equivalence to it.

## Run and verify

Node 22+, `npm ci` if dependencies are missing, `npm start`; server port 4747. Use disposable data and AI off for checks. `npm run verify` is the offline suite/build/generated-output check. Do not contact live AI just to check consolidation. Static preview is solo, not multiplayer.

## Existing Mac rehearsal download

The package predates the partial visual experiment and uses source `da72db54f490cef62e7ea1f68b79737d1867fc96`.
[Download rehearsal ZIP](https://github.com/sifuentestrey/chaos-party-rpg/raw/refs/heads/downloads/mac-rehearsal-da72db5/Chaos_Party_Mac_rehearsal_da72db5.zip).
SHA-256: `c3b64c764d8aad255de5fa71ac941ad60306995a6585eae3a0f427e05de2346c`.
It is a rehearsal candidate, not an accepted release. Preserve installations/saves and use a new test room. Older report paths to package worktrees may no longer exist in a new environment.

## Historical references, only when needed

- `docs/OWNER_HANDOFF_REACTIVE_HYBRID_WORLD_2026-10-27.md`: detailed owner vision.
- `docs/LUNA_VISUAL_GAME_NIGHT_RESULTS.md`: latest partial review and real remaining defects.
- `docs/LUNA_POLISH_MARATHON_RESULTS.md`: earlier completed work.
- `docs/LUNA_VISUAL_GAME_NIGHT_RELEASE.md`: old detailed assignment, paused pending new scope.
- `docs/FREE_AI_SESSION_LIMITS.md`: AI budget arithmetic.

## Branch preservation snapshot

All source refs below are contained in the inherited checkpoint. The downloads ref is an independent artifact branch. Commit IDs preserve provenance even if names later change.

```text
origin/beta/reactive-tavern fe7b9df2d1c0311632ead2e112ed74900c1e580e
origin/downloads/mac-rehearsal-da72db5 c812eed782cf5dfc657947beb0fc2aaaffe2c6ed
origin/fix/grounded-action-contract e14cabf55e226e524c97671907de997853f6dff0
origin/improve/tavern-presentation a0ff6c079a0c51537abd45325c2bad4a87e76ac3
origin/luna/game-night-presentation-qa 16e823cb8d5d5fdfd19f1c9d352490efc966103f
origin/luna/polish-and-accessibility da72db54f490cef62e7ea1f68b79737d1867fc96
origin/luna/visual-game-night-release df9f03883080944a469ab93c6028fb65f4c45e78
origin/main f00fad315f31f57367612c82bd777616aef9d5bb
origin/work-prototype-import 44b8029bc1b950b9da9c3890c108a92d130a6347
```

## Paste into a new chat

Continue Chaos Party from https://github.com/sifuentestrey/chaos-party-rpg on branch `luna/visual-game-night-release`. Read START_HERE.md and AGENTS.md first. This is the single working home; previous branch assignments are historical and paused. Preserve the existing game and saves. Help me choose and complete one coherent next milestone aligned with my shared-TV, phone-controller, reactive-world and creative-DM vision. Start from the actual latest code and evidence; do not restart the project or create another competing roadmap.
