import {spawnItem,localCreatures,recordCampaign} from './campaign.js';
import {OBJECTS,objectState,environmentTarget} from './environment.js';
export const MATERIAL_RULES={
 cloth:{color:'#bd88cf',hardness:7,burns:true},wood:{color:'#b88955',hardness:10,burns:true},glass:{color:'#7dc7cf',hardness:8,sharp:true},stone:{color:'#a3adbb',hardness:14},metal:{color:'#dfc16e',hardness:16},fiber:{color:'#c7b69a',hardness:6,burns:true},bone:{color:'#dfd5b5',hardness:9},flesh:{color:'#bd8b78',hardness:8}
};
export const normalized=text=>String(text).trim().toLowerCase().replace(/^(?:a|an|the)\s+/,'');
export function available(s,r,item){
 if(item.parentId||item.condition==='disassembled')return false;
 if(item.containerId){const box=s.items[item.containerId];if(!box?.open&&box?.condition!=='broken')return false;}
 return item.location===s.current||r.players.some(p=>p.id===item.ownerId)||localCreatures(s).some(c=>c.id===item.ownerId);
}
export function entityNamed(s,r,text,find){
 const norm=normalized(text),matches=[...localCreatures(s),...r.players].filter(c=>c.id===text||normalized(c.name)===norm);
 if(matches.length===1)return matches[0];
 // Titles are aliases only when unique among entities currently present.
 if(!matches.length){const titled=[...localCreatures(s),...r.players].filter(c=>normalized(c.name).endsWith(' the '+norm));if(titled.length===1)return titled[0];}
 const item=find(s,r,text);if(item)return item;
 if(s.current==='tavern'){
  const legacy=Object.hasOwn(OBJECTS,text)?{kind:text}:environmentTarget(text);
  if(legacy){const o=OBJECTS[legacy.kind],state=objectState(r.world,legacy.kind);return {id:'fixture:'+legacy.kind,name:o.name,type:'fixture',material:o.material,portable:o.portable,position:o.position,legacyId:legacy.kind,...state};}
 }
 return null;
}
export function parseEntityAttempt(text){
 let m;
 if(/^(?:explore|continue (?:the )?(?:story|campaign)|begin (?:the )?campaign)$/i.test(text))return {verb:'explore'};
 if((m=text.match(/^(?:talk to|ask|negotiate with|pacify|befriend|tame|persuade) (.+?)(?: about .*)?$/i)))return {verb:/^(talk|ask)/i.test(text)?'talk':'pacify',target:m[1]};
 if((m=text.match(/^(?:attack|damage|hit|strike) (.+?)(?: with (.+))?$/i)))return {verb:'attack',target:m[1],item:m[2]};
 if((m=text.match(/^(?:cut|pluck|harvest|separate) (.+?) from (.+)$/i)))return {verb:'harvest',part:m[1],target:m[2]};
 if((m=text.match(/^(?:heal|bandage|treat) (.+?)(?: (?:using|with) (.+))?$/i)))return {verb:'treat',target:m[1].replace(/[’']s (?:sprained |injured |wounded )?(?:arm|leg|hand|foot|head|wound|injury)\b.*$/i,''),item:m[2]?.replace(/^my /i,'')};
 if((m=text.match(/^put (.+?) (?:in|into) (.+)$/i)))return {verb:'put',item:m[1],target:m[2]};
 if((m=text.match(/^attach (.+?) to (.+)$/i)))return {verb:'attachTo',item:m[1],target:m[2]};
 if((m=text.match(/^fill (.+?) from (.+)$/i)))return {verb:'fill',item:m[1],target:m[2]};
 if((m=text.match(/^(inspect|open|close|unlock|repair|ignite|extinguish|drink|move|push) (.+)$/i)))return {verb:m[1].toLowerCase()==='push'?'move':m[1].toLowerCase(),target:m[2]};
 return null;
}
export function planEntity(r,s,actor,attempt,find){
 if(!attempt)return null;
 const blocked=error=>({...attempt,error,automatic:true,dc:0,ability:'Interaction'});
 if(attempt.verb==='explore'){
  const next=s.locations[s.current].exits.find(id=>!s.locations[id]?.visited)||s.locations[s.current].exits.find(id=>id!=='tavern');
  return {...attempt,destination:next,automatic:true,ability:'Exploration'};
 }
 const target=entityNamed(s,r,attempt.target,find);
 if(!target){if(s.current==='tavern'&&!['harvest','pacify','fill'].includes(attempt.verb))return null;return {...blocked('That entity is not here. Use the displayed name or identity.'),unresolvedTarget:true};}
 if(target.legacyId&&!['harvest','attack'].includes(attempt.verb))return null;
 const p={...attempt,targetId:target.id,automatic:true,dc:0,ability:'Interaction'};
 if(attempt.verb==='inspect')return p;
 const creature=!!target.attitude,player=r.players.some(x=>x.id===target.id);
 if(['talk','pacify'].includes(attempt.verb)&&creature&&target.hp<=0)return blocked('That creature is down. Treat it before trying to speak with it.');
 if(['talk','pacify'].includes(attempt.verb))return creature?{...p,automatic:attempt.verb==='talk'||target.attitude==='friendly',dc:10+(s.locations[s.current].danger||0),ability:'Persuasion'}:blocked('Choose a living character to speak with.');
 if(attempt.verb==='attachTo'){
  if(!creature&&!player)return null;
  const item=find(s,r,attempt.item);
  if(!item||item.ownerId!==actor.id||item.type!=='wearable'||item.condition!=='intact')return blocked('Carry an intact wearable to attach.');
  if(player&&target.id!==actor.id||creature&&target.hp>0&&target.attitude!=='friendly')return blocked('The recipient must agree. Befriend the creature first, or give another player the item so they can equip it.');
  return {...p,itemId:item.id};
 }
 if(attempt.verb==='treat'){
  if(!creature&&!player)return blocked('Choose an injured creature or adventurer.');
  const requested=attempt.item?Object.values(s.items).filter(i=>i.ownerId===actor.id&&available(s,r,i)&&(i.id===attempt.item||normalized(i.name)===normalized(attempt.item))):[];
  const candidate=requested.length===1?requested[0]:null;
  const bandage=(attempt.item?[candidate]:Object.values(s.items)).find(i=>i&&i.ownerId===actor.id&&available(s,r,i)&&['cloth','fiber'].includes(i.material)&&i.condition==='intact');
  return bandage?{...p,itemId:bandage.id,automatic:false,dc:8,ability:'Medicine'}:blocked('You need a carried cloth or fiber item for a bandage.');
 }
 if(attempt.verb==='harvest'){
  const parts=target.parts||(target.legacyId?[{name:target.material+' scrap',material:target.material,count:target.condition==='taken'||target.condition==='broken'?0:1}]:[]);
  const part=parts.find(part=>normalized(part.name)===normalized(attempt.part));
  if(!part||part.count<=0)return blocked('That part is unavailable. Inspect the entity to see its remaining parts.');
  return {...p,part:part.name,material:part.material,automatic:false,dc:creature&&target.hp>0?14:8,ability:'Craft'};
 }
 if(attempt.verb==='attack'){
  if(target.ownerId&&target.ownerId!==actor.id&&!creature)return blocked('Ask the owner to drop that object first.');
  if(target.condition==='broken'||creature&&target.hp<=0)return blocked('That target is already down or broken.');
  const tool=attempt.item?find(s,r,attempt.item):null;
  if(attempt.item&&(!tool||tool.ownerId!==actor.id||tool.condition!=='intact'||tool.type!=='tool'))return blocked('Choose an intact tool in your own pockets.');
  return {...p,itemId:tool?.id,automatic:false,dc:creature?10+(s.locations[s.current].danger||1):MATERIAL_RULES[target.material]?.hardness||10,ability:'Athletics'};
 }
 if(creature||player)return blocked('This action requires an object.');
 if(target.ownerId&&target.ownerId!==actor.id)return blocked('Ask its owner to transfer or drop it first.');
 if(attempt.verb==='put'){
  const item=find(s,r,attempt.item);if(!item||item.ownerId!==actor.id||target.type!=='container'||!target.open||target.ownerId!==actor.id||item.id===target.id)return blocked('Choose a carried item and an open container you carry.');
  let parent=target;for(let n=0;parent&&n<256;n++){if(parent.id===item.id)return blocked('A container cannot contain itself or its parent.');parent=s.items[parent.containerId];}
  if((target.contents||[]).length>=8)return blocked('That container is full (eight objects).');return {...p,itemId:item.id};
 }
 if(attempt.verb==='fill'){
  const vessel=find(s,r,attempt.item);
  return target.source==='water'&&vessel?.type==='container'&&vessel.ownerId===actor.id&&vessel.condition==='intact'?{...p,itemId:vessel.id}:blocked('Carry an intact container and choose a water source here.');
 }
 if(attempt.verb==='drink')return target.ownerId===actor.id&&target.liquid?.amount>0?p:blocked('You need a carried container with liquid in it.');
 if(['open','close','unlock'].includes(attempt.verb)){
  if(target.type!=='container'&&target.type!=='fixture')return blocked('That object has no opening.');
  if(target.condition==='broken')return blocked('It is broken open already.');
  return {...p,automatic:attempt.verb==='close'||!target.locked,dc:11+(s.locations[s.current].danger||0),ability:'Sleight of hand'};
 }
 if(attempt.verb==='move')return target.portable===false?blocked('That fixture is fixed to the ground.'):{...p,automatic:false,dc:8,ability:'Athletics'};
 if(attempt.verb==='ignite')return MATERIAL_RULES[target.material]?.burns?{...p,automatic:false,dc:9,ability:'Arcana'}:blocked('That material will not burn.');
 if(attempt.verb==='extinguish')return target.condition==='burning'?p:blocked('There is no flame on that object.');
 if(attempt.verb==='repair')return target.condition==='broken'?{...p,automatic:false,dc:11,ability:'Craft'}:blocked('That object is not broken.');
 return blocked('That action is not supported by this entity.');
}
export function damageEntity(r,s,actor,target,amount){
 const armor=Object.values(s.items).some(i=>i.ownerId===target.id&&i.equipped&&(i.materials||[i.material]).some(m=>['metal','stone'].includes(m)));
 amount=Math.max(1,amount-(armor?1:0));target.hp=Math.max(0,(target.hp??4)-amount);
 target.injuries||=[];if(target.hp>0&&target.hp<(target.maxHp||4)/2&&!target.injuries.includes('wounded'))target.injuries.push('wounded');
 if(!target.hp){if(target.attitude){target.attitude='defeated';target.status='knocked out';}else{target.condition='broken';target.equipped=false;target.open=true;target.locked=false;}}
 target.lastImpact={round:r.round,actorId:actor.id,amount};
}
export function resolveEntity(r,s,actor,p,success){
 const target=s.items[p.targetId]||s.creatures[p.targetId]||r.players.find(x=>x.id===p.targetId);
 if(p.error)return {success:false,blocked:true,text:p.error};
 const reply=(text,change)=>({success,blocked:false,text,change});
 if(!success){if(target?.attitude==='hostile'&&['harvest','attack'].includes(p.verb)){const protectedByGear=Object.values(s.items).some(i=>i.ownerId===actor.id&&i.equipped&&(i.materials||[i.material]).some(m=>['metal','stone'].includes(m)));actor.hp=Math.max(0,actor.hp-(protectedByGear?1:2));actor.injuries||=[];if(!actor.injuries.includes('bruised'))actor.injuries.push('bruised');}return reply(`${actor.name} cannot ${p.verb} ${target?.name||'that'} this time.${target?.attitude==='hostile'?' The creature lashes back.':''}`);}
 if(p.targetId?.startsWith('fixture:')&&p.verb==='attack'){const id=p.targetId.slice(8);r.world.objects||={};r.world.objects[id]={...objectState(r.world,id),condition:'broken'};r.world.props||={};r.world.props[id]='broken';return reply(actor.name+' breaks '+OBJECTS[id].name,'BROKEN: '+OBJECTS[id].name);}
 switch(p.verb){
 case 'inspect':return reply(`${target.name} (${target.id}): ${target.attitude||target.condition}; ${target.material}; ${target.hp??4}/${target.maxHp??4} HP. Parts: ${(target.parts||[]).filter(p=>p.count>0).map(p=>p.name+' ×'+p.count).join(', ')||'none'}. ${target.locked?'Locked. ':''}${target.open?'Open. ':''}${target.liquid?'Contains '+target.liquid.amount+' water. ':''}${target.injuries?.length?'Injuries: '+target.injuries.join(', '):''}`);
 case 'talk':{const q=s.regions[s.current]?.quest;if(q&&target.id===q.patronId){if(q.status==='available')q.status='active';return reply(`${target.name}: “${q.objective}” ${s.regions[s.current].rumor}`,'ADVENTURE: '+q.title);}return reply(`${target.name} ${target.attitude==='hostile'?'growls a warning. You could try befriending it or fighting.':'shares a story about the road ahead.'}`);}
 case 'pacify':target.attitude='friendly';target.trust[actor.id]=(target.trust[actor.id]||0)+1;break;
 case 'attack':damageEntity(r,s,actor,target,p.itemId?4+(s.items[p.itemId]?.properties?.sharp?1:0):2);break;
 case 'treat':{const bandage=s.items[p.itemId];bandage.parentId=target.id;bandage.ownerId=null;bandage.location=null;bandage.attachedTo=target.id;target.hp=Math.min(target.maxHp,target.hp+4);target.injuries=[];if(target.status==='knocked out')target.status='ready';if(target.attitude==='defeated')target.attitude='wary';if(target.trust)target.trust[actor.id]=(target.trust[actor.id]||0)+1;break;}
 case 'harvest':{
  const legacy=p.targetId.startsWith('fixture:');
  if(legacy){const id=p.targetId.slice(8);r.world.objects||={};r.world.objects[id]={...objectState(r.world,id),condition:'broken'};r.world.props||={};r.world.props[id]='broken';}
  else {target.parts.find(x=>x.name===p.part).count--;if(target.attitude&&target.hp>0)damageEntity(r,s,actor,target,2);}
  const item=spawnItem(s,null,{name:p.part,material:p.material,ownerId:actor.id,originId:p.targetId,appearance:{shape:'shard',color:MATERIAL_RULES[p.material].color}});
  return reply(`${actor.name} separates ${item.name} (${item.id}) from ${target?.name||OBJECTS[p.targetId.slice(8)]?.name}. It is now a real crafting component.`,'HARVESTED: '+item.name);
 }
 case 'put':{const item=s.items[p.itemId];target.contents||=[];target.contents.push(item.id);item.containerId=target.id;item.ownerId=target.ownerId;item.location=target.location;item.equipped=false;break;}
 case 'attachTo':{const item=s.items[p.itemId];for(const other of Object.values(s.items))if(other.ownerId===target.id&&other.slot===item.slot)other.equipped=false;item.ownerId=target.id;item.location=null;item.equipped=true;item.attachedTo=target.id;break;}
 case 'fill':s.items[p.itemId].liquid={kind:'water',amount:3};break;
 case 'drink':target.liquid.amount--;actor.hp=Math.min(actor.maxHp,actor.hp+1);break;
 case 'open':case 'unlock':target.locked=false;target.open=true;break;
 case 'close':target.open=false;break;
 case 'move':target.position=[Math.min(870,target.position[0]+35),target.position[1]];break;
 case 'ignite':target.condition='burning';target.heat=0;break;
 case 'extinguish':target.condition='intact';target.heat=0;break;
 case 'repair':target.condition='intact';target.hp=target.maxHp||4;break;
 }
 const text=`${actor.name}: ${p.verb} ${target?.name||'the object'}.${p.verb==='attack'?` ${target.hp}/${target.maxHp||4} HP remaining.`:''}`;
 if(target){target.history||=[];target.history.push({verb:p.verb,actorId:actor.id,round:r.round,location:s.current});target.history=target.history.slice(-12);}
 recordCampaign(r,s,'interaction',text,{entityId:p.targetId,location:s.current});return reply(text,p.verb.toUpperCase()+': '+target?.name);
}
export function advanceEntities(r,s){
 const changes=[];
 for(const item of Object.values(s.items))if((item.location===s.current||r.players.some(p=>p.id===item.ownerId))&&item.condition==='burning'){
  item.heat=(item.heat||0)+1;
  for(const c of localCreatures(s))if(c.hp>0&&Math.hypot(c.position[0]-item.position[0],c.position[1]-item.position[1])<65){damageEntity(r,s,{id:'fire'},c,1);changes.push(c.name+' takes fire damage');}
  if(item.heat>=3){item.condition='broken';item.hp=0;item.open=true;item.equipped=false;changes.push(item.name+' burned through');}
 }
 return changes;
}
