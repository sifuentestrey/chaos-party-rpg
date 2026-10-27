import {campaignView} from './campaign.js';
import {recordDMMemory,redactDMMemory} from './dm-memory.js';
import {ensureItems,itemPlan,planWorldProposal,resolveItem,currentLocation,advanceWorld} from './world-items.js';
import {OBJECTS,objectState,environmentTarget,environmentCheck,interactEnvironment,advanceEnvironment} from './environment.js';
import {selectD20} from './vendor/dnd5e-advantage.js';
// Authoritative game plugin, shared by PartyFrame and the labeled solo mode.
import {Rng} from './vendor/partyframe-rng.js';
export const VERSION = '0.3.0-beta.2';
export const ROLES = {
  rogue: { name: 'Rogue', icon: '◆', description: 'Quick hands. Questionable intentions.', skills: ['steal', 'sneak'], color: '#ba9dff' },
  bard: { name: 'Bard', icon: '♫', description: 'Every disaster deserves a soundtrack.', skills: ['social', 'dance'], color: '#f9bd6c' },
  wizard: { name: 'Wizard', icon: '✦', description: 'A little magic. Very little supervision.', skills: ['magic', 'inspect'], color: '#8baaff' },
  knight: { name: 'Knight', icon: '♜', description: 'Armor first. Questions eventually.', skills: ['attack', 'break'], color: '#87d6c0' },
  healer: { name: 'Healer', icon: '✚', description: 'Keeping these idiots alive since tonight.', skills: ['heal', 'social'], color: '#f299b9' },
  wildcard: { name: 'Wildcard', icon: '★', description: 'No qualifications. Excellent confidence.', skills: ['weird'], color: '#d5de8e' }
};
export const PERKS = {
  lucky: { name: 'Lucky-ish', description: 'Reroll a natural 1, 2, or 3 once per action.' },
  tough: { name: 'Thick skin', description: 'Start with 3 extra health.' },
  charming: { name: 'Suspiciously charming', description: '+2 when talking, dancing, or distracting.' }
};
export const DEFAULT_AVATAR = { body: 'human', skin: 2, hair: 0, hairColor: 1, outfit: 0, color: 0, accessory: 0 };
export const SKIN = ['#f8d7ba','#dfa878','#b77b52','#8e563c','#633e32','#b0c8bc'];
export const HAIR = ['#24212c','#74452e','#cf9b56','#e7d9bd','#a46fc1','#d96772'];
export const CLOTHES = ['#b392ed','#74bbaa','#df9374','#8da9e1','#e1bb68','#d788ab'];
export const OPENING = 'The Duke’s ridiculous golden crown is hidden somewhere in this tavern. Find it, grab it, and get out together before the guards catch on.';
export const uid = () => globalThis.crypto?.randomUUID?.() || 'id-' + Array.from(globalThis.crypto?.getRandomValues?.(new Uint8Array(18)) || Array.from({length:18},()=>Math.floor(Math.random()*256)),x=>x.toString(16).padStart(2,'0')).join('');
export class RuleError extends Error { constructor(code, message) { super(message); this.code = code; } }
const fail = (code, message) => { throw new RuleError(code, message); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0,n);
export function avatarSafe(a={}) {
  const out = {};
  for(const [k,max] of Object.entries({skin:5,hair:5,hairColor:5,outfit:3,color:5,accessory:5})) out[k] = clamp(Math.floor(Number(a[k]) || 0),0,max);
  out.body = ['human','elf','orc'].includes(a.body) ? a.body : 'human';
  return out;
}
export function createRoom({ code='SOLO', seed=12345, now=Date.now(), reactionMs=8000 }={}) {
  return { version:VERSION, code, createdAt:now, updatedAt:now, seq:0, revision:0,
    seed: (seed >>> 0) || 12345, phase:'lobby', paused:false, deadline:0, reactionMs:clamp(reactionMs,4000,12000),
    players:[], turn:null, result:null, events:[], requests:{}, dmMemory:{version:1,entries:[],people:{}}, round:0, chaos:0,
    quest:{ clues:0, crown:false, carrierId:null, escaped:false }, lastActorId:null, priorityUntil:0,
    world:{ bartender:'wary', guards:'bored', facts:['The Duke has terrible taste in hats.'], props:{rug:true} }, stats:{ actions:0, rolls:0 } };
}
function touch(r, now) { r.revision++; r.updatedAt=now; }
function event(r, type, text, now, extra={}) {
  const e={ id:++r.seq,type,text,at:now,...extra }; r.events.push(e); if(r.events.length>100) r.events.shift(); return e;
}
export function addPlayer(r, { token, name, avatar, role='rogue', perk='lucky', pin }, now=Date.now()) {
  if(!token || typeof token!=='string' || token.length<16 || token.length>150) fail('TOKEN','This device needs a fresh character token.');
  let p=r.players.find(x=>x.token===token);
  if(p) { p.connected=true; touch(r,now); return p; }
  if(r.players.length>=24) fail('FULL','This tavern is full (24 adventurers).');
  name=clean(name,18); if(name.length<1) fail('NAME','Give your adventurer a name.');
  if(r.players.some(x=>x.name.toLowerCase()===name.toLowerCase())) fail('NAME_TAKEN','That name is already in the tavern. Try a nickname.');
  const maxHp=perk==='tough'?13:10;
  p={id:uid(),token,pin:pin || String(Math.floor(100000+Math.random()*900000)),name,avatar:avatarSafe(avatar),
    role:ROLES[role]?role:'rogue',perk:PERKS[perk]?perk:'lucky',hp:maxHp,maxHp,gold:3,inventory:['Bent spoon'],
    connected:true,muted:false,joinedAt:now,score:0,actions:0,assists:0,nat20:0,status:'ready'};
  r.players.push(p); event(r,'join',`${name} has entered the tavern.`,now,{playerId:p.id}); touch(r,now); return p;
}
export function editPlayer(r,id,profile,now=Date.now()) {
  const p=r.players.find(x=>x.id===id); if(!p) fail('PLAYER','Character not found.');
  const name=clean(profile.name,18);
  if(name && r.players.some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase())) fail('NAME_TAKEN','That name is taken.');
  if(name) p.name=name;
  p.avatar=avatarSafe(profile.avatar || p.avatar);
  if(r.phase==='lobby' || r.phase==='ended') {
    if(ROLES[profile.role]) p.role=profile.role;
    if(PERKS[profile.perk]) { p.perk=profile.perk; p.maxHp=p.perk==='tough'?13:10; p.hp=p.maxHp; }
  }
  touch(r,now); return p;
}
export function publicRoom(r) {
  if(r.world.expedition)ensureItems(r);
  const {requests,seed,dmMemory,...s}=r;
  const projected={...s,world:{...s.world,...(s.world.expedition?{expedition:campaignView(r)}:{})}};
  return { ...structuredClone(projected), players:r.players.map(({token,pin,...p})=>structuredClone(p)) };
}
export function startGame(r,now=Date.now()) {
  if(r.phase!=='lobby') fail('PHASE','This story has already started.');
  if(!r.players.length) fail('EMPTY','At least one adventurer needs to join first.');
  ensureItems(r);r.phase='open'; r.deadline=0; event(r,'story',OPENING,now); touch(r,now);
}
export function classify(text) {
  const t=text.toLowerCase();
  if(environmentTarget(t)&&/\b(extinguish|douse|quench|put out|blow out|repair|fix|mend|restore|ignite|light|close|shut|unlock|open|push|shove|drag|move|pull|sit|climb|pour|spill|empty)\b/i.test(t))return 'interact';
  if(/\b(heal|bandage|revive|mend|rest|nap|sleep|drink|eat|snack|potion)\b/.test(t)) return 'heal';
  if(/\b(leave|escape|flee|run|exit|outside|sprint)\b/.test(t)) return 'flee';
  if(/\b(steal|pickpocket|snatch|loot|grab|take|swipe|rob|pocket)\b/.test(t)) return 'steal';
  if(/\b(fire|spell|cast|magic|summon|enchant|teleport|wizard|lightning|turn.*into)\b/.test(t)) return 'magic';
  if(/\b(punch|hit|kick|fight|stab|attack|slap|suplex|wrestle|tackle|bonk|headbutt)\b/.test(t)) return 'attack';
  if(/\b(smash|break|throw|flip|explode|burn|crash|swing)\b/.test(t)) return 'break';
  if(/\b(dance|sing|song|music|perform|twerk|backflip|cartwheel)\b/.test(t)) return 'dance';
  if(/\b(sneak|hide|crawl|disguise|invisible|tiptoe)\b/.test(t)) return 'sneak';
  if(/\b(search|inspect|look|investigate|check|open|read|find|listen|examine)\b/.test(t)) return 'inspect';
  if(/\b(talk|ask|flirt|kiss|hug|convince|persuade|bribe|order|compliment|insult|distract|tell|joke|negotiate|toast)\b/.test(t)) return 'social';
  return 'weird';
}
function targetFor(r,actor,text) {
  const t=text.toLowerCase();
  if(classify(text)==='flee')return {kind:'door',name:'the tavern exit'};
  const aimed=t.match(/\b(?:at|on|against|into|towards?)\s+(?:the\s+)?(.+?)(?:\s+(?:with|using)\b|$)/);
  if(aimed&&aimed[1]!==t)return targetFor(r,actor,aimed[1]);
  const other=r.players.find(p=>p.id!==actor.id&&t.includes(p.name.toLowerCase()));
  if(other) return {kind:'player',id:other.id,name:other.name};
  const environmental=environmentTarget(text);
  const objectIndex=environmental?Math.min(...OBJECTS[environmental.kind].aliases.map(a=>t.indexOf(a)).filter(i=>i>=0)):Infinity;
  const npcIndex=t.search(/guard|captain|brick|soldier|bartender|marnie|barkeep|barmaid|goblin|fiddler/);
  if(environmental&&(npcIndex<0||objectIndex<npcIndex))return environmental;
  if(/guard|captain|brick|soldier/.test(t)) return {kind:'guard',name:'Captain Brick'};
  if(/bartender|marnie|barkeep|barmaid/.test(t)) return {kind:'bartender',name:'Marnie'};
  if(/rug|carpet|mat|runner|tapestry/.test(t)) return {kind:'rug',name:'the tavern rug'};
  if(/crown|chest|box|treasure|drawer/.test(t)) return {kind:'chest',name:'the locked chest'};
  if(/goblin|bard|musician|fiddler/.test(t)) return {kind:'goblin',name:'the goblin fiddler'};
  if(/chandelier|ceiling/.test(t)) return {kind:'chandelier',name:'the chandelier'};
  return environmental||{kind:'room',name:'the tavern'};
}
export function submit(r, playerId, input, now=Date.now()) {
  const p=r.players.find(x=>x.id===playerId); if(!p) fail('PLAYER','Rejoin the tavern first.');
  const key=p.id+':'+clean(input.requestId,90);
  if(!input.requestId || typeof input.requestId!=='string' || input.requestId.length>90) fail('REQUEST','Please try again with a fresh action.');
  if(r.requests[key]) return {...r.requests[key],duplicate:true};
  advance(r,now);
  if(r.paused) fail('PAUSED','The host paused the story.');
  if(p.muted) fail('MUTED','The host has muted your actions.');
  const text=clean(input.text,180); if(text.length<2) fail('TEXT','Tell us what you try to do (at least 2 characters).');
  if(input.kind==='reaction') {
    if(r.phase!=='react' || !r.turn || input.turnId!==r.turn.id) fail('WINDOW_CLOSED','That reaction window closed. Your next big idea is up next.');
    if(r.turn.actorId===p.id) fail('ACTOR','Your action is already locked in. Let the others react.');
    if(r.turn.reactions.some(x=>x.playerId===p.id)) fail('REACTED','Your reaction is already locked in.');
    const kind=['assist','intervene','flee','custom'].includes(input.reaction)?input.reaction:'custom';
    const reaction={id:++r.seq,playerId:p.id,kind,text,at:now}; r.turn.reactions.push(reaction);
    p.status=kind==='flee'?'hiding':'reacting';
    const ack={ok:true,accepted:true,kind:'reaction',seq:reaction.id,at:now,turnId:r.turn.id};
    r.requests[key]=ack; touch(r,now); return ack;
  }
  if(r.phase!=='open') fail('BUSY',r.phase==='react'?'Someone got there first. You can still react!':'Wait for the next opening.');
  if(r.lastActorId===p.id && now<r.priorityUntil && r.players.filter(x=>x.connected&&!x.muted&&!x.isBot).length>1) fail('COOLDOWN','Give someone else a shot — your opening returns in a few seconds.');
  const dynamic=itemPlan(r,p,text);
  const intent=dynamic?(dynamic.verb==='rest'?'heal':'world'):classify(text);
  if(p.hp<=0 && intent!=='heal') fail('KNOCKED_OUT','You’re on the floor. Rest, eat, or drink to get back up.');
  const e=event(r,'declaration',text,now,{playerId:p.id,name:p.name});
  r.round++; r.turn={id:uid(),seq:e.id,actorId:p.id,action:text,intent,target:targetFor(r,p,text),at:now,
    deadline:now+r.reactionMs,reactions:[]};
  if(dynamic){r.turn.worldAction=true;r.turn.worldLocked=dynamic.verb!=='unsupported'&&!dynamic.unresolvedTarget;if(dynamic.unresolvedTarget)r.turn.worldPendingVerb=dynamic.verb;const key=dynamic.targetId||dynamic.itemId||dynamic.sourceIds?.[0];const item=r.world.expedition.items[key]||r.world.expedition.creatures?.[key];r.turn.target={kind:'world',entityId:item?.id,name:item?.name||dynamic.destination||'materials',position:item?.ownerId?[480,335]:item?.position||[480,490]};}
  r.phase='react'; r.deadline=r.turn.deadline; r.result=null; p.status='committed';p.cover=false;
  const ack={ok:true,accepted:true,kind:'action',seq:e.id,at:now,turnId:r.turn.id};
  r.requests[key]=ack;
  const keys=Object.keys(r.requests); if(keys.length>1200) keys.slice(0,300).forEach(k=>delete r.requests[k]);
  touch(r,now); return ack;
}
const randomSources=new WeakMap();
export function withGameRng(room,rng,run){rng.restore(room.seed);randomSources.set(room,rng);try{return run();}finally{room.seed=rng.snapshot();randomSources.delete(room);}}
function random(r) { const rng=randomSources.get(r)||new Rng(r.seed),value=rng.next();r.seed=rng.snapshot();return value; }
const pick=(r,a)=>a[Math.floor(random(r)*a.length)];
const hurt=(p,n)=>{const before=p.hp;p.hp=clamp(p.hp-n,0,p.maxHp);return before-p.hp;};
const heal=(p,n)=>{const before=p.hp;p.hp=clamp(p.hp+n,0,p.maxHp);return p.hp-before;};
function resolve(r,now) {
  const t=r.turn,p=r.players.find(x=>x.id===t.actorId); if(!p) return;
  if(t.ai?.status==='thinking')t.ai={...t.ai,status:'fallback',reason:'The turn resolved before local AI finished. Game rules were used.'};
  const sorted=[...t.reactions].sort((a,b)=>a.id-b.id);
  const helpers=sorted.filter(x=>x.kind==='assist'||(x.kind==='custom'&&!/\b(stop|prevent|block|intervene)\b/i.test(x.text)));
  const blockers=sorted.filter(x=>x.kind==='intervene'||(x.kind==='custom'&&/\b(stop|prevent|block|intervene)\b/i.test(x.text)));
  const hostile=t.worldAction||['attack','steal','magic','break'].includes(t.intent);
  const dynamic=t.worldAction?(t.worldProposal?(planWorldProposal(r,p,t.worldProposal)||{verb:'unsupported',error:'The selected action is no longer available.',automatic:true,dc:0,ability:'Interaction'}):itemPlan(r,p,t.rulesText||t.action)):null;
  if(dynamic&&t.worldBlueprint)Object.assign(dynamic,t.worldBlueprint);
  const check=dynamic||environmentCheck(r.world,t.target,t.intent,t.rulesText||t.action);
  const automatic=!!check?.automatic;
  const situation=[];
  let advantage=check?.advantage||0;
  if(t.intent==='sneak'&&r.world.bartender==='friendly'){advantage=1;situation.push('Marnie covers for you');}
  if(t.intent==='flee'&&r.world.guards==='distracted'){advantage=1;situation.push('Guards distracted');}
  if(t.intent==='flee'&&['open','broken'].includes(r.world.props?.door)){advantage=1;situation.push('Exit cleared');}
  if(t.intent==='steal'&&r.world.guards==='distracted'){advantage=1;situation.push('Guards distracted');}
  if(['sneak','steal'].includes(t.intent)&&Object.entries(r.world.objects||{}).filter(([id,s])=>OBJECTS[id]?.lit&&s.lit===false).length>=3){advantage=1;situation.push('Room dimmed');}
  if(['dance','flee','attack','break'].includes(t.intent)&&Object.values(r.world.objects||{}).some(s=>s.spilled)){advantage=-1;situation.push('Slippery floor');}
  if(p.injuries?.length&&check?.ability==='Athletics'){advantage=-1;situation.push('Injured');}
  const dice=automatic?[]:[1+Math.floor(random(r)*20)];
  if(!automatic&&advantage)dice.push(1+Math.floor(random(r)*20));
  let roll=automatic?0:advantage?selectD20(dice,advantage):dice[0],rerolled=null;
  if(!automatic&&p.perk==='lucky'&&roll<=3) {rerolled=roll;roll=1+Math.floor(random(r)*20);}
  const skill=ROLES[p.role].skills.includes(t.intent)||(['interact','world'].includes(t.intent)&&((check?.ability==='Athletics'&&p.role==='knight')||(check?.ability==='Arcana'&&p.role==='wizard')||(check?.ability==='Sleight of hand'&&p.role==='rogue')))?3:0;
  const charm=p.perk==='charming'&&['social','dance'].includes(t.intent)?2:0;
  const assistance=Math.min(4,helpers.length),interference=hostile?Math.min(4,blockers.length):0;
  const training=Math.min(3,Math.floor((p.level||1)/3));
  const modifier=skill+charm+assistance-interference+training;
  const dc=automatic?0:check?.dc??({heal:6,flee:r.quest.crown?12:8,inspect:9,social:10,dance:9,sneak:10,steal:13,magic:12,attack:12,break:11,weird:10,interact:10})[t.intent];
  const critical=roll===20;let success=automatic||critical||(roll!==1&&roll+modifier>=dc);
  const effects=[],changes=[]; let narration='',unsupported=false;
  const add=(s)=>changes.push(s);
  const fx=(verb,target=t.target.kind)=>effects.push({verb,actorId:p.id,target,targetId:t.target.id||null});
  const damage=(who,n)=>{let d=hurt(who,n);if(d)add(`${who.name} −${d} HP`);};
  const recovery=(who,n)=>{let h=heal(who,n);if(h)add(`${who.name} +${h} HP`);};
  p.actions++; r.stats.actions++; if(!automatic)r.stats.rolls++; if(critical) p.nat20++;
  const target=r.players.find(x=>x.id===t.target.id);
  const damageNpc=n=>{if(!['guard','bartender','goblin'].includes(t.target.kind))return;const npcs=r.world.npcs||={},npc=npcs[t.target.kind]||={hp:8,maxHp:8};npc.hp=Math.max(0,npc.hp-n);add(`${t.target.name} ${npc.hp}/8 HP`);if(!npc.hp){npc.status='knocked out';add(`${t.target.name} KNOCKED OUT`);if(t.target.kind==='guard')r.world.guards='distracted';}};
  const props=r.world.props||(r.world.props={rug:true});
  const environmental=dynamic?null:interactEnvironment(r.world,t.target,t.intent,success,p,{text:t.rulesText||t.action});
  if(dynamic){const outcome=resolveItem(r,p,dynamic,success);success=outcome.success;unsupported=outcome.blocked;narration=outcome.text;if(outcome.change)add(outcome.change);fx(dynamic.verb==='break'||dynamic.verb==='use'?'impact':'inspect');}
  else if(environmental){success=environmental.success;narration=environmental.text;if(environmental.change)add(environmental.change);fx(({break:'impact',ignite:'fire',extinguish:'smoke',take:'steal',repair:'hearts',push:'impact'})[environmental.verb]||'inspect');r.chaos+=environmental.chaos;if(environmental.damage)damage(p,environmental.damage);if(environmental.cover){p.status='hiding';p.cover=true;}}
  else switch(t.intent) {
    case 'heal':
      recovery(target||p,success?4:2); fx('hearts',target?'player':'self');
      narration=success?pick(r,[`${p.name} discovers the ancient healing art of sitting down. It works.`,`${p.name} administers tavern medicine. Marnie refuses to list the ingredients.`,`${p.name} takes a well-earned breather. Even the guards respect snack time.`]):`${p.name} drops half the remedy. The remaining half does its best.`;
      r.chaos=Math.max(0,r.chaos-1); break;
    case 'attack':
      fx('melee'); r.chaos+=success?2:1;
      if(success) {if(target)damage(target,critical?3:2);if(['guard','bartender','goblin'].includes(t.target.kind)){const npcs=r.world.npcs||=( {}),npc=npcs[t.target.kind]||={hp:8,maxHp:8};npc.hp=Math.max(0,npc.hp-(critical?4:2));add(`${t.target.name} ${npc.hp}/8 HP`);if(!npc.hp){npc.status='knocked out';add(`${t.target.name} KNOCKED OUT`);if(t.target.kind==='guard')r.world.guards='distracted';}}narration=pick(r,[`${p.name} lands it. ${t.target.name} looks personally offended by the physics.`,`${p.name} connects. A barstool rattles.`,`${p.name} wins this exchange. The goblin starts playing fight music.`]);}
      else {damage(p,2);fx('hit','self');narration=pick(r,[`${p.name} commits fully. Unfortunately, so does the floor.`,`${p.name} misses. Captain Brick calls it “a useful demonstration.”`,`${p.name} swings with confidence and lands with a very different sound.`]);}
      break;
    case 'steal':
      fx('steal'); r.chaos+=2;
      if(t.target.kind==='rug') {
        if(objectState(r.world,'rug').condition==='taken') {
          success=false;unsupported=true;
          narration=`${p.name} reaches for the rug, but the floor is bare. Someone already made off with it.`;
          add('The rug is already gone');
        } else if(success) {
          props.rug=false;(r.world.objects||={}).rug={...objectState(r.world,'rug'),condition:'taken'};p.inventory.push('The Tavern Rug');add('RUG STOLEN');
          narration=`${p.name} pulls the tavern rug free and rolls it under one arm. Bare floorboards remain where it stood.`;
        } else {
          damage(p,1);narration=`${p.name} gets one corner up. The rug snaps back and the tavern keeps its footing.`;fx('hit','self');
        }
      } else if(success) {
        if(r.quest.clues>=3&&!r.quest.crown&&['chest','bartender','room'].includes(t.target.kind)) {
          r.quest.crown=true;r.quest.carrierId=p.id;p.inventory.push('The Duke’s Crown');p.score+=5;add('THE CROWN IS YOURS');
          narration=`${p.name} lifts the ridiculous golden crown. It jingles like cutlery. The guards have definitely noticed. Find a way out!`;fx('crown');
        } else {p.gold+=2;add(`${p.name} +2 coins`);narration=pick(r,[`${p.name} pockets two coins and a deeply unnecessary amount of confidence.`,`${p.name} has very quick hands. The room suddenly checks its pockets.`,`${p.name} makes a clean getaway. The stolen spoons are, technically, treasure.`]);}
      } else {damage(p,1);narration=`${p.name} gets caught reaching. Marnie produces a wooden spoon with disturbing speed.`;fx('hit','self');}
      break;
    case 'magic':
      fx('spell');r.chaos+=2;
      if(success) {const offensive=/\b(fire|fireball|lightning|bolt|blast|zap|freeze)\b/i.test(t.rulesText||t.action);narration=offensive?`${p.name}'s spell strikes ${t.target.name}. The impact leaves a very real mark.`:pick(r,[`${p.name} bends reality just enough to make everyone extremely uncomfortable.`,`${p.name} casts it. The goblin briefly glows. He charges extra for that.`,`${p.name} makes magic happen. Three guards immediately blame each other.`]);if(offensive){if(target)damage(target,critical?4:2);else damageNpc(critical?4:2);}else if(target)recovery(target,1);if(t.target.kind==='guard'){r.world.guards='distracted';add('GUARDS DISTRACTED');}}
      else {damage(p,2);fx('fire','self');narration=pick(r,[`${p.name} summons a very small problem with very large eyebrows. It explodes.`,`${p.name} gets the spell mostly right. “Mostly” is doing a lot of work here.`,`${p.name} accidentally enchants their own boots. The boots are furious.`]);}
      break;
    case 'break':
      fx('impact');r.chaos+=2;
      if(success) {narration=`${p.name} makes an entrance. Or an exit. The building no longer has an opinion.`;p.gold++;add(`${p.name} +1 coin`);}
      else {damage(p,2);narration=`${p.name} tests the tavern’s structural integrity. The tavern wins.`;fx('hit','self');} break;
    case 'flee':
      fx('flee','door');
      if(success&&r.quest.crown) {r.quest.escaped=true;r.quest.escapedBy=p.id;p.score+=5;narration=`${p.name} kicks open the door. The whole party spills into the night with the crown, the goblin, and a truly impressive bar tab. HEIST COMPLETE.`;add('PARTY VICTORY');}
      else if(success) {p.status='hiding';r.chaos=Math.max(0,r.chaos-2);narration=`${p.name} escapes to the doorway. Excellent survival instincts. Unfortunately, the crown is still inside.`;add('Chaos −2');}
      else {damage(p,1);narration=`${p.name} makes for the door. Captain Brick is already standing in it. Awkward.`;} break;
    case 'dance':
      fx('dance');
      if(success) {r.world.guards='distracted';r.chaos=Math.max(0,r.chaos-2);p.gold++;add(`${p.name} +1 coin`);add('GUARDS DISTRACTED');narration=pick(r,[`${p.name} steals the show. One guard forgets why he works here.`,`${p.name} performs. The goblin sheds a single professional tear.`,`${p.name} gets the whole tavern involved. Captain Brick has surprisingly good rhythm.`]);}
      else {r.chaos++;narration=`${p.name} puts on a show. The silence afterward is somehow louder than the music.`;} break;
    case 'social':
      fx('hearts');
      if(success) {r.chaos=Math.max(0,r.chaos-1);r.world.bartender='friendly';if(t.target.kind==='guard'){r.world.guards='distracted';add('GUARDS DISTRACTED');}narration=pick(r,[`${p.name} talks their way into everyone’s good graces. Suspiciously effective.`,`${p.name} says exactly the right thing. Marnie pretends she isn’t impressed.`,`${p.name} wins the room over. The guards lower their guard, which feels redundant.`]);}
      else {narration=`${p.name} gives it a shot. Marnie raises one eyebrow and the price of everything.`;r.chaos++;} break;
    case 'inspect':
      fx('inspect');
      narration=success?`${p.name} investigates. Beneath the spilled ale and bad decisions, an actual clue turns up.`:`${p.name} searches thoroughly. This would be more useful if the barrel wasn’t just a barrel.`;break;
    case 'sneak':
      fx('sneak');
      if(success) {r.chaos=Math.max(0,r.chaos-1);narration=`${p.name} slips past unnoticed. The goblin narrates it anyway. Very quietly.`;}
      else {narration=`${p.name} steps on the one floorboard with an opinion. Everyone looks over.`;r.chaos++;}break;
    default:
      fx('weird');
      success=false;unsupported=true;narration=`${p.name} tries “${t.action}”. This attempt is not supported yet. Name a person or object and try inspecting, moving, taking, breaking, talking, hiding, or casting a spell.`;break;
  }
  for(const change of advanceWorld(r))add(change);
  if(success&&!automatic&&!environmental?.blocked)p.score+=critical?5:2;
  if(currentLocation(r)==='tavern')for(const change of advanceEnvironment(r.world))add(change);
  if(Object.values(r.world.objects||{}).some(s=>s.condition==='burning'))r.chaos++;
  // Physical hazards are persisted; risky stunts near spilled ale or glass have consequences.
  if(!success&&['dance','flee','attack','break'].includes(t.intent)&&Object.entries(r.world.objects||{}).some(([id,s])=>s.spilled||(OBJECTS[id]?.material==='glass'&&s.condition==='broken'))){damage(p,1);add('HAZARD: slippery ale or broken glass');}
  if(success && (!environmental||(t.intent==='inspect'&&t.target.kind==='counter')) && !r.quest.crown && ['inspect','social','dance','sneak','weird','magic'].includes(t.intent)) {
    if(r.quest.clues<3) {
      r.quest.clues++; const facts=['Marnie saw the Duke hide something behind the bar.','The goblin’s song mentions a chest and a golden hat.','The crown is in the chest behind the bar. Steal it!'];
      const fact=facts[r.quest.clues-1];r.world.facts.push(fact);add(`Clue ${r.quest.clues}/3`);narration+=' '+fact;
    }
  }
  for(const react of sorted) {
    const rp=r.players.find(x=>x.id===react.playerId);if(!rp)continue;
    if(react.kind==='flee') {rp.status='hiding';effects.push({verb:'flee',actorId:rp.id,target:'door'});continue;}
    rp.assists++; if(success)rp.score++;
    if(react.kind==='intervene') r.chaos=Math.max(0,r.chaos-1);
    if(react.kind==='custom'&&classify(react.text)==='heal') recovery(p,1);
  }
  if(helpers.length) narration+=` ${helpers.length===1?r.players.find(x=>x.id===helpers[0].playerId)?.name:helpers.length+' accomplices'} ${helpers.length===1?'helps':'help'} sell it.`;
  if(blockers.length) narration+=` ${blockers.length===1?'One voice of reason tries':'The voices of reason try'} to rein things in.`;
  r.chaos=clamp(r.chaos,0,10);
  if(currentLocation(r)==='tavern'&&r.chaos>=10&&!r.quest.escaped) {
    const exposed=r.players.filter(x=>x.connected&&x.status!=='hiding');
    for(const rp of exposed) hurt(rp,1);
    r.chaos=5;r.world.guards='alert';add('Guard sweep: exposed players −1 HP');
    narration+=' The guards sweep the room. Anyone who stayed in the open takes a hit.';effects.push({verb:'alarm',actorId:p.id,target:'guard'});
  }
  for(const rp of r.players){const level=Math.min(20,1+Math.floor(rp.score/20));if(level>(rp.level||1)){const gained=level-(rp.level||1);rp.maxHp+=gained*2;rp.hp=Math.min(rp.maxHp,rp.hp+gained*2);add(rp.name+' LEVEL '+level);}rp.level=level;}
  for(const rp of r.players) if(rp.hp===0)rp.status='knocked out';
  if(r.quest.crown)r.world.guards='searching';
  r.lastActorId=p.id;r.priorityUntil=now+12500;
  r.result={id:t.id,playerId:p.id,name:p.name,action:t.action,intent:t.intent,target:t.target,ai:t.ai?structuredClone(t.ai):null,
    roll,rerolled,modifier,skill,charm,assistance,interference,total:automatic?0:roll+modifier,dc,success,critical:critical&&success,automatic,dice,advantage,situation,check:check?.ability||t.intent,blocked:!!environmental?.blocked||unsupported,
    narration,changes,effects,reactions:sorted.map(x=>({playerId:x.playerId,kind:x.kind,text:x.text,seq:x.id})),at:now};
  r.phase='reveal';r.deadline=now+6500;
  recordDMMemory(r);
  event(r,'outcome',narration,now,{playerId:p.id,success,roll,turnId:t.id});touch(r,now);
}
export function advance(r,now=Date.now()) {
  if(r.paused)return false;
  if(r.phase==='react'&&now>=r.deadline) {resolve(r,now);return true;}
  if(r.phase==='reveal'&&now>=r.deadline) {
    r.phase=r.quest.escaped&&!r.world.expedition?.campaign?.continuing?'ended':'open';r.deadline=0;
    for(const p of r.players)if(p.hp>0)p.status=p.cover?'hiding':'ready';
    touch(r,now);return true;
  }
  return false;
}
export function hostCommand(r,command,now=Date.now()) {
  if(command.type==='continueCampaign'){ensureItems(r).campaign.heistCompleted=r.quest.escaped;ensureItems(r).campaign.continuing=true;r.phase='open';r.quest.escaped=false;r.deadline=0;event(r,'story','The crown job was only the beginning. The road beyond the tavern is open.',now);touch(r,now);return;}
  if(command.type==='start')return startGame(r,now);
  if(command.type==='pause') {
    if(!r.paused) {r.remaining=Math.max(0,r.deadline-now);r.paused=true;} else {r.paused=false;if(r.deadline){r.deadline=now+(r.remaining||0);if(r.turn&&r.phase==='react')r.turn.deadline=r.deadline;}}
  } else if(command.type==='resolve') {
    if(r.phase!=='react'&&r.phase!=='reveal')fail('PHASE','There is no timer to skip.');
    r.deadline=now;if(r.turn)r.turn.deadline=now;if(!r.paused)advance(r,now);
  } else if(command.type==='mute') {
    const p=r.players.find(x=>x.id===command.playerId);if(!p)fail('PLAYER','No such player.');p.muted=!p.muted;
  } else if(command.type==='resetScene') {
    r.phase='open';r.turn=null;r.result=null;r.deadline=0;r.chaos=0;r.paused=false;
    r.world.props={rug:true};r.world.objects={};r.world.npcs={};r.world.guards='bored';
    for(const p of r.players){p.hp=Math.max(p.hp,4);p.status='ready';p.cover=false;}
    event(r,'story','Marnie claps her hands. “Everyone breathe. We’re starting that bit again.”',now);
  } else if(command.type==='redact') {
    const e=r.events.find(x=>x.id===command.eventId);if(e)e.text='[Hidden by the host]';
    if(r.turn){r.turn.action='[Hidden by the host]';r.turn.reactions.forEach(x=>x.text='[Hidden by the host]');}
    if(r.result){redactDMMemory(r,r.result.id);r.result.action='[Hidden by the host]';r.result.narration='The host moved this scene along.';r.result.story={status:'fallback'};r.result.reactions.forEach(x=>x.text='[Hidden by the host]');}
    const turnId=e?.turnId||(e?.type==='declaration'?r.events.find(x=>x.type==='outcome'&&x.playerId===e.playerId&&x.at>=e.at)?.turnId:null);
    if(turnId){redactDMMemory(r,turnId);for(const row of r.events)if(row.turnId===turnId)row.text='[Hidden by the host]';}
  } else if(command.type==='newStory') {
    const fresh=createRoom({code:r.code,seed:r.seed,now,reactionMs:r.reactionMs});
    const players=r.players.map(p=>({...p,hp:p.maxHp,gold:3,inventory:['Bent spoon'],actions:0,assists:0,score:0,nat20:0,status:'ready',cover:false}));
    Object.assign(r,fresh,{players,seq:r.seq,revision:r.revision,requests:r.requests});
    event(r,'story','A fresh night. The same terrible judgment.',now);
  } else if(command.type==='window') {
    r.reactionMs=clamp(Number(command.ms)||8000,4000,12000);
  } else fail('COMMAND','Unknown host action.');
  touch(r,now);
}
