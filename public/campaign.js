import {Rng} from './vendor/partyframe-rng.js';
// Deterministic region generation is independent of the authoritative dice stream.
const hash=text=>{let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export const CAMPAIGN_TYPES={
 clearing:{name:'Clearing',ground:'#466756',accent:'#638368'},
 ruins:{name:'Ruins',ground:'#575663',accent:'#91909c'},
 forest:{name:'Forest',ground:'#355646',accent:'#497859'},
 marsh:{name:'Marsh',ground:'#3d5c5d',accent:'#71958b'},
 village:{name:'Village',ground:'#79624e',accent:'#b79868'},
 cavern:{name:'Cavern',ground:'#464355',accent:'#847e9e'}
};
export function upgradeCampaign(r,s){
 if(s.campaign)return;
 s.worldSeed=r.seed;s.creatures={};s.regions={};s.campaign={chapter:1,renown:0,day:1,history:[],completed:[]};
 for(const l of Object.values(s.locations))l.visited=l.id==='tavern';
 if(!s.locations.ruins.exits.includes('wild-0-0'))s.locations.ruins.exits.push('wild-0-0');
 describeRegion(s,'wild-0-0');
}
export function describeRegion(s,id){
 if(s.locations[id])return s.locations[id];
 const m=id.match(/^wild-(-?\d+)-(-?\d+)$/);if(!m)return null;
 const [x,y]=m.slice(1).map(Number);if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>100000||Math.abs(y)>100000)return null;
 const rng=new Rng(hash(s.worldSeed+':'+id)),kind=rng.pick(Object.keys(CAMPAIGN_TYPES));
 const exits=[`wild-${x+1}-${y}`,`wild-${x}-${y+1}`,`wild-${x-1}-${y}`,`wild-${x}-${y-1}`];if(x===0&&y===0)exits[2]='ruins';
 return s.locations[id]={id,name:rng.pick(['Whispering','Copper','Forgotten','Silver','Thorn','Starfall','Ashen','Winding'])+' '+CAMPAIGN_TYPES[kind].name+' '+Math.abs(hash(id)%1000),kind,exits,visited:false,danger:Math.min(5,1+Math.floor((Math.abs(x)+Math.abs(y))/3)),decor:Array.from({length:12},()=>[rng.int(90,870),rng.int(170,470),rng.int(0,2)])};
}
export function spawnItem(s,location,properties){
 const id='item-'+s.nextId++;
 return s.items[id]={id,name:'object',type:'fragment',material:'wood',condition:'intact',hp:4,maxHp:4,ownerId:null,location,position:[480,390],components:[],contents:[],equipped:false,appearance:{shape:'shard',color:'#b88955'},history:[],...properties};
}
const regionStores=new WeakMap();
export function bindRegionStorage(r,store){regionStores.set(r,store);}
function unloadRegion(r,s,id){
 const store=regionStores.get(r);if(!store||id==='tavern')return;
 const people=Object.fromEntries(Object.entries(s.creatures).filter(([,c])=>c.location===id));
 const ids=new Set(Object.values(s.items).filter(i=>i.location===id||people[i.ownerId]||people[i.attachedTo]).map(i=>i.id));
 const addChildren=key=>{const i=s.items[key];for(const child of [...i?.components||[],...i?.contents||[]])if(!ids.has(child)){ids.add(child);addChildren(child);}};for(const key of [...ids])addChildren(key);
 const chunk={version:1,location:id,region:s.regions[id],creatures:people,items:Object.fromEntries([...ids].map(key=>[key,s.items[key]]))};
 s.regionRefs||={};s.regionRefs[id]=store.write(chunk);
 for(const key of ids)delete s.items[key];for(const key of Object.keys(people))delete s.creatures[key];delete s.regions[id];
}
export function enterRegion(r,s,id){
 const l=describeRegion(s,id);if(!l)return false;
 if(s.current!==id)unloadRegion(r,s,s.current);
 s.current=id;l.visited=true;
 if(s.regionRefs?.[id]&&!s.regions[id]){const store=regionStores.get(r);if(!store)throw Error('Saved region storage is unavailable; campaign preserved.');const chunk=store.read(s.regionRefs[id]);if(chunk.location!==id)throw Error('Saved region identity mismatch');Object.assign(s.items,chunk.items);Object.assign(s.creatures,chunk.creatures);s.regions[id]=chunk.region;}
 if(id==='tavern')return true;
 for(const exit of l.exits)describeRegion(s,exit);
 if(s.regions[id])return true;
 const rng=new Rng(hash(s.worldSeed+':adventure:'+id)),danger=l.danger||1;
 if(!Object.values(s.items).some(i=>i.location===id))for(const [name,material,type,shape,color] of [['cloth strip','cloth','fragment','shard','#bd88cf'],['wood splinter','wood','tool','rod','#b88955'],['blue bottle','glass','container','cup','#7dc7cf'],['smooth stone','stone','fragment','shard','#a3adbb']])spawnItem(s,id,{name,material,type,position:[240+(s.nextId%4)*150,390],appearance:{shape,color}});
 const patronId='person-'+id,threatId='beast-'+id,species=rng.pick(['wolf','boar','crow']);
 s.creatures[patronId]={id:patronId,name:rng.pick(['Wren','Tansy','Rook','Finch','Ember'])+' the Wayfarer',kind:'person',material:'flesh',location:id,position:[240,245],hp:6,maxHp:10,attitude:'wary',injuries:['sprained arm'],trust:{},parts:[{name:'loose hair',material:'fiber',count:1}],appearance:{skin:rng.int(0,5),hair:rng.int(0,5),color:rng.int(0,5),outfit:1},history:[]};
 s.creatures[threatId]={id:threatId,name:rng.pick(['Bristle','Mottle','Cinder','Briar'])+' '+species[0].toUpperCase()+species.slice(1),kind:'beast',species,material:'flesh',location:id,position:[760,300],hp:6+danger*2,maxHp:6+danger*2,attitude:'hostile',injuries:[],trust:{},parts:[{name:'tuft of fur',material:'fiber',count:2},{name:'small bone',material:'bone',count:1}],appearance:{skin:5,hair:3,color:1,outfit:0,body:'orc'},history:[]};
 const adventureKind=id.startsWith('wild-')?rng.pick(['recover','rescue','restore']):'recover';
 const chest=spawnItem(s,id,{name:'weathered coffer',type:'fixture',material:'wood',portable:false,locked:true,open:false,position:[650,185],appearance:{shape:'chest',color:'#a77951'},parts:[{name:'wood shaving',material:'wood',count:2}]});
 const relic=spawnItem(s,id,{name:rng.pick(['silver','copper','amber'])+' keepsake',material:'metal',containerId:chest.id,position:[650,185],appearance:{shape:'shard',color:'#dfc16e'}});chest.contents=[relic.id];
 spawnItem(s,id,{name:'spring',type:'fixture',material:'stone',portable:false,source:'water',position:[115,395],appearance:{shape:'spring',color:'#7dc7cf'}});
 const gate=spawnItem(s,id,{name:'weathered gate',type:'fixture',material:'wood',portable:false,locked:false,open:false,position:[480,145],appearance:{shape:'gate',color:'#b88955'},parts:[{name:'wood shaving',material:'wood',count:2}]});
 if(adventureKind==='restore'){gate.condition='broken';gate.hp=0;}
 const objective=adventureKind==='rescue'?'Make the road safe and bandage the injured wayfarer.':adventureKind==='restore'?'Make the road safe and repair the broken gate.':'Make the road safe and return the keepsake from the coffer to the wayfarer.';
 s.regions[id]={quest:{id:'quest-'+id,kind:adventureKind,objective,gateId:gate.id,title:adventureKind==='rescue'?'Shelter on the road':adventureKind==='restore'?'The broken crossing':'A keepsake on the road',patronId,threatId,relicId:relic.id,chestId:chest.id,status:'available',reward:4+danger,chapter:s.campaign.chapter},rumor:rng.pick(['Someone has been moving the old boundary stones.','The spring runs clear, even in drought.','Travelers say the next valley remembers every promise.'])};
 recordCampaign(r,s,'discovery',`Discovered ${l.name}.`,{location:id});
 return true;
}
export function recordCampaign(r,s,type,text,extra={}){
 const entry={id:r.seq+':'+r.round+':'+s.campaign.history.length,type,text,round:r.round,day:s.campaign.day,...extra};
 s.campaign.history.push(entry);if(s.campaign.history.length>200)s.campaign.history.shift();
}
export const localCreatures=s=>Object.values(s.creatures||{}).filter(c=>c.location===s.current);
function contains(s,item,id,seen=new Set()){
 if(item.id===id)return true;if(seen.has(item.id))return false;seen.add(item.id);
 return [...item.components||[],...item.contents||[]].some(child=>s.items[child]&&contains(s,s.items[child],id,seen));
}
export function progressAdventure(r,s){
 const quest=s.regions[s.current]?.quest;if(!quest||quest.status==='completed')return null;
 const beast=s.creatures[quest.threatId],patron=s.creatures[quest.patronId];
 if(quest.status==='available')return null;
 quest.steps={safe:beast.hp<=0||beast.attitude==='friendly',recovered:Object.values(s.items).some(i=>i.ownerId&&r.players.some(p=>p.id===i.ownerId)&&contains(s,i,quest.relicId)),healed:patron.hp===patron.maxHp,restored:s.items[quest.gateId]?.condition==='intact',returned:Object.values(s.items).some(i=>i.ownerId===patron.id&&contains(s,i,quest.relicId))};
 const solved=quest.kind==='rescue'?quest.steps.healed:quest.kind==='restore'?quest.steps.restored:quest.steps.returned;
 if(!quest.steps.safe||!solved)return null;
 quest.status='completed';quest.completedRound=r.round;s.campaign.completed.push({id:quest.id,title:quest.title,location:s.current,chapter:s.campaign.chapter});
 for(const p of r.players){p.gold+=quest.reward;p.score+=6;}
 s.campaign.renown++;s.campaign.chapter++;patron.attitude='friendly';
 const text=`${quest.kind==='rescue'?patron.name+' is healed':quest.kind==='restore'?'The crossing is repaired':patron.name+'’s keepsake is returned'} and the road is safe. Everyone gains ${quest.reward} coins and 6 XP. Chapter ${s.campaign.chapter} begins beyond the next path.`;
 recordCampaign(r,s,'adventure',text,{location:s.current,questId:quest.id});return text;
}
// Only the local scene, carried objects and known neighboring summaries cross the wire.
export function campaignView(r){
 const s=r.world.expedition;if(!s)return undefined;
 const ids=new Set([s.current,...s.locations[s.current]?.exits||[]]);
 const locations=Object.fromEntries(Object.entries(s.locations).filter(([id])=>ids.has(id)).map(([id,l])=>[id,id===s.current?l:{id,name:l.name,kind:l.kind,visited:l.visited,exits:l.exits}]));
 const creatures=Object.fromEntries(localCreatures(s).map(c=>[c.id,c]));
 const keep=new Set(Object.values(s.items).filter(i=>i.location===s.current||r.players.some(p=>p.id===i.ownerId)||creatures[i.ownerId]||creatures[i.attachedTo]||r.players.some(p=>p.id===i.attachedTo)).map(i=>i.id));
 const include=id=>{const i=s.items[id];if(!i)return;keep.add(id);for(const child of [...i.components||[],...i.contents||[]])if(!keep.has(child))include(child);};
 for(const id of [...keep])include(id);
 const {regionRefs,...local}=s;
 return {...local,locations,items:Object.fromEntries([...keep].map(id=>[id,s.items[id]])),creatures,regions:s.regions[s.current]?{[s.current]:s.regions[s.current]}:{},campaign:{...s.campaign,history:s.campaign.history.slice(-30),completed:s.campaign.completed.slice(-20)}};
}
