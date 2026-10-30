/** Reversible, server-owned game-night objective using only confirmed Fracture
 * actions and original Chaos crafting outcomes. No native rewards, world edits,
 * invented campaign maps or legacy Chaos save migration.
 */
import {creativeAttempt} from './chaos-world.mjs';
import {proposeRally,voteRally,settleRally,rallyView} from './party-rally.mjs';
export const ADVENTURE_ID='refuge-trial-v1';
const REFUGE='The Refuge',WOODS='Glitch Woods';
const clean=s=>String(s||'').slice(0,32);
export function startAdventure(now=Date.now(),run=1,instanceId=null){
 return {version:1,id:ADVENTURE_ID,status:'active',startedAt:now,completedAt:null,
  run,instanceId,npc:null,proof:null,choice:null,woods:null,returned:null,visitors:[],seen:[]};
}
/** An explicit host replay preserves a compact, private history of completed
 * runs. Never erase an active/unknown-version save or carry old objectives into
 * a new run. The instance ID binds delayed native receipts to their own run.
 */
export function replayAdventure(current,history=[],now=Date.now(),instanceId){
 if(!current||current.id!==ADVENTURE_ID||current.version!==1||current.status!=='completed')
  throw Error('Only a completed, supported trial can be replayed.');
 if(!Array.isArray(history))throw Error('Adventure history is not readable; refusing to replace it.');
 if(typeof instanceId!=='string'||!/^[a-f0-9-]{36}$/i.test(instanceId))
  throw Error('A new private adventure instance ID is required.');
 const run=Number.isSafeInteger(current.run)&&current.run>0?current.run:1;
 if(run>=1000000)throw Error('Adventure run limit reached; refusing to overwrite history.');
 const previous={run,completedAt:current.completedAt,route:current.proof?.route||null,choice:current.choice?.route||null,
  steps:adventureView(current).steps.map(s=>({label:s.label,done:s.done,by:s.by}))};
 return {adventure:startAdventure(now,run+1,instanceId),
  history:[...history,previous].slice(-10)};
}
export function receiptEvidence(receipt,attempt,actor,player,activeInstanceId=null){
 if(!receipt||!attempt||!actor?.ready||typeof receipt.id!=='string'||!receipt.id||!player)return null;
 // An old native action can finish after the host starts another trial.
 // Its outcome remains real, but must not advance the new run.
 if(activeInstanceId&&attempt.adventureInstance!==activeInstanceId)return null;
 const base={id:receipt.id,player:clean(player)};
 if(attempt.verb==='talk'&&receipt.status==='succeeded')
  return {...base,kind:'npc'};
 // A phone attack request, a missed hit, or an AI story is NOT a kill.
 if(attempt.verb==='attack'&&receipt.status==='started'&&receipt.combat?.dead===true&&
    Number.isFinite(receipt.combat.before)&&receipt.combat.before>0&&receipt.combat.after===0)
  return {...base,kind:'combat'};
 // Reuse the ORIGINAL Chaos parser and its server-authored canonical outcome.
 if(attempt.verb==='creative'&&receipt.status==='succeeded'&&receipt.event?.outcome==='success'&&
    creativeAttempt(receipt.event.attempt)?.verb==='craft')
  return {...base,kind:'craft'};
 return null;
}
export function zoneEvidence(actor,player,participant){
 if(!actor?.ready||actor.dead||!player||typeof participant!=='string'||!participant||![REFUGE,WOODS].includes(actor.zone))return null;
 return {kind:'zone',zone:actor.zone,player:clean(player),participant};
}
export function advanceAdventure(adventure,evidence,now=Date.now()){
 if(!adventure||adventure.id!==ADVENTURE_ID||adventure.version!==1||adventure.status!=='active'||!evidence)return null;
 const seen=adventure.seen||[];
 if(evidence.id&&seen.includes(evidence.id))return null;
 let change=null;
 const credit={player:clean(evidence.player),at:now};
 if(evidence.kind==='npc'&&!adventure.npc){
  adventure.npc=credit;change='Spoke to a real local NPC.';
 }else if(['combat','craft'].includes(evidence.kind)&&!adventure.proof&&(!adventure.choice||adventure.choice.route===evidence.kind)){
  adventure.proof={...credit,route:evidence.kind};
  change=evidence.kind==='combat'?'Defeated a real Fracture monster.':'Successfully crafted an original Chaos item.';
 }else if(evidence.kind==='zone'&&evidence.zone===WOODS&&adventure.npc&&adventure.proof&&
   evidence.participant&&!(adventure.visitors||[]).some(v=>v.participant===evidence.participant)){
  adventure.visitors=[...(adventure.visitors||[]),{...credit,participant:evidence.participant}].slice(-20);
  if(!adventure.woods)adventure.woods=credit;
  change='A party member reached Glitch Woods after meeting the trial requirements.';
 }else if(evidence.kind==='zone'&&evidence.zone===REFUGE&&adventure.woods&&!adventure.returned&&
   (adventure.visitors||[]).some(v=>v.participant===evidence.participant)){
  // A person who actually reached the woods must return. A teammate who
  // never left town cannot finish the adventure by polling their position.
  adventure.returned=credit;adventure.status='completed';adventure.completedAt=now;
  change='Home again! The party has completed The Refuge Trial. Keep exploring or start another trial.';
 }
 if(!change)return null;
 if(evidence.id)adventure.seen=[...seen,evidence.id].slice(-32);
 return {change,completed:adventure.status==='completed'};
}
export function adventureView(a,{allowCraft=true}={}){
 if(!a)return null;
 if(a.id!==ADVENTURE_ID||a.version!==1)return {title:'Unknown adventure save',status:'unsupported',steps:[],summary:'Existing adventure data was preserved; this version cannot interpret it.'};
 const steps=[
  {label:'Talk to a real NPC',done:!!a.npc,by:a.npc?.player||null},
  {label:a.choice?.route==='combat'?'Defeat a real monster (party choice)':a.choice?.route==='craft'?(allowCraft?'Craft an item (party choice)':'Legacy craft choice unavailable in native-only mode'):allowCraft?'Defeat a monster OR craft an item':'Defeat a real monster',done:!!a.proof,by:a.proof?.player||null},
  {label:'Enter Glitch Woods',done:!!a.woods,by:a.woods?.player||null},
  {label:'Return to The Refuge',done:!!a.returned,by:a.returned?.player||null}
 ];
 return {title:'The Refuge Trial',status:a.status,run:a.run||1,route:a.proof?.route||null,choice:a.choice?.route||null,steps,
  summary:a.status==='completed'?'Home again! The party has completed the trial. Keep exploring, or start another adventure.':
  'Work together: meet a local, '+(a.choice?.route==='combat'?'defeat a monster':a.choice?.route==='craft'?(allowCraft?'craft an item':'legacy craft vote is unavailable in native-only mode'):allowCraft?'fight OR craft':'defeat a monster')+', visit the woods, and return. Everyone can help, explore, or cause a little trouble along the way.'};
}

