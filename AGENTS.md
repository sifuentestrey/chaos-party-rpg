# Chaos Party development instructions

## One source of truth

`main` is the canonical Chaos Party source, product branch, and release reference.
Work requested for Chaos Party means work directly on `main` unless the owner explicitly says otherwise.

The current product is the native **Fracture** integration in
`experiments/fracture-phone-tv`, played in the **Refuge** village and the surrounding
native world. The old tavern implementation remains in the repository for
provenance and preservation; it is not the game-night product.

The following refs are historical or protected:

- `luna/visual-game-night-release` is a preserved historical backup. Do not edit or delete it.
- `spike/fracture-phone-tv` was superseded and deleted. Do not recreate it unless the owner explicitly requests that.
- All other branches are outside the current product and must be left alone.
- Pull requests are review records, not alternate sources of truth. PR #11 is closed and was not merged.

Never infer the product from an old branch name, draft PR, cached package, screenshot, or historical note. Inspect `main` and the current runtime.

## Product rules

Chaos Party is a private family game: one shared TV shows the native Fracture world, and each phone controls its own character.

- The Fracture server owns movement, combat, world state, dice, inventory, and persistence.
- The bridge connects phones and TV and may keep bounded Chaos Party sidecar state, but it cannot override native truth.
- The AI Dungeon Master may interpret intent and narrate confirmed outcomes. It must never invent objects, loot, stats, geometry, damage, movement, or success.
- The first valid action locks on the server. Dice are server-owned and fair. Confirmed consequences persist.
- Discovery comes through NPCs, player observation, and grounded DM narration. Do not add waypoints, route markers, tracker hand-holding, or fast travel.
- Groq is optional and free-tier only. Every runtime must clearly identify live Groq versus the labeled offline fallback. Keep keys in runtime secrets; never commit or log them.
- Reuse existing Fracture art, maps, actors, animations, and mechanics. For character customization only, layered variations, palette swaps, and new layers derived from existing Fracture sprites or animation frames are allowed. Wholly new art styles, external art imports, fabricated game-world assets, and placeholder outcomes remain prohibited.

## Working procedure

Before editing:

1. Check out `main`, fetch its current tip, and record the full commit SHA.
2. Read this file, `README.md`, `START_HERE.md`, and the current release checklist.
3. Inspect the actual code and runtime before trusting historical claims.

Make the smallest correct change on `main`. Preserve original Chaos source, saves, credentials, and the separate pinned Fracture checkout. Do not mix the original networking/database with Fracture's runtime.

Use targeted checks first, then the relevant build or release checks. Automated checks do not establish physical Mac, phone, TV, capacity, or fun acceptance. Record genuine gaps in the release checklist rather than hiding them.

Every progress report must identify the exact product being discussed:

`Branch: main | Commit: <full SHA> | Game scene: native Fracture — <actual scene> | AI mode: live Groq or offline`

Do not describe work on another branch as current Chaos Party work. Do not merge, deploy publicly, spend money, reset saves, or change protected branches without explicit owner direction.

## Documentation ownership

- `README.md` is the definitive product description and launch guide.
- `START_HERE.md` is only a pointer to the definitive documents.
- `docs/FRACTURE_GAME_NIGHT_RELEASE.md` is the current acceptance checklist and evidence ledger.
- Other dated docs are historical references unless the owner explicitly promotes one.

When instructions conflict, this file and the owner's latest request take precedence. Replace obsolete instructions instead of appending another competing plan.
