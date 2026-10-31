// @ts-nocheck
/** Chaos-owned shared pacing. Native execution and collision remain authoritative. */
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const PACING_TIMES=Object.freeze({planning:30000,preparation:7000,action:5000,recap:4000,travel:60000});
export function createSimulationClock({file=null,wall=()=>Date.now()}={}){
 let offset=0,pausedAt=null,recovered=false;
 if(file&&fs.existsSync(file)){
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));
  if(saved.version!==1||!Number.isFinite(saved.offset)||saved.offset<0||saved.pausedAt!==null&&!Number.isFinite(saved.pausedAt))throw Error('Unsupported pacing clock; saved data preserved');
  recovered=saved.pausedAt!==null;
  offset=saved.offset+(saved.pausedAt===null?0:Math.max(0,wall()-saved.pausedAt));
 }
 function save(){if(!file)return;fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file+'.tmp',JSON.stringify({version:1,offset,pausedAt}),{mode:0o600});fs.renameSync(file+'.tmp',file);}
 if(recovered)save(); // Commit the resumed offset so another restart cannot rewind simulation time.
 return {now:()=>wall()-offset-(pausedAt===null?0:Math.max(0,wall()-pausedAt)),get paused(){return pausedAt!==null;},
  pause(){if(pausedAt!==null)return;pausedAt=wall();save();},resume(){if(pausedAt===null)return;offset+=Math.max(0,wall()-pausedAt);pausedAt=null;save();}};
}
export function createPartyPacing({world,clock,sceneAt,wall=()=>Date.now(),times=PACING_TIMES,onChange=()=>{}}){
 const instanceId=randomUUID();
 let enabled=false,partyId=null,phase='exploration',area=null,round=0,deadline=0,reason='',travel=null,revision=0;
 const routes=new Map(),returning=new Set(),identity=p=>String(p.characterId||p.id);
 let electorate=[],drafts=new Map(),outcomes=[],lastRecap=null,prepared=false,planningOrigin=null;
 const players=()=>Object.values(world.players||{}).filter(p=>p.chaosControlled&&!p.chaosSpectator&&p.chaosPartyId===partyId&&p.hasEnteredGame&&p.connection?._connection?.connected!==false);
 const zone=p=>world.zoneManager.getZoneAt(p.x,p.y)?.name||'Unknown area';
 const inside=(p,a=area)=>!!a&&zone(p)===a.zone&&p.x>=a.x&&p.y>=a.y&&p.x<a.x+a.width&&p.y<a.y+a.height;
 const active=()=>players().filter(p=>!p.isDead&&inside(p));
 const changed=()=>{revision++;onChange();};
 function setPhase(next,ms=0){phase=next;deadline=ms?wall()+ms:0;['planning','preparation','recap'].includes(next)?clock.pause():clock.resume();changed();}
 function enable(id,{regroup=false}={}){
  if(enabled){if(id!==partyId)throw Error('This world already has an active party');return;}
  partyId=id;const live=players().filter(p=>!p.isDead);if(!live.length)throw Error('Connect a living character first');
  const counts=new Map();for(const p of live){const s=sceneAt({x:p.x,y:p.y,zone:zone(p)});const group=counts.get(s.id)||{scene:s,count:0};group.count++;counts.set(s.id,group);}
  area=[...counts.values()].sort((a,b)=>b.count-a.count)[0].scene;
  if(regroup&&live.some(p=>!inside(p))){area=null;partyId=null;throw Error('Gather everyone in the same scene before starting Hybrid');}
  enabled=true;changed();
 }
 function beginPlanning(why='Choose your next action'){
  if(!enabled||!area||phase!=='exploration')return false;
  planningOrigin={instanceId,phase,roundId:round};
  reason=why;round++;prepared=false;outcomes=[];electorate=active().map(p=>String(p.id));drafts=new Map();
  for(const p of active()){const pending=p.chaosPendingAction?.();if(pending)drafts.set(String(p.id),{...pending,actorId:p.id,continuation:true,confirmed:false,ready:false,revision:0});}
  setPhase('planning',times.planning);return true;
 }
 function admitAction(context){
  if(!enabled)return;
  if(!context||context.instanceId!==instanceId)throw Error('The connection to the adventure changed. Refresh your controller.');
  const current=context.roundId===round&&context.phase===phase;
  // The first hostile action opens planning synchronously. Other fresh inputs
  // already sent from that same exploration belong to this opening window.
  const opening=phase==='planning'&&context.phase==='exploration'&&context.roundId===planningOrigin?.roundId;
  if(!current&&!opening)throw Error('That moment has passed. Choose what you want to do now.');
 }
 function queue(player,{id,intent,text}){
  if(!enabled||phase!=='planning')throw Error('The party is not choosing actions right now');
  if(player.isDead||!electorate.includes(String(player.id)))throw Error('Join the active area for the next planning window');
  const previous=drafts.get(String(player.id));
  if(intent.verb==='ability'){
   if(previous?.ability)player.chaosReceipt?.(previous.ability.id,'cancelled','Replaced by your newer ability choice.');
   const draft=previous||{actorId:player.id,id:null,intent:{verb:'cancel'},text:'Hold position',confirmed:false};
   draft.ability={id,intent,text:String(text||'Use ability')};draft.ready=false;draft.revision=(draft.revision||0)+1;drafts.set(String(player.id),draft);changed();return;
  }
  if(previous&&!previous.continuation&&previous.id!==id)player.chaosReceipt?.(previous.id,'cancelled','Replaced by your newer choice.');
  drafts.set(String(player.id),{id,intent,text:String(text||intent.verb).slice(0,180),actorId:player.id,ready:false,confirmed:true,ability:previous?.ability,revision:(previous?.revision||0)+1});changed();
 }
 function ready(player,value,expectedRound){
  if(phase!=='planning'||expectedRound!==round)throw Error('That planning window has closed');
  if(!electorate.includes(String(player.id)))throw Error('You can join the next planning window');
  let draft=drafts.get(String(player.id));
  if(!draft){draft={actorId:player.id,id:null,intent:{verb:'cancel'},text:'Hold position',revision:0};drafts.set(String(player.id),draft);}
  draft.ready=value===true;if(draft.ready)draft.confirmed=true;changed();tick();
 }
 function cancel(player,stopTravel=true){if(stopTravel&&travel&&['pending','travelling'].includes(travel.status)){if(!travel.stopped.includes(String(player.id)))travel.stopped.push(String(player.id));const r=travel.target.request;if(r&&!r.terminal&&r.actorId===player.id){r.terminal=true;player.chaosReceipt?.(r.id,'cancelled','Your travel action was cancelled. The party can still vote.');}}returning.delete(identity(player));const d=drafts.get(String(player.id));if(d?.ability)player.chaosReceipt?.(d.ability.id,'cancelled','Your planned ability was cancelled.');if(d&&!d.continuation&&d.id)player.chaosReceipt?.(d.id,'cancelled','Your planned action was cancelled.');drafts.delete(String(player.id));changed();}
 function record(player,result){
  if(['blocked','failed','cancelled'].includes(result.status)&&returning.has(identity(player))&&result.id===routes.get(identity(player))?.[0]?.id+'-'+player.id){returning.delete(identity(player));changed();}
  if(phase==='travel'&&travel&&['blocked','failed'].includes(result.status)&&result.id===travel.id+'-'+player.id){
   if(!travel.stopped.includes(String(player.id)))travel.stopped.push(String(player.id));
   const r=travel.target.request;if(r&&!r.terminal&&r.actorId===player.id){r.terminal=true;player.chaosReceipt?.(r.id,'blocked',result.message);}changed();
  }
  if(!enabled||phase!=='action'||!['succeeded','failed','blocked'].includes(result.status))return;const d=drafts.get(String(player.id)),verb=d?.ability?.id===result.id?'ability':d?.intent?.verb;outcomes.push({id:result.id,player:player.chaosName||player.name,status:result.status,message:result.message,importance:['attack','creative','environment','talk','quest','open','loot'].includes(verb)?2:verb==='ability'?1:0});outcomes=outcomes.slice(-40);
 }

 function threats(){if(players().some(p=>{const d=p.chaosPendingAction?.();const mob=d?.intent?.verb==='attack'&&world.getEntityById?.(d.targetId);return mob&&!mob.isDead&&mob.hitPoints>0;}))return true;const ids=new Set(players().filter(p=>!p.isDead).map(p=>String(p.id)));return Object.values(world.mobs||{}).some(m=>!m.isDead&&m.hitPoints>0&&ids.has(String(m.target)));}
 function noticeThreat(player,mob){
  if(!enabled||phase!=='exploration'||!inside(player)||!mob||mob.isDead||mob.hitPoints<=0)return false;
  return beginPlanning('An enemy engages the party');
 }
 function prepare(){
  const people=new Map(players().map(p=>[String(p.id),p]));
  return [...drafts.values()].filter(d=>(d.confirmed||d.ability)&&people.has(String(d.actorId))).map(d=>({...d,actor:people.get(String(d.actorId)).chaosState?.()}));
 }
 function commit(expectedRound,plans){
  if(phase!=='preparation'||round!==expectedRound||prepared)return false;
  const updates=new Map((plans||[]).map(d=>[d.id,d]));
  for(const d of drafts.values()){const update=updates.get(d.id);if(update&&update.revision===d.revision&&update.actorId===d.actorId&&update.intent)d.intent=update.intent;}
  prepared=true;startAction();return true;
 }
 function startAction(){
  if(phase!=='preparation')return;
  setPhase('action',times.action);
  for(const p of players()){
   const d=drafts.get(String(p.id));
   if(returning.has(identity(p))&&!inside(p))continue;
   if(d?.ability)p.chaosExecutePlan?.(d.ability);
   if(!d?.confirmed){p.chaosStopAction?.('No action chosen; holding position.');continue;}
   if(d.continuation){continue;}
   p.chaosStopAction?.('Replaced by your chosen action.');
   if(d.id)p.chaosExecutePlan?.(d);
  }
 }
 function stopDeparting(player){cancel(player,false);player.chaosStopAction?.('Party travel replaces the previous action.');}
 function proposeTravel(player,target){
  if(!enabled||!['exploration','planning'].includes(phase))throw Error('Finish this moment before proposing travel');
  if(travel?.status==='pending')throw Error('The party already has a travel vote');
  if(!inside(player)||player.isDead)throw Error('Join the current area before proposing travel');
  const group=active();if(!target?.id||!target.area||typeof target.intent!=='object')throw Error('Choose an existing mapped exit');
  travel={id:'travel-'+(++revision),target,source:{...area},electorate:group.map(p=>String(p.id)),votes:{[String(player.id)]:true},required:Math.floor(group.length/2)+1,deadline:wall()+times.planning,status:'pending',arrivals:[],stopped:[],fromPhase:phase};if(phase==='planning')deadline=Math.max(deadline,travel.deadline);changed();settleTravel();return travel;
 }
 function voteTravel(player,id,yes){
  if(!travel||travel.id!==id||travel.status!=='pending'||wall()>=travel.deadline)throw Error('That travel vote has closed');
  const token=String(player.id);if(!travel.electorate.includes(token)||Object.hasOwn(travel.votes,token))throw Error('Your travel vote is unavailable or already recorded');
  travel.votes[token]=yes===true;changed();settleTravel();
 }
 function settleTravel(){
  if(travel?.status!=='pending')return;
  const yes=Object.values(travel.votes).filter(Boolean).length,remaining=travel.electorate.length-Object.keys(travel.votes).length;
  if(yes>=travel.required){
   travel.status='travelling';travel.deadline=wall()+times.travel;
   setPhase('travel',times.travel);
   for(const p of players()){
    if(travel.electorate.includes(String(p.id))||routes.get(identity(p))?.length){const queue=routes.get(identity(p))||[];queue.push({id:travel.id,target:travel.target,source:travel.source});routes.set(identity(p),queue);}
    if(!travel.electorate.includes(String(p.id))||travel.stopped.includes(String(p.id))||p.isDead)continue;stopDeparting(p);p.chaosExecuteTravel?.(travel);
   }
  }else if(yes+remaining<travel.required||wall()>=travel.deadline){travel.status='declined';finishTravelRequest('blocked','The party did not approve travel. Nobody was moved by the vote.');changed();}
 }
 function finishTravelRequest(status=null,message=null){
  const r=travel?.target.request;if(!r||r.terminal)return;
  const p=players().find(p=>p.id===r.actorId);if(!p)return;
  r.terminal=true;const arrived=inside(p,travel.target.area);
  p.chaosReceipt?.(r.id,status||(arrived?'succeeded':'blocked'),message||(arrived?'Travelled through the existing doorway into '+zone(p)+'.':'Your character did not reach the destination. Use Rejoin to follow the approved native route.'));
 }
 function walkable(player,x,y){
  if(!enabled||!area)return true;
  const p={x,y,getWorld:player.getWorld};
  const permit=routes.get(identity(player))?.[0]||(phase==='travel'?travel:null);
  if(permit){
   const a=permit.source,b=permit.target.area;
   return (x>=a.x&&y>=a.y&&x<a.x+a.width&&y<a.y+a.height)||(x>=b.x&&y>=b.y&&x<b.x+b.width&&y<b.y+b.height)||!!permit.target.corridor?.some(t=>t.x===x&&t.y===y);
  }
  if(inside(p))return true;
  // A recovered straggler may walk back to the group, never roam farther away.
  const gap=q=>Math.max(area.x-q.x,0,q.x-area.x-area.width+1)+Math.max(area.y-q.y,0,q.y-area.y-area.height+1);
  return !inside(player)&&zone(player)===area.zone&&zone(p)===area.zone&&gap(p)<gap(player);
 }
 function extend(expectedRound){if(phase!=='planning'||expectedRound!==round)throw Error('That planning window has closed');deadline+=15000;if(travel?.status==='pending')travel.deadline+=15000;changed();}
 function tick(){
  if(!enabled)return;
  if(!players().length){if(clock.paused)clock.resume();phase='exploration';deadline=0;electorate=[];drafts.clear();return;}
  for(const p of players()){
   const queue=routes.get(identity(p));if(!queue?.length)continue;
   while(queue.length&&inside(p,queue[0].target.area))queue.shift();
   if(returning.has(identity(p))&&queue.length&&!p.chaosPendingAction?.())p.chaosExecuteTravel?.(queue[0]);
   if(!queue.length)returning.delete(identity(p));
  }
  settleTravel();
  if(phase==='planning'){
   if(travel?.status==='pending')return;
   const ids=new Set(active().map(p=>String(p.id))),eligible=electorate.filter(id=>ids.has(id));
   if((eligible.length&&eligible.every(id=>drafts.get(id)?.ready))||wall()>=deadline)setPhase('preparation',times.preparation);
  }else if(phase==='preparation'&&wall()>=deadline)startAction();
  else if(phase==='action'&&wall()>=deadline){
   lastRecap={roundId:round,outcomes:[...outcomes],text:outcomes.length?[...outcomes].sort((a,b)=>b.importance-a.importance).slice(0,3).map(r=>r.player+': '+(r.message.length>180?r.message.slice(0,177)+'…':r.message)).join('\n'):'The party holds its ground.'};
   setPhase('recap',times.recap);
  }else if(phase==='recap'&&wall()>=deadline){
   setPhase('exploration');if(threats())beginPlanning('The encounter continues');
  }else if(phase==='travel'&&travel){
   for(const p of players())if(inside(p,travel.target.area)&&(p.chaosTravelArrived?.(travel)??true)&&!travel.arrivals.includes(String(p.id)))travel.arrivals.push(String(p.id));
   if(travel.arrivals.length>=travel.required&&!travel.selected){area=travel.target.area;travel.selected=true;changed();}
   const present=players().filter(p=>travel.electorate.includes(String(p.id))&&!travel.stopped.includes(String(p.id))&&!p.isDead);
   if(present.every(p=>travel.arrivals.includes(String(p.id)))||wall()>=deadline){
    for(const p of present)p.chaosStopAction?.('Party travel finished; check your actual arrival.');
    travel.status=travel.selected?'arrived':'incomplete';setPhase('exploration');finishTravelRequest();
   }
  }
 }
 function snapshot(player){
  const ids=new Set(active().map(p=>String(p.id))),eligible=electorate.filter(id=>ids.has(id)),d=player&&drafts.get(String(player.id));
  return {instanceId,members:eligible,enabled,phase,outside:!!player&&enabled&&!inside(player),returning:!!player&&returning.has(identity(player)),roundId:round,revision,deadline,reason,area,ready:eligible.filter(id=>drafts.get(id)?.ready).length,total:eligible.length,
   eligible:!!player&&eligible.includes(String(player.id)),draft:d?{id:d.id,text:(d.ability?d.ability.text+' · ':'')+d.text,ready:d.ready,continuation:!!d.continuation}:null,
   recap:phase==='recap'?lastRecap:null,travel:travel?{id:travel.id,status:travel.status,name:travel.target.name,deadline:travel.deadline,yes:Object.values(travel.votes).filter(Boolean).length,required:travel.required,arrived:travel.arrivals.length,total:travel.electorate.length,eligible:!!player&&travel.electorate.includes(String(player.id)),voterIds:travel.electorate,votedIds:Object.keys(travel.votes),voted:!!player&&Object.hasOwn(travel.votes,String(player.id))}:null};
 }
 function rejoin(player,fallback=null){
  if(!enabled||inside(player))throw Error('You are already with the party');
  const queue=routes.get(identity(player))||[];if(!queue.length&&fallback){queue.push(...(Array.isArray(fallback)?fallback:[fallback]));routes.set(identity(player),queue);}
  if(!queue.length)throw Error('No approved return route is available. Regroup with the host.');
  player.chaosStopAction?.('Returning to the party.');returning.add(identity(player));player.chaosExecuteTravel?.(queue[0]);changed();
 }
 const api={admitAction,rejoin,canTravel:(p,id)=>routes.get(identity(p))?.some(t=>t.id===id),enable,beginPlanning,queue,ready,cancel,record,noticeThreat,prepare,commit,proposeTravel,voteTravel,walkable,extend,tick,snapshot,
  get enabled(){return enabled;},get phase(){return phase;},get paused(){return enabled&&['planning','preparation','recap'].includes(phase);},get area(){return area;},get roundId(){return round;},get instanceId(){return instanceId;},get partyId(){return partyId;},
  owns:player=>enabled&&player.chaosPartyId===partyId,
  close(){clock.resume();}};
 return api;
}
