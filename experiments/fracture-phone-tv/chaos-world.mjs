/** Chaos Party object rules projected onto real Fracture tiles; no legacy networking or saves. */
import fs from 'node:fs';import path from 'node:path';import {randomInt} from 'node:crypto';
import {parseItemAttempt,planItemAttempt,resolveItem,ITEM_TYPES,MATERIALS} from '../../public/world-items.js';
import {parseEntityAttempt,planEntity,resolveEntity,advanceEntities,MATERIAL_RULES} from '../../public/entity-rules.js';
import {recordDMMemory} from '../../public/dm-memory.js';
import {recordEnvironmentalIncident,propertyConcern} from './reactive-witness.mjs';
import {objectCapabilities,objectBlocksTile} from './object-capabilities.mjs';
import {registerScenery as registerAuthoredScenery,strikeScenery as damageAuthoredScenery,sceneryBlocks,visibleScenery} from './scenery-bridge.mjs';
import {advanceAuthoredFire} from './scenery-fire.mjs';
import {createNativeDoorControl} from './native-door-control.mjs';
import {selectNpcFireResponses} from './reactive-npc-actions.mjs';
import {spawnItem} from '../../public/campaign.js';
import {Rng} from '../../public/vendor/partyframe-rng.js';
import {selectD20} from '../../public/vendor/dnd5e-advantage.js';
import {resolveObjectRoll} from './party-roles.mjs';
const verbs=new Set(['take','drop','craft','attach','give','equip','unequip','separate','inspect','break','steal']);
const environmental=new Set(['move','ignite','extinguish','repair']);
const norm=s=>String(s||'').toLowerCase().replace(/^(?:the|a|an|my)\s+/,'').trim();
/** Door control uses only existing native map-authored entrances and player sprites. */
export function nativeDoorAttempt(text){
 const clean=String(text||'').trim().replace(/^(?:please |I (?:want to |try to )?)+/i,'').replace(/[.!?]+$/,'');
 if(/^(?:hold|brace|block|guard) (?:the )?(?:door|doorway|entrance)(?: shut)?$/i.test(clean))return 'hold';
 if(/^(?:release|unhold|stop holding|let go of) (?:the )?(?:door|doorway|entrance)$/i.test(clean))return 'release';
 if(/^(?:force|shove|push through|break through) (?:the )?(?:door|doorway|entrance)$/i.test(clean))return 'force';
 return null;
}
export function creativeAttempt(text){
 const clean=String(text).trim().replace(/^(?:please |I (?:want to |try to )?)+/i,'').replace(/[.!?]+$/,'').replace(/^(?:pick up|pickup|collect|grab) /i,'take ');
 const direction=clean.match(/ (north|south|east|west)$/i),core=direction?clean.slice(0,-direction[0].length):clean;
 const appeal=clean.match(/^(?:apologize to|make amends with|make peace with|reconcile with|persuade)\s+(?:the\s+)?(.+)$/i);if(appeal)return {verb:'appeal',recipient:appeal[1].trim()};
 const help=clean.match(/^(?:help|assist|aid)\s+(.+?)(?:\s+(?:craft|make|build|with crafting))?$/i);if(help)return {verb:'assist',recipient:help[1].trim()};
 const hinder=clean.match(/^(?:hinder|interfere with|sabotage)\s+(.+?)(?:\s+(?:with|on)\s+(?:their|the)\s+(?:roll|check|action))?$/i);if(hinder)return {verb:'hinder',recipient:hinder[1].trim()};
 const entity=parseEntityAttempt(core);
 if(entity&&environmental.has(entity.verb))return {...entity,...(direction?{direction:direction[1].toLowerCase()}:{}),entityAction:true};
 const attempt=parseItemAttempt(clean);return attempt&&verbs.has(attempt.verb)?attempt:null;
}
/** Only a named, visible Chaos-authored fixture can receive scenery commands.
 * Native mobs and unregistered map art always retain their own engine rules. */
export function sceneryAttempt(text,scenery=[]){
 const clean=String(text||'').trim().replace(/^(?:please |I (?:want to |try to )?)+/i,'').replace(/[.!?]+$/,'');
 const m=/^(?:attack|hit|strike|chop(?: down)?|cut down|fell|break|kick|smash|hack|uproot)\s+(?:the\s+)?(.+)$/i.exec(clean);
 if(!m)return null;
 const target=norm(m[1]);
 const matches=scenery.filter(o=>o&&o.scene&&o.tile&&
  [o.kind,o.name,o.id,o.id?.slice(o.scene.length+1)].some(ref=>norm(ref)===target));
 return matches.length===1?matches[0]:matches.length&&['tree','camp tree'].includes(target)?matches[0]:null;
}
function sceneryObjectAttempt(text,scenery=[]){
 const attempt=creativeAttempt(text);if(!attempt||!['ignite','extinguish','repair','move','inspect'].includes(attempt.verb))return null;
 const target=norm(attempt.target||attempt.item);
 const matches=scenery.filter(o=>[o.kind,o.name,o.id,o.id?.slice(o.scene.length+1)].some(ref=>norm(ref)===target));
 return (matches.length===1||matches.length&&['tree','camp tree'].includes(target))?{attempt:{...attempt,entityAction:true,target:matches[0].id},object:matches[0]}:null;
}
export function shouldUseCreative(text,actor){if(nativeDoorAttempt(text))return true;if(sceneryAttempt(text,actor?.chaos?.scenery||[])||sceneryObjectAttempt(text,actor?.chaos?.scenery||[]))return true;const a=creativeAttempt(text);if(!a)return false;if(['craft','attach','give','separate','steal','assist','hinder','appeal'].includes(a.verb))return true;const items=[...(actor?.chaos?.bag||[]),...(actor?.chaos?.ground||[]),...(actor?.chaos?.npcs||[]).flatMap(n=>n.items||[])];const reference=a.item||a.target;return items.some(i=>i.id===reference||norm(i.name)===norm(reference));}

