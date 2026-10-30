/** Chaos Party object rules projected onto real Fracture tiles; no legacy networking or saves. */
import fs from 'node:fs';import path from 'node:path';import {randomInt} from 'node:crypto';
import {parseItemAttempt,planItemAttempt,resolveItem,ITEM_TYPES,MATERIALS} from '../../public/world-items.js';
import {spawnItem} from '../../public/campaign.js';
import {Rng} from '../../public/vendor/partyframe-rng.js';
import {selectD20} from '../../public/vendor/dnd5e-advantage.js';
const verbs=new Set(['take','drop','craft','attach','give','equip','unequip','separate','inspect','break']);
const norm=s=>String(s||'').toLowerCase().replace(/^(?:the|a|an|my)\s+/,'').trim();
export function creativeAttempt(text){const command=String(text).trim().replace(/^(?:please |I (?:want to |try to )?)+/i,'').replace(/^(?:pick up|pickup|collect|grab) /i,'take ');const help=command.match(/^(?:help|assist|aid)\s+(.+?)(?:\s+(?:craft|make|build|with crafting))?$/i);if(help)return {verb:'assist',recipient:help[1].trim()};const attempt=parseItemAttempt(command);return attempt&&verbs.has(attempt.verb)?attempt:null;}
export function shouldUseCreative(text,actor){const a=creativeAttempt(text);if(!a)return false;if(['craft','attach','give','separate','assist'].includes(a.verb))return true;const items=[...(actor?.chaos?.bag||[]),...(actor?.chaos?.ground||[])];return items.some(i=>i.id===a.item||norm(i.name)===norm(a.item));}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const scene=p=>`fracture:${p.getWorld?.().id||'world'}`;
const reachable=(p,q)=>{const d=distance(p,q);if(d<=1)return true;if(d>2)return false;return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>p.getWorld().isValidPosition(p.x+dx,p.y+dy)&&distance({x:p.x+dx,y:p.y+dy},q)===1);};
const identity=p=>String(p.characterId||'');
const name=p=>p.chaosName||p.name;
export function createChaosWorld({file,seed=randomInt(1,0xffffffff),now=()=>Date.now()}={}){
 if(!file)throw Error('Separate Fracture object save path required');
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,seed,rng:seed,nextId:1,round:0,items:{},actors:{},camp:null};
 if(state.version!==1||!state.items||!state.actors)throw Error('Unsupported Chaos object save; refusing to overwrite');
 // Optional version-1 extension. Existing saves load unchanged and acquire this
 // field only on the next successful object write.
 state.assists||={};
 const persist=()=>{const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(state),{mode:0o600});fs.renameSync(temp,file);};
 function add(location,properties){const s={items:state.items,nextId:state.nextId};const item=spawnItem(s,location,properties);state.nextId=s.nextId;return item;}
 function seedPlayer(p){
  const id=identity(p);if(!id)return;
  if(!state.actors[id]){
   const previous=state;state=structuredClone(state);try{
   state.actors[id]={name:name(p)};
   for(const [label,material,type] of [['cloth strip','cloth','fragment'],['wood splinter','wood','tool']])add(null,{name:label,material,type,ownerId:id,appearance:{shape:ITEM_TYPES[type].shape,color:MATERIALS[material].color}});
   if(!state.camp){
    state.camp={x:p.x,y:p.y,scene:scene(p)};const world=p.getWorld();
    const spots=[];for(let r=1;r<=3;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&world.isValidPosition(p.x+dx,p.y+dy))spots.push({x:p.x+dx,y:p.y+dy});
    for(const [i,[label,material,type]] of [['smooth stone','stone','fragment'],['blue bottle','glass','container'],['cloth scrap','cloth','fragment'],['wood offcut','wood','tool']].entries())if(spots[i])add(scene(p),{name:label,material,type,tile:spots[i],appearance:{shape:ITEM_TYPES[type].shape,color:MATERIALS[material].color}});
   }
   persist();
   }catch(error){state=previous;throw error;}
  }else state.actors[id].name=name(p);
 }
 function projection(p){
  seedPlayer(p);const current=scene(p),id=identity(p),world=p.getWorld();
  const peers=Object.values(world.players||{}).filter(q=>q.chaosControlled&&!q.chaosSpectator&&q.hasEnteredGame&&!q.isDead&&scene(q)===current&&reachable(p,q));
  if(!peers.includes(p))peers.push(p);
  const players=peers.map(q=>({id:identity(q),name:name(q),hp:q.hitPoints,maxHp:q.maxHitPoints}));
  const s={current,items:Object.fromEntries(Object.entries(state.items).filter(([,i])=>!i.location||(i.location===current&&i.tile&&distance(p,i.tile)<=8))),nextId:state.nextId,creatures:{},regions:{},campaign:{day:1,history:[],completed:[]},locations:{[current]:{id:current,name:world.zoneManager?.getZoneAt(p.x,p.y)?.name||'Fracture',exits:[],danger:0}}};
  return {room:{seed:state.seed,round:state.round,world:{expedition:s},players},actor:players.find(q=>q.id===id),s};
 }
 const plain=i=>({id:i.id,name:i.name,type:i.type,material:i.material,condition:i.condition,equipped:i.equipped,slot:i.slot,color:i.appearance?.color,tile:i.tile?{...i.tile}:null,components:[...i.components]});
 function snapshot(p){
  if(!identity(p))return {bag:[],ground:[],wearables:[]};seedPlayer(p);const id=identity(p);
  const bag=Object.values(state.items).filter(i=>i.ownerId===id&&!i.parentId&&i.condition!=='disassembled');
  const ground=Object.values(state.items).filter(i=>!i.ownerId&&!i.parentId&&i.location===scene(p)&&i.tile&&distance(p,i.tile)<=8&&i.condition!=='disassembled');
  const aid=state.assists[id];const helper=aid?.until>now()?Object.values(p.getWorld().players||{}).find(q=>identity(q)===aid.helperId&&q.chaosControlled&&q.hasEnteredGame&&!q.isDead&&reachable(p,q)):null;const assistedBy=helper?name(helper):null;
  return {bag:bag.map(plain),ground:ground.map(plain),wearables:bag.filter(i=>i.equipped).map(plain),camp:state.camp,...(assistedBy?{assistedBy}:{})};
 }
 function apply(p,text){
  if(!identity(p))return {blocked:true,success:false,text:'Your character is still connecting.'};
  if(p.isDead)return {blocked:true,success:false,text:'Respawn before handling objects.'};
  const attempt=creativeAttempt(text);if(!attempt)return {blocked:true,success:false,text:'That object action is not available yet.'};
  const {room,actor,s}=projection(p);if(!actor)return {blocked:true,success:false,text:'Your character is still connecting.'};
  if(attempt.verb==='assist'){
   // A second real character must be nearby, alive and connected. No phone can
   // grant itself advantage or grant it to an absent/off-map character.
   const matches=room.players.filter(q=>q.id!==actor.id&&(q.id===attempt.recipient||norm(q.name)===norm(attempt.recipient)));
   if(matches.length!==1)return {blocked:true,success:false,text:'Help a single nearby player by their exact character name.'};
   const recipient=matches[0],existing=state.assists[recipient.id];
   if(existing?.until>now())return {blocked:true,success:false,text:`${recipient.name} already has help for the next craft attempt.`};
   for(const [id,aid] of Object.entries(state.assists))if(aid.helperId===actor.id)delete state.assists[id];
   state.assists[recipient.id]={helperId:actor.id,until:now()+15000};
   state.round++;persist();
   return {blocked:false,success:true,text:`${actor.name} helps ${recipient.name}. Their next valid craft or attachment roll gets D20 advantage for 15 seconds while you stay nearby.`};
  }
  const plan=planItemAttempt(room,actor,attempt);
  if(!plan)return {blocked:true,success:false,text:'No unique object matches that request.'};
  const item=state.items[plan.itemId];
  if(item&&!item.ownerId&&(!item.tile||scene(p)!==item.location||!reachable(p,item.tile)))return {blocked:true,success:false,text:'Walk closer to that object before interacting with it.'};
  if(plan.error)return {blocked:true,success:false,text:plan.error};
  const rng=new Rng(state.seed);rng.restore(state.rng);
  let roll=null,rolls=null,assistedBy=null;
  if(!plan.automatic){
   const aid=['craft','attach'].includes(attempt.verb)?state.assists[actor.id]:null;
   const helper=aid?.until>now()?room.players.find(q=>q.id===aid.helperId&&q.id!==actor.id):null;
   if(aid)delete state.assists[actor.id]; // Consume on a real attempt, even a failed roll.
   if(helper){rolls=[rng.int(1,20),rng.int(1,20)];roll=selectD20(rolls,1);assistedBy=helper.name;}
   else roll=rng.int(1,20);
  }
  const result=resolveItem(room,actor,plan,plan.automatic||roll>=plan.dc);
  Object.assign(state.items,s.items);state.nextId=s.nextId;state.rng=rng.snapshot();state.round++;
  if(result.success&&attempt.verb==='drop'&&item)item.tile={x:p.x,y:p.y};
  if(result.success&&['take','give'].includes(attempt.verb)&&item)delete item.tile;
  persist();
  return {...result,...(roll!==null?{roll,dc:plan.dc,...(rolls?{rolls,assistedBy}:{}),text:rolls?`D20 advantage ${rolls.join(' / ')} → ${roll} / ${plan.dc} (helped by ${assistedBy}): ${result.text}`:`D20 ${roll} / ${plan.dc}: ${result.text}`}:{})};
 }
 function execute(p,text){seedPlayer(p);const previous=state;state=structuredClone(state);try{const result=apply(p,text);if(result.blocked)state=previous;return result;}catch(error){state=previous;throw error;}}
 function approach(p,text){
  const attempt=creativeAttempt(text);if(!attempt)return null;
  const {room,actor}=projection(p);if(!actor)return null;
  const plan=planItemAttempt(room,actor,attempt);if(!plan||plan.error)return null;
  const item=state.items[plan.itemId];
  return item&&!item.ownerId&&item.tile&&!reachable(p,item.tile)?{...item.tile}:null;
 }
 return {snapshot,execute,approach};
}
