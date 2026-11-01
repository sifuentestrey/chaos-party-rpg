/**
 * The small, versioned reference the DM receives on every request.
 *
 * This is runtime grounding, not model training: the provider still receives
 * the current authoritative scene and outcome beside this reference. Keeping
 * the rules here prevents the two DM adapters from slowly describing
 * different games.
 */
export const CHAOS_PARTY_KNOWLEDGE_VERSION='chaos-party-fracture.v1';
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
  {id:'power_strike',role:'Fighter',name:'Power Strike'},
  {id:'phase_shift',role:'Rogue',name:'Phase Shift'},
  {id:'war_cry',role:'Mage',name:'Arcane Shock'},
  {id:'mend',role:'Healer',name:'Mend'}
]);

export function gameKnowledgeContext({scene=null,situation=null,nearby=null}={}){
  return {version:CHAOS_PARTY_KNOWLEDGE_VERSION,authority:'authoritative native Fracture engine',
    intentVerbs:CHAOS_PARTY_INTENT_VERBS,abilities:CHAOS_PARTY_ABILITIES,
    ...(scene?{scene}:{}),...(situation?{situation}:{}),
    ...(Array.isArray(nearby)&&nearby.length?{nearby:nearby.slice(0,12).map(e=>({id:e?.id,name:e?.name,type:e?.type}))}:{})};
}

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
  Mage/Arcane Shock and Healer/Mend. The actor snapshot decides availability,
  cooldown and legal targets; never promise an effect from a class description.
- The Refuge and Glitch Woods are existing native areas. Doors, travel routes,
  combatants, scenery, NPCs and adventure steps come from the live snapshot;
  names in this reference never create a missing target.
- The server-owned Refuge mystery introduces a missing silver bell and evolves
  through confirmed clues, danger, suspicion, discoveries and combat. It can
  branch around player choices; its prompts are invitations, not mandatory
  quest steps. NPC trust and memories are canonical engine state.

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
