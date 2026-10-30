/** Two real native Fracture actors + majority rally, against disposable CI server only.
 * Never point this at family saves or a non-disposable Fracture database.
 */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {createPartyBridge} from './party-bridge.mjs';
if(process.env.CHAOS_BETA_TEST!=='1')throw Error('Disposable test database only: CHAOS_BETA_TEST=1 required');
if(!process.env.FRACTURE_ROOT||!process.env.CHAOS_ACTOR_KEY||!process.env.CHAOS_TV_KEY)throw Error('Isolated server and actor keys required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-rally-native-'));
const app=createPartyBridge({root:process.env.FRACTURE_ROOT,dataDir:dir,actorKey:process.env.CHAOS_ACTOR_KEY,tvKey:process.env.CHAOS_TV_KEY,port:0,bind:'127.0.0.1'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let base;
const get=token=>fetch(base+'/state?token='+token).then(r=>r.json());
const post=async(p,b)=>{const r=await fetch(base+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});return {status:r.status,...await r.json()};};
async function finalResult(token,id,timeout=12000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){const s=await get(token),r=s.results.find(x=>x.id===id);if(r&&!['received','started'].includes(r.status))return r;await sleep(150);}
 throw Error('Timed out waiting for native actor outcome');
}
try{
 await app.start();base='http://127.0.0.1:'+app.server.address().port;
 const tokens=[];
 for(const name of ['RallyA_'+Math.random().toString(36).slice(2,6),'RallyB_'+Math.random().toString(36).slice(2,6)]){
  const p=await post('/pair',{key:app.room.join,name});
  assert.equal(p.status,201);tokens.push(p.token);
 }
 let states=[],deadline=Date.now()+20000;
 do{states=await Promise.all(tokens.map(get));if(states.every(s=>s.actor?.ready&&s.actor.zone))break;await sleep(250);}while(Date.now()<deadline);
 assert.ok(states.every(s=>s.actor?.ready&&s.actor.zone),'Both native actors must authenticate and expose a real zone');
 assert.notEqual(states[0].actor.id,states[1].actor.id,'Separate native actors');
 // Create an actual position difference using validated native movement, not a
 // fabricated sidecar position. Probe four cardinal directions at most.
 let moved=false;
 for(const direction of ['north','east','south','west']){
  const before=await get(tokens[1]);
  if(before.actor.dead)throw Error('Native actor died before rally rehearsal');
  const action=await post('/action',{token:tokens[1],text:'walk '+direction+' 1'});
  assert.equal(action.status,202);
  const outcome=await finalResult(tokens[1],action.id);
  assert.ok(['succeeded','blocked'].includes(outcome.status),'Only native movement outcomes count');
  const after=await get(tokens[1]);
  if(after.actor.x!==before.actor.x||after.actor.y!==before.actor.y){moved=true;break;}
  await sleep(250);
 }
 assert.ok(moved,'No accessible adjacent native tile for rally rehearsal');
 states=await Promise.all(tokens.map(get));
 assert.equal(states[0].actor.zone,states[1].actor.zone);
 assert.ok(Math.abs(states[0].actor.x-states[1].actor.x)+Math.abs(states[0].actor.y-states[1].actor.y)<=12);
 const proposal=await post('/rally/propose',{token:tokens[0]});
 assert.equal(proposal.status,201);
 assert.equal(proposal.rally.required,2);
 assert.equal(proposal.rally.status,'pending');
 const noAction=app.sessions.get(tokens[1]).results.size;
 const existingIds=new Set(app.sessions.get(tokens[1]).results.keys());
 assert.equal((await post('/rally/vote',{token:app.room.join,id:proposal.rally.id,yes:true})).status,403);
 assert.equal(app.sessions.get(tokens[1]).results.size,noAction,'Invalid vote must not dispatch movement');
 const approved=await post('/rally/vote',{token:tokens[1],id:proposal.rally.id,yes:true});
 assert.equal(approved.status,200);
 assert.equal(approved.rally.status,'approved');
 const s=app.sessions.get(tokens[1]);
 const [id,r]=[...s.results.entries()].find(([id])=>!existingIds.has(id))||[];
 assert.ok(id&&r,'An approved vote must issue a distinct native actor request');
 const outcome=await finalResult(tokens[1],id);
 assert.ok(['succeeded','blocked'].includes(outcome.status),'Native Fracture, not vote, owns final outcome');
 if(outcome.status==='succeeded'){
  const [a,b]=await Promise.all(tokens.map(get));
  assert.deepEqual([b.actor.x,b.actor.y],[a.actor.x,a.actor.y],'Native movement reached proposer');
 }
 // Real two-actor expedition acceptance against disposable native Fracture.
 // These are map-authored waypoints used in the earlier verified adventure,
 // never a teleport, fake zone report, or a phone-provided coordinate.
 for(const token of tokens){
  await sleep(250);
  const walk=await post('/action',{token,text:'walk to 34,210'});
  assert.equal(walk.status,202,'native departure approach must be accepted');
  const result=await finalResult(token,walk.id,60000);
  assert.equal(result.status,'succeeded','native departure waypoint must be reachable: '+result.message);
 }
 states=await Promise.all(tokens.map(get));
 assert.ok(states.every(s=>s.actor.zone==='The Refuge'),'Both actors must still be in The Refuge before voting');
 assert.ok(states.every(s=>Math.abs(s.actor.x-41)+Math.abs(s.actor.y-195)<=24),'Actors must be near the pinned departure area');
 const travel=await post('/expedition/propose',{token:tokens[0],destination:'woods'});
 assert.equal(travel.status,201,'server must recognize the pinned Glitch Woods route');
 assert.equal(travel.rally.kind,'expedition');
 assert.equal(travel.rally.required,2);
 const ids=tokens.map(token=>new Set(app.sessions.get(token).results.keys()));
 const accepted=await post('/rally/vote',{token:tokens[1],id:travel.rally.id,yes:true});
 assert.equal(accepted.status,200);
 assert.equal(accepted.rally.status,'approved');
 for(let i=0;i<tokens.length;i++){
  const newId=[...app.sessions.get(tokens[i]).results.keys()].find(id=>!ids[i].has(id));
  assert.ok(newId,'Each native actor must receive an independent travel command');
  const result=await finalResult(tokens[i],newId,60000);
  assert.equal(result.status,'succeeded','Native route to Glitch Woods blocked: '+result.message);
 }
 states=await Promise.all(tokens.map(get));
 assert.ok(states.every(s=>s.actor.zone==='Glitch Woods'),'Both native actors must actually enter Glitch Woods');
 await sleep(1200);
 assert.equal((await post('/rally/vote',{token:tokens[1],id:travel.rally.id,yes:true})).status,409,'vote replay is rejected');
 const arrival=(await get(tokens[0])).rally;
 assert.ok(arrival,'Approved expedition must remain visible until actual native arrival or bounded timeout');
 assert.equal(arrival.arrived,2,'Native-zone callback must confirm two independent arrivals');

 console.log(JSON.stringify({status:'passed',checks:['two distinct native actors','actual native one-tile movement','majority vote cannot move early','invalid voter rejected','per-actor native go receipt','two native actors approved and actually entered Glitch Woods'],rallyOutcome:outcome.status}));
}finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}
