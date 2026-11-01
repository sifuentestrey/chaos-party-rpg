# Bounded offline fallback repair — October 27, 2026

Source before repair: `12683ad`. This follows the fallback priority in the owner handoff, independent QA and issue #9 triage. It adds no regions or travel mechanics.

## Reproduction and repair

Fresh native tavern probes reproduced `Set the stolen rug on fire` targeting the fireplace and `Bandage the wayfarer injury with my cloth` resolving as generic healing. The exact `Rap to calm the wolf` probe was already unsupported in this checkout; singing variants did enter the unrelated dance path. The regression set covers both rap and singing without claiming to reproduce a dance result for every phrase.

The bounded native parser now routes vocal calming, medical treatment and physical ignition through explicit target checks. A parsed target must match a complete local name, unique title, item identity or registered fixture reference. Words inside absent names, such as “fireplace keeper” or “guard wolf,” cannot select unrelated furniture or people. Missing targets and unavailable carried objects block without healing, dance rewards, clues or ownership changes. Inanimate fixtures cannot become medical patients or pacification targets.

Ignition separates the target from “on fire,” so a room rug can burn while a claimed stolen rug that is not carried stays unavailable. Existing canonical carried items use their own IDs and ownership rules. A selected ignition tool or extra step is conservatively rejected when unsupported. Literal saved names take precedence over sentence punctuation, including when `cloth!` and `cloth` both exist.

Existing tavern dancing/singing, fireplace and candle lighting, rug burning, self recovery, player revival, fixture mending, first accepted declarations and duplicate request receipts retain their native rules. The shared vocal predicate also retains the existing model validation boundary against converting song pacification into medical treatment.

## Local verification

- `npm test`: **133/133 passed**, including 14 new deterministic fallback regression tests and the existing multiplayer, persistence, ownership and campaign suites.
- `npm run build`: passed; tracked `src/framework.mjs` rebuilt from the shared source.
- `git diff --check`: passed.
- No live inference, provider requests, paid services or deployment. The October 27 free request allowance remains exhausted; model protocol tests use mock replies or local fixtures.

## Limits

This remains a bounded grammar, not general language understanding. Complex prose, selected tools and chained declarations can be rejected. Existing string-only inventory labels such as a legacy stolen tavern rug have not been migrated into canonical item instances; ignition of those labels is safely unavailable. A real owned cloth item fixture proves the supported canonical item path, not a completed steal-then-burn legacy rug flow.

No real model interpretation or narration was qualified by these checks; narration remains opt-in. The original `Chaos_Party_Mac.zip` is still unavailable. Physical phones, the 90-second TV sequence, rendering/audio and the 2015 Mac performance gate were not tested in this repair.
