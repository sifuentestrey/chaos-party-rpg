// Scene data and deterministic interactions; independent of the renderer or map.
export const OBJECTS = {
  table:{name:'the tavern table',position:[245,335],pattern:/\b(table|tables)\b/i},
  barrel:{name:'the ale barrel',position:[846,165],pattern:/\b(barrel|barrels|cask|keg)\b/i},
  door:{name:'the tavern door',position:[480,495],pattern:/\b(door|gate)\b/i}
};
export function environmentTarget(text){
  for(const [kind,o] of Object.entries(OBJECTS))if(o.pattern.test(text))return {kind,name:o.name};
  return null;
}
export function interactEnvironment(world,target,intent,success,actor){
  const object=OBJECTS[target.kind];
  if(!object||!['break','attack','inspect','steal'].includes(intent))return null;
  const props=world.props||(world.props={rug:true});
  const state=props[target.kind]||'intact';
  if(intent==='inspect')return {text:`${actor} examines ${object.name}. ${state==='broken'?'It is broken, with debris still on the floor.':'It is solid wood, worn by years of tavern trouble.'}`,change:null};
  if(state==='broken')return {text:`${actor} approaches ${object.name}, but it is already broken. The debris remains.`,change:null};
  if(intent==='steal')return {text:`${actor} tries to pocket ${object.name}. It is much too large to carry away intact.`,change:null};
  if(!success)return {text:`${actor} strikes ${object.name}. It shudders but holds together.`,change:null};
  props[target.kind]='broken';
  return {text:`${actor} breaks ${object.name}. ${target.kind==='barrel'?'Ale pours across the floor.':target.kind==='door'?'Splintered boards leave the doorway open.':'The tabletop collapses into a pile of planks.'}`,change:`${target.kind.toUpperCase()} BROKEN`};
}
