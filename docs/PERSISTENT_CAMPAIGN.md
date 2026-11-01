# Persistent campaign development slice

This branch extends the tavern and dynamic-object proof with generated places, repeatable adventures and persistent consequences. It is an experimental foundation, not a finished D&D ruleset or a complete AI Dungeon Master.

## Play

Use Node 22+, `npm ci`, and `CHAOS_AI=off npm start`. Open `/host`, join on a phone and start the story. To isolate a test campaign, set `CHAOS_DATA_DIR` to a fresh path before starting. Existing Mac saves should be backed up before trying an experimental build.

The controller's location panel contains paths, people, creatures, nearby objects, actions and a journal. `Explore` follows an unvisited path; connected regions are generated deterministically when reached. Each place has its own appearance, characters, creature, spring, coffer, gate and an adventure. Speak to the wayfarer to learn its objective. The three generated patterns ask the party to make the road safe and return a keepsake, heal an injured wayfarer, or repair a crossing. A creature can be befriended or fought. Successful completion grants party rewards and starts the next chapter. The original crown-heist ending offers the host a Continue campaign button, preserving characters and their inventory.

Characters, creatures, locations and items have persistent identities. Items have material, condition, owner or location, components and appearance; crafted objects retain their actual components. Use `Take`, `Open`, `Put ... into ...`, `Fill ... from ...`, `Drink`, `Move`, `Attack ... with ...`, `Repair`, `Ignite`, `Extinguish`, `Cut <part> from <entity>`, `Bandage`, `Attach`, `Make ... from ... and ...`, `Give`, `Equip`, `Separate`, and `Travel to ...`. The controller drafts many of these actions. Inspect an entity for its condition and available parts. The rules validate source ownership, materials, reachability and the rolled outcome. Failed crafting does not consume ingredients. In a keepsake adventure, returning a creation containing the actual keepsake also satisfies the objective.

Materials have bounded properties such as hardness, flammability and sharpness; metal or stone equipment reduces incoming damage. Injuries and trust persist. Fire damages nearby creatures and eventually burns through combustible items; water can be carried and drunk. Characters gain levels from accumulated score. The TV draws generated environments, creatures, loose items and worn or carried creations using reusable pixels and existing character assets. These are discrete rules, not a general physics simulation; legacy tavern fixtures and original inventory remain supported through the existing game and limited adapters.

## Persistence and resource use

Locations are generated lazily. The client receives the current scene and neighboring location summaries, rather than the full discovered map. On a real server, leaving a generated region writes a content-addressed, checksummed region file under the campaign data directory and unloads its entities; returning reloads it. Player-carried items follow the party. The main campaign save retains region references and global history. Never remove the `regions` directory from an existing campaign backup: both it and `campaigns.json` are required. Region chunks are immutable and currently accumulate; automatic garbage collection and backup/restore tooling remain future work. The solo preview keeps regions in memory.

## AI boundary

Optional local AI can propose an action, component identities, a bounded item type, slot and color. The server validates the proposal against the actual nearby entities and ownership, then performs the normal check; model output does not directly change state. A slow, invalid or unavailable model falls back to rules. Native supported actions remain immediately available without waiting for AI.

The multiplayer integration test uses a simulated model response. Actual Qwen inference and target-Mac performance are not verified. The official Qwen weight request was redirected to `us.aws.cdn.hf.co`, which this environment's enforced network policy denied. No weights were downloaded. `node scripts/benchmark-campaign-ai.mjs` tests an already running private OpenAI-compatible model endpoint and records correctness and latency; it does not install or launch a model. Keep models off public interfaces.

A full creative narrator, post-outcome NPC dialogue, long-term plot memory and bounded event proposals are a separate next stage. The owner's detailed requirements are in GitHub issue #6: https://github.com/sifuentestrey/chaos-party-rpg/issues/6. Hardware acceptance remains outstanding: an early-2015 Mac, TV and two physical phones have not been tested here.
