/** Sidecar-only environmental spread. Native Fracture scenery/HP is untouched. */
import {environmentStep} from './environment-rules.mjs';
export function advanceAuthoredFire(state,scene,{rain=0,wind={x:0,y:0}}={}){
 const entries=Object.values(state.scenery||{}).filter(o=>o.scene===scene);
 if(!entries.length)return [];
 const sources=Object.values(state.items||{}).filter(i=>i.location===scene&&!i.ownerId&&!i.parentId&&i.tile&&i.condition==='burning');
 const burning=entries.map(o=>({...o}));
 // Fire can enter the authored overlay from a physically adjacent Chaos floor object.
 for(const target of burning){
  if(!target.flammable||target.condition!=='intact'||target.wet>0)continue;
  if(sources.some(source=>Math.abs(source.tile.x-target.tile.x)+Math.abs(source.tile.y-target.tile.y)===1))target.condition='burning';
 }
 const result=environmentStep(Object.fromEntries(burning.map(o=>[o.id,o])),{rain,wind});
 const changes=[];
 for(const next of Object.values(result.objects)){
  const previous=state.scenery[next.id];
  if(!previous)continue;
  if(previous.condition!==next.condition||previous.hp!==next.hp){
   changes.push({id:next.id,kind:next.kind,before:previous.condition,after:next.condition,hp:next.hp});
  }
  state.scenery[next.id]={...previous,...next,blocking:next.condition==='broken'?false:next.blocking};
 }
 return changes;
}
