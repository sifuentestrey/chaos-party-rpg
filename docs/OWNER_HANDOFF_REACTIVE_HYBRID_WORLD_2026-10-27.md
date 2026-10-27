# Chaos Party — Owner Product Handoff: Reactive Hybrid Island and Game-Night Priorities
**Recorded:** 2026-10-27  
**Status:** Product direction and test evidence, NOT authorization to implement or deploy.  
**Source context:** Owner discussion while ChatGPT Work/Codex usage was unavailable; GitHub independent read-only QA; existing project issues #4–#7.  
**Relevant source branch at handoff:** `fix/grounded-action-contract` at `8ebabfff8fad5234f0113834cae93414d57230ac` (recheck HEAD before work).

> **READ THIS FIRST:** The owner wants a fun, convincing, **one-TV / phone-as-remote** family fantasy game with a reactive world and a truly creative AI Dungeon Master. Prioritize an enjoyable first real game night over speculative world-building. Do not implement every brainstormed feature immediately. The owner specifically asked for this conversation to be captured for Codex context.

## 1. Owner-confirmed fundamentals (not optional assumptions)

- **One shared TV visual game.** The Mac/TV shows the actual animated pixel-art world; phones are **controllers/remotes**, not separate visually rendered adventures. Phone screens can display text/dictation input, character/avatar, inventory, current location and objects, journal, reactions, join/reconnect and **travel votes**. Do **not** add separate playable world rendering to phones or split-screen gameplay as a presumed requirement.
- Roughly **12–20 family members**, many unfamiliar with tabletop RPGs, connect via browsers on phones to the same party game. The product is a chaotic, funny RPG that feels much more free-form than a menu of prewritten choices.
- **First accepted declaration is final**, and everyone else has the existing bounded reaction window (roughly 8–12 seconds). Rules/dice/server determine whether it succeeds; AI cannot rewrite an accepted action or canonically award anything by prose. Reactions are not a separate AI call per participant. Host can pause/moderate.
- **Characters remain individual, distinctive, customizable and persistent.** Hairstyles, outfits, roles, items, appearance and progression should be legible on TV. Keep reconnect, saved identity and fair turns.
- **The look matters:** an attractive coherent 16:9 pixel-art RPG with characters visibly acting, physical target reactions, sound/effects, correct contextual animation and clear, couch-distance storytelling. A text success with inert sprites is not satisfying. Reuse actual tested licensed art, scene/game code and networking—do not replace the game with a generic web dashboard.
- **Hardware/cost boundary:** intended host is an early-2015 Intel MacBook Pro (~dual-core i5, 8 GB RAM). Do not presume it can run a substantial creative LLM. Prefer one capable hosted AI service for the entire party if genuinely free and approved, while the Mac runs lightweight authoritative game/render/network. **Strictly no paid AI or new billing, public deployment, exposure of keys, or unapproved hosting.** User declined doing another Groq connector/authentication setup in chat; do not treat that as approval to change credentials.
- **Game night first.** Owner wants a real enjoyable session before choosing larger campaign direction. Preserve all viable future options without building too much prematurely.

## 2. AI requirement: TWO capabilities, not just an action parser

The owner explicitly corrected the earlier action-interpreter-only vision.

1. **Natural-language action interpretation:** understand what players are *attempting*, from scene targets and current state. E.g. "I'm the bartender's long-lost son; give me free drinks" is a *social deception attempt*, not automatic free inventory. "Rap to calm a wolf" is *pacification*, **not** healing that consumes cloth, nor generic tavern dance. A requested but unavailable rug must not be replaced by the fireplace. Support unusual naming, crafting and manipulation through a grounded bounded action schema.
2. **Creative AI Dungeon Master:** give funny varied but coherent NPC dialogue, consequences, stories, discoveries and recaps; remember canonical past events and character attitudes; use the actual dice outcome and validated world mutations. Generated text must not hallucinate rewards, successful injuries, actions, NPC identity or relationship facts. For unsupported actions, be honest rather than describing something as accomplished.
3. **Server authoritative, AI proposal only:** model suggests supported intents and **bounded** event/world changes; deterministic rules validate target IDs, source ownership, material capability, range, feasibility and randomness; only then store mutations. An entertaining statement is not a world change.
4. **Responsive even when AI is slow or down:** animate/acknowledge the action quickly, enforce the turn deadline (~5.5-second interpretation cap in existing code), post-outcome story separately, use real fallback rules, never blank/hang the TV. Test semantics **and** latency, not merely well-formed JSON.
5. **Cost and qualification:** Old local Qwen3 1.7B Q8 CPU configuration failed hard in a Codex worker (0/24 within 5.5 s; a few outputs took 79–109 s and were wrong). This does **not** measure the actual Mac or every Qwen model. Groq free GPT-OSS options have produced promising *and* flawed real results in earlier Codex evaluations; see `docs/AI_RECOVERY_RESULTS.md`, `docs/AI_CHAOS_STRESS_RESULTS.md`, `docs/FREE_AI.md`, `docs/GROUNDED_ACTION_SYSTEM.md`. Narrative truthfulness **not qualified**; default off until proved. User does not want a paid service or another account-connection chore right now.

