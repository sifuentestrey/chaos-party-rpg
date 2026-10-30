/** Chaos-owned local room host. Fracture credentials never reach a phone. */
import http from 'node:http';
import qrcode from './vendor/qrcode.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createOptionalDM} from './optional-dm.mjs';
import {shouldUseCreative} from './chaos-world.mjs';
import {worldFingerprint} from './world-change.mjs';
import {parseIntent} from './action-contract.ts';
import {proposeRally,proposeExpedition,expeditionEligible,voteRally,settleRally,rallyView} from './party-rally.mjs';
import {preferredLanIp} from './lan-address.mjs';
import {ROLES,validRole} from './party-roles.mjs';
import {startAdventure,replayAdventure,receiptEvidence,zoneEvidence,advanceAdventure,adventureView,proposeTrialChoice,voteTrialChoice,settleTrialChoice,trialChoiceView} from './party-adventure.mjs';
import {stagedAction,isReaction,publicDeclarations,REACTION_MS} from './party-declaration.mjs';
const token=()=>randomBytes(24).toString('hex');
const lanIp=()=>preferredLanIp();
const phoneHost=req=>{const host=(req.headers.host||'localhost').split(':')[0];return ['localhost','127.0.0.1'].includes(host)?lanIp():host;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qrSvg=url=>{const code=qrcode(0,'M');code.addData(url);code.make();return code.createSvgTag({cellSize:4,margin:16,scalable:true});};
const page=(title,body)=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0;background:#121922;color:#f4eddc;font:18px system-ui;padding:24px}main{max-width:650px;margin:auto}h1{color:#efbd68}input,button,select{font:inherit;padding:14px;border-radius:8px;width:100%;margin:5px 0;border:1px solid #647386}button{background:#edbd70;color:#18212a;font-weight:bold;cursor:pointer}a{color:#b4dbff}#log{white-space:pre-wrap;line-height:1.5;max-height:180px;overflow:auto}h1{margin:0 0 16px}details{margin:12px 0}summary{cursor:pointer;color:#b4dbff}small{color:#bfc8d3}.row{display:flex;gap:8px}.row button{width:auto;flex:1}.card{padding:18px;background:#202c39;margin:18px 0;border-radius:10px}</style></head><body><main>${body}</main></body></html>`;
export function createPartyBridge({root=process.env.FRACTURE_ROOT,actorKey=process.env.CHAOS_ACTOR_KEY,tvKey=process.env.CHAOS_TV_KEY,port=4748,bind='0.0.0.0',dataDir=process.env.CHAOS_PARTY_DATA||path.join(root||'.','server/data/chaos-party'),ioFactory,dmFactory=createOptionalDM,fracturePort=8000,idleMs=45000,reactionMs=REACTION_MS}={}) {
 if(!root||!actorKey||!tvKey)throw Error('Isolated Fracture root and private runtime keys required');
 const io=ioFactory||createRequire(path.join(root,'package.json'))('socket.io-client').io;
 fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
 const dm=dmFactory({dataDir});
 const save=path.join(dataDir,'room.json');
 let room=fs.existsSync(save)?JSON.parse(fs.readFileSync(save,'utf8')):{host:token(),join:token(),players:[]};
 const persist=()=>{const tmp=save+'.tmp';fs.writeFileSync(tmp,JSON.stringify({...room,turn:undefined,rally:undefined,choiceVote:undefined}),{mode:0o600});fs.renameSync(tmp,save);};persist();
 // Combat/notification events are not credentials or character saves. Write their
 // room log at most twice per second; identity and host slot changes stay durable
 // immediately. STOP/close flush the latest events before shutting down.
 let pendingEventFlush=null;
 const scheduleEventFlush=()=>{if(pendingEventFlush)return;pendingEventFlush=setTimeout(()=>{pendingEventFlush=null;persist();},500);pendingEventFlush.unref?.();};
 const flushEvents=()=>{if(pendingEventFlush){clearTimeout(pendingEventFlush);pendingEventFlush=null;}persist();};
 const sessions=new Map(),pending=new Map(),events=room.events||[];room.turn=null;room.rally=null;room.choiceVote=null;persist();
 const meaningful=new Set(['creative','attack','talk','quest','open','loot']);
 const liveCount=()=>room.players.filter(p=>!p.parked).length;
 const eventClients=new Map();
 let worldNotifyTimer=null;
 const scheduleWorldNotification=()=>{
  if(worldNotifyTimer)return;
  worldNotifyTimer=setTimeout(()=>{worldNotifyTimer=null;notifyClients();},100);
  worldNotifyTimer.unref?.();
 };
 function notifyClients(){for(const [res,token] of eventClients){
  const session=sessions.get(token);
  if(res.destroyed||!session||session.player.parked){eventClients.delete(res);if(!res.destroyed)res.end();continue;}
  try{res.write('event: change\\ndata: {}\\n\\n'.replaceAll('\\n','\n'));}catch{eventClients.delete(res);res.end();}
 }}
 function record(event){events.push({...event,at:Date.now()});if(events.length>80)events.shift();room.events=events;scheduleEventFlush();notifyClients();}
 function progressAdventure(evidence){
  const change=advanceAdventure(room.adventure,evidence);
  if(!change)return;
  persist();record({player:'Adventure',status:change.completed?'completed':'progress',message:change.change});
 }
 function cancelPending(s,reason='Your announced action was cancelled.'){
  const staged=pending.get(s.player.token);if(!staged)return false;
  clearTimeout(staged.timer);pending.delete(s.player.token);
  const result={status:'cancelled',message:reason};s.results.set(staged.id,result);
  record({player:s.player.name,id:staged.id,...result});return true;
 }
 function finishPending(s,id){
  const staged=pending.get(s.player.token);if(!staged||staged.id!==id)return;
  pending.delete(s.player.token);clearTimeout(staged.timer);
  if(s.player.parked||!s.socket.connected||!s.actor?.ready||s.actor.dead||
     String(s.actor.id)!==String(staged.actorId)||s.actor.zone!==staged.zone||s.epoch!==staged.epoch){
   const result={status:'cancelled',message:'The character disconnected, moved to another area, or became unavailable before the announced action.'};
   s.results.set(id,result);record({player:s.player.name,id,...result});return;
  }
  // The real engine validates current objects, reach, ownership, rolls and
  // consequences at execution time. A queued declaration is never success.
  dispatch(s,staged.intent,staged.text,id,true);
 }
 function queueDeclaration(s,staged){
  if(pending.has(s.player.token))throw Error('You already announced an action. Wait for it or use STOP.');
  const id=randomUUID(),dueAt=Date.now()+reactionMs;
  const entry={id,name:s.player.name,text:staged.text,intent:staged.intent,
   actorId:s.actor.id,zone:s.actor.zone,epoch:s.epoch,dueAt};
  pending.set(s.player.token,entry);
  s.results.set(id,{status:'queued',message:'Announced for a 10-second reaction window. Nearby players can help or hinder before the native D20 check.'});
  if(s.results.size>80)s.results.delete(s.results.keys().next().value);
  record({player:s.player.name,id,status:'queued',message:'Announced: '+staged.text+'. Nearby players may help or hinder before the real check.'});
  entry.timer=setTimeout(()=>finishPending(s,id),reactionMs);entry.timer.unref?.();
  return id;
 }
 function connect(player){
  const socket=io(`http://127.0.0.1:${fracturePort}`,{transports:['websocket'],reconnection:true,autoConnect:false,auth:{chaosActorKey:actorKey,chaosName:player.name,chaosRole:validRole(player.role)?player.role:null,chaosPerk:player.perk==='lucky'?'lucky':null}});
  const session={player,socket,actor:null,worldFingerprint:null,results:new Map(),declarations:new Map(),attempts:new Map(),lastAction:0,epoch:0,lastSeen:0,suspending:false};sessions.set(player.token,session);
  socket.on('connect_error',()=>{session.error='Fracture is unavailable. The host should check its launcher.';});
  socket.on('connect',()=>{session.error=null;session.actor=null;socket.emit('message',[0,player.account,21,60,0,player.password]);});
  socket.on('disconnect',()=>{session.worldFingerprint=null;cancelPending(session,'Announced action cancelled: character disconnected.');session.actor=null;session.epoch++;session.storyController?.abort();session.declarations.clear();session.attempts.clear();for(const [id,result] of session.results)if(['received','started'].includes(result.status))session.results.set(id,{...result,status:'failed',message:'Game connection lost. Reconnect and try again.'});});
  socket.on('message',data=>{const messages=Array.isArray(data?.[0])?data:[data];for(const msg of messages){
   if(!Array.isArray(msg))continue;
   if(msg[0]===1){session.actor={id:msg[1],name:player.name,x:msg[3],y:msg[4],hp:msg[5],ready:true};refresh(session);}
   if(msg[0]===28){record({player:player.name,message:String(msg[2]),status:'dialogue'});session.dialogue=String(msg[2]);}
   if(msg[0]===30)session.quest={type:msg[1],target:msg[2],count:msg[3],progress:msg[4],reward:msg[5],xp:msg[6],description:msg[7]};
   if(msg[0]===31)session.quest=msg[1]===null?null:{...session.quest,type:msg[1],target:msg[2],count:msg[3],progress:msg[4]};
   if(msg[0]===32){session.quest={...session.quest,completed:true,description:msg[3]};record({player:player.name,status:'succeeded',message:'Quest completed! '+String(msg[3])});}
   if(msg[0]===86)session.error='Character authentication failed.';
  }});
  socket.on('chaos:receipt',r=>{
   if(!session.results.has(r.id))return;
   const {actor,...outcome}=r;session.results.set(r.id,outcome);if(actor)session.actor=actor;if(['succeeded','failed'].includes(r.status))for(const peer of sessions.values())if(peer!==session&&!peer.player.parked)refresh(peer);
   // The native engine, not merely receipt of phone text, authorizes the
   // first-valid-action declaration. Rejections never waste a reaction turn.
   const declaration=session.declarations.get(r.id);
   if(declaration){
    if((['started','succeeded'].includes(r.status)||(r.status==='failed'&&Number.isInteger(r.roll)))&&!session.player.parked&&session.socket.connected){
     const now=Date.now();
     if(!room.turn||room.turn.deadline<=now)room.turn={id:r.id,actor:player.name,text:declaration.text,deadline:now+10000,participants:[player.token]};
     else if(!room.turn.participants.includes(player.token))room.turn.participants.push(player.token);
     persist();
     session.declarations.delete(r.id);
    }else if(['blocked','failed','cancelled'].includes(r.status))session.declarations.delete(r.id);
   }
   const attempt=session.attempts.get(r.id);
   progressAdventure(receiptEvidence(r,attempt,actor||session.actor,player.name,room.adventure?.instanceId));
   const storyEvent=r.event||(attempt&&meaningful.has(attempt.verb)?{attempt:attempt.text}:null);
   if(storyEvent&&['succeeded','failed','blocked'].includes(r.status)){
    session.storyController?.abort();const storyController=new AbortController();session.storyController=storyController;session.story={id:r.id,text:r.message,mode:'offline'};const epoch=session.epoch;
    void dm.narrate({...r,event:storyEvent,actor:actor||session.actor,player:player.name},{signal:storyController.signal}).then(story=>{
     if(!story||session.epoch!==epoch||session.story?.id!==r.id)return;
     const message=story.text+(story.dialogue.length?' '+story.dialogue.map(d=>d.name+': '+d.line).join(' '):'');
     session.story={id:r.id,text:message,mode:'optional AI'};record({player:'DM',status:'story',canonicalId:r.id,message});
    });
   }
   record({player:player.name,...r,actor:undefined});
  });
  socket.on('chaos:position',s=>{session.actor=s;if(!session.player.parked)progressAdventure(zoneEvidence(s,session.player.name,session.player.token));});
  return session;
 }
 // One dispatch path for personal and majority-approved movement. All outcomes
 // are sourced from the native engine, not the vote or the HTTP acceptance.
 function dispatch(s,intent,text,id=randomUUID(),announced=false){
  s.results.set(id,{status:'received',message:text});s.attempts.set(id,{text,verb:intent.verb,adventureInstance:room.adventure?.instanceId||null});if(s.attempts.size>80)s.attempts.delete(s.attempts.keys().next().value);
  if(s.results.size>80)s.results.delete(s.results.keys().next().value);
  if(meaningful.has(intent.verb)&&!isReaction(text)&&!announced){
   s.declarations.set(id,{text});
   if(s.declarations.size>80)s.declarations.delete(s.declarations.keys().next().value);
  }
  s.socket.timeout(2000).emit('chaos:action',{key:actorKey,id,intent,actorId:s.actor.id,issuedAt:Date.now()},(error,r)=>{
   if(error||r?.error){
    s.declarations.delete(id);
    if(s.results.get(id)?.status==='received'){
     const result={status:'blocked',message:r?.error||'No engine acknowledgment. Please stop before retrying.'};
     s.results.set(id,result);record({player:s.player.name,id,...result});
    }
   }
  });
  return id;
 }
 const publicChoice=(token=null)=>{const view=trialChoiceView(room.choiceVote,token,Date.now());if(view)view.proposer=sessions.get(view.proposer)?.player.name||'Party member';return view;};
 function finishChoice(){
  const vote=room.choiceVote;if(!vote)return;
  const lead=sessions.get(vote.proposer)?.player.name||'Party member';
  const result=settleTrialChoice(vote,room.adventure,Date.now(),lead);
  if(!result)return;
  if(result.approved){persist();record({player:'Adventure',status:'approved',message:`The party chose ${result.route==='combat'?'a real monster fight':'original Chaos crafting'} for this Refuge Trial. Only confirmed engine outcomes count.`});}
  else record({player:'Adventure',status:'declined',message:'The story-choice vote did not approve a valid route; the existing trial remains unchanged.'});
 }
 const publicRally=(token=null)=>{const view=rallyView(room.rally,token,Date.now());if(view)view.proposer=sessions.get(view.proposer)?.player.name||'Party member';return view;};
 function finishRally(){
  const rally=room.rally;if(!rally)return;
  const status=settleRally(rally,Date.now());
  if(status==='pending'||rally.dispatched)return;
  rally.dispatched=true;
  const lead=sessions.get(rally.proposer)?.player.name||'Party member';
  const expedition=rally.kind==='expedition';
  const target=expedition?rally.waypoint:{x:rally.x,y:rally.y};
  if(expedition)rally.arrivals=[];
  if(status==='declined'){
   record({player:lead,status:'declined',message:`Party ${expedition?'travel':'rally'} did not reach ${rally.required} yes votes; nobody was moved.`});
   return;
  }
  record({player:lead,status:'approved',message:`Party approved ${expedition?'travel toward '+rally.arrivalZone:'local rally'} (${Object.values(rally.votes).filter(Boolean).length}/${rally.required}). Each native actor will attempt a walk, not teleport; arrival is not guaranteed and STOP remains available.`});
  for(const token of rally.electorate){
   const s=sessions.get(token);
   if(!s||s.player.parked||!s.socket.connected||!s.actor?.ready||s.actor.dead||s.actor.zone!==rally.zone){
    record({player:s?.player.name||'Absent player',status:'blocked',message:'Vote dispatch skipped: character disconnected, unavailable or in another area.'});continue;
   }
   if(expedition?!expeditionEligible(rally,s.actor):Math.abs(s.actor.x-rally.x)+Math.abs(s.actor.y-rally.y)>12){
    record({player:s.player.name,status:'blocked',message:'Vote dispatch skipped: character left the bounded departure area.'});continue;
   }
   if(s.actor.x===target.x&&s.actor.y===target.y){
    record({player:s.player.name,status:'succeeded',message:'Already at the requested waypoint; actual zone must still be checked.'});continue;
   }
   dispatch(s,{verb:'go',x:target.x,y:target.y},expedition?'Approved travel: walk toward '+rally.arrivalZone:'Party rally: walk to '+target.x+', '+target.y);
  }
 }
 function refresh(s){if(s.socket.connected&&s.actor)s.socket.timeout(1500).emit('chaos:state',{key:actorKey},(err,r)=>{if(!err&&r?.ok){
  s.actor=r.actor;
  if(!s.player.parked){
   const nextWorld=worldFingerprint(r.actor);
   if(nextWorld!==null){
    if(s.worldFingerprint!==null&&s.worldFingerprint!==nextWorld)scheduleWorldNotification();
    s.worldFingerprint=nextWorld;
   }
   progressAdventure(zoneEvidence(r.actor,s.player.name,s.player.token));
   const vote=room.rally;
   if(vote?.kind==='expedition'&&vote.status==='approved'&&vote.dispatched&&vote.electorate.includes(s.player.token)&&r.actor.ready&&!r.actor.dead&&r.actor.zone===vote.arrivalZone&&!(vote.arrivals||[]).includes(s.player.token)){
    vote.arrivals||=[];vote.arrivals.push(s.player.token);vote.lastArrivalAt=Date.now();
    record({player:s.player.name,status:'arrived',message:'Native character confirmed arrival in '+vote.arrivalZone+'.'});
   }
  }
 }});}
 room.players.forEach(connect);
 const polling=setInterval(()=>{finishRally();finishChoice();for(const s of sessions.values()){
   if(s.player.parked)continue;
   if(s.socket.connected&&s.actor&&Date.now()-s.lastSeen>idleMs&&!s.suspending){s.suspending=true;s.socket.timeout(2000).emit('chaos:save',{key:actorKey},()=>{if(Date.now()-s.lastSeen>idleMs)s.socket.disconnect();s.suspending=false;});}
   else refresh(s);
  }},1000);
 const publicPlayer=s=>({name:s.player.name,color:s.player.color,role:validRole(s.player.role)?s.player.role:null,actor:s.actor,error:s.error,story:s.story});
 const roster=()=>[...sessions.values()].filter(s=>!s.player.parked).map(publicPlayer);
 const json=(res,code,value)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
 const body=async req=>{let chunks='',bytes=0;for await(const c of req){bytes+=c.length;if(bytes>4096)throw Error('Body too large');chunks+=c;}return JSON.parse(chunks);};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),p=url.pathname;
   if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Invalid origin'});
   if(p==='/changes'&&req.method==='GET'){
    const session=sessions.get(url.searchParams.get('token'));
    if(!session||session.player.parked)return json(res,403,{error:'Active character required'});
    res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-store, no-transform','connection':'keep-alive','x-content-type-options':'nosniff'});
    res.write(': connected\\n\\n'.replaceAll('\\n','\n'));
    eventClients.set(res,session.player.token);req.on('close',()=>eventClients.delete(res));return;
   }
   if(p==='/health')return json(res,200,{ok:true,players:liveCount(),registered:sessions.size,connected:[...sessions.values()].filter(s=>!s.player.parked&&s.actor).length});
   if(p==='/host'&&req.method==='GET'){
    if(url.searchParams.get('key')!==room.host)return json(res,403,{error:'Private host link required'});
    const host=(req.headers.host||'localhost').split(':')[0],actual=server.address().port;
    const preferred=lanIp(),lan=preferred==='localhost'?host:preferred;
    const join=`http://${['localhost','127.0.0.1'].includes(host)?lan:host}:${actual}/join?key=${room.join}`;
    const tv=`http://${host}:${fracturePort}/?chaosTV=${encodeURIComponent(`http://${host}:${actual}`)}&tvKey=${tvKey}`;
    res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});return res.end(page('Chaos Party host',`<h1>Chaos Party</h1><p>Local game-night beta · Fracture world</p><div class="card"><a href="${esc(tv)}" target="_blank" rel="noopener">Open shared TV</a><p>Each phone joins here:</p><a href="${esc(join)}">${esc(join)}</a><div style="width:220px;background:white;margin:16px auto">${qrSvg(join)}</div><button id="dm" data-enabled="${dm.enabled}">Live AI DM (interpretation + narration): ${dm.enabled?'ON':'OFF'}</button><script>document.getElementById('dm').onclick=async()=>{const r=await fetch('/dm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:${JSON.stringify(room.host)},enabled:document.getElementById('dm').dataset.enabled!=='true'})});const v=await r.json();if(r.ok)location.reload();else alert(v.error);};</script><p id="dm-status" role="status"></p><button id="dm-test" type="button">Test AI connection</button><details><summary>Configure free Groq connection</summary><label for="dm-key">Your existing Groq API key</label><input id="dm-key" type="password" autocomplete="off" placeholder="Paste key on this host only"><button id="dm-save" type="button">Save isolated connection</button><small>Stored only in this Fracture test’s private data folder. Never included in the game ZIP.</small></details><script>
const dmHostKey=${JSON.stringify(room.host)},dmStatus=document.getElementById('dm-status');
async function refreshDM(){try{const r=await fetch('/dm/status?key='+encodeURIComponent(dmHostKey));const s=await r.json();const button=document.getElementById('dm');button.dataset.enabled=String(s.enabled);button.textContent='Live AI DM (interpretation + narration): '+(s.enabled?'ON':'OFF');dmStatus.textContent=s.message+' · '+s.state+' · free allowance remaining: '+s.quota.remaining;}catch{dmStatus.textContent='Could not check AI connection. Offline play remains available.';}}
document.getElementById('dm-test').onclick=async function(){this.disabled=true;dmStatus.textContent='Testing AI connection…';try{await fetch('/dm/test',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:dmHostKey})});}catch{dmStatus.textContent='Connection check failed. Offline play remains available.';}finally{this.disabled=false;await refreshDM();}};
document.getElementById('dm-save').onclick=async()=>{const field=document.getElementById('dm-key'),value=field.value;field.value='';const r=await fetch('/dm/configure',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:dmHostKey,apiKey:value})});if(!r.ok)alert((await r.json()).error);await refreshDM();};
refreshDM();setInterval(refreshDM,3000);
</script><p>Keep this host link private. Each phone gets its own character.</p></div><p>Adventure: meet a villager, defeat a rat, collect loot, then explore north together. Use “look around” to discover real targets.</p><div class="card"><h2>Recover a character</h2>${room.players.map(p=>`<p>${esc(p.name)} (${p.parked?'benched':'playing'}): <a href="${esc(join)}#recover=${p.token}">personal reconnect link</a> <button type="button" data-roster="${p.token}" data-park="${!p.parked}">${p.parked?'Restore player':'Bench player'}</button></p>`).join('')}<small>Share each personal link only with its player. It never contains the Fracture password.</small><script>document.querySelectorAll('[data-roster]').forEach(button=>button.onclick=async()=>{if(button.dataset.park==='true'&&!confirm('Bench this player? Their character will be saved and can be restored.'))return;const r=await fetch('/host/player',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:${JSON.stringify(room.host)},token:button.dataset.roster,parked:button.dataset.park==='true'})});const v=await r.json();if(r.ok)location.reload();else alert(v.error);});</script></div><div class="card"><h2>Optional party adventure</h2><p>Start The Refuge Trial after a player joins in The Refuge. Talk to an NPC, defeat a monster OR craft, visit Glitch Woods, and return. Group progress persists; no invented loot, XP, or original campaign migration.</p><button id="adventure-start" type="button">${room.adventure?.status==='completed'?'Start another trial':'Start The Refuge Trial'}</button><p id="adventure-status">${esc(adventureView(room.adventure)?.summary||"Not started.")}</p><script>document.getElementById("adventure-start").onclick=async()=>{const replay=${room.adventure?.status==='completed'};if(replay&&!confirm("Start a NEW Refuge Trial? Your completed run will be archived; native characters, gear, saves and world objects are not reset."))return;const r=await fetch("/host/adventure",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:${JSON.stringify(room.host)},action:replay?"replay":"start"})});const v=await r.json();document.getElementById("adventure-status").textContent=r.ok?v.adventure.summary:v.error;};</script></div><p>12–20-player performance and physical Mac acceptance remain unverified.</p>`));
   }
   if(p==='/host/adventure'&&req.method==='POST'){
    const b=await body(req);if(b.key!==room.host)return json(res,403,{error:'Private host link required'});
    if(!['start','replay'].includes(b.action))return json(res,400,{error:'Unsupported adventure action'});
    if(b.action==='start'&&room.adventure)return json(res,409,{error:'The trial already exists. Active or completed progress will not be silently reset.'});
    if(b.action==='replay'&&(!room.adventure||room.adventure.id!=='refuge-trial-v1'||room.adventure.version!==1||room.adventure.status!=='completed'))
     return json(res,409,{error:'Finish the supported trial before explicitly starting another run.'});
    const ready=[...sessions.values()].some(s=>!s.player.parked&&s.socket.connected&&s.actor?.ready&&!s.actor.dead&&s.actor.zone==='The Refuge');
    if(!ready)return json(res,409,{error:'Join with a living character in The Refuge before starting the trial.'});
    const previous=room.adventure,previousHistory=room.adventureHistory;
    try{
     if(b.action==='replay'){
      const next=replayAdventure(room.adventure,room.adventureHistory||[],Date.now(),randomUUID());
      room.adventure=next.adventure;room.adventureHistory=next.history;
     }else room.adventure=startAdventure(Date.now(),1,randomUUID());
     room.choiceVote=null;persist();
    }catch(error){room.adventure=previous;room.adventureHistory=previousHistory;return json(res,409,{error:'Could not safely start the trial: '+error.message});}
    record({player:'Adventure',status:'started',message:'The Refuge Trial run '+room.adventure.run+' began. Talk to a local, defeat a monster OR craft, visit Glitch Woods, then return.'});
    return json(res,201,{adventure:adventureView(room.adventure)});
   }
   if(p==='/host/player'&&req.method==='POST'){
    const b=await body(req);
    if(b.key!==room.host)return json(res,403,{error:'Private host link required'});
    const s=sessions.get(b.token);
    if(!s||typeof b.parked!=='boolean')return json(res,400,{error:'Unknown player or action'});
    if(!b.parked&&s.player.parked&&liveCount()>=20)return json(res,409,{error:'Room is full. Bench another player first.'});
    if(s.player.parked===b.parked)return json(res,200,{ok:true,parked:b.parked,name:s.player.name});
    // Parked actors retain their private credentials and saved Fracture state.
    if(b.parked)cancelPending(s,'Announced action cancelled: host benched this character.');
    s.player.parked=b.parked;persist();
    if(b.parked){
      s.epoch++;s.lastSeen=0;
      if(s.socket.connected&&s.actor){
        s.suspending=true;
        s.socket.timeout(2500).emit('chaos:save',{key:actorKey},(error,result)=>{
          if(error||result?.error)console.error('[Chaos Party] Bench save acknowledgment failed; native disconnect save will run.');
          // A quick host Restore may happen while the save is pending.
          // Never disconnect a character that has already been restored.
          if(s.player.parked){s.socket.disconnect();s.actor=null;}
          s.suspending=false;
        });
      }else{s.socket.disconnect();s.actor=null;}
      record({player:s.player.name,status:'benched',message:'Character benched by host; progress preserved.'});
    }else{
      record({player:s.player.name,status:'restored',message:'Host restored a slot. Rejoin with your personal link.'});
    }
    return json(res,200,{ok:true,parked:b.parked,name:s.player.name});
   }
   if(p==='/join'&&req.method==='GET'){
    if(url.searchParams.get('key')!==room.join)return json(res,403,{error:'Valid room link required'});
    res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});return res.end(page('Chaos Party controller',`<h1>Chaos Party</h1><section id="pair"><p>Your own character in our shared adventure.</p><input id="name" maxlength="18" placeholder="Character name"><select id="color"><option>Amber</option><option>Blue</option><option>Green</option><option>Rose</option></select><label for="role">Character class</label><select id="role">${Object.entries(ROLES).map(([id,r])=>`<option value="${id}">${r.name}</option>`).join('')}</select><small>Original Chaos classes are saved with your character. Rogue gets +3 to theft, Knight +3 to breaking, and Bard/Healer +3 to social amends checks. Lucky-ish rerolls a 1–3 on Chaos object D20 checks. Other class skills and native Fracture combat stats are not yet migrated. Color tints your TV sprite.</small><button id="join">Join adventure</button></section><section id="play" hidden><h2 id="who"></h2><p id="stats"></p><form id="form"><input id="text" maxlength="180" placeholder="What do you do?" required autocomplete="off"><button>Act</button></form><small>For a real 10-second D20 reaction window, type <b>declare make green hat from cloth strip and wood splinter</b> or <b>declare steal guard's rug</b>. Other nearby players can type <b>help Ada</b> or <b>hinder Ada</b> before the roll. Ordinary actions are immediate.</small><p id="declarations"></p><button id="stop">Stop my character</button><button id="revive" hidden>Respawn at checkpoint</button><p id="turn"></p><p id="dm-story"></p><p id="adventure"></p><details><summary>Choose the trial objective (optional majority vote)</summary><p id="trial-choice">Meet a local NPC to unlock the choice.</p><div class="row"><button id="trial-fight" type="button">Choose fight</button><button id="trial-craft" type="button">Choose craft</button></div><div class="row"><button id="trial-yes" type="button" hidden>Vote yes</button><button id="trial-no" type="button" hidden>Vote no</button></div><small>After speaking to an NPC, the group can commit to a fight or crafting objective. A strict majority locks the choice for this trial only. No vote means either route remains valid; this never changes Fracture's native combat, items or rewards.</small></details><details><summary>Gather the party (optional vote)</summary><p id="rally">No group rally proposed.</p><button id="propose-rally" type="button">Propose gathering at my position</button><button id="travel-woods" type="button">Vote to travel to Glitch Woods</button><button id="travel-refuge" type="button">Vote to return to The Refuge</button><div class="row"><button id="rally-yes" type="button" hidden>Vote yes</button><button id="rally-no" type="button" hidden>Vote no</button></div><small>Strict-majority votes approve a local rally or bounded travel along pinned Fracture map waypoints. Native collision, pathing, zone transitions and STOP remain authoritative. No teleport, guaranteed arrival or original Dawn Bell campaign travel.</small></details><details><summary>Gear and quest</summary><p id="inventory"></p><p id="quest"></p></details><details><summary>World and people</summary><p id="world"></p><p id="memory"></p></details><div class="row"><button data-action="walk north 3">↑</button></div><div class="row"><button data-action="walk west 3">←</button><button data-action="look around">Look</button><button data-action="walk east 3">→</button></div><div class="row"><button data-action="walk south 3">↓</button></div><small>Try push camp table east, light camp table, put out camp table, or repair camp table. Look for owned rugs. NPCs remember what they witness. If an NPC refuses a job after theft, try apologize to guard (D20 social check, 30s between attempts) or give a gift. You can also help a nearby friend with their next Chaos D20 check (crafting, theft, objects or NPC amends). Help lasts 15 seconds and never changes native Fracture combat.</small></section><div class="card" id="log" role="status" aria-live="polite">Connecting…</div><script>
const room=${JSON.stringify(room.join)},storage='chaos-party:'+location.host+':'+room;let auth=localStorage.getItem(storage),pending=null,activeRally=null,activeChoice=null;const recovery=new URLSearchParams(location.hash.slice(1)).get('recover');if(recovery){auth=recovery;localStorage.setItem(storage,auth);history.replaceState(null,'',location.pathname+location.search);}
const el=id=>document.getElementById(id),log=s=>el('log').textContent=s;el('stop').after(el('log'));
async function api(path,data){const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const v=await r.json();if(!r.ok)throw Error(v.error);return v;}
el('join').onclick=async()=>{try{const v=await api('/pair',{key:room,name:el('name').value,color:el('color').value,role:el('role').value});auth=v.token;localStorage.setItem(storage,auth);connectChanges();await poll();}catch(e){log(e.message);}};
async function act(text){try{const r=await api('/action',{token:auth,text});pending=r.id;log('RECEIVED: '+text);}catch(e){log(e.message);}}
el('form').onsubmit=e=>{e.preventDefault();act(el('text').value);el('text').value='';};el('stop').onclick=()=>act('stop');el('revive').onclick=()=>act('respawn');
el('propose-rally').onclick=async()=>{try{const r=await api('/rally/propose',{token:auth});activeRally=r.rally;log('Party vote opened.');await poll();}catch(e){log(e.message);}};
for(const [id,destination] of [['travel-woods','woods'],['travel-refuge','refuge']])el(id).onclick=async()=>{try{const r=await api('/expedition/propose',{token:auth,destination});activeRally=r.rally;log('Travel vote opened.');await poll();}catch(e){log(e.message);}};
async function castRally(yes){if(!activeRally)return;try{const r=await api('/rally/vote',{token:auth,id:activeRally.id,yes});activeRally=r.rally;log('Vote locked.');await poll();}catch(e){log(e.message);}}
el('rally-yes').onclick=()=>castRally(true);el('rally-no').onclick=()=>castRally(false);
for(const [id,route] of [['trial-fight','combat'],['trial-craft','craft']])el(id).onclick=async()=>{try{const r=await api('/adventure/choice/propose',{token:auth,route});activeChoice=r.choiceVote;log('Story vote opened.');await poll();}catch(e){log(e.message);}};
async function castChoice(yes){if(!activeChoice)return;try{const r=await api('/adventure/choice/vote',{token:auth,id:activeChoice.id,yes});activeChoice=r.choiceVote;log('Story vote locked.');await poll();}catch(e){log(e.message);}}
el('trial-yes').onclick=()=>castChoice(true);el('trial-no').onclick=()=>castChoice(false);
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
async function poll(){if(!auth){log('Choose your name to join.');return;}try{const v=await api('/state?token='+encodeURIComponent(auth));el('pair').hidden=true;el('play').hidden=false;el('who').textContent=v.name+' · '+(v.role?({rogue:'Rogue',bard:'Bard',wizard:'Wizard',knight:'Knight',healer:'Healer',wildcard:'Wildcard'}[v.role]||'Unassigned'):'Unassigned');el('stats').textContent=v.actor?(v.actor.dead?'Knocked out — respawn to continue.':'HP '+v.actor.hp+'/'+v.actor.maxHp+' · '+(v.actor.zone||'')+' · position '+v.actor.x+', '+v.actor.y):(v.error||'Connecting to Fracture…');el('revive').hidden=!v.actor?.dead;el('inventory').textContent=v.actor?'Gear: '+v.actor.weapon+' / '+v.actor.armor+' · Bag: '+[...(v.actor.inventory||[]),...(v.actor.chaos?.bag||[])].map(i=>i.name+(i.id?' ['+i.id+']':'')+(i.equipped?' (worn)':'')).join(', ')+(v.actor.chaos?.assistedBy?' · D20 help: '+v.actor.chaos.assistedBy:'')+(v.actor.chaos?.hinderedBy?' · D20 interference: '+v.actor.chaos.hinderedBy:'')+(v.actor.chaos?.error?' · '+v.actor.chaos.error:''):'';el('dm-story').textContent=v.story?'DM ('+v.story.mode+'): '+v.story.text:v.actor?.chaos?.story?.length?'DM memory: '+v.actor.chaos.story.at(-1).fact:'';const adventure=v.adventure;el('adventure').textContent=adventure?'THE REFUGE TRIAL ('+adventure.status+'): '+adventure.steps.map(s=>(s.done?'✓ ':'○ ')+s.label).join(' · '):'Optional party adventure: ask the host to start The Refuge Trial.';el('world').textContent=[...(v.actor?.chaos?.ground||[]),...(v.actor?.chaos?.scenery||[])].map(i=>(i.name||i.kind)+' ['+i.id+'] · '+i.condition+(i.hp!==undefined&&i.hp!==null?' · HP '+i.hp:'')+(i.owner?' · belongs to '+i.owner:'')).join(' | ');el('memory').textContent=(v.actor?.chaos?.npcs||[]).map(n=>n.name+' ['+n.id+'] · trust '+n.trust).join(' | ');el('quest').textContent=v.quest?'Quest: '+(v.quest.description||'Adventure complete')+' '+(v.quest.progress!==undefined?v.quest.progress+'/'+v.quest.count:''):'Ask a nearby NPC for a quest, or explore freely.';el('turn').textContent=v.turn?'Action window: '+Math.max(0,Math.ceil((v.turn.deadline-Date.now())/1000))+'s · '+v.turn.actor+' acted: '+v.turn.text:'';el('declarations').textContent=(v.declarations||[]).map(d=>d.player+' announces '+d.text+' · '+Math.max(0,Math.ceil((d.dueAt-Date.now())/1000))+'s to help/hinder').join(' | ');
activeChoice=v.choiceVote;
el('trial-choice').textContent=adventure?.choice?'The party committed to '+(adventure.choice==='combat'?'defeating a real monster':'crafting a real item')+'.':v.choiceVote? v.choiceVote.proposer+' proposes '+(v.choiceVote.route==='combat'?'a monster fight':'crafting')+' ('+v.choiceVote.yes+'/'+v.choiceVote.required+' yes, '+v.choiceVote.status+')':'No story choice is locked; either route counts.';
el('trial-fight').hidden=el('trial-craft').hidden=!adventure||adventure.status!=='active'||!adventure.steps[0]?.done||adventure.steps[1]?.done||!!adventure.choice||v.choiceVote?.status==='pending';
el('trial-yes').hidden=el('trial-no').hidden=!v.choiceVote||v.choiceVote.status!=='pending'||!v.choiceVote.eligible||v.choiceVote.voted;
activeRally=v.rally;
el('rally').textContent=v.rally? v.rally.proposer+' proposes '+(v.rally.kind==='expedition'?'travel to '+v.rally.destination:'gathering at '+v.rally.x+', '+v.rally.y)+' ('+v.rally.yes+'/'+v.rally.required+' yes needed, '+v.rally.status+(v.rally.status==='pending'?' · '+Math.max(0,Math.ceil((v.rally.deadline-Date.now())/1000))+'s left':'')+')':'No group vote proposed.';
el('propose-rally').hidden=v.rally?.status==='pending';
el('travel-woods').hidden=v.actor?.zone!=='The Refuge'||v.rally?.status==='pending';el('travel-refuge').hidden=v.actor?.zone!=='Glitch Woods'||v.rally?.status==='pending';
el('rally-yes').hidden=el('rally-no').hidden=!v.rally||v.rally.status!=='pending'||!v.rally.eligible||v.rally.voted;
const r=v.results.find(r=>r.id===pending)||v.results.at(-1);if(r)log(r.status.toUpperCase()+': '+r.message+(v.dialogue?'\\nNPC: '+v.dialogue:''));}catch(e){log(e.message);}}
let changes=null;function connectChanges(){if(changes){changes.close();changes=null;}if(!auth||typeof EventSource==='undefined')return;changes=new EventSource('/changes?token='+encodeURIComponent(auth));changes.addEventListener('change',()=>{if(!document.hidden)void poll();});}connectChanges();setInterval(poll,750);poll();
</script>`));
   }
   if(p==='/dm/status'&&req.method==='GET'){if(url.searchParams.get('key')!==room.host)return json(res,403,{error:'Private host required'});return json(res,200,dm.status());}
   if(p==='/dm/configure'&&req.method==='POST'){const b=await body(req);if(b.key!==room.host)return json(res,403,{error:'Private host required'});try{dm.configureKey(b.apiKey);return json(res,200,{available:dm.available});}catch{return json(res,400,{error:'Could not save connection. Enter a valid Groq key and check folder permissions.'});}}
   if(p==='/dm/test'&&req.method==='POST'){const b=await body(req);if(b.key!==room.host)return json(res,403,{error:'Private host required'});const reply=await dm.check();return json(res,reply?200:502,{ok:!!reply,status:dm.status()});}
   if(p==='/dm'&&req.method==='POST'){const b=await body(req);if(b.key!==room.host)return json(res,403,{error:'Private host required'});if(!dm.available)return json(res,409,{error:'No approved Groq key is configured. Offline actions remain available.'});dm.enabled=b.enabled===true;return json(res,200,{enabled:dm.enabled});}
   if(p==='/pair'&&req.method==='POST'){
    const b=await body(req);if(b.key!==room.join)return json(res,403,{error:'Wrong room'});
    if(liveCount()>=20)return json(res,409,{error:'Room is full. Ask the host to bench an inactive player.'});
    const name=typeof b.name==='string'?b.name.trim():'';
    if(!/^[\p{L}\p{N} _-]{2,18}$/u.test(name))return json(res,400,{error:'Use a name of 2–18 letters or numbers.'});
    if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return json(res,409,{error:'That name is taken. Reconnect with the same phone or choose another.'});
    if(b.role!==undefined&&!validRole(b.role))return json(res,400,{error:'Choose a valid Chaos character class.'});
    const player={name,role:validRole(b.role)?b.role:null,perk:validRole(b.role)?'lucky':null,color:['Amber','Blue','Green','Rose'].includes(b.color)?b.color:'Amber',token:token(),account:name.replace(/[^a-zA-Z0-9]/g,'').slice(0,8)+'_'+randomBytes(3).toString('hex'),password:token()};
    room.players.push(player);persist();const session=connect(player);session.lastSeen=Date.now();session.socket.connect();return json(res,201,{token:player.token});
   }
   if(p==='/adventure/choice/propose'&&req.method==='POST'){
    const b=await body(req),s=sessions.get(b.token);
    if(!s||s.player.parked)return json(res,403,{error:'Invalid personal controller'});
    finishChoice();
    if(room.choiceVote?.status==='pending')return json(res,409,{error:'A story-choice vote is already open.'});
    const now=Date.now();
    const actors=[...sessions.values()].filter(x=>!x.player.parked&&x.socket.connected&&x.actor?.ready&&!x.actor.dead&&now-x.lastSeen<=idleMs)
     .map(x=>({token:x.player.token,ready:true,dead:false,zone:x.actor.zone,x:x.actor.x,y:x.actor.y}));
    try{room.choiceVote=proposeTrialChoice(room.adventure,actors,s.player.token,b.route,now,randomUUID());}
    catch(e){return json(res,409,{error:e.message});}
    s.lastSeen=now;record({player:s.player.name,status:'vote',message:`Proposed a ${b.route==='combat'?'fight':'craft'} objective for the current trial. ${room.choiceVote.required} yes votes needed.`});
    return json(res,201,{choiceVote:publicChoice(s.player.token)});
   }
   if(p==='/adventure/choice/vote'&&req.method==='POST'){
    const b=await body(req),s=sessions.get(b.token);
    if(!s||s.player.parked)return json(res,403,{error:'Invalid personal controller'});
    if(!room.choiceVote||room.choiceVote.id!==b.id)return json(res,409,{error:'This story-choice vote is no longer open.'});
    try{voteTrialChoice(room.choiceVote,s.player.token,b.yes,Date.now());}
    catch(e){finishChoice();return json(res,409,{error:e.message});}
    s.lastSeen=Date.now();finishChoice();
    return json(res,200,{choiceVote:publicChoice(s.player.token),adventure:adventureView(room.adventure)});
   }
   if((p==='/rally/propose'||p==='/expedition/propose')&&req.method==='POST'){
    const b=await body(req),s=sessions.get(b.token);
    if(!s||s.player.parked)return json(res,403,{error:'Invalid personal controller'});
    if(room.rally?.status==='pending'){finishRally();if(room.rally.status==='pending')return json(res,409,{error:'A party vote is already open.'});}
    if(room.rally?.kind==='expedition'&&room.rally.status==='approved'&&Date.now()-(room.rally.resolvedAt||0)<45000&&(room.rally.arrivals||[]).length<room.rally.electorate.length)
     return json(res,409,{error:'Approved group travel is still underway. Wait for native arrivals or the 45-second travel window before opening another vote.'});
    const now=Date.now();
    const actors=[...sessions.values()].filter(x=>!x.player.parked&&x.socket.connected&&x.actor?.ready&&!x.actor.dead&&now-x.lastSeen<=idleMs)
      .map(x=>({token:x.player.token,ready:true,dead:false,zone:x.actor.zone,x:x.actor.x,y:x.actor.y}));
    try{room.rally=p==='/expedition/propose'?proposeExpedition(actors,s.player.token,b.destination,now,randomUUID()):proposeRally(actors,s.player.token,now,randomUUID());}
    catch(e){return json(res,409,{error:e.message});}
    s.lastSeen=now;
    record({player:s.player.name,status:'vote',message:`Proposed ${room.rally.kind==='expedition'?'group travel toward '+room.rally.arrivalZone:'a local rally at '+room.rally.x+', '+room.rally.y}. Needs ${room.rally.required} yes votes in 10 seconds.`});
    return json(res,201,{rally:publicRally(s.player.token)});
   }
   if(p==='/rally/vote'&&req.method==='POST'){
    const b=await body(req),s=sessions.get(b.token);
    if(!s||s.player.parked)return json(res,403,{error:'Invalid personal controller'});
    if(!room.rally||b.id!==room.rally.id)return json(res,409,{error:'This rally is no longer open.'});
    try{voteRally(room.rally,s.player.token,b.yes,Date.now());}
    catch(e){finishRally();return json(res,409,{error:e.message});}
    s.lastSeen=Date.now();finishRally();
    return json(res,200,{rally:publicRally(s.player.token)});
   }
   if(p==='/state'&&req.method==='GET'){
    const s=sessions.get(url.searchParams.get('token'));if(!s)return json(res,403,{error:'Reconnect using your original phone and room link.'});
    if(s.player.parked)return json(res,409,{error:'Your character is benched. Ask the host to restore your slot; your progress is saved.'});
    s.lastSeen=Date.now();if(!s.socket.connected&&!s.socket.active)s.socket.connect();
    return json(res,200,{...publicPlayer(s),dialogue:s.dialogue,quest:s.quest,adventure:adventureView(room.adventure),choiceVote:publicChoice(s.player.token),rally:publicRally(s.player.token),declarations:publicDeclarations(pending),turn:room.turn&&room.turn.deadline>Date.now()?{actor:room.turn.actor,text:room.turn.text,deadline:room.turn.deadline}:null,results:[...s.results.entries()].slice(-12).map(([id,r])=>({id,...r}))});
   }
   if(p==='/tv-state'&&req.method==='GET'){
    if(url.searchParams.get('key')!==tvKey)return json(res,403,{error:'Private TV link required'});
    const origin=req.headers.origin;
    if(origin){const u=new URL(origin);if(u.protocol!=='http:'||Number(u.port)!==fracturePort||u.hostname!==(req.headers.host||'').split(':')[0])return json(res,403,{error:'Invalid TV origin'});res.setHeader('access-control-allow-origin',origin);}
    return json(res,200,{players:roster(),adventure:adventureView(room.adventure),choiceVote:publicChoice(),rally:publicRally(),declarations:publicDeclarations(pending),events:events.slice(-8),lobby:{join:`http://${phoneHost(req)}:${server.address().port}/join?key=${room.join}`,qr:qrSvg(`http://${phoneHost(req)}:${server.address().port}/join?key=${room.join}`)},turn:room.turn&&room.turn.deadline>Date.now()?{actor:room.turn.actor,text:room.turn.text,deadline:room.turn.deadline}:null});
   }
   if(p==='/action'&&req.method==='POST'){
    const b=await body(req),s=sessions.get(b.token);if(!s)return json(res,403,{error:'Invalid personal controller'});
    if(s.player.parked)return json(res,409,{error:'Your character is benched. Ask the host to restore your slot.'});
    if(typeof b.text!=='string'||b.text.trim().length<2||b.text.length>180)return json(res,400,{error:'Action must contain 2–180 characters'});
    s.lastSeen=Date.now();
    if(!s.actor?.ready)return json(res,503,{error:'Your character is connecting. Try again shortly.'});
    const staged=stagedAction(b.text);
    if(staged?.error)return json(res,400,{error:staged.error});
    if(staged){
     if(pending.has(s.player.token))return json(res,409,{error:'You already announced an action. STOP cancels it.'});
     if(s.actor.dead)return json(res,409,{error:'Respawn before declaring a world action.'});
     const turn=room.turn?.deadline>Date.now()?room.turn:null;
     if(turn?.participants.includes(s.player.token))return json(res,409,{error:'Your last action is still locked. You can STOP or move.'});
     if(Date.now()-s.lastAction<200)return json(res,429,{error:'Give your character a moment.'});
     s.lastAction=Date.now();return json(res,202,{id:queueDeclaration(s,staged)});
    }
    let intent=shouldUseCreative(b.text,s.actor)?{verb:'creative',target:b.text}:parseIntent(b.text);const epoch=intent.verb==='cancel'?++s.epoch:s.epoch;
    if(intent.verb==='cancel')cancelPending(s,'Announced action cancelled by STOP before execution.');
    const unresolved=intent.target&&['go','attack','talk','quest','open','loot','equip'].includes(intent.verb)&&![...(s.actor.nearby||[]),...(s.actor.inventory||[])].some(e=>e.name.toLowerCase().includes(intent.target.toLowerCase()));
    if(intent.verb==='unknown'||unresolved)intent=await dm.interpret(b.text,s.actor)||intent;
    if(epoch!==s.epoch)return json(res,409,{error:'That pending interpretation was cancelled.'});
    if(intent.verb==='cancel')s.storyController?.abort();
    const now=Date.now();
    const turn=room.turn&&room.turn.deadline>now?room.turn:null;
    if(meaningful.has(intent.verb)&&!isReaction(b.text)&&turn&&turn.participants.includes(s.player.token))return json(res,409,{error:'Your declaration is locked for this reaction window. You can still move or stop.'});
    if(pending.has(s.player.token)&&meaningful.has(intent.verb)&&!isReaction(b.text))return json(res,409,{error:'Your announced action is waiting for reactions. Use STOP to cancel.'});
    if(intent.verb!=='cancel'&&now-s.lastAction<200)return json(res,429,{error:'Give your character a moment.'});s.lastAction=now;
    const id=dispatch(s,intent,b.text.trim());
    return json(res,202,{id});
   }
   json(res,404,{error:'Not found'});
  }catch(e){json(res,400,{error:'Invalid request'});}
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 return {server,room,sessions,pending,async start(){await new Promise((resolve,reject)=>server.once('error',reject).listen(port,bind,resolve));return server.address();},async close(){dm.close?.();for(const s of sessions.values())cancelPending(s,'Announced action cancelled: host is shutting down.');clearInterval(polling);if(worldNotifyTimer){clearTimeout(worldNotifyTimer);worldNotifyTimer=null;}for(const client of eventClients.keys())client.end();eventClients.clear();await Promise.all([...sessions.values()].filter(s=>s.socket.connected&&s.actor).map(s=>new Promise(resolve=>s.socket.timeout(2000).emit('chaos:save',{key:actorKey},(error,result)=>{if(error||result?.error)console.error('[Chaos Party] Save acknowledgment failed; attempting native disconnect save.');resolve();}))));flushEvents();for(const s of sessions.values())s.socket.disconnect();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const app=createPartyBridge();app.start().then(()=>console.log(`Chaos Fracture local bridge: http://localhost:4748/host?key=${app.room.host}`)).catch(e=>{console.error(e.message);process.exit(1);});let stopping=false;for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{if(stopping)return;stopping=true;await app.close();process.exit(0);});}
