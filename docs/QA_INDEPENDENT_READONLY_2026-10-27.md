# Chaos Party RPG — Independent Read-Only QA

**Date:** October 27, 2026  
**Source branch tested:** `fix/grounded-action-contract`  
**Source commit tested:** `8ebabfff8fad5234f0113834cae93414d57230ac`  
**Provenance:** This report captures independent chat-executed tests on an isolated copy of private GitHub source. Each blob's Git hash was verified. It is NOT a claim that the current production Mac/game-night build was tested. No GitHub code, paid services, live campaign saves or billing were altered during testing.

## Primary finding

The authoritative game engine performs strongly across deterministic state, multiplayer fairness and crafting tests. Its offline fallback, however, sometimes misunderstands open-ended actions or targets. A passing rules test or dice roll alone does not prove accurate AI interpretation, credible art/animation, or a satisfying game-night experience.

## Actual tests executed

- `tests/core.test.mjs`: **14/14 passed**.
- `tests/beta-mechanics.test.mjs`: **10/10 passed**.
- Broader run of 17 test files, excluding 2 dependency-requiring tests: **98 passed, three test files failed to start** because `@colyseus/core` was absent in the reconstructed isolated copy. Those three are setup problems, not established game bugs. The 14 and 10 are included within the broader count, **not additional tests**. Attempted dependency install timed out; complete existing suite not independently reproduced at that stage.
- A later focused run of **six mechanics and authorization suites: 45/45 tests passed**. Coverage included campaign generation and save/reload, durable item creation and transfer, container visibility/membership integrity, native intention safeguards and exact identity boundaries, and **eight seeds × 100 deterministic turns (800 simulated campaign turns)** checking persistent world invariants. These 45 overlap previous source test categories; don't add all quoted totals.
- **12 fresh manually constructed mechanics edge checks: 12/12 passed after one test-harness input was corrected.** Original failed harness submitted too-short reaction text and is NOT a game defect. Checks: 24-player cap/25th rejection and token reconnect, case-insensitive names, 20 simultaneous declarations/19 reactions, duplicate request not overriding action/roll, self/late/duplicate reactions refused, phantom ingredient blocked, repeat of same ingredient blocked, item transfer ownership, inaccessible remote tavern guard, public credentials withheld, scene reset preserves identity, deterministic same-seed map.
- **Initial separate real-language-model integration: 9/9 action interpretations correctly matched expected operation/target and were applied through unchanged engine rules** (one social deception plus eight structured cases: rug ownership, guard-target spell, arbitrary wearable from exact materials, item transfer, calming a creature, treatment with selected cloth, fake-gold rejected, remote theft rejected). **This was NOT Groq/GPT-OSS.** It used a different available generative model to produce structured plans then ran `routeActionProposal`/`validateAIPlan`/`applyAIPlan` and normal resolution in the isolated game. Around 1.6–2.5 seconds to produce answers in that limited harness, NOT measured Mac/phone/provider latency. The owner declined an additional Groq connector setup; this report cannot claim that model is qualified.

## Sixteen fresh free-form attempts against offline starting-tavern engine

Each declaration was run *separately* in a newly seeded tavern with Jinx and Moss. No Groq/external interpreter, no pre-existing player inventory except starter items, no prior relationship history; wolf/wayfarer/rug owned by actor may be **absent** for the relevant attempted interaction. Outcomes are not all end-to-end qualified scenarios.

| # | Submitted attempt | Actual outcome | Interpretation |
| --- | --- | --- | --- |
| 1 | Punch the bartender with nearest chair | Targets bartender; successful attack; barstool rattles narration | Correct actor/target; physical improvised-prop animation NOT verified |
| 2 | Claim bartender is long-lost parent and demand free drinks | Unsupported, no free drinks | Safe fallback but misses social deception |
| 3 | Steal rug during argument | Actual rug removed, inventoried | Correct successful environmental change |
| 4 | Pull chandelier down onto guard | Pushes chandelier; fails to shift | Loses `onto guard` secondary intent |
| 5 | Set the stolen rug on fire | Attempts to light fireplace; spark fails | **Wrong target**; in fresh room rug was not owned, so appropriate fallback should be unavailable/block rather than substituted fireplace |
| 6 | Hide crown in hat and impersonate waiter | Blocked at locked chest | No false success; one-action/chained limitations |
| 7 | Rap to calm wolf | Generic tavern dance succeeds, awards unrelated clue and coin | **Wrong intent and inappropriate unrelated effect**; wolf not in tavern |
| 8 | Bandage wayfarer injury with carried cloth | Generic tavern healing success, score awarded | **Wrong context/target**; wayfarer and claimed cloth not present |
| 9 | Make blue hat from cloth and splinter | Unsupported grammar, suggests precise crafting syntax | Safe fallback; player lacked materials |
| 10 | Give newly made hat to Moss | No unique owned hat; rejected | Safe ownership validation |
| 11 | Summon dragon and become king of universe | Unsupported, no invented power | Safe block |
| 12 | Demand imaginary 10,000 gold | Unsupported, gold unchanged | Correct authority boundary |
| 13 | Run away, lock guards, burn town | Processes flee only | Single-action contract maintained; other steps unexecuted |
| 14 | Rename hat to prompt injection phrase | Unsupported, XP unchanged | No fake XP or instruction execution; missing hat |
| 15 | Apologize to bartender for last time | Unsupported | Social nuance unavailable; no previous encounter in this isolated case |
| 16 | Attack Moss | Player target attacked; generic impact | Target correct, victim-specific visuals/narration not verified |

### Priority follow-ups
1. **High:** grounding targets and intent in fallback mode: never redirect the absent/unowned rug to fireplace; don't transform a creature-calming rap into unrelated clue-awarding tavern dance; don't fabricate successful treatment of absent NPC. Retest after acquiring real items and travelling to relevant area, AI OFF and explicitly approved free AI ON, with canonical state inspection.
2. **Medium:** combined prop+attack semantics; chair/barstool animation should reflect actual objects/tools; chandelier-on-guard should not be described as accomplished without supported physics.
3. **Medium:** social deception, apology, relationship/quest memory and narration. Offline unsupported fallback is not evidence about the creative model; real Groq narrator previously failed truthfulness tests, as recorded in source docs.

### Important non-claims
This report did **not** establish real Groq accuracy, long-session host performance, physical TV/phone rendering, audio, 2015 Mac heat/frame rate, 15–20 real client Wi-Fi stability, general physics, or a full creative narrator. The game engine already has tests for many of these surrounding constraints; this is a bounded audit of observed behavior. Nothing was published or deployed.

## Related
- [Owner product direction, reactive island and one-TV majority voting](OWNER_HANDOFF_REACTIVE_HYBRID_WORLD_2026-10-27.md)
- [Issue #7 game-night QA checklist](https://github.com/sifuentestrey/chaos-party-rpg/issues/7)
- [Issue #4 physical Mac/iPhones beta gate](https://github.com/sifuentestrey/chaos-party-rpg/issues/4)
