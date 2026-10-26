import {OBJECTS} from './environment.js';
export const AI_VERBS=['inspect','take','break','open','close','push','ignite','extinguish','repair','hide','climb','pour','attack','social','heal','dance','sneak','flee','magic','unsupported'];
const names={guard:'Captain Brick',bartender:'Marnie',goblin:'the fiddler',room:'the tavern'};
const mapping={inspect:['inspect','Inspect'],take:['steal','Steal'],break:['break','Smash'],open:['interact','Open'],close:['interact','Close'],push:['interact','Push'],ignite:['interact','Ignite'],extinguish:['interact','Extinguish'],repair:['interact','Repair'],hide:['sneak','Hide behind'],climb:['interact','Climb onto'],pour:['interact','Spill'],attack:['attack','Attack'],social:['social','Talk to'],heal:['heal','Heal'],dance:['dance','Dance for'],sneak:['sneak','Sneak past'],flee:['flee','Flee through'],magic:['magic','Cast a spell at'],unsupported:['weird','Unsupported attempt at']};
export function validateAIPlan(raw,room,actorId){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['verb','target','summary'].includes(k)))throw new Error('Invalid interpretation fields');
  if(!AI_VERBS.includes(raw.verb)||typeof raw.target!=='string'||typeof raw.summary!=='string'||raw.summary.length>160)throw new Error('Invalid interpretation');
  const player=room.players.find(p=>p.id===raw.target||raw.target==='self'&&p.id===actorId);
  let target;if(player)target={kind:'player',id:player.id,name:player.name};
  else if(Object.hasOwn(OBJECTS,raw.target))target={kind:raw.target,name:OBJECTS[raw.target].name};
  else if(Object.hasOwn(names,raw.target))target={kind:raw.target,name:names[raw.target]};
  else throw new Error('Unknown interpretation target');
  let [intent,verb]=mapping[raw.verb];
  if(raw.verb==='ignite'&&['guard','bartender','goblin','player'].includes(target.kind)){intent='magic';verb='Cast fire at';}
  if(raw.verb==='flee'&&target.kind!=='door')throw new Error('Escape must target the door');
  if(raw.verb==='heal'&&target.kind!=='player')throw new Error('Healing must target a character');
  return {verb:raw.verb,intent,target,rulesText:`${verb} ${target.name}`,summary:raw.summary.replace(/[\u0000-\u001f\u007f]/g,' ').trim()};
}
// Called only on the authoritative server. Client submissions cannot contain a plan.
export function applyAIPlan(room,turnId,raw,model,now=Date.now()){
  const t=room.turn;
  if(room.phase!=='react'||room.paused||!t||t.worldAction||t.id!==turnId||now>=t.deadline-800)return false;
  const plan=validateAIPlan(raw,room,t.actorId);
  const actor=room.players.find(p=>p.id===t.actorId);
  if(actor.hp<=0&&plan.intent!=='heal')throw new Error('Knocked out characters must recover');
  t.intent=plan.intent;t.target=plan.target;t.rulesText=plan.rulesText;
  t.ai={status:'applied',model,summary:plan.summary,verb:plan.verb};
  room.revision++;room.updatedAt=now;return true;
}