export const fireCatchup=(last,now)=>({steps:Math.min(3,Math.floor(Math.max(0,now-last)/10000)),next:last+Math.min(3,Math.floor(Math.max(0,now-last)/10000))*10000});
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const scene=p=>`fracture:${p.getWorld?.().id||'world'}`;
const zoneAt=(world,x,y)=>{const zone=world.zoneManager?.getZoneAt(x,y);return zone?String(zone.id??zone.name??''):null;};
const sameZone=(p,q)=>{
 const world=p.getWorld();
 if(q.getWorld&&q.getWorld()!==world)return false;
 const a=zoneAt(world,p.x,p.y),b=zoneAt(world,q.x,q.y);
 return !!a&&a===b;
};
const reachable=(p,q)=>{
 const world=p.getWorld(),d=distance(p,q);
 if(!sameZone(p,q)||d>2||!world.isValidPosition(p.x,p.y)||!world.isValidPosition(q.x,q.y))return false;
 if(d<=1)return true;
 const zone=zoneAt(world,p.x,p.y);
 return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{
  const x=p.x+dx,y=p.y+dy;
  return world.isValidPosition(x,y)&&zoneAt(world,x,y)===zone&&distance({x,y},q)===1;
 });
};
const identity=p=>String(p.characterId||'');
const name=p=>p.chaosName||p.name;
export function createChaosWorld({file,seed=randomInt(1,0xffffffff),clock=Date.now,kindName=()=> 'villager',now=clock,npcName=n=>n.chaosName||n.name||kindName(n.kind),nativeTrees=[],nativeDoors=[]}={}){
 if(!file)throw Error('Separate Fracture object save path required');
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,seed,rng:seed,nextId:1,round:0,items:{},actors:{},camp:null};
 if(state.version!==1||!state.items||!state.actors)throw Error('Unsupported Chaos object save; refusing to overwrite');
 const doorControl=createNativeDoorControl(nativeDoors);
  state.scenery||={};state.assists||={};state.appeals||={};state.npcs||={};state.fireClock||={};state.dmMemory||={version:1,entries:[],people:{}};
 // A native mob instance can produce only one durable defeat memory. This set
 // is ephemeral; actual canonical story facts live in the separate object save.
 const observedNativeDefeats=new WeakSet();
 const persist=()=>{const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(state),{mode:0o600});fs.renameSync(temp,file);};
 function add(location,properties){const s={items:state.items,nextId:state.nextId};const item=spawnItem(s,location,properties);state.nextId=s.nextId;return item;}
 const nativeWorlds=new WeakSet(),clearedWorlds=new WeakMap();
 function syncNative(p){
  const world=p.getWorld();if(!nativeTrees.length||!world.map?.grid)return;
  let cleared=clearedWorlds.get(world);if(!cleared){cleared=new Set();clearedWorlds.set(world,cleared);}
  for(const tree of nativeTrees){
   if(cleared.has(tree.id)||state.scenery[scene(p)+':'+tree.id]?.condition!=='broken')continue;
   // Only validated native trunk cells are released. Other map layers survive.
   for(const t of tree.footprint)if(world.map.grid[t.y])world.map.grid[t.y][t.x]=0;
   cleared.add(tree.id);
  }
 }
 function seedNative(p){
  if(!nativeTrees.length)return;
  const world=p.getWorld();if(!nativeWorlds.has(world)){
   const previous=state;state=structuredClone(state);try{
    for(const tree of nativeTrees){const o=registerAuthoredScenery(state,{scene:scene(p),...tree});Object.assign(o,{name:'tree',nativeOrigin:tree.nativeOrigin,footprint:tree.footprint});}
    persist();nativeWorlds.add(world);
   }catch(error){state=previous;throw error;}
  }
  syncNative(p);
 }
 function seedPlayer(p){
  const id=identity(p);if(!id)return;
  if(!state.actors[id]){
   const previous=state;state=structuredClone(state);try{
   state.actors[id]={name:name(p)};
   for(const [label,material,type] of [['cloth strip','cloth','fragment'],['wood splinter','wood','tool']])add(null,{name:label,material,type,ownerId:id,appearance:{shape:ITEM_TYPES[type].shape,color:MATERIALS[material].color}});
   if(!state.camp){
    state.camp={x:p.x,y:p.y,scene:scene(p)};const world=p.getWorld();
    const spots=[];for(let r=1;r<=3;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&world.isValidPosition(p.x+dx,p.y+dy)&&sameZone(p,{x:p.x+dx,y:p.y+dy}))spots.push({x:p.x+dx,y:p.y+dy});
    for(const [i,[label,material,type]] of [['smooth stone','stone','fragment'],['blue bottle','glass','container'],['cloth scrap','cloth','fragment'],['wood offcut','wood','tool']].entries())if(spots[i])add(scene(p),{name:label,material,type,tile:spots[i],appearance:{shape:ITEM_TYPES[type].shape,color:MATERIALS[material].color}});
   }
   persist();
   }catch(error){state=previous;throw error;}
  }else state.actors[id].name=name(p);
  if(state.actors[id])state.actors[id].scene=scene(p);
 }
 function visible(p,q,radius=8,allowBlockedTarget=false){
  q=q?.tile||q;if(!q||![p.x,p.y,q.x,q.y].every(Number.isInteger))return false;
  if(!sameZone(p,q)||distance(p,q)>radius)return false;
  let x=p.x,y=p.y;const dx=Math.abs(q.x-x),dy=Math.abs(q.y-y),sx=x<q.x?1:-1,sy=y<q.y?1:-1;let err=dx-dy;
  while(x!==q.x||y!==q.y){const e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}if(!p.getWorld().isValidPosition(x,y)&&!(Array.isArray(allowBlockedTarget)?allowBlockedTarget.some(t=>t.x===x&&t.y===y):allowBlockedTarget&&x===q.x&&y===q.y))return false;}return true;
 }
 const npcKey=(p,n)=>`${scene(p)}:npc:${n.kind}:${n.x}:${n.y}`;
 function nativeNPCs(p){const w=p.getWorld();return [...new Map([...Object.values(w.entities||{}).filter(n=>n.type==='npc'),...Object.values(w.npcs||{})].map(n=>[String(n.id),n])).values()];}
 function seedNPCs(p){
  const native=nativeNPCs(p).filter(n=>visible(p,n));
  const fresh=native.filter(n=>!state.npcs[npcKey(p,n)]);if(!fresh.length)return;
  const previous=state;state=structuredClone(state);try{
   for(const n of fresh){const id=npcKey(p,n),label=npcName(n),legacy=state.npcs[String(n.id)]||{};
    state.npcs[id]={id,nativeId:String(n.id),name:label,kind:'person',location:scene(p),tile:{x:n.x,y:n.y},position:[n.x*16,n.y*16],hp:1,maxHp:1,attitude:legacy.attitude||'wary',trust:legacy.trust||{},history:legacy.history||[],memories:legacy.memories||{}};
    if(state.npcs[String(n.id)]&&String(n.id)!==id){for(const item of Object.values(state.items))if(item.ownerId===String(n.id))item.ownerId=id;delete state.npcs[String(n.id)];}
    const tile=[[0,1],[1,0],[-1,0],[0,-1]].map(([dx,dy])=>({x:n.x+dx,y:n.y+dy})).find(t=>p.getWorld().isValidPosition(t.x,t.y)&&sameZone(p,t)&&!Object.values(state.items).some(i=>i.tile&&distance(i.tile,t)===0));
    if(tile)add(null,{name:label+"'s rug",type:'fragment',material:'cloth',ownerId:id,tile,visual:'rug',hp:4,maxHp:4,appearance:{shape:'rug',color:'#bd88cf'}});
   }persist();
  }catch(error){state=previous;throw error;}
 }
 function surroundings(p){seedNative(p);seedPlayer(p);seedNPCs(p);
  // Seed a bounded authored tree near each *distinct spawn area*, not only
  // the first camp: native Fracture may spawn new actors far from that camp.
  // Persist the per-actor decision to avoid creating trees on every poll.
  const actorId=identity(p),actor=state.actors[actorId];
  if(!nativeTrees.length&&actor&&!actor.treeChecked){
   const nearby=visibleScenery(state,scene(p)).find(o=>o.kind==='tree'&&
    distance(p,o.tile)<=8&&sameZone(p,o.tile)&&visible(p,o.tile));
   const count=Object.values(state.scenery).filter(o=>o.kind==='tree').length;
   const previous=state;state=structuredClone(state);
   try{
    state.actors[actorId].treeChecked=true;
    if(nearby)state.actors[actorId].treeId=nearby.id;
    else if(count<4){
     const c={x:p.x,y:p.y},world=p.getWorld(),radii=[4,5,3,6,2,7,8];
     const candidates=[];
     for(const radius of radii){
      const ring=[];
      for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++)
       if(Math.max(Math.abs(dx),Math.abs(dy))===radius)ring.push({x:c.x+dx,y:c.y+dy});
      ring.sort((a,b)=>distance(c,a)-distance(c,b));
      candidates.push(...ring);
     }
     const occupied=Object.values(world.entities||{}).concat(Object.values(world.players||{}),Object.values(world.npcs||{}));
     const suitable=t=>world.isValidPosition(t.x,t.y)&&sameZone(p,t)&&visible(p,t)&&
      !occupied.some(e=>e.x===t.x&&e.y===t.y)&&
      !Object.values(state.items).some(i=>i.tile?.x===t.x&&i.tile?.y===t.y)&&
      !Object.values(state.scenery).some(i=>i.scene===scene(p)&&i.tile?.x===t.x&&i.tile?.y===t.y);
     const openNeighbors=t=>[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>
      world.isValidPosition(t.x+dx,t.y+dy)&&sameZone(p,{x:t.x+dx,y:t.y+dy})).length;
     const tile=candidates.find(t=>suitable(t)&&openNeighbors(t)>=3)||
      candidates.find(t=>suitable(t)&&openNeighbors(t)>=2);
     if(tile){
      const tree=registerAuthoredScenery(state,{scene:scene(p),id:'authored-tree-'+(count+1),kind:'tree',tile});
      state.actors[actorId].treeId=tree.id;
      if(state.camp?.scene===scene(p)&&distance(c,state.camp)<=8&&!state.camp.treeId)state.camp.treeId=tree.id;
     }
    }
    persist();
   }catch(error){state=previous;throw error;}
  }
  if(state.camp?.scene===scene(p)&&!state.camp.tableId){const c=state.camp,world=p.getWorld();const tile=[[2,0],[-2,0],[0,2],[0,-2]].map(([dx,dy])=>({x:c.x+dx,y:c.y+dy})).find(t=>world.isValidPosition(t.x,t.y)&&sameZone(p,t)&&!Object.values(world.entities||{}).concat(Object.values(world.players||{})).some(e=>e.x===t.x&&e.y===t.y)&&!Object.values(state.items).some(i=>i.tile&&distance(i.tile,t)===0));
   if(tile){const previous=state;state=structuredClone(state);try{state.camp.tableId=add(scene(p),{name:'camp table',type:'fixture',material:'wood',portable:true,blocks:true,tile,visual:'table',hp:4,maxHp:4}).id;persist();}catch(error){state=previous;throw error;}}
  }
 }
 function npcViews(p){const present=new Map(nativeNPCs(p).map(n=>[npcKey(p,n),n]));return Object.values(state.npcs).filter(n=>present.has(n.id)&&n.location===scene(p)&&visible(p,n)).map(n=>{n.nativeId=String(present.get(n.id).id);return n;});}
 function blocked(p,x,y){
  // Persisted NPC ownership is not proof the native NPC is still present.
  // Only currently observed native owners can project their fixtures here.
  const present=new Set(nativeNPCs(p).map(n=>npcKey(p,n)));
  const owners=Object.fromEntries(Object.entries(state.npcs).filter(([id])=>present.has(id)));
  return doorControl.isBlocked(p,x,y)||objectBlocksTile(state.items,scene(p),x,y,owners)||sceneryBlocks(state,scene(p),x,y);
 }
 function targetItem(s,room,reference){const matches=Object.values(s.items).filter(i=>!i.parentId&&i.condition!=='disassembled'&&(i.id===reference||norm(i.name)===norm(reference))&&(i.location===s.current||room.players.some(p=>p.id===i.ownerId)||Object.hasOwn(s.creatures,i.ownerId)));return matches.length===1?matches[0]:null;}
 function projection(p){
  surroundings(p);const current=scene(p),id=identity(p),world=p.getWorld();
  const peers=Object.values(world.players||{}).filter(q=>q.chaosControlled&&!q.chaosSpectator&&q.hasEnteredGame&&!q.isDead&&scene(q)===current&&reachable(p,q));
  if(!peers.includes(p))peers.push(p);
  const players=peers.map(q=>({id:identity(q),name:name(q),hp:q.hitPoints,maxHp:q.maxHitPoints}));
  const s={current,items:Object.fromEntries(Object.entries(state.items).filter(([,i])=>!i.location||(i.location===current&&i.tile&&distance(p,i.tile)<=8&&sameZone(p,i.tile)))),nextId:state.nextId,creatures:Object.fromEntries(npcViews(p).map(n=>[n.id,n])),regions:{},campaign:{day:1,history:[],completed:[]},locations:{[current]:{id:current,name:world.zoneManager?.getZoneAt(p.x,p.y)?.name||'Fracture',exits:[],danger:0}}};
  return {room:{seed:state.seed,round:state.round,world:{expedition:s},players},actor:players.find(q=>q.id===id),s};
 }
 const plain=i=>({id:i.id,name:i.name,type:i.type,material:i.material,condition:i.condition,equipped:i.equipped,slot:i.slot,color:i.appearance?.color,visual:i.visual,blocks:objectCapabilities(i).blocking,capabilities:objectCapabilities(i),owner:i.ownerId?state.npcs[i.ownerId]?.name:null,hp:i.hp,maxHp:i.maxHp,tile:i.tile?{...i.tile}:null,components:[...i.components]});
 function pulse(p){
  const current=scene(p),now=clock();if(!state.fireClock[current])state.fireClock[current]=now;
  const burning=Object.values(state.items).filter(i=>i.condition==='burning'&&(i.location===current||state.npcs[i.ownerId]?.location===current||state.actors[i.ownerId]?.scene===current));
  if(!burning.length&&!visibleScenery(state,current).some(o=>o.condition==='burning')){state.fireClock[current]=now;return;}
  const {steps,next}=fireCatchup(state.fireClock[current],now);if(steps<1)return;
  const previous=state;state=structuredClone(state);try{
   const owned=[...Object.values(state.npcs).filter(n=>n.location===current).map(n=>({id:n.id})),...Object.entries(state.actors).filter(([,a])=>a.scene===current).map(([id])=>({id}))];
   const changes=[];let eventTile=null;
   const present=new Set(nativeNPCs(p).map(n=>npcKey(p,n)));
   const witnessed=(kind,item,actorId)=>recordEnvironmentalIncident(state.npcs,{
    kind,item,actorId,round:state.round+1,location:current,
    canWitness:(npc,tile)=>present.has(npc.id)&&visible({...p,x:npc.tile.x,y:npc.tile.y,getWorld:()=>p.getWorld()},tile,6,item.footprint||false)
   });
   // Only physical ground objects can conduct fire. Carried inventory, distant
   // objects and objects in another native zone are never affected. Capture the
   // sources BEFORE each tick so a newly lit object cannot ignite a whole room
   // instantly; the original Chaos burn/repair rules still own object damage.
   const onFloor=i=>i.tile&&(!i.ownerId?i.location===current:state.npcs[i.ownerId]?.location===current);
   const zone=tile=>tile&&(p.getWorld().isValidPosition(tile.x,tile.y)||nativeTrees.some(t=>t.tile.x===tile.x&&t.tile.y===tile.y))?zoneAt(p.getWorld(),tile.x,tile.y):null;
   for(let i=0;i<steps;i++){
    const sources=[...Object.values(state.items).filter(item=>onFloor(item)&&item.condition==='burning'),
     ...visibleScenery(state,current).filter(item=>item.condition==='burning')];
    changes.push(...advanceEntities({round:state.round,players:owned},{current,items:state.items,creatures:{}}));
    for(const source of sources)if(onFloor(source)&&source.condition==='broken'){
     witnessed('fire-destruction',source,source.ignitedBy);
     eventTile||={...source.tile};
    }
    for(const item of Object.values(state.items)){
     if(!onFloor(item)||item.condition!=='intact'||!objectCapabilities(item).flammable)continue;
     const itemZone=zone(item.tile);if(!itemZone)continue;
     const source=sources.find(src=>src.id!==item.id&&src.condition==='burning'&&zone(src.tile)===itemZone&&distance(src.tile,item.tile)===1);
     if(!source)continue;
     item.condition='burning';item.heat=0;
     item.ignitedBy=source.ignitedBy||null;item.ignitionOriginId=source.ignitionOriginId||(source.ignitedBy?source.id:null);
     changes.push(`Fire spreads to ${item.name}`);eventTile||={...item.tile};
     witnessed('fire-spread',item,item.ignitedBy);
    }
    // Nearby native NPCs can save their own burning floor property after one
    // full warning tick. No movement is simulated: a real native NPC must
    // already be beside the object in the same valid zone.
    const responders=new Set(nativeNPCs(p).filter(n=>!n.isDead&&(n.hitPoints??1)>0).map(n=>npcKey(p,n)));
    const responses=selectNpcFireResponses({npcs:state.npcs,items:state.items,location:current,present:responders,
     zoneAt:zone,validTile:tile=>!!tile&&p.getWorld().isValidPosition(tile.x,tile.y),
     tick:state.fireClock[current]+(i+1)*10000});
    for(const {npcId,itemId} of responses){
     const npc=state.npcs[npcId],item=state.items[itemId];
     if(!npc||!item||item.condition!=='burning')continue;
     // Reuse the canonical original Chaos object resolver, not a new fire rule.
     resolveEntity({seq:0,round:state.round+1,players:owned},
      {current,items:state.items,creatures:{},campaign:{day:1,history:[]}},
      {id:npc.id,name:npc.name},{verb:'extinguish',targetId:item.id},true);
     npc.history=[...(npc.history||[]),{verb:'extinguish',actorId:npc.id,itemId:item.id,round:state.round+1,success:true}].slice(-12);
     changes.push(`${npc.name} extinguishes ${item.name}`);eventTile||={...item.tile};
    }
    const sceneryChanges=advanceAuthoredFire(state,current,{
     sources:sources.filter(src=>src.condition==='burning'),
     canSpread:(src,target)=>!!zone(src.tile)&&zone(src.tile)===zone(target.tile)
    });
    for(const change of sceneryChanges){
     const object=state.scenery[change.id];changes.push(object.name+' '+change.after);eventTile||=object.tile;
     if(change.before!=='burning'&&change.after==='burning')witnessed('fire-spread',object,object.ignitedBy);
     if(change.before==='burning'&&change.after==='broken')witnessed('fire-destruction',object,object.ignitedBy);
    }
   }
   state.fireClock[current]=next; // Preserve unprocessed elapsed ticks across bounded catch-up.
   if(changes.length){const room={round:++state.round,world:{expedition:{current,creatures:state.npcs}},dmMemory:state.dmMemory,result:{id:'chaos-'+state.round,playerId:'fire',name:'Fire',action:'fire progresses',target:{entityId:burning[0]?.id||'authored-scenery'},blocked:false,success:true,narration:changes.join('. ')+'.',changes,sceneEvents:[]}};recordDMMemory(room);state.dmMemory.entries.at(-1).tile=eventTile||burning[0]?.tile||{x:p.x,y:p.y};}
   persist();
  }catch(error){state=previous;throw error;}
 }
 function snapshot(p){
  if(!identity(p))return {bag:[],ground:[],wearables:[]};surroundings(p);pulse(p);syncNative(p);const id=identity(p);
  const bag=Object.values(state.items).filter(i=>i.ownerId===id&&!i.parentId&&i.condition!=='disassembled');
  const ground=Object.values(state.items).filter(i=>(!i.ownerId&&i.location===scene(p)||state.npcs[i.ownerId]?.location===scene(p))&&!i.parentId&&i.tile&&visible(p,i.tile)&&i.condition!=='disassembled');
  const npcs=npcViews(p).map(n=>({id:n.id,nativeId:n.nativeId,name:n.name,tile:n.tile,attitude:(n.trust[identity(p)]||0)<0?'hostile':(n.trust[identity(p)]||0)>0?'friendly':'neutral',trust:n.trust[identity(p)]||0,memory:(n.memories?.[identity(p)]||n.history.filter(h=>h.actorId===identity(p))).slice(-3),concern:propertyConcern(state.items,n,(npc,tile)=>visible({...p,x:npc.tile.x,y:npc.tile.y,getWorld:()=>p.getWorld()},tile,6)),items:Object.values(state.items).filter(i=>i.ownerId===n.id&&!i.parentId).map(plain)}));
  const story=state.dmMemory.entries.filter(e=>e.location===scene(p)&&(e.actorId===id||e.tile&&visible(p,e.tile))).slice(-3);
  const aid=state.assists[id],helper=aid?.until>now()?Object.values(p.getWorld().players||{}).find(q=>identity(q)===aid.helperId&&q.hasEnteredGame&&!q.isDead&&q.chaosControlled&&!q.chaosSpectator&&scene(q)===scene(p)&&reachable(p,q)):null;
  const assistedBy=helper&&aid.mode!==-1?name(helper):null,hinderedBy=helper&&aid.mode===-1?name(helper):null;
  return {doors:doorControl.view(p),nativeChanges:nativeTrees.filter(t=>state.scenery[scene(p)+':'+t.id]?.condition==='broken').map(t=>t.id),bag:bag.map(plain),ground:ground.map(plain),scenery:visibleScenery(state,scene(p)).filter(o=>visible(p,o.tile,o.nativeOrigin?18:8,o.nativeOrigin?o.footprint:false)).sort((a,b)=>distance(p,a.tile)-distance(p,b.tile)),npcs,story,wearables:bag.filter(i=>i.equipped).map(plain),camp:state.camp,...(assistedBy?{assistedBy}:{}),...(hinderedBy?{hinderedBy}:{})};
 }
 function apply(p,text){
  if(!identity(p))return {blocked:true,success:false,text:'Your character is still connecting.'};
  if(p.isDead)return {blocked:true,success:false,text:'Respawn before handling objects.'};
  const sceneryAction=sceneryObjectAttempt(text,visibleScenery(state,scene(p)).filter(o=>visible(p,o.tile,o.nativeOrigin?18:8,o.nativeOrigin?o.footprint:false)).sort((a,b)=>distance(p,a.tile)-distance(p,b.tile)));
  const attempt=sceneryAction?.attempt||creativeAttempt(text);if(!attempt)return {blocked:true,success:false,text:'That object action is not available yet.'};
  const {room,actor,s}=projection(p);if(!actor)return {blocked:true,success:false,text:'Your character is still connecting.'};
  if(sceneryAction){
   const o=sceneryAction.object;
   if(attempt.verb==='repair'&&o.kind==='tree')return {blocked:true,success:false,text:'A felled tree cannot be repaired. The cleared tile remains passable.'};
   if(attempt.verb==='ignite'&&o.condition==='broken')return {blocked:true,success:false,text:'That scenery is already destroyed.'};
   s.items[o.id]={...o,location:s.current,type:'fixture',portable:false,maxHp:o.maxHp??12,components:[]};
  }
  // One reusable original Chaos advantage check for any legitimate world D20
  // action, including social checks. Only an actual roll consumes assistance.
  // Projection includes ONLY living, nearby, connected actors in this zone.
  const assistedCheck=(verb,dc,rng)=>{
   const aid=state.assists[actor.id];
   const helper=aid?.until>now()?room.players.find(q=>q.id===aid.helperId&&q.id!==actor.id):null;
   if(aid)delete state.assists[actor.id];
   const rolls=helper?[rng.int(1,20),rng.int(1,20)]:null;
   const mode=helper&&aid.mode===-1?-1:1;
   const check=resolveObjectRoll({role:p.chaosRole,perk:p.chaosPerk,verb,dc,
    roll:rolls?selectD20(rolls,mode):rng.int(1,20),rng});
   return {check,rolls,assistedBy:helper&&mode===1?helper.name:null,hinderedBy:helper&&mode===-1?helper.name:null};
  };
  if(attempt.verb==='appeal'){
   // A social check repairs a real, previously damaged NPC relationship. The
   // same native quest gate consults this trust; no native NPC quest or reward
   // is invented. Reuse original Chaos D20 and matching-class skill rules.
   const matches=npcViews(p).filter(n=>n.id===attempt.recipient||norm(n.name)===norm(attempt.recipient));
   if(matches.length!==1)return {blocked:true,success:false,text:'Name one visible NPC to make amends with; use their displayed ID if names repeat.'};
   const npc=matches[0];
   if(!reachable(p,npc.tile)||!visible(p,npc.tile))return {blocked:true,success:false,text:'Walk within two clear tiles of that NPC before making amends.'};
   const prior=npc.trust[actor.id]||0;
   if(prior>=0)return {blocked:true,success:false,text:`${npc.name} has no grievance with you. There is nothing to make amends for.`};
   const key=npc.id+'|'+actor.id,at=now(),last=state.appeals[key];
   if(Number.isFinite(last)&&at-last<30000)return {blocked:true,success:false,text:`Give ${npc.name} time before trying to make amends again.`};
   const rng=new Rng(state.seed);rng.restore(state.rng);
   const dc=12+Math.min(6,Math.abs(prior));
   const {check,rolls,assistedBy,hinderedBy}=assistedCheck('social',dc,rng);
   state.rng=rng.snapshot();state.appeals[key]=at;state.round++;
   if(check.success)npc.trust[actor.id]=Math.min(0,prior+2);
   const observation={verb:'appeal',actorId:actor.id,round:state.round,success:check.success};
   npc.memories||={};npc.memories[actor.id]=[...(npc.memories[actor.id]||[]),observation].slice(-4);
   npc.history.push(observation);npc.history=npc.history.slice(-12);
   const bonus=check.bonus?` +${check.bonus} class`:'';
   const charming=check.perkBonus?` +${check.perkBonus} Charming`:'';
   const lucky=check.rerolled!==null?` · Lucky-ish ${check.rerolled} → ${check.roll}`:'';
   const resultText=check.success?`${npc.name} accepts your apology. Trust ${prior} → ${npc.trust[actor.id]}.${npc.trust[actor.id]<0?' More amends are needed before asking for a job.':' You may ask for a job again.'}`:`${npc.name} is not persuaded. Trust stays ${prior}.`;
   const outcomeText=(rolls?`D20 ${hinderedBy?'disadvantage':'advantage'} ${rolls.join(' / ')} → ${check.roll}${bonus}${charming} / ${dc} (${hinderedBy?'hindered by '+hinderedBy:'helped by '+assistedBy})${lucky}`:`D20 ${check.roll}${bonus}${charming} / ${dc}${lucky}`)+': '+resultText;
   room.dmMemory=state.dmMemory;
   room.result={id:'chaos-'+state.round,playerId:actor.id,name:actor.name,action:text,target:{entityId:npc.id},blocked:false,success:check.success,narration:outcomeText,changes:check.success?[`Trust ${prior} → ${npc.trust[actor.id]}`]:[],sceneEvents:[{type:'witness',entityId:npc.id}]};
   recordDMMemory(room);const entry=state.dmMemory.entries.at(-1);if(entry)entry.tile={x:p.x,y:p.y};
   persist();
   return {blocked:false,success:check.success,text:outcomeText,roll:check.roll,dc,bonus:check.bonus,perkBonus:check.perkBonus,rerolled:check.rerolled,...(rolls?{rolls,...(assistedBy?{assistedBy}:{}),...(hinderedBy?{hinderedBy}:{})}:{}),event:entry};
  }
  if(attempt.verb==='assist'||attempt.verb==='hinder'){
   // A second real character must be nearby, alive and connected. No phone can
   // grant itself advantage or grant it to an absent/off-map character.
   const matches=room.players.filter(q=>q.id!==actor.id&&(q.id===attempt.recipient||norm(q.name)===norm(attempt.recipient)));
   if(matches.length!==1)return {blocked:true,success:false,text:'Help a single nearby player by their exact character name.'};
   const recipient=matches[0],existing=state.assists[recipient.id];
   if(existing?.until>now())return {blocked:true,success:false,text:`${recipient.name} already has a reaction for the next world D20 check. No stacking.`};
   for(const [id,aid] of Object.entries(state.assists))if(aid.helperId===actor.id)delete state.assists[id];
   const hostile=attempt.verb==='hinder';
   state.assists[recipient.id]={helperId:actor.id,until:now()+15000,mode:hostile?-1:1};
   state.round++;persist();
   return {blocked:false,success:true,text:`${actor.name} ${hostile?'hinders':'helps'} ${recipient.name}. Their next valid Chaos world D20 check gets ${hostile?'disadvantage':'advantage'} for 15 seconds while you stay nearby.`};
  }
  const projectedTarget=attempt.entityAction?targetItem(s,room,attempt.target):null;
  if(attempt.entityAction&&!projectedTarget)return {blocked:true,success:false,text:'Choose a visible Chaos object for that interaction; native scenery and characters are not movable objects.'};
  // The original planner correctly forbids taking or moving someone else's
  // possessions. A broken or burning NPC-owned floor object is an exception
  // ONLY for public-safety repair/extinguish. Plan against a temporary view;
  // resolve and persist against the original owner-bound item.
  const publicAid=projectedTarget?.tile&&state.npcs[projectedTarget.ownerId]&&['repair','extinguish'].includes(attempt.verb);
  const planning=publicAid?{...s,items:{...s.items,[projectedTarget.id]:{...projectedTarget,ownerId:null,location:s.current}}}:s;
  const plan=attempt.entityAction?planEntity(room,planning,actor,attempt,(_s,r,ref)=>targetItem(planning,r,ref)):planItemAttempt(room,actor,attempt);
  if(!plan)return {blocked:true,success:false,text:'No unique object matches that request.'};
  const item=state.items[plan.itemId||plan.targetId]||(sceneryAction?s.items[plan.targetId]:null);
  if(item?.ownerId&&item.ownerId!==actor.id&&!state.npcs[item.ownerId])return {blocked:true,success:false,text:'Another player owns that object. Ask them to give or drop it.'};
  const itemTile=item?.tile||state.npcs[item?.ownerId]?.tile;
  if(item&&(itemTile||state.npcs[item.ownerId])&&(!itemTile||(!item.ownerId&&scene(p)!==item.location)||(sceneryAction?.object.nativeOrigin?distance(p,itemTile)>1:!reachable(p,itemTile))))return {blocked:true,success:false,text:'Walk closer to that object before interacting with it.'};
  if(plan.recipientId){const recipient=state.npcs[plan.recipientId];if(recipient&&!reachable(p,recipient.tile))return {blocked:true,success:false,text:'Walk closer to the recipient.'};}
  if(attempt.verb==='give'&&Object.values(s.creatures).concat(room.players).filter(n=>norm(n.name)===norm(attempt.recipient)).length>1)return {blocked:true,success:false,text:'That name is ambiguous. Use the displayed recipient ID.'};
  if(plan.error)return {blocked:true,success:false,text:plan.error};
  if(plan.verb==='ignite'&&item?.condition==='burning')return {blocked:true,success:false,text:'That object is already burning. Extinguish it to prevent damage.'};
  let destination;
  if(plan.verb==='move'&&item){
   if(item.ownerId)return {blocked:true,success:false,text:'Drop a carried object before pushing it.'};
   const dirs={north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]};const dx=item.tile.x-p.x,dy=item.tile.y-p.y;
   const [mx,my]=dirs[attempt.direction]||(Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1]);destination={x:item.tile.x+mx,y:item.tile.y+my};
   if(!sameZone(p,destination)||!p.getWorld().isValidPosition(destination.x,destination.y)||blocked(p,destination.x,destination.y)||Object.values(p.getWorld().entities||{}).concat(Object.values(p.getWorld().players||{})).some(e=>e.x===destination.x&&e.y===destination.y))return {blocked:true,success:false,text:'That object cannot move into a wall, another object or a character.'};
  }
  const rng=new Rng(state.seed);rng.restore(state.rng);
  let roll=null,rolls=null,assistedBy=null,hinderedBy=null,check=null;
  if(!plan.automatic){
   ({check,rolls,assistedBy,hinderedBy}=assistedCheck(attempt.verb,plan.dc,rng));
   roll=check.roll;
  }
  const success=plan.automatic||check.success;
  const result=attempt.entityAction?resolveEntity(room,s,actor,plan,success):resolveItem(room,actor,plan,success);
  if(sceneryAction){
   const updated=s.items[sceneryAction.object.id];
   Object.assign(state.scenery[updated.id],{condition:updated.condition,hp:updated.hp,heat:updated.heat});
   delete s.items[updated.id];
  }
  Object.assign(state.items,s.items);state.nextId=s.nextId;state.rng=rng.snapshot();state.round++;
  if(result.success&&destination)item.tile=destination;
  if(result.success&&plan.verb==='ignite'&&item){item.ignitedBy=actor.id;item.ignitionOriginId=item.id;if(sceneryAction)Object.assign(state.scenery[item.id],{ignitedBy:item.ignitedBy,ignitionOriginId:item.id});}
  if(result.success&&plan.verb==='extinguish'&&item?.ownerId&&state.npcs[item.ownerId])delete state.npcs[item.ownerId].fireAlert;
  if(result.success&&attempt.verb==='drop'&&item)item.tile={x:p.x,y:p.y};
  if(result.success&&['take','give','steal'].includes(attempt.verb)&&item)delete item.tile;
  const witnesses=npcViews(p).filter(n=>visible(p,n.tile,6)&&(!item?.tile||visible({...p,x:n.tile.x,y:n.tile.y,getWorld:()=>p.getWorld()},item.tile,6,item.footprint||false)));
  for(const n of witnesses){
   let delta=0;if(attempt.verb==='steal'&&plan.previousOwnerId!==n.id)delta=-2;
   if(['ignite','break'].includes(attempt.verb))delta=-1;
   if(result.success&&['repair','extinguish'].includes(attempt.verb))delta=1;
   if(result.success&&attempt.verb==='give'&&plan.recipientId===n.id)delta=2;
   n.trust[actor.id]=Math.max(-10,Math.min(10,(n.trust[actor.id]||0)+delta));
   if(!['inspect','equip','unequip'].includes(attempt.verb)){
    const observation={verb:attempt.verb,actorId:actor.id,itemId:item?.id,round:state.round,success:!!result.success};
    n.memories||={};n.memories[actor.id]=[...(n.memories[actor.id]||n.history.filter(h=>h.actorId===actor.id)),observation].slice(-4);
    n.history.push(observation);n.history=n.history.slice(-12);
   }
  }
  const changes=[];
  const modifier=check?.bonus?` +${check.bonus} class`:'';
  const lucky=check?.rerolled!==null&&check?.rerolled!==undefined?` · Lucky-ish ${check.rerolled} → ${roll}`:'';
  const canonical=(rolls?`D20 ${hinderedBy?'disadvantage':'advantage'} ${rolls.join(' / ')} → ${roll}${modifier} / ${plan.dc} (${hinderedBy?'hindered by '+hinderedBy:'helped by '+assistedBy}${lucky}): `:roll!==null?`D20 ${roll}${modifier} / ${plan.dc}${lucky}: `:'')+result.text+(changes.length?' '+changes.join('. ')+'.':'');
  room.dmMemory=state.dmMemory;room.result={id:'chaos-'+state.round,playerId:actor.id,name:actor.name,action:text,target:{entityId:item?.id},blocked:false,success:result.success,narration:canonical,changes:[result.change,...changes].filter(Boolean),sceneEvents:witnesses.map(n=>({type:'witness',entityId:n.id}))};
  recordDMMemory(room);const entry=state.dmMemory.entries.at(-1);if(entry)entry.tile={x:p.x,y:p.y};
  persist();
  return {...result,...(result.success&&item?.tile?{object:{id:item.id,name:item.name,tile:item.tile,before:null,after:item.hp,condition:item.condition,actorId:p.id,verb:attempt.verb}}:{}),...(roll!==null?{roll,dc:plan.dc,bonus:check.bonus,...(check.rerolled!==null?{rerolled:check.rerolled}:{}),...(rolls?{rolls,...(assistedBy?{assistedBy}:{}),...(hinderedBy?{hinderedBy}:{})}:{}),text:canonical}:{text:canonical}),witnesses:witnesses.map(n=>n.name),event:entry};
 }
 function registerScenery(sceneId,id,kind,tile){
  const existing=state.scenery?.[sceneId+':'+id];
  if(existing)return existing;
  const previous=state;state=structuredClone(state);try{
   const obj=registerAuthoredScenery(state,{scene:sceneId,id,kind,tile});persist();return obj;
  }catch(error){state=previous;throw error;}
 }
 function strikeScenery(p,id,damage=1,{fell=false}={}){
  if(!identity(p)||p.isDead||!p.chaosControlled)return {changed:false,error:'Active living actor required'};
  const obj=state.scenery[scene(p)+':'+id];
  if(!obj||!sameZone(p,obj.tile)||distance(p,obj.tile)>1)return {changed:false,error:'Scenery out of reach'};
  if(fell&&(!obj.nativeOrigin||obj.kind!=='tree'))return {changed:false,error:'Only a real nearby tree can be felled.'};
  if(obj.condition==='broken')return {changed:false,error:'That tree is already down.'};
  const previous=state;state=structuredClone(state);try{
   let check=null;
   if(fell){
    // One original-Chaos D20 check for deliberate tree felling, not a
    // visible sequence of HP-bar attacks. The native map remains authoritative.
    const rng=new Rng(state.seed);rng.restore(state.rng);
    check=resolveObjectRoll({role:p.chaosRole,perk:p.chaosPerk,verb:'break',dc:14,roll:rng.int(1,20),rng});
    state.rng=rng.snapshot();
    if(!check.success){
     state.round++;persist();
     return {changed:false,attempted:true,roll:check.roll,dc:14,bonus:check.bonus,rerolled:check.rerolled,error:'The tree holds fast. It is still standing.'};
    }
   }
   const before=obj.hp;
   const result=damageAuthoredScenery(state,{scene:scene(p),id,damage:fell?obj.hp:damage});
   if(result.changed){
    if(result.object.condition==='broken'&&obj.nativeOrigin)add(null,{name:'wood offcut',material:'wood',type:'tool',ownerId:identity(p),originId:obj.id});
    state.round++;
    const fact=fell?`${name(p)} brings down the existing ${obj.name} after a D20 check. Its original trunk is no longer blocking the path.`:`${name(p)} chops ${obj.name}. ${before} → ${result.object.hp} HP.${result.object.condition==='broken'?' The tree falls and its trunk tiles are cleared.':''}`;
    const room={round:state.round,world:{expedition:{current:scene(p),creatures:state.npcs}},dmMemory:state.dmMemory,result:{id:'chaos-'+state.round,playerId:identity(p),name:name(p),action:'chop '+obj.name,target:{entityId:obj.id},success:true,blocked:false,narration:fact,changes:[fact],sceneEvents:[]}};
    recordDMMemory(room);state.dmMemory.entries.at(-1).tile={...obj.tile};
    result.event=state.dmMemory.entries.at(-1);persist();syncNative(p);
    result.feedback={id:obj.id,name:obj.name,tile:obj.tile,before:fell?null:before,after:fell?null:result.object.hp,condition:result.object.condition,actorId:p.id,verb:fell?'fell':'chop'};
   }
   if(fell&&check)Object.assign(result,{attempted:true,roll:check.roll,dc:14,bonus:check.bonus,rerolled:check.rerolled});
   return result;
  }catch(error){state=previous;throw error;}
 }
 function execute(p,text){
  surroundings(p);pulse(p);
  const doorVerb=nativeDoorAttempt(text);
  if(doorVerb){
   if(!identity(p)||p.isDead||!p.chaosControlled)return {blocked:true,success:false,text:'An active player must operate that doorway.'};
   const entry=doorControl.find(p,1,point=>sameZone(p,point));
   if(!entry||entry.ambiguous)return {blocked:true,success:false,text:entry?.ambiguous?'More than one doorway is equally close. Move beside one.':'Stand beside an existing Fracture doorway.'};
   if(doorVerb!=='force')return doorControl.use(p,entry,doorVerb);
   const probe=doorControl.use(p,entry,'force',{success:false});
   if(probe.blocked)return probe;
   const previous=state;state=structuredClone(state);
   try{
    const rng=new Rng(state.seed);rng.restore(state.rng);
    const check=resolveObjectRoll({role:p.chaosRole,perk:p.chaosPerk,verb:'break',dc:12,roll:rng.int(1,20),rng});
    state.rng=rng.snapshot();state.round++;persist();
    const result=doorControl.use(p,entry,'force',{success:check.success});
    return {...result,roll:check.roll,dc:12,bonus:check.bonus,rerolled:check.rerolled,text:`D20 ${check.roll}${check.bonus?' +'+check.bonus+' Knight':''} / 12: ${result.text}`};
   }catch(error){state=previous;throw error;}
  }
  const scenery=sceneryAttempt(text,visibleScenery(state,scene(p)).filter(o=>visible(p,o.tile,o.nativeOrigin?18:8,o.nativeOrigin?o.footprint:false)).sort((a,b)=>distance(p,a.tile)-distance(p,b.tile)));
  if(scenery){
   const fell=/^(?:(?:chop|cut) down|fell|uproot)\s+(?:the\s+)?/i.test(String(text).trim().replace(/^(?:please |I (?:want to |try to )?)+/i,''));
   const result=strikeScenery(p,scenery.id.slice(scene(p).length+1),3,{fell});
   const description=scenery.name||scenery.kind;
   return {blocked:!result.changed&&!result.attempted,success:result.changed,event:result.event,object:result.feedback,
    ...(result.attempted?{roll:result.roll,dc:result.dc,bonus:result.bonus,rerolled:result.rerolled}:{}),
    text:result.changed?(fell?'You bring down the '+description+'. Its old trunk no longer blocks the path.':
    result.object.condition==='broken'?'The '+description+' falls. The route is clear.':
     'You strike the '+description+'. '+result.object.hp+' HP remains.'):
    (result.error||'That object is already destroyed.')};
  }
  const previous=state;state=structuredClone(state);try{const result=apply(p,text);if(result.blocked)state=previous;return result;}catch(error){state=previous;throw error;}}
 function approach(p,text){
  surroundings(p);
  if(nativeDoorAttempt(text)){
   const entry=doorControl.find(p,8,point=>sameZone(p,point));
   return entry&&!entry.ambiguous&&entry.distance>1?{...entry.point}:null;
  }
  const view=visibleScenery(state,scene(p)).filter(o=>visible(p,o.tile,o.nativeOrigin?18:8,o.nativeOrigin?o.footprint:false)).sort((a,b)=>distance(p,a.tile)-distance(p,b.tile));
  const scenery=sceneryAttempt(text,view)||sceneryObjectAttempt(text,view)?.object;
  if(scenery)return sameZone(p,scenery.tile)&&distance(p,scenery.tile)>1?{...scenery.tile}:null;
  const attempt=creativeAttempt(text);if(!attempt)return null;
  const {room,actor,s}=projection(p);if(!actor||attempt.entityAction&&!targetItem(s,room,attempt.target))return null;
  const plan=attempt.entityAction?planEntity(room,room.world.expedition,actor,attempt,(_s,r,ref)=>targetItem(room.world.expedition,r,ref)):planItemAttempt(room,actor,attempt);if(!plan||plan.error)return null;
  const item=state.items[plan.itemId||plan.targetId];
  const tile=item?.tile||state.npcs[item?.ownerId]?.tile;
  return item&&(!item.ownerId||state.npcs[item.ownerId])&&tile&&!reachable(p,tile)?{...tile}:null;
 }
 function talk(p,native){surroundings(p);const n=state.npcs[npcKey(p,native)];if(!n)return null;const history=n.memories?.[identity(p)]||n.history.filter(h=>h.actorId===identity(p));const trust=n.trust[identity(p)]||0;const concern=propertyConcern(state.items,n,(npc,tile)=>visible({...p,x:npc.tile.x,y:npc.tile.y,getWorld:()=>p.getWorld()},tile,6));if(concern)return `${n.name}: “${concern}” (trust ${trust})`;if(!history.length&&trust===0)return null;const last=history.at(-1)||{verb:'theft',success:false};return `${n.name}: “${trust<0?'I remember what you did. Make amends before asking for a job.':last.verb==='give'?'Thank you for the gift. I remember your kindness.':last.verb==='appeal'?'I remember your apology. We can talk again.':last.verb==='defend'?`I saw you fighting when ${last.targetName||'that creature'} fell.`:`I remember your ${last.success?'':'attempt at '}${last.verb}${last.itemId?' involving '+(state.items[last.itemId]?.name||state.scenery[last.itemId]?.name||'that object'):''}.`}” (trust ${trust})`;}
 function canQuest(p,native){surroundings(p);const n=state.npcs[npcKey(p,native)];return !n||(n.trust[identity(p)]||0)>=0;}
 // Bridge only: the authenticated native actor calls this AFTER its real HIT
 // has reduced a mob to zero HP. No phone-supplied damage, XP or kill credit.
 // Native Fracture remains authoritative; this stores a witnessed story fact.
 function recordNativeDefeat(p,mob,{before,after,tile}={}){
  if(!p?.chaosControlled||!p.hasEnteredGame||p.isDead||!identity(p)||
     !mob||typeof mob!=='object'||!mob.isDead||observedNativeDefeats.has(mob)||
     !Number.isFinite(before)||before<=0||after!==0||
     !tile||!Number.isInteger(tile.x)||!Number.isInteger(tile.y)||
     !sameZone(p,tile)||distance(p,tile)>2)return null;
  const previous=state;state=structuredClone(state);
  try{
   surroundings(p);
   const actorId=identity(p),mobName=String(mob.chaosName||mob.name||kindName(mob.kind)||'creature').replace(/[\\u0000-\\u001f]/g,' ').slice(0,50);
   const witnessed=npcViews(p).filter(n=>visible({...p,x:n.tile.x,y:n.tile.y,getWorld:()=>p.getWorld()},tile,6));
   const id='native-defeat-'+(++state.round);
   for(const n of witnessed){
    const observation={verb:'defend',actorId,targetName:mobName,round:state.round,success:true};
    n.memories||={};n.memories[actorId]=[...(n.memories[actorId]||n.history.filter(h=>h.actorId===actorId)),observation].slice(-4);
    n.history.push(observation);n.history=n.history.slice(-12);
   }
   const fact=`${name(p)} fought ${mobName}; native combat confirmed ${before} → 0 HP and the creature fell.`;
   const room={round:state.round,world:{expedition:{current:scene(p),creatures:state.npcs}},dmMemory:state.dmMemory,
    result:{id,playerId:actorId,name:name(p),action:'fight '+mobName,target:{entityId:'native-mob:'+String(mob.id)},
     blocked:false,success:true,narration:fact,changes:['Native mob defeated at '+tile.x+','+tile.y],
     sceneEvents:witnessed.map(n=>({type:'witness',entityId:n.id}))}};
   recordDMMemory(room);
   const entry=state.dmMemory.entries.at(-1);if(entry)entry.tile={x:tile.x,y:tile.y};
   persist();observedNativeDefeats.add(mob);
   return {id,fact,witnesses:witnessed.map(n=>n.name)};
  }catch(error){state=previous;throw error;}
 }
 return {prepareWorld:world=>seedNative({getWorld:()=>world}),snapshot,execute,approach,isBlocked:blocked,releaseDoorHolds:doorControl.releaseActor,talk,canQuest,recordNativeDefeat,registerScenery,strikeScenery};
}