## 3. Long-term world design: hybrid, bounded, highly reactive (agreed *direction*, NOT next implementation order)

Owner proposed a **hybrid rather than a purely handcrafted map or an infinite AI-rendered world**, and agreed to the architecture with caution:

- **Hand-authored anchor locations** on a bounded **island/kingdom** for visual quality, coherent geography, memorable NPCs and story beats. Example environments (concepts only, not promised maps): The Tipsy Wyvern/village hub, market, deep forest, river/bridge/lake, old ruins/castle, shore.
- **Procedural gap-filling on demand** when someone goes "off script": generate *supported* trails, glades, caves, interiors, shoreline/underwater subregions using consistent reusable licensed pixel tiles, known object/entity templates and seeded world rules. The AI can describe or propose encounters, characters and events, but does **not** have to generate brand-new art or physics each turn.
- **Persistent discovered geography:** generated locations receive stable IDs, saved terrain, objects, items, inhabitants, prior effects. Returning to a forest should find the same burned bridge/angry traveler unless a valid intervening event changed them. Generate lazily; load only relevant vicinity, unload region chunks when practical—especially important for the old Mac.
- **Systemic sandbox reactivity, not bespoke scripts for each prop.** Give meaningful objects shared properties: material, size, flammability, durability, portability, contents, owner, position, capabilities, visibility/containment, damage/state. Actions like take, cut, climb, burn, repair, fill, combine, wear, trade, build and disassemble derive from reusable rules. Background decoration may have *lightweight* reactions; don't promise arbitrary simulated physics for every pixel.
- **Systemic NPC reactivity:** people/creatures have identities, memories, relations, trust, attitude, possessions, knowledge, goals and scene awareness. E.g. steal apples → merchant notices or doesn't, complains to guard or refuses service, consequences persist, AI writes personality-appropriate dialogue after authoritative results.
- **Ocean as an in-fiction world boundary:** near coast support legitimate swimming, diving, fishing, boat/wreck/shore experiences when those mechanics exist. Far offshore, increasingly dangerous currents, weather, fatigue, visibility, creatures/sharks/sea monsters make indefinite travel unattractive or impossible. Avoid an arbitrary invincible scripted shark: Bobby will try to kill, tame or ride it. Creatures and navigation must obey actual rules. Do not pretend an endless reachable world exists beyond the implemented boundary.
- **"Bobby jumps into a river, dives to discover a submerged cave" is a desired eventual experience**, *not* a feature the present code can do fully. A supported underwater biome requires its own mechanics (depth, air, swimming, collision, visual representation and suitable hazards). Gracefully report unsupported behaviors until proven, rather than claiming magic instant scene creation.
- **Player-chained declarations** (e.g. steal apples AND set cart on fire AND flee) currently obey one accepted action per turn. Pick a faithful one-action interpretation or explicitly constrain multi-step attempts; do not silently resolve three successful actions at once.
- **World generation ≠ infinite responsiveness:** the real goal is players feeling free to try surprising things, seeing understandable visual consequences and living with them. Robust constraints, persistent canonical state and affordances matter more than the number of maps.

## 4. Party splitting and majority vote — owner-approved product shape

This is a **critical clarified decision** following a mistaken suggestion that minority players could keep playing separate graphical adventures on their phones.

