# Broad offline stress checkpoint

## Cost and scope

No additional external game inference requests were made. The shared ledger remained at 100/100 on the same UTC day, so the daily cap was respected. SOL 6.1 Max reviewed priorities and the container fix; Luna 6 wrote generated test cases and the bounded container production fix; the main agent reviewed assertions, corrected edge cases and ran the complete suite. Coding-assistant usage is separate from game API requests.

## Coverage

- 800 native campaign turns: eight deterministic seeds, 100 turns each. Each turn also tests duplicate submission with changed text and repeated same-time advance.
- 80 in-memory JSON save/reload cycles during those sequences. These are not 80 disk or server restarts; existing regression tests separately cover disk state and multiplayer restart.
- After every sequence step: bounded character/creature HP, stable item identities, existing parents, reciprocal unique container membership, acyclic containment, valid equipped ownership, nonnegative liquid/parts. Blocked actions and ordinary dice failures are expected, not test failures.
- 114 generated proposal variations across five grouped tests: 60 malformed field attempts, 30 unavailable/unknown/non-owned source combinations, six stale accepted sources, 12 command-shaped creation names, six collision/unrelated-entity variants. The scenarios test rules with synthetic plans; they are not model-generated language or an AI accuracy sample.
- Seven targeted container tests: repeated put, moving between parents and dropping the old parent, closed outer ancestors, missing/cyclic ancestors, consumed/disassembled/invalid ancestors, atomic capacity rejection, and compatibility with opened quest fixture chests.

## Bugs reproduced and repaired

Repeated puts duplicated membership. Moving a child to a new container left it listed in the old parent, which could later change its ownership through stale edges. Visibility checked only the immediate container, exposing contents of an open inner container inside a closed outer one. Invalid containment graphs also exposed items.

Visibility now checks the full ancestor chain and fails closed for missing/cyclic/consumed/disassembled ancestors while retaining opened or broken container access. Legitimate fixture chests with contents remain compatible. Put planning prevents duplicate membership and cycles; resolution checks rejection conditions before detaching the old membership and then updates the new parent once.

All six original new container regressions failed against the previous commit. During integration the first full run caught an overly restrictive ancestor type check that broke two existing quest tests. This was corrected, and a seventh compatibility regression now protects quest fixtures. The final full suite passes 119/119 and the build succeeds. Evidence: ai-evidence/container-before-tests.txt and low-usage-stress-tests.txt.

## Confidence limits and next live batch

This materially strengthens confidence in the tested rule/state boundaries. It does not establish a statistical model accuracy estimate, truthful narration, unlimited physics, entertainment quality or sustained physical-device performance. The 800-turn sequence primarily exercises native rules; generated plans in the other tests are synthetic. Existing tests retain 20-client/reconnection/restart coverage. Original Mac ZIP and physical controllers were unavailable in this recovery.

Once the normal free allowance resets, prioritize at most six fresh live cases: named white crafted appearance, indirect social calming, an explicit medical item, transfer with identity/display-name collision, a remote impossible action, and malicious instructions embedded in a harmless label. Check actual intended operation and state changes, not JSON validity alone. The action contract remains opt-in and generated narration stays off by default. No automatic reruns, paid fallback, public deployment or save replacement was introduced.
