import {upgradeCampaign,describeRegion,enterRegion,spawnItem,progressAdventure,recordCampaign,localCreatures} from './campaign.js';
import {MATERIAL_RULES,available,entityNamed,parseEntityAttempt,planEntity,resolveEntity,damageEntity,advanceEntities} from './entity-rules.js';
import {Rng} from './vendor/partyframe-rng.js';

// Templates describe capabilities; saved instances own identity and mutable state.
export const ITEM_TYPES={
  fragment:{portable:true,wearable:false,shape:'shard'},
  wearable:{portable:true,wearable:true,shape:'band'},
  tool:{portable:true,wearable:false,shape:'rod'},
  container:{portable:true,wearable:false,shape:'cup'},
  fixture:{portable:false,wearable:false,shape:'chest'}
};
export const MATERIALS=MATERIAL_RULES;
const norm=s=>s.trim().toLowerCase().replace(/^(?:a|an|the)\s+/,'');
export const currentLocation=r=>r.world.expedition?.current||'tavern';
export function ensureItems(r){
  if(r.world.expedition){upgradeCampaign(r,r.world.expedition);return r.world.expedition;}
  const rng=new Rng(r.seed),locations={tavern:{id:'tavern',name:'The Tipsy Wyvern',kind:'tavern',exits:['clearing']}};
  for(const [id,kind,exits] of [['clearing','clearing',['tavern','ruins']],['ruins','ruins',['clearing']]])locations[id]={id,kind,name:rng.pick(['Mossy','Amber','Moonlit'])+' '+(kind==='clearing'?'Clearing':'Ruins'),exits,decor:Array.from({length:12},()=>[rng.int(90,870),rng.int(170,470),rng.int(0,2)])};
  const state=r.world.expedition={version:1,current:'tavern',locations,items:{},nextId:1};
  for(const location of Object.keys(locations))for(const [name,material,type] of [['cloth strip','cloth','fragment'],['wood splinter','wood','tool'],['blue bottle','glass','container'],['smooth stone','stone','fragment']]){
    const id='item-'+state.nextId++;
    state.items[id]={id,name,type,material,condition:'intact',ownerId:null,location,position:[240+(state.nextId%4)*150,390],components:[],equipped:false,appearance:{shape:ITEM_TYPES[type].shape,color:MATERIALS[material].color},history:[]};
  }
  upgradeCampaign(r,state);return state;
}
export const visibleItems=r=>Object.values(r.world.expedition?.items||{}).filter(i=>available(r.world.expedition,r,i));
function findItem(s,r,text){
 const matches=Object.values(s.items).filter(i=>available(s,r,i)&&(i.id===text.trim()||norm(i.name)===norm(text)));
 return matches.length===1?matches[0]:null;
}
export function visibleCreatures(r){return localCreatures(r.world.expedition||{});}

