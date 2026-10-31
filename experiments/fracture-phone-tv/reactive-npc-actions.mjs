/** Bounded, physically grounded NPC fire response in the isolated Fracture sidecar.
 * No NPC movement, native combat, inventory, or quest state is fabricated.
 * Mutates only the caller's cloned NPC alert state; caller executes the original
 * Chaos extinguish rule and persists the resulting authoritative object state.
 */
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function selectNpcFireResponses({npcs,items,location,present,zoneAt,validTile,tick,delayMs=10000}) {
 const responses=[];
 for(const npc of Object.values(npcs||{})) {
  if(npc.location!==location)continue;
  if(!present.has(npc.id)||!npc.tile||!validTile(npc.tile)){delete npc.fireAlert;continue;}
  const zone=zoneAt(npc.tile);
  const burning=Object.values(items||{}).find(item=>item.ownerId===npc.id&&item.tile&&
   item.condition==='burning'&&validTile(item.tile)&&zone!==null&&zone===zoneAt(item.tile)&&
   distance(npc.tile,item.tile)<=1);
  if(!burning){delete npc.fireAlert;continue;}
  if(npc.fireAlert?.itemId!==burning.id||!Number.isFinite(npc.fireAlert.at)||npc.fireAlert.at>tick){
   npc.fireAlert={itemId:burning.id,at:tick};continue;
  }
  if(tick-npc.fireAlert.at<delayMs)continue;
  responses.push({npcId:npc.id,itemId:burning.id});
  delete npc.fireAlert;
 }
 return responses;
}
