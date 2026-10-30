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

export function objectBlocksTile(items,location,x,y){
 return Object.values(items||{}).some(item=>!item.ownerId&&item.location===location&&item.tile?.x===x&&item.tile?.y===y&&objectCapabilities(item).blocking);
}
