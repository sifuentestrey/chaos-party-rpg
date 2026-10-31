/** Sidecar-only environmental spread. Native Fracture scenery/HP is untouched. */
import {environmentStep,touchingEnvironment} from './environment-rules.mjs';
export function advanceAuthoredFire(state,scene,{rain=0,wind={x:0,y:0},sources=null,canSpread=()=>true,nativeOnly=false,allowedIds=null}={}){
 const entries=Object.values(state.scenery||{}).filter(o=>o.scene===scene&&(!nativeOnly||o.nativeOrigin)&&(!allowedIds||allowedIds.has(o.id)));
 if(!entries.length)return [];
 sources??=Object.values(state.items||{}).filter(i=>i.location===scene&&!i.ownerId&&!i.parentId&&i.tile&&i.condition==='burning');
 const burning=entries.map(o=>({...o}));
 const previouslyBurning=new Set(entries.filter(o=>o.condition==='burning').map(o=>o.id));
 // Fire can enter the authored overlay from a physically adjacent Chaos floor object.
 for(const target of burning){
  if(!target.flammable||target.condition!=='intact'||target.wet>0)continue;
  const source=sources.find(source=>!source.contained&&canSpread(source,target)&&touchingEnvironment(source,target));
  if(source){target.condition='burning';target.ignitedBy=source.ignitedBy||null;target.ignitionOriginId=source.ignitionOriginId||(source.ignitedBy?source.id:null);}
 }
 const result=environmentStep(Object.fromEntries(burning.map(o=>[o.id,o])),{rain,wind,canSpread:(a,b)=>(a.waterSource||['river','lake','pond'].includes(a.kind)||previouslyBurning.has(a.id))&&canSpread(a,b)});
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
