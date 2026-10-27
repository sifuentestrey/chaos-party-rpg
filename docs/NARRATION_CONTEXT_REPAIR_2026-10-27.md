# Narration context repair — October 27, 2026

Source before repair: `1412137`. This is a bounded context repair; narration remains opt-in and unqualified.

## Confirmed gaps and changes

The narrator was instructed to respect current injuries but received no actor health, no explicit resolved target state, and no tavern NPC health. Generated people supplied injuries but omitted health. Player-target memory retrieval also used the generic `player` kind instead of the actual character ID, allowing newer unrelated memories to crowd out that person's prior encounter.

The context now supplies bounded canonical HP, maximum HP, saved status and injuries for the actor, present living targets and eligible NPC speakers. Absent injuries remain an empty array; absent status is omitted. Untouched tavern NPC health uses the same 8/8 defaults as the existing game rules. The target includes its resolved reference and local item or fixture condition when available; remote fixture state is withheld.

Player memory selection now uses the target's exact player ID. Memory and condition arrays are projected into detached objects using allowed fields, so nested private metadata is excluded and context consumers cannot mutate saved injury or memory arrays. The existing context size limit remains in force.

Review also checked redaction while a newer narration request contains an earlier memory. The existing host-redaction path already marks the current story as fallback; the existing completion guard discards that stale reply. A controlled synthetic-response regression now protects this behavior. No lifecycle change or newly reproduced leak is claimed.

## Local verification

- `npm test`: **139/139 passed**, including six new context and lifecycle regressions.
- Coverage includes actual generated patient injuries, JSON save/reload, player-target memory competing with newer unrelated entries, local versus remote fixtures, private nested fields, detached arrays, and a 20-participant context budget.
- `npm run build` and `git diff --check`: passed. The tracked framework was rebuilt and remained byte-identical; this repair changes the separate server narrator module.
- Tests use mock responses or local fixtures. No live inference or provider call was made, and the exhausted October 27 request allowance was not changed.

## Limits

These checks prove which canonical data is supplied and whether an obsolete reply is published. They do not prove free-form prose truthful or entertaining. Structural validation still cannot establish that arbitrary dialogue preserves every fact. No keyword hallucination detector, narration default change, model qualification, deployment, or world expansion was added. The original Mac ZIP and physical TV/phone/Mac acceptance gates remain unavailable or untested.
