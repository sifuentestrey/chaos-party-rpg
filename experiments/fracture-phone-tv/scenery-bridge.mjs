/** Explicitly authored scenery only. Never infer destructibility from native tiles. */
import {environmentObject,environmentDamage} from './environment-rules.mjs';
export function registerScenery(state,{scene,id,kind,tile}){
 if(!scene||!id||!kind)throw Error('Scenery needs scene, id and kind');
 state.scenery||={};
 const key=scene+':'+id;
 if(!state.scenery[key])state.scenery[key]={...environmentObject(key,kind,tile),scene};
 return state.scenery[key];
}
export function strikeScenery(state,{scene,id,damage=1}){
 const key=scene+':'+id,old=state.scenery?.[key];
 if(!old)return {changed:false,error:'Unknown authored scenery'};
 const result=environmentDamage(state.scenery,key,damage);
 if(result.changed)state.scenery=result.objects;
 return {changed:result.changed,object:state.scenery[key]};
}
export function sceneryBlocks(state,scene,x,y){
 return Object.values(state.scenery||{}).some(o=>o.scene===scene&&o.tile.x===x&&o.tile.y===y&&o.blocking&&o.condition!=='broken');
}
export function visibleScenery(state,scene){return Object.values(state.scenery||{}).filter(o=>o.scene===scene);}
