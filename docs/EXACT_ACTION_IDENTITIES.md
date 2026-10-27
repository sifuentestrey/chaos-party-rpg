# Exact identity boundary for structured actions

This checkpoint used the owner's requested team: SOL 6.1 Max reviewed the design and diff; Luna 6 wrote bounded offline regression tests; the main agent reviewed test assumptions and implemented the production fix. Review corrected test fixture/API mistakes before accepting the tests. The requested delegation workflow is recorded in AGENTS.md.

## Defect and general fix

Structured action references were prevalidated as exact IDs, but lower-level planners could reinterpret those strings as display names. A player named after a creature ID could intercept an action or transfer. After acceptance, a replacement item named after an original source ID could be consumed if ownership changed. This is an identity invariant failure, not a sentence-parsing issue.

Structured proposals now use explicit exact-ID mode through item and entity planners, including targets, sources, tools, recipients, destinations and medical items. Native name/title input retains its existing alias behavior. Resolution rechecks original identities and ownership. An AI-proposed treatment must explicitly select a carried bandage ID; it cannot silently select a different bandage later. Native bandaging without a specified item keeps its existing local convenience.

## Evidence

The nine boundary tests were run against an untouched archive of the previous commit and current source. Five failed before the fix and all nine passed after it:

- typed target cannot be intercepted by another entity's display name;
- transfer recipient cannot be intercepted by a player named after the creature ID;
- crafting cannot substitute a new item named after a source whose ownership changed;
- typed treatment requires an explicit medical item;
- treatment cannot substitute a differently identified cloth after ownership changes.

The other four tests cover malformed/unsupported input, unknown references, inert argument text, and resolving a JSON-restored accepted proposal. The complete suite has 99 tests. Test execution and build status are recorded in the delivery response. Before/after logs are in ai-evidence/exact-id-before.txt and exact-id-after.txt.

No game API inference was used or free allowance bypassed. The new prompt contract remains opt-in and generated narration remains off by default; these offline invariants do not establish language-model accuracy. Physical Mac/phone performance and the original Mac ZIP remain unavailable in this recovery. Original checkout and saves were preserved.
