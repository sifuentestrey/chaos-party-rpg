# Dynamic object proof

This development slice extends the recovered tavern and its PartyFrame/Colyseus authority. It introduces shared object templates and saved instances, with no per-creation art or recipe. It is not a complete generated campaign or unrestricted physics simulation.

## Try it privately

Run `CHAOS_AI=off node server.mjs`. To keep test play separate from existing saves, set `CHAOS_DATA_DIR` to a new disposable directory. Open `/host`, create a room, join `/join` on controllers and start. Existing game data is never migrated by a standalone script; the added world state initializes additively when a campaign first uses it. Original character IDs, tokens, PINs, avatars and legacy inventory remain intact.

On the phone, the objects section lists loose materials, carried creations, and connected paths. Buttons draft attempts; the normal commit button locks them in, with the existing reaction window and authoritative resolution.

For example:

1. `Take cloth strip`, then `Take wood splinter`.
2. `Make a bureaucratic moon hat from cloth strip and wood splinter`. Failed checks consume nothing. On success a new ID appears; no recipe for this name exists.
3. `Equip bureaucratic moon hat`, or use its displayed ID if a name is ambiguous.
4. `Give bureaucratic moon hat to Moss` (another player's full name). Only the owner can transfer it. The recipient can equip it.
5. `Travel to clearing`, then `Travel to ruins`. The whole party travels together. Equipped and carried objects follow; dropped objects stay where they were left.
6. `Separate bureaucratic moon hat` to recover its original component instances. `Attach cloth strip to wood splinter` creates a tool with both components; `Use <tool ID> on smooth stone` makes a real material-based damage check. These actions work in every location.

Inspect, take, drop, equip/wear, unequip, give, attach, separate, break/smash, use and travel share the same implementation across locations. Rest restores health outside the tavern. The old tavern affordances and crown heist remain available in the tavern; its fixtures and NPCs cannot be targeted remotely.

## Model and boundaries

`public/world-items.js` owns material/type templates, deterministic location generation using the existing PartyFrame RNG, validation and mutations. The generator creates two connected outdoor spaces with seeded names/decor and reusable material instances. It does not consume the dice stream. Locations and instances are saved with the campaign. Each instance has a stable ID, type, primary material, condition, appearance, owner or ground location, component IDs and bounded provenance history. Combining consumes availability of the actual components; separating restores them without copying. Nested compositions remain intact.

New names map to four capability templates: fragment, wearable, tool and container. Wearable vocabulary selects head/body/hand placement; a small named color palette is supported, otherwise colors derive from components. The shared Canvas glyph renderer draws ground objects, carried objects and equipped attachments; phone portraits reflect equipment too. No new art assets or dependencies are needed. All original third-party notices remain applicable and unchanged.

Crafting and tool damage use normal seeded d20 checks, assistance/intervention and the existing no-takeback request receipts. Automatic interactions do not roll or award XP. Only the authoritative game resolves ownership and mutations. Client input cannot supply generated state. Components must be distinct, intact and owned; remote sources, unknown or ambiguous IDs and unreachable destinations are blocked. Caps: 256 object instances per campaign, 2–4 crafting inputs, 48-character creation names and 12 history entries per item.

The local grammar deliberately supports `Make <name> from <item> and <item>` and the verbs above. It does not interpret arbitrary new physics, creatures, magical effects, or novel material properties. Tools currently damage loose world objects; containers have identity/assembly/portability but no liquid simulation. Materials and damage use the primary component's material. The party shares one location. There are no generated quests or NPCs in outdoor spaces. The original heist ending still ends its session.

The existing optional Qwen adapter remains for tavern actions. Dynamic-object attempts stay under deterministic rules and cannot be overwritten by the old tavern-only AI schema. Real Qwen interpretation of this new vocabulary and Mac inference performance remain future work; this implementation makes no such claim and downloads no weights.

## Verification

`npm test` runs the existing multiplayer/rules checks plus object tests for arbitrary identity, ownership, duplicate submissions, failed crafts, blocked remote access, palette/health recovery, seeded generation and persistence. `CHAOS_AI=off node tests/world-items-browser.mjs` exercises actual host and portrait phone browsers, creates an arbitrary hat, wears/transfers/drops/recovers it, creates a second arbitrary tool in the ruins, uses it in the clearing, then verifies a real server restart and character rejoin. It uses disposable storage. Screenshots and result JSON go to `artifacts/world-items/` by default.

The Mac ZIP is absent from this recovered filesystem; its historical hash and recovery are documented in PROTOTYPE_IMPORT.md. Browser controllers do not satisfy the outstanding two-physical-phone gate. Actual old-Mac performance, LAN behavior and family enjoyment still require physical acceptance. This slice follows the owner's explicit request to proceed with the dynamic-item proof while retaining those limitations.
