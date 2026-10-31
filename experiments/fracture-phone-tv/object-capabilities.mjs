/** Shared capabilities for Chaos-owned objects; native Fracture scenery remains authoritative. */
import {MATERIAL_RULES} from '../../public/entity-rules.js';

export function objectCapabilities(item){
 const physical=!!item&&!!item.tile&&!item.parentId&&item.condition!=='disassembled';
 const intact=physical&&item.condition!=='broken';
 return Object.freeze({
  movable:!!(intact&&item.portable),
  flammable:!!(intact&&MATERIAL_RULES[item.material]?.burns),
  breakable:!!(intact&&Number.isFinite(item.hp)&&item.hp>0),
  repairable:!!(physical&&item.condition==='broken'),
  blocking:!!(intact&&item.blocks),
  extinguishable:!!(physical&&item.condition==='burning')
 });
}

export function objectBlocksTile(items,location,x,y,npcs={}){
 return Object.values(items||{}).some(item=>{
  // A physical NPC-owned fixture still blocks movement. Player inventory
  // never becomes scenery, even if a stale saved item retained a tile.
  const onGround=item.ownerId?npcs[item.ownerId]?.location===location:item.location===location;
  return onGround&&item.tile?.x===x&&item.tile?.y===y&&objectCapabilities(item).blocking;
 });
}