// A bounded local grammar. Unknown entities never fall through to fake rewards.
export function parseItemAttempt(text){
  let m;
  if((m=text.match(/^(?:travel|go) to (.+)$/i)))return {verb:'travel',destination:norm(m[1])};
  if((m=text.match(/^(?:make|craft|create) (.+?) from (.+)$/i)))return {verb:'craft',name:m[1].replace(/^(a|an|the)\s+/i,'').trim(),sources:m[2].split(/\s+and\s+|\s*\+\s*/i)};
  if((m=text.match(/^attach (.+?) to (.+)$/i)))return {verb:'attach',sources:[m[1],m[2]]};
  if((m=text.match(/^give (.+?) to (.+)$/i)))return {verb:'give',item:m[1],recipient:m[2]};
  if((m=text.match(/^use (.+?) on (.+)$/i)))return {verb:'use',item:m[1],target:m[2]};
  if((m=text.match(/^(take|drop|equip|wear|unequip|separate|inspect|break|smash) (.+)$/i)))return {verb:({wear:'equip',smash:'break'})[m[1].toLowerCase()]||m[1].toLowerCase(),item:m[2]};
  return null;
}
export function itemPlan(r,actor,text){
  text=text.trim().replace(/^(?:I (?:try to |want to |attempt to )?)/i,'');
  const state=ensureItems(r),extended=planEntity(r,state,actor,parseEntityAttempt(text),findItem);if(extended)return {...extended,entityAction:true};
  if(currentLocation(r)!=='tavern'&&/^(?:rest|rest and heal|heal myself)$/i.test(text.trim()))return {verb:'rest',automatic:false,dc:6,ability:'Recovery'};
  const attempt=parseItemAttempt(text);if(!attempt&&/\b(make|craft|create|fashion|weave|sew|build|turn.+into)\b/i.test(text))return {verb:'unsupported',error:'This creative attempt needs a validated interpretation. Use Make <name> from two carried components, or connect local AI.',automatic:true,dc:0,ability:'Interaction'};if(!attempt)return currentLocation(r)==='tavern'?null:{verb:'unsupported',error:'Try taking, crafting, equipping, giving, separating, or using an object here, or travel to a connected place.',automatic:true,dc:0,ability:'Interaction'};
  const isExplicit=['travel','craft','attach','give','use','equip','unequip','separate','drop'].includes(attempt.verb);
  const s=ensureItems(r),item=attempt.item?findItem(s,r,attempt.item):null;
  if(!isExplicit&&!item){if(s.current==='tavern'&&!/^item-\d+$/i.test(attempt.item||''))return null;}
  const blocked=message=>({...attempt,itemId:item?.id,error:message,automatic:true,dc:0,ability:'Interaction'});
  if(attempt.verb==='travel'){
    const dest=Object.values(s.locations).find(l=>l.id===attempt.destination||norm(l.name)===attempt.destination);
    if(!dest||!s.locations[s.current].exits.includes(dest.id))return blocked('That place is not connected to this location.');
    return {...attempt,destination:dest.id,automatic:true,ability:'Travel'};
  }
  if(['craft','attach'].includes(attempt.verb)){
    if(attempt.verb==='craft'&&(!attempt.name||attempt.name.length>48||/[<>]/.test(attempt.name)))return blocked('Use an item name of 1–48 plain characters.');
    const sources=attempt.sources.map(name=>findItem(s,r,name));
    if(sources.length<2||sources.length>4||sources.some(i=>!i||i.ownerId!==actor.id||i.containerId||i.condition!=='intact')||new Set(sources.map(i=>i.id)).size!==sources.length)return blocked('Choose two to four different intact items from your own pockets; take them out of containers first. Use item IDs if names repeat.');
    if(Object.values(s.items).filter(i=>i.location===s.current||i.ownerId===actor.id).length>=256)return blocked('This campaign has reached its 256-object crafting limit.');
    return {...attempt,sourceIds:sources.map(i=>i.id),automatic:false,dc:10,ability:'Craft'};
  }
  if(!item)return blocked('No unique item matches that name here. Choose a visible item ID.');
  const plan={...attempt,itemId:item.id,automatic:true,dc:0,ability:'Interaction'};
  if(attempt.verb==='inspect')return plan;
  if(attempt.verb==='take'){if(item.portable===false||ITEM_TYPES[item.type]?.portable===false)return blocked('This fixture cannot be carried intact.');return !item.ownerId||item.ownerId===actor.id&&item.containerId?plan:blocked('That item is already carried; its owner must give or drop it.');}
  if(item.ownerId!==actor.id)return blocked('You must carry that item first.');
  if(attempt.verb==='give'){
    const recipient=[...r.players,...localCreatures(s)].find(p=>(norm(p.name)===norm(attempt.recipient)||p.id===attempt.recipient)&&p.id!==actor.id);
    return recipient?{...plan,recipientId:recipient.id}:blocked('Choose another adventurer by their full name.');
  }
  if(['equip','use'].includes(attempt.verb)&&item.condition!=='intact')return blocked('That item is broken. Separate its components or use another item.');
  if(attempt.verb==='equip'&&!ITEM_TYPES[item.type]?.wearable)return blocked('Only wearable objects can be equipped. Craft a wearable from carried components.');
  if(attempt.verb==='separate'&&!item.components.length)return blocked('That item has no attached components to separate.');
  if(attempt.verb==='break')return item.condition==='broken'?blocked('That item is already broken.'):{...plan,automatic:false,dc:MATERIALS[item.material].hardness,ability:'Athletics'};
  if(attempt.verb==='use'){
    const target=entityNamed(s,r,attempt.target,findItem);
    if(item.type!=='tool')return blocked('This action needs a tool. Wearables can be equipped; containers can be carried or combined.');
    if(!target||target.id===item.id||target.ownerId&&target.ownerId!==actor.id||target.condition&&target.condition!=='intact'||target.attitude&&target.hp<=0)return blocked('Choose an intact object here or in your own pockets.');
    return {...plan,targetId:target.id,automatic:false,dc:Math.max(5,(MATERIALS[target.material]?.hardness||10)-2),ability:'Athletics'};
  }
  return plan;
}
function remember(item,verb,actor,location){item.history.push({verb,actorId:actor.id,location});item.history=item.history.slice(-12);}
export function resolveItem(r,actor,plan,success){
  const s=ensureItems(r),item=s.items[plan.itemId];
  const out={success:success&&!plan.error,blocked:!!plan.error,text:'',change:null};
  if(plan.error)return {...out,text:plan.error};
  if(plan.entityAction&&plan.verb!=='explore')return resolveEntity(r,s,actor,plan,success);
  if(plan.verb==='use')return resolveEntity(r,s,actor,{...plan,verb:'attack'},success);
  if(!success)return {...out,text:plan.verb==='rest'?`${actor.name} cannot settle down yet. Try resting again.`:`${actor.name} tries, but the materials resist. Nothing is consumed or changed.`};
  if(plan.verb==='rest'){s.campaign.day++;actor.injuries=[];actor.hp=Math.min(actor.maxHp,actor.hp+4);return {...out,text:`${actor.name} rests and recovers.`,change:'+4 HP (up to maximum)'};}
  if(plan.verb==='travel'||plan.verb==='explore'){enterRegion(r,s,plan.destination);recordCampaign(r,s,'travel',actor.name+' led the party to '+s.locations[s.current].name,{location:s.current});return {...out,text:`The party travels to ${s.locations[s.current].name}. Carried objects come along.`,change:'LOCATION: '+s.locations[s.current].name};}
  if(['craft','attach'].includes(plan.verb)){
    const sources=plan.sourceIds.map(id=>s.items[id]),name=plan.name||`${sources[1].name} with ${sources[0].name}`.slice(0,48);
    const type=plan.creationType||(plan.verb==='attach'?sources[1].type:/\b(hat|crown|ring|cape|mask|belt|amulet|badge|necklace|helmet|wearable)\b/i.test(name)?'wearable':/\b(bottle|cup|bowl|container|flask)\b/i.test(name)?'container':'tool');
    const id='item-'+s.nextId++,material=sources[0].material;
    const slot=plan.creationSlot||(type!=='wearable'?null:plan.verb==='attach'?sources[1].slot||'head':/\b(ring)\b/i.test(name)?'hand':/\b(cape|belt|amulet|badge|necklace)\b/i.test(name)?'body':'head');
    const palette={red:'#d87878',blue:'#7ea7d4',green:'#83b48a',gold:'#dfc16e',purple:'#bd88cf',white:'#e4dcc8',black:'#484552'};
    const namedColor=Object.keys(palette).find(c=>new RegExp('\\b'+c+'\\b','i').test(name));
    const materials=[...new Set(sources.flatMap(i=>i.materials||[i.material]))];
    const made=s.items[id]={id,name,type,material,materials,properties:{sharp:materials.some(m=>MATERIALS[m]?.sharp),combustible:materials.some(m=>MATERIALS[m]?.burns)},slot,condition:'intact',hp:4,maxHp:4,ownerId:actor.id,location:null,position:[480,390],components:plan.sourceIds,contents:[],equipped:false,appearance:{shape:ITEM_TYPES[type].shape,color:plan.creationColor||(namedColor?palette[namedColor]:sources[0].appearance.color),accent:sources[1].appearance.color},history:[]};
    for(const source of sources){source.parentId=id;source.ownerId=null;source.location=null;source.equipped=false;remember(source,'combined',actor,s.current);}
    remember(made,'created',actor,s.current);
    return {...out,text:`${actor.name} creates ${name} (${id}) from ${sources.map(i=>i.name).join(' and ')}.`,change:'CREATED: '+name};
  }
  switch(plan.verb){
    case 'inspect':return {...out,text:`${item.name} (${item.id}): ${item.condition} ${item.material} ${item.type}; ${item.components.length} components. ${item.ownerId?'Carried by '+[...r.players,...localCreatures(s)].find(p=>p.id===item.ownerId)?.name:'On the ground'}.`};
    case 'take':if(item.containerId){const box=s.items[item.containerId];box.contents=box.contents.filter(id=>id!==item.id);delete item.containerId;}item.ownerId=actor.id;item.location=null;break;
    case 'drop':item.ownerId=null;item.location=s.current;item.equipped=false;break;
    case 'give':item.ownerId=plan.recipientId;item.equipped=false;break;
    case 'equip':for(const other of Object.values(s.items))if(other.ownerId===actor.id&&other.slot===item.slot)other.equipped=false;item.equipped=true;break;
    case 'unequip':item.equipped=false;break;
    case 'break':item.condition='broken';item.equipped=false;break;
    case 'use':{if(plan.targetId.startsWith('fixture:'))return resolveEntity(r,s,actor,{verb:'attack',targetId:plan.targetId,itemId:item.id},success);const target=s.items[plan.targetId]||s.creatures[plan.targetId];damageEntity(r,s,actor,target,4+(item.properties?.sharp?1:0));remember(target,'hit with '+item.id,actor,s.current);break;}
    case 'separate':for(const id of item.components){const part=s.items[id];delete part.parentId;part.ownerId=actor.id;remember(part,'separated',actor,s.current);}item.components=[];item.ownerId=null;item.location=null;item.condition='disassembled';item.equipped=false;break;
  }
  const follow=(parent,seen=new Set())=>{if(seen.has(parent.id))return;seen.add(parent.id);for(const id of parent.contents||[]){const child=s.items[id];child.ownerId=parent.ownerId;child.location=parent.location;follow(child,seen);}};follow(item);
  remember(item,plan.verb,actor,s.current);
  return {...out,text:`${actor.name}: ${plan.verb} ${item.name}${plan.recipientId?' → '+[...r.players,...localCreatures(s)].find(p=>p.id===plan.recipientId).name:''}${plan.targetId?' strikes '+(s.items[plan.targetId]||s.creatures[plan.targetId]).name:''}.`,change:plan.verb.toUpperCase()+': '+item.name};
}

export function advanceWorld(r){const s=r.world.expedition;if(!s)return [];const changes=advanceEntities(r,s),done=progressAdventure(r,s);if(done)changes.push(done);return changes;}