- The phone is a **remote only**, no separate playable world view.
- **One shared TV camera/scene for the party**, especially in the first release. Do not implement concurrent separate subgroup adventures, per-phone worlds or split screens without a new decision.
- **Majority voting for major group travel** is the preferred direction: if Bobby wants to leave the tavern and most connected participants vote to follow him into the forest, the shared TV and party move there together. If the majority declines, the main TV stays; Bobby can get an in-world reaction to the *attempt* without opening a second parallel campaign. Everyone retains participation in the current room.
- **Do not vote for every ordinary action**: that would destroy pacing. Existing first-declaration / reaction mechanics remain authoritative for moment-to-moment chaos.
- Vote details are **not yet decided**: exact threshold/eligible voters, tie policy, abstentions, timeouts, host intervention, what counts as major vs minor travel, how individual "leave" animations/attempts operate if group says no. Treat those as design questions for later playtest, not established requirements.
- The owner specifically **liked and confirmed** the one-TV / shared-world / controller-vote proposal.

## 5. Intentionally deferred product decisions

- **Continuous, permanently evolving kingdom vs discrete game-night adventures with persistent characters:** OWNER HAS NOT DECIDED; explicitly prefers waiting until after **one successful game night**. Keep save IDs, characters, inventories and world history compatible with both approaches; do not force a campaign architecture/product decision now.
- How many islands, specific layout, ocean threat mechanics, fully dynamic multi-region event scheduler, the eventual depth of physics/world autonomy, separate parties in a distant future: **brainstormed only**. Do not start a huge world-building feature based on this document.
- Do not make the next milestone "50 locations" or "everything fully physics simulated." Better benchmark **one delightful, visually reactive place** and one small outdoor proof.

## 6. Concrete examples useful for AI/world acceptance later

These are design probes, not statements that all functions exist yet:

- Bobby runs into the forest, swims in the river and dives. If the path/water/depth is supported, world generator provides a consistent connected location; if not, the engine limits honestly. Moving whole group requires travel vote. No instant independent phone adventure.
- "I cut a tree and make a raft": validate available tree/tool/materials and actions over multiple turns; only craft a supported vessel with material/floating rules if implemented. Otherwise an honest attempt/failure, not prose pretending a raft exists.
- Market apple theft and burning cart: merchant awareness and guard reactions depend on line of sight and canonical state; fire propagates only through a supported bounded fire system; visible cart/props change; returning remembers it.
- Burn a bridge, return next game: crossing broken until repaired, travelers react, possible AI-proposed repair quest only if implemented and accepted into canonical state.
- Claim to be Marnie's child: deception roll/social interaction, NPC responds but does not gift drinks unless a validated effect actually occurs.
- "I sing a rap to soothe Bristle": creature-specific pacify with **no** medical item consumed.
- "Make a purple raincatcher from cloth strip + wood splinter": sources, appearance, slot and ownership must be exact; visuals reflect the creation.
- Steal rug / ignite rug: exact referenced rug and ownership; no substitution with fireplace; persist scene and inventory changes.
- Unavailable, remote, impossible targets and fraudulent currency/power declarations must not mutate state or appear successful in the narrator.
- Reactions, chained actions, multiple players, reconnect, and side comments should never overwrite the first locked declaration.

## 7. Actual progress and independent test evidence (labelled carefully)

**Existing implementation in `fix/grounded-action-contract` at 8ebabfff:** the tavern, shared multiplayer, generated connecting regions, simple generated quests and NPCs, material/item system, crafting/containment, travel, region saves, bounded authoritative memory, experimental AI action contract and optional creative narrator foundations. **This is NOT** a finished generative sandbox or reliable creative narrator. The latest branch is NOT yet the delivered Mac build. The current real-phone/TV/2015-Mac gates remain open.

