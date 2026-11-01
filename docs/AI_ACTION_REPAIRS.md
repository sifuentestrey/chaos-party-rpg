# Action interpretation repairs

## What changed

- Crafting instructions distinguish existing ingredients from the new output ID, which the server creates.
- Vocal attempts to calm a creature have a constrained pacify/unsupported schema and an independent server validator. They cannot silently become treatment that spends cloth.
- Native bandaging understands a unique character title, possessive injury wording and an explicitly selected carried item. Wrong materials are blocked rather than silently replaced with cloth.
- Native crafting and equipment operations resolve owned item names in the actor's inventory, including "my" references, without confusing duplicate names on the ground. Craft parsing understands the final "to wear on my head/body/hand" instruction; headbands are wearables.
- A native parse with an unresolved target may receive an AI clarification restricted to its original verb (or unsupported). Once clarified, the action locks. Existing valid declarations and explicit feasibility failures remain locked.
- Displayed AI action summaries now quote the original declaration with "Attempt:" rather than using a potentially misleading generated paraphrase.
- npm run start:free-ai selects the fixed Groq adapter, inherited proxy support and canonical narration. It leaves the API key in the environment, defaults to GPT-OSS-120B, and forces experimental generated narration off. Existing local rules skip AI interpretation for resolved locked actions. No paid provider or automatic fallback was introduced.

## Evidence and limits

All 82 automated tests and the build passed after the final changes. Seven new deterministic tests cover target clarification and action locking, owned ingredients, chosen medical tools, crafting and vocal-action authority.

The live repair set matched all six expected interpretations within 5.5 seconds (median 1247 ms, p95 4452 ms). Its new green-headband variant exposed a further native ingredient-suffix parsing failure even though the AI was correct. After that fix, the explicit final headband check matched the requested ingredients/type/slot/color and actually created the wearable through native resolution, with a 720 ms AI response. Raw evidence retains the earlier failure; it was not edited into a pass.

The original live twelve-case benchmark still returned twelve correct interpretations, but only eleven met the 5.5-second deadline: remote-theft rejection took 10819 ms. Median 827 ms. Qualification therefore failed on latency in that run. Production retains its shorter timeout and local fallback. This is not a promise of constant free-provider availability.

The original benchmark and six-case repair run occurred during repair checkpoints; final deterministic summary and suffix/locking changes were subsequently covered by the complete automated suite and the final live headband check. Live scripts use a longer diagnostic timeout than gameplay. Results are cloud-worker measurements, not target-Mac or physical-controller acceptance.

Free-plan/account billing status remains based on the owner's confirmation. Test data and the shared request ledger were separate from campaign saves. The original Mac ZIP was not supplied in this recovery. Generated NPC narration remains unqualified because prior tests invented rewards; it is off in the free-AI launch command. These fixes strengthen context and rules; they do not fine-tune model weights or create a new world lore database.

Evidence: ai-evidence/repair-cases.json, ai-evidence/green-headband-final.json, ai-evidence/baseline-after-repair.json.
