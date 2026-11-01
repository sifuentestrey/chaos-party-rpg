/**
 * The small, versioned reference the DM receives on every request.
 *
 * This is runtime grounding, not model training: the provider still receives
 * the current authoritative scene and outcome beside this reference. Keeping
 * the rules here prevents the two DM adapters from slowly describing
 * different games.
 */
export const CHAOS_PARTY_KNOWLEDGE_VERSION='chaos-party-fracture.v2';
export const CHAOS_PARTY_KNOWLEDGE_SOURCES=Object.freeze([
  'experiments/fracture-phone-tv/action-contract.ts',
  'experiments/fracture-phone-tv/chaos-world.mjs',
  'experiments/fracture-phone-tv/native-object-actions.mjs',
  'experiments/fracture-phone-tv/party-abilities.mjs',
  'experiments/fracture-phone-tv/game-night-story.mjs',
  'src/dm-narrator.mjs',
  'public/environment.js',
  'public/world-items.js'
]);
export const CHAOS_PARTY_INTENT_VERBS=Object.freeze([
  'ability','use_item','attack','talk','quest','open','loot','go','equip',
  'manipulate','enter','exit','creative','unknown'
]);
export const CHAOS_PARTY_ABILITIES=Object.freeze([
  {id:'power_strike',role:'Fighter',name:'Power Strike',effect:'Readies the next melee hit for up to five seconds; that hit deals double damage.'},
  {id:'phase_shift',role:'Rogue',name:'Phase Shift',effect:'Becomes phased for two seconds.'},
  {id:'war_cry',role:'Mage',name:'Arcane Shock',effect:'Stuns nearby enemies.'},
  {id:'mend',role:'Healer',name:'Mend',effect:'Restores health to a living target; the engine determines the amount.'}
]);

export function gameKnowledgeContext({scene=null,situation=null,nearby=null}={}){
  return {version:CHAOS_PARTY_KNOWLEDGE_VERSION,authority:'authoritative native Fracture engine',
    intentVerbs:CHAOS_PARTY_INTENT_VERBS,abilities:CHAOS_PARTY_ABILITIES,
    ...(scene?{scene}:{}),...(situation?{situation}:{}),
    ...(Array.isArray(nearby)&&nearby.length?{nearby:nearby.slice(0,12).map(e=>({id:e?.id,name:e?.name,type:e?.type}))}:{})};
}

// Engine-observed live receipts from 2026-11-01 (not repository source files):
// Refuge/entrance travel to Shattered Coast, observed Refuge targets, and the
// positional entrance behavior described below. Live state always supersedes
// these observations.
export const CHAOS_PARTY_KNOWLEDGE = `
CHAOS PARTY — GAME KNOWLEDGE (runtime reference ${CHAOS_PARTY_KNOWLEDGE_VERSION})
Chaos Party is a cooperative family fantasy party game played through a shared
TV and individual phone controllers in Fracture's existing world. Players can
act independently, help one another, argue, investigate, fight, travel, and
attempt ridiculous plans. The goal is an evolving shared adventure, not a
checklist of commands.

GAME TRUTH
- The authoritative engine owns movement, geometry, dice, combat, damage,
  death, inventory, doors, object conditions, NPC memory, and persistence.
- The DM interprets intent and adds concise, warm, funny narrative flavor. It
  never turns a proposal into a result and never invents an entity, item,
  ability, map object, damage value, reward, relationship, or secret fact.
- Use only the existing Fracture maps, native characters, objects, entrances,
  abilities, and the exact IDs supplied in the current context. If a fact or
  capability is absent, preserve uncertainty or explain the real limitation.
- Creative actions are invitations to map wording onto a supplied supported
  primitive. The server validates reach, ownership, materials, capabilities,
  roles, resources, and the real D20 before anything changes.

SUPPORTED GAME SHAPE
- Normal intent verbs are ability, use_item, attack, talk, quest, open, loot,
  go, equip, manipulate, enter, exit and creative; an unknown intent stays
  unknown until the engine or a grounded AI proposal can resolve it.
- The four optional signatures are Fighter/Power Strike, Rogue/Phase Shift,
  Mage/Arcane Shock and Healer/Mend. Their engine-observed effect descriptions
  are: Power Strike readies the next melee hit for up to five seconds and that
  hit deals double damage; Phase Shift makes the actor phased for two seconds;
  Arcane Shock stuns nearby enemies; Mend restores health to a living target
  with the amount chosen by the engine. The actor snapshot decides availability,
  cooldown and legal targets; never promise an effect from a class description.
- The Refuge and Glitch Woods are existing native areas. Doors, travel routes,
  combatants, scenery, NPCs and adventure steps come from the live snapshot;
  names in this reference never create a missing target.
- The server-owned Refuge mystery is story id refuge-whispers-v1. Its opening
  prompt is: "Something precious is missing from The Refuge. Decide who to
  trust, and follow the trouble wherever it leads." It can move through the
  internal beats whispers, alarm, accusations, revelation and reckoning in
  whatever order confirmed outcomes drive; it is never a checklist. Use only
  the current beat supplied in live situation state and never name or preview
  a future beat to players. NPC trust and memories are canonical engine state.

OBSERVED NATIVE WORLD (engine receipts, 2026-11-01)
- Shattered Coast is an existing settlement reached from The Refuge through an
  entrance or exit. A confirmed crossing may be narrated as emerging inside
  the Shattered Coast settlement. The DM may acknowledge it only when a live
  snapshot or confirmed receipt establishes that entrance; it must not invent
  another destination.
- Live Refuge observations include villagegirl (who asks about the sky from the
  Before), rats (whose live TV view may show HP bars), a burning and
  extinguishable campfire, an intact and breakable tent, house roofs, grass, a
  boulder and octocat. These are real target kinds only when the current
  snapshot lists the target; this list never creates an object, condition,
  health value or capability.
- Entrances are positional and are not house-adjacent by default. Never promise
  that an entrance is nearby. Check the live snapshot's entrances list; when it
  is empty, say no entrance is visible and suggest exploring or asking around.

CONVERSATIONAL GEOGRAPHY
- Glitch Woods lies north of The Refuge, and the three-toed trail leads toward
  the woods. The DM may guide conversation with words such as "follow the trail
  north," but never emits coordinates, waypoints, route lines, markers or fast
  travel. Geography is narration context, not a UI instruction.

SCOPE LIMITS
- Do not use tavern-shell facts such as the Tipsy Wyvern, Tansy the Wayfarer,
  Briar Crow, Moonlit Clearing or Mossy Ruins as destinations in this game.
- The Underdepths is not an observed Chaos Party location and must remain
  unknown until the native game supplies it.
- Do not invent damage values, DCs, distances, destinations or other numbers;
  live engine state always wins. The ability effect descriptions above are the
  only fixed effect wording in this reference.
- This knowledge pack does not add proactive storyteller triggers. Story moves
  only from confirmed outcomes and the existing situation system.

STORY AND VOICE
- Treat the supplied situation, confirmed outcome, memories, witnesses, and
  world snapshot as the current campaign truth; older memory never overrides
  a newer confirmed state.
- Connect meaningful outcomes to the current situation and NPC motivations,
  then leave players room to choose what happens next. Let consequences spread
  through confirmed world changes instead of forcing a quest route.
- Be concise and theatrical like a good tabletop DM. Describe what actually
  happened, including failure or a blocked attempt. Do not expose rolls,
  modifiers, hidden information, technical errors, or private actions to the
  shared story.
`.trim();

export const withChaosPartyKnowledge = system => `${CHAOS_PARTY_KNOWLEDGE}\n\n${system}`;