**Independent read-only testing performed in chat (source copied to isolated runtime, exact blob hashes verified; no GitHub/game-source/saves changes):**
- Core tests 14/14 and beta mechanics 10/10.
- Broader partial Node run: **98 passed**; 3 test files failed to start due to unavailable `@colyseus/core` in the isolated copy. These counts **overlap** the core/beta results; don't sum.
- More focused existing mechanical tests: **45/45 passed** across six suites, including **8 × 100-turn** deterministic campaign stress, reusable crafting/ownership, containers, generated quests, exact-ID validation and AI intent guards. Those tests overlap other repo suites; don't interpret as 45 new features.
- **12 original mechanics boundary scenarios** passed after correcting one test-harness input (first valid declaration of 20, nineteen reactions, 24-person limit, duplicate requests, no self/late/duplicate reactions, no item theft/duplicate crafting, privacy, deterministic world, scene reset, remote NPC safeguard).
- **16 fresh no-AI, starting-tavern declarations**: wrong interpretation examples included an absent/unowned rug fire being directed at the hearth, calming a nonexistent-in-room wolf becoming tavern dance with unrelated clue/coin, absent wayfarer bandage becoming generic healing, social deception/apology unsupported. These were **starting-room deterministic-parser probes**; the referenced wolf/wayfarer, craft materials and prior event were absent, not valid in-world end-to-end AI evaluations. Some core valid actions (rug theft, attacking characters, no imaginary gold) worked. See **`docs/QA_INDEPENDENT_READONLY_2026-10-27.md`** for exact cases and qualifications.
- **9/9 initial independent real-model interpretations** matched the expected action and were successfully validated/applied by unmodified engine (bartender deception + 8 cases: rug ownership, spell guard target, creative wearable, transfer, pacify creature, treat injury, fake reward rejection, remote target rejection). **The model was NOT Groq/GPT-OSS**, but a separate real generative model available to chat's testing sandbox. This is limited harness-level evidence, NOT proof that the shipped Groq adapter is qualified or that the TV visuals are right. Measured model inference on those cases ~1.6–2.5 s, not game-night network/host latency.
- **AI story/narration from the real Groq provider remains unqualified**; previous Codex real Groq stress reported fabricated drinks/rewards/unsupported events even when schema validated. **Do not enable narration by default solely based on 9/9 action interpretation.**
- Owner declined connecting Groq to this chat for additional real provider testing, and chose more mechanics testing instead. **No provider/billing/connection work is currently requested**.

## 8. Staging guidance: prioritize fun and actual acceptance

**Now / before first family game night (highest priority):**
1. Keep and stabilize the working game, preserve saves/provenance/assets. Test complete Mac packaging on target early-2015 machine; backup existing campaign.
2. Prove 90 seconds of delightful, understandable, animated tavern gameplay at 1280×720 with **two physical phone controllers** first; then 12–20 actual participants if feasible. Check sound, legibility, effects, startup, QR, character appearance, reaction fairness, Wi-Fi, heat/CPU, persistence, latency.
3. Finish AI action and creative narration **qualification** against the actual chosen free provider if already authorized/available, with strict semantic/canonical audits and no new paid service. Preserve no-AI fallback. Narration remains opt-in until trustworthy.
4. Play one enjoyable real family game night before forcing campaign-format decisions.

**Only after that / optional controlled experiment:**
5. Create a **small forest + river + bridge** or **village market** adjacent to the tavern, within consistent pre-authored visual assets; use as a **sandbox architecture proof**, not full island expansion. Demonstrate NPC/object system and persistent damage/repair/ownership plus at least one unexpected-but-supported declared action, with real visible feedback.
6. Prototype **majority-vote group travel** with phone voting and single camera *only when ready to implement*, then test for interruptions and minority frustration.
7. Incrementally increase supported procedural biomes, underwater mechanics and generative quest proposals **if verified fun, stable, and affordable**.

## 9. Codex guardrails / navigation

- **This is owner context, not an autonomous implementation request.** Do not spawn a large feature project, restructure core game, alter model provider, buy anything or deploy because this file appeared.
- Respect existing `AGENTS.md`, `docs/QUALITY_GATES.md`, third-party licensing, existing Playwright/browser/physical testing constraints, zero paid game-service requirement, shared free API usage quota, and authoritative validation.
- Relevant existing issues: [#4 hardware beta](https://github.com/sifuentestrey/chaos-party-rpg/issues/4), [#5 original Qwen inference](https://github.com/sifuentestrey/chaos-party-rpg/issues/5), [#6 creative AI DM](https://github.com/sifuentestrey/chaos-party-rpg/issues/6), [#7 game-night QA](https://github.com/sifuentestrey/chaos-party-rpg/issues/7).
- **When Codex resumes**, first read this handoff and latest Git history, reconcile any newer commits, and ask whether the owner wants implementation or simply discussion before adding major scope.
