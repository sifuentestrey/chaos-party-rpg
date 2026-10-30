/** Grounded environmental witnesses for the isolated Chaos/Fracture world.
 * The native engine still owns NPC movement, combat, and quest rewards.
 * This module records observed events only; it never fabricates a player action.
 */
const incidentKinds = new Set(['fire-spread', 'fire-destruction']);
export function recordEnvironmentalIncident(npcs, {kind, item, actorId=null, round, location, canWitness}) {
 if (!incidentKinds.has(kind) || !item?.id || !item.tile || !Number.isInteger(round) || typeof canWitness !== 'function') return [];
 const witnessed=[];
 for (const npc of Object.values(npcs||{})) {
  if (npc.location!==location || !npc.tile || !canWitness(npc,item.tile)) continue;
  const id=actorId && String(actorId) || null;
  const observation={verb:kind,actorId:id,itemId:item.id,round,success:true};
  const prior=(npc.history||[]).filter(h=>h.actorId===id);
  npc.history=[...(npc.history||[]),observation].slice(-12);
  if (id) {
   npc.memories||={};
   npc.memories[id]=[...(npc.memories[id]||prior),observation].slice(-4);
   if (npc.id===item.ownerId) {
    npc.trust||={};
    npc.trust[id]=Math.max(-10,(npc.trust[id]||0)-1);
   }
  }
  witnessed.push(npc.id);
 }
 return witnessed;
}

/** NPCs react to the actual condition of their own visible property. */
export function propertyConcern(items,npc,canWitness){
 if (!npc || typeof canWitness!=='function') return null;
 const property=Object.values(items||{}).find(i=>i.ownerId===npc.id && i.tile &&
  ['burning','broken'].includes(i.condition) && canWitness(npc,i.tile));
 if (!property) return null;
 const itemName=String(property.name||'property').replace(/[\u0000-\u001f]/g,' ').slice(0,60);
 return property.condition==='burning'
  ? `My ${itemName} is on fire! Please extinguish it.`
  : `My ${itemName} burned through. Can someone repair it?`;
}
