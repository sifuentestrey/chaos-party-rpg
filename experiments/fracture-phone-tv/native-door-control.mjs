/** Temporary, actor-held control of EXISTING Fracture map doors.
 * No props, map tiles, teleport destinations, or native collision data are created.
 * A hold is in memory only and ends on timeout, death, disconnect, or departure.
 */
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cell=p=>`${p.x},${p.y}`;
const keyFor=d=>[cell(d),cell({x:d.tx,y:d.ty})].sort().join('|');
const valid=d=>[d?.x,d?.y,d?.tx,d?.ty].every(Number.isInteger)&&d.x>=0&&d.y>=0&&d.tx>=0&&d.ty>=0&&(d.x!==d.tx||d.y!==d.ty);
const actorId=p=>String(p?.characterId||'');
export function createNativeDoorControl(doors,{clock=Date.now,ttlMs=15000}={}){
 if(!Array.isArray(doors)||!Number.isFinite(ttlMs)||ttlMs<1000)throw Error('Native door geometry and positive hold duration required');
 const entries=new Map(),tiles=new Map(),holds=new Map();
 for(const door of doors){
  if(!valid(door))continue; // Fail closed on malformed or invented geometry.
  const key=keyFor(door),ends=[{x:door.x,y:door.y},{x:door.tx,y:door.ty}];
  if(!entries.has(key))entries.set(key,{key,ends});
  for(const end of ends){const c=cell(end);if(!tiles.has(c))tiles.set(c,new Set());tiles.get(c).add(key);}
 }
 const live=(key,world)=>{
  const hold=holds.get(key);if(!hold)return null;
  const entry=entries.get(key);
  const owner=Object.values(world?.players||{}).find(p=>actorId(p)===hold.actorId);
  if(!owner||!owner.chaosControlled||owner.chaosSpectator||!owner.hasEnteredGame||owner.isDead||owner.getWorld?.()!==world||clock()>=hold.until||!entry.ends.some(end=>distance(owner,end)<=1)){
   holds.delete(key);return null;
  }
  return {...hold,name:owner.chaosName||owner.name||'A player'};
 };
 const find=(p,limit=8,inZone=()=>true)=>{
  const matches=[];
  for(const entry of entries.values()){
   const options=entry.ends.filter(inZone).map(point=>({point,distance:distance(p,point)})).filter(x=>x.distance<=limit).sort((a,b)=>a.distance-b.distance);
   if(options.length)matches.push({...entry,...options[0]});
  }
  matches.sort((a,b)=>a.distance-b.distance);
  if(matches.length>1&&matches[0].distance===matches[1].distance)return {ambiguous:true};
  return matches[0]||null;
 };
 const use=(p,entry,verb,{success=false}={})=>{
  if(!entry||entry.ambiguous||!entries.has(entry.key))return {blocked:true,success:false,text:'Choose one existing map doorway.'};
  if(!actorId(p)||!p.chaosControlled||p.isDead||!p.hasEnteredGame||!entry.ends.some(end=>distance(p,end)<=1))return {blocked:true,success:false,text:'Stand beside that doorway with your active character.'};
  const current=live(entry.key,p.getWorld());
  if(verb==='hold'){
   if(current&&current.actorId!==actorId(p))return {blocked:true,success:false,text:`${current.name} is already holding that doorway.`};
   holds.set(entry.key,{actorId:actorId(p),until:clock()+ttlMs});
   return {blocked:false,success:true,text:`${p.chaosName||p.name} holds the existing doorway shut for up to ${Math.ceil(ttlMs/1000)} seconds. Moving away releases it.`};
  }
  if(!current)return {blocked:true,success:false,text:'That doorway is not being held shut.'};
  if(verb==='release'){
   if(current.actorId!==actorId(p))return {blocked:true,success:false,text:'Only the character holding this doorway can release it. Try forcing it.'};
   holds.delete(entry.key);return {blocked:false,success:true,text:'You release the doorway. Passage is clear.'};
  }
  if(verb==='force'){
   if(current.actorId===actorId(p))return {blocked:true,success:false,text:'You are holding this doorway. Release it instead.'};
   if(success)holds.delete(entry.key);
   return {blocked:false,success:!!success,text:success?`You force the doorway past ${current.name}. Passage is clear.`:`${current.name} holds the doorway against your attempt.`};
  }
  return {blocked:true,success:false,text:'Unsupported doorway interaction.'};
 };
 const isBlocked=(p,x,y)=>{
  for(const key of tiles.get(`${x},${y}`)||[]){const hold=live(key,p.getWorld());if(hold&&hold.actorId!==actorId(p))return true;}
  return false;
 };
 const view=p=>[...entries.values()].flatMap(entry=>{
  const hold=live(entry.key,p.getWorld());if(!hold)return [];
  const point=entry.ends.slice().sort((a,b)=>distance(p,a)-distance(p,b))[0];
  return distance(p,point)<=8?[{x:point.x,y:point.y,heldBy:hold.name}]:[];
 });
 return {find,use,isBlocked,view};
}