/** Optional, durable majority story decision. Reuses the same frozen-electorate
 * 10-second vote and strict-majority math as native travel. This only gates
 * the independent Refuge Trial proof, never native combat, items or quests.
 */
export function proposeTrialChoice(adventure,actors,proposer,route,now,id){
 if(!adventure||adventure.id!==ADVENTURE_ID||adventure.version!==1||adventure.status!=='active'||!adventure.npc||adventure.proof||adventure.choice)
  throw Error('Meet a local before voting; a completed or chosen proof cannot be changed.');
 if(!['combat','craft'].includes(route))throw Error('Choose fight or craft.');
 const vote=proposeRally(actors,proposer,now,id);
 if(vote.zone!==REFUGE)throw Error('The party must choose together in The Refuge.');
 return {...vote,kind:'trial-choice',route,instanceId:adventure.instanceId};
}
export function voteTrialChoice(vote,token,yes,now){return voteRally(vote,token,yes,now);}
export function settleTrialChoice(vote,adventure,now,by){
 if(!vote||vote.kind!=='trial-choice'||vote.dispatched)return null;
 const status=settleRally(vote,now);
 if(status==='pending')return null;
 vote.dispatched=true;
 // Never let a delayed vote change a run that has moved on or been replayed.
 if(status!=='approved'||!adventure||adventure.id!==ADVENTURE_ID||adventure.version!==1||adventure.status!=='active'||
    adventure.instanceId!==vote.instanceId||!adventure.npc||adventure.proof||adventure.choice){
  if(status==='approved')vote.status='declined';
  return {approved:false};
 }
 adventure.choice={route:vote.route,by:String(by||'Party member').slice(0,32),at:now};
 return {approved:true,route:vote.route};
}
export function trialChoiceView(vote,token,now){
 const v=rallyView(vote,token,now);
 return v?{...v,route:vote.route}:null;
}
