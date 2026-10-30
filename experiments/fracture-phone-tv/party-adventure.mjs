/** Reversible, server-owned game-night objective using only confirmed Fracture
 * actions and original Chaos crafting outcomes. No native rewards, world edits,
 * invented campaign maps or legacy Chaos save migration.
 */
import {creativeAttempt} from './chaos-world.mjs';
export const ADVENTURE_ID='refuge-trial-v1';
const REFUGE='The Refuge',WOODS='Glitch Woods';
const clean=s=>String(s||'').slice(0,32);
export function startAdventure(now=Date.now()){
 return {version:1,id:ADVENTURE_ID,status:'active',startedAt:now,completedAt:null,
  npc:null,proof:null,woods:null,returned:null,seen:[]};
}
export function receiptEvidence(receipt,attempt,actor,player){
 if(!receipt||!attempt||!actor?.ready||typeof receipt.id!=='string'||!receipt.id||!player)return null;
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
export function zoneEvidence(actor,player){
 if(!actor?.ready||actor.dead||!player||![REFUGE,WOODS].includes(actor.zone))return null;
 return {kind:'zone',zone:actor.zone,player:clean(player)};
}
export function advanceAdventure(adventure,evidence,now=Date.now()){
 if(!adventure||adventure.id!==ADVENTURE_ID||adventure.version!==1||adventure.status!=='active'||!evidence)return null;
 const seen=adventure.seen||[];
 if(evidence.id&&seen.includes(evidence.id))return null;
 let change=null;
 const credit={player:clean(evidence.player),at:now};
 if(evidence.kind==='npc'&&!adventure.npc){
  adventure.npc=credit;change='Spoke to a real local NPC.';
 }else if(['combat','craft'].includes(evidence.kind)&&!adventure.proof){
  adventure.proof={...credit,route:evidence.kind};
  change=evidence.kind==='combat'?'Defeated a real Fracture monster.':'Successfully crafted an original Chaos item.';
 }else if(evidence.kind==='zone'&&evidence.zone===WOODS&&adventure.npc&&adventure.proof&&!adventure.woods){
  adventure.woods=credit;change='Reached Glitch Woods after meeting the trial requirements.';
 }else if(evidence.kind==='zone'&&evidence.zone===REFUGE&&adventure.woods&&!adventure.returned){
  adventure.returned=credit;adventure.status='completed';adventure.completedAt=now;
  change='Returned to The Refuge. The Refuge Trial is complete — no native rewards were invented.';
 }
 if(!change)return null;
 if(evidence.id)adventure.seen=[...seen,evidence.id].slice(-32);
 return {change,completed:adventure.status==='completed'};
}
export function adventureView(a){
 if(!a)return null;
 if(a.id!==ADVENTURE_ID||a.version!==1)return {title:'Unknown adventure save',status:'unsupported',steps:[],summary:'Existing adventure data was preserved; this version cannot interpret it.'};
 const steps=[
  {label:'Talk to a real NPC',done:!!a.npc,by:a.npc?.player||null},
  {label:'Defeat a monster OR craft an item',done:!!a.proof,by:a.proof?.player||null},
  {label:'Enter Glitch Woods',done:!!a.woods,by:a.woods?.player||null},
  {label:'Return to The Refuge',done:!!a.returned,by:a.returned?.player||null}
 ];
 return {title:'The Refuge Trial',status:a.status,route:a.proof?.route||null,steps,
  summary:a.status==='completed'?'The party completed the trial. No extra loot or XP was granted.':
  'Work together: meet a local, fight OR craft, visit the woods, and return. Real engine actions only.'};
}
