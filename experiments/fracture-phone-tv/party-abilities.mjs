/** Authoritative class signatures. Reuses native skill and health execution. */
import fs from 'node:fs';import path from 'node:path';
import {STARTERS} from './character-profile.mjs';
const actorId=p=>String(p.characterId||''),label=p=>p.chaosName||p.name;
const alive=p=>p?.chaosControlled&&!p.chaosSpectator&&p.hasEnteredGame&&!p.isDead;
function sameArea(a,b){if(a.getWorld()!==b.getWorld())return false;const z=a.getWorld().zoneManager;const x=z?.getZoneAt(a.x,a.y),y=z?.getZoneAt(b.x,b.y);return !!x&&!!y&&(x.id??x.name)===(y.id??y.name);}
function reachable(a,b){if(!sameArea(a,b))return false;const d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y),w=a.getWorld();if(d>2)return false;if(d<=1)return true;return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>w.isValidPosition(a.x+dx,a.y+dy)&&Math.abs(a.x+dx-b.x)+Math.abs(a.y+dy-b.y)===1);}
export function createPartyAbilities({file,useNativeSkill,clock=Date.now,displayClock=clock}){
 let ledger=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,actors:{}};
 if(ledger.version!==1||!ledger.actors)throw Error('Unsupported ability save; original file preserved.');
 const save=()=>{fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file+'.tmp',JSON.stringify(ledger),{mode:0o600});fs.renameSync(file+'.tmp',file);};
 function readyAt(p,def){return Math.max(ledger.actors[actorId(p)]?.[def.skill]||0,p.getSkillState?.()?.cooldowns?.[def.skill]||0);}
 function snapshot(p){const def=STARTERS[p.chaosRole];if(!def)return null;const at=readyAt(p,def),skills=p.getSkillState?.();if(skills&&def.skill!=='mend')skills.cooldowns[def.skill]=at;
  const targets=[p,...Object.values(p.getWorld().entities||{}).filter(q=>q!==p&&q.type==='player'&&p.chaosPartyId&&q.chaosPartyId===p.chaosPartyId&&alive(q)&&reachable(p,q))];
  return {id:def.skill,name:def.ability,description:def.description,readyAt:at?displayClock()+Math.max(0,at-clock()):0,remainingMs:Math.max(0,at-clock()),phased:!!p.isPhased?.(),phaseUntil:skills?.phaseShiftExpires?displayClock()+Math.max(0,skills.phaseShiftExpires-clock()):0,empowered:!!((skills?.powerStrikeActive&&skills.powerStrikeExpires>clock())||(skills?.frenzyActive&&skills.frenzyExpires>clock())||(skills?.ambushActive&&skills.ambushExpires>clock())),frenzied:!!(skills?.frenzyActive&&skills.frenzyExpires>clock()),bulwark:!!(skills?.bulwarkActive&&skills.bulwarkExpires>clock()),ambushReady:!!(skills?.ambushActive&&skills.ambushExpires>clock()),cursed:def.skill==='curse'&&!!(skills?.powerStrikeActive&&skills.powerStrikeExpires>clock()),...(def.skill==='mend'?{targets:targets.filter(alive).map(q=>({id:String(q.id),name:q===p?'Yourself':label(q),hp:q.hitPoints,maxHp:q.maxHitPoints}))}:{})};
 }
 function use(p,reference='',requestedSkill=null){
  const blocked=text=>({blocked:true,success:false,system:true,text});const def=STARTERS[p?.chaosRole];
  if(!p?.chaosControlled||p?.chaosSpectator||!p?.hasEnteredGame||!actorId(p))return blocked('Your character is not in the game yet. Tap Ready and wait for the host to begin.');
  if(!def)return blocked('This class has no ability to use.');
  if(p.isDead)return blocked('You are knocked out. Respawn first.');
  if(requestedSkill&&requestedSkill!==def.skill)return blocked('Your class uses '+def.ability+'.');
  const at=readyAt(p,def);if(at>clock())return blocked(def.ability+' is ready in '+Math.ceil((at-clock())/1000)+' seconds.');
  let target=p;
  if(def.skill==='mend'&&reference&&!['self','me','myself'].includes(reference.toLowerCase())){
   const q=String(reference).toLowerCase();const matches=Object.values(p.getWorld().entities||{}).filter(e=>e.type==='player'&&alive(e)&&p.chaosPartyId&&e.chaosPartyId===p.chaosPartyId&&(String(e.id)===q||label(e).toLowerCase()===q));
   if(matches.length!==1)return blocked('Choose one living member of your party to heal.');target=matches[0];
  }
  if(def.skill!=='mend'&&def.skill!=='bulwark'&&reference)return blocked(def.ability+' does not take a friendly target.');
  if(def.skill==='bulwark'&&reference&&!['self','me','myself'].includes(reference.toLowerCase()))return blocked('Bulwark protects only its acting character.');
  if(def.skill==='mend'&&(!reachable(p,target)||target.hitPoints>=target.maxHitPoints))return blocked(!reachable(p,target)?'Move within two clear tiles of your friend.':'That character is already at full health.');
  const before=target.hitPoints,old=structuredClone(ledger),nativeState=p.getSkillState?.();let effect;
  // Reserve the durable deadline BEFORE execution. Disk failure cannot grant
  // a free repeatable skill; neither phone refresh nor native reconnect resets it.
  ledger.actors[actorId(p)]||={};ledger.actors[actorId(p)][def.skill]=clock()+def.cooldown*1000;
  try{save();}catch(error){ledger=old;throw error;}
  try{
   if(def.skill==='mend'){
    target.regenHealthBy(Math.max(1,Math.floor(target.maxHitPoints/4)));
    const world=target.getWorld();if(target.saveToStorage&&world.getStorageService)target.saveToStorage(world.getStorageService());
    effect={id:'mend',actorId:p.id,targetId:target.id,before,after:target.hitPoints};
   }else{
    if(typeof useNativeSkill!=='function'||!nativeState)throw Error('Native skill adapter unavailable');
    const stuns=['war_cry','entangle'].includes(def.skill)?new Map(Object.values(p.getWorld().entities||{}).filter(e=>e.type==='mob').map(e=>[e,e.stunUntil||0])):null;
    p.chaosSignatureSkill=def.skill;useNativeSkill(p,def.skill);
    if(!(nativeState.cooldowns[def.skill]>clock()))throw Error('Native engine rejected the skill');
    effect={id:def.skill,actorId:p.id,x:p.x,y:p.y,orientation:p.orientation,...(stuns?{stunnedTargets:[...stuns].filter(([mob,before])=>mob.stunUntil>before&&mob.stunUntil>clock()).map(([mob])=>mob.id)}:{})};
   }
  }catch(error){if(def.skill==='mend')target.hitPoints=before;ledger=old;try{save();}catch{}throw error;}
  if(def.skill==='mend'){try{target.getWorld().pushToPlayer(target,target.health());}catch{/* Native state polls also report actual health. */}}
  const text=def.skill==='mend'?`${def.ability}: ${label(target)} recovers ${target.hitPoints-before} health (${target.hitPoints}/${target.maxHitPoints}).`:def.skill==='phase_shift'?`${def.ability}: became phased for two seconds.`:def.skill==='power_strike'?`${def.ability}: readied the next melee hit for up to five seconds.`:def.skill==='frenzy'?`${def.ability}: melee attacks are empowered for the native engine's short window.`:def.skill==='bulwark'?`${def.ability}: the native engine is guarding your next incoming damage.`:def.skill==='ambush'?`${def.ability}: your first attack is empowered by the native engine.`:def.skill==='entangle'?`${def.ability}: ${effect.stunnedTargets?.length||0} nearby enemies were entangled by the native stun effect.`:def.skill==='curse'?`${def.ability}: your next attack carries an engine-controlled damage curse.`:`${def.ability}: ${effect.stunnedTargets?.length||0} nearby enemies were stunned by the native skill.`;
  return {blocked:false,success:true,text,abilityEffect:effect};
 }
 return {snapshot,use};
}
