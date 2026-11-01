/** Real local-server acceptance. Run ONLY against a disposable Fracture test database. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {createPartyBridge} from './party-bridge.mjs';
if(process.env.CHAOS_BETA_TEST!=='1')throw Error('Set CHAOS_BETA_TEST=1 only for a disposable server/database. This creates test characters.');
const root=process.env.FRACTURE_ROOT,seconds=Number(process.env.CHAOS_SOAK_SECONDS||1200),count=Number(process.env.CHAOS_TEST_PLAYERS||20);
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-real-load-'));
const app=createPartyBridge({root,dataDir,actorKey:process.env.CHAOS_ACTOR_KEY,tvKey:process.env.CHAOS_TV_KEY,port:0,bind:'127.0.0.1'});
const started=Date.now(),summary={upstream:'642c00a8a2d3a95979e85bbfa3f62deee611a4a6',requestedActors:count,checks:[],samples:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let base;
const get=async token=>fetch(base+'/state?token='+token).then(r=>r.json());
async function action(token,text){const r=await fetch(base+'/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,text})});return {code:r.status,...await r.json()};}
async function result(token,id,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){const s=await get(token),r=s.results.find(r=>r.id===id);if(r&&!['received','started'].includes(r.status))return r;await sleep(150);}throw Error('Engine result timeout');}
try{
 await app.start();base='http://127.0.0.1:'+app.server.address().port;
 const suffix=Math.random().toString(36).slice(2,6),tokens=[];
 for(let i=0;i<count;i++){const r=await fetch(base+'/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:app.room.join,name:`Load${suffix}_${i}`,color:['Amber','Blue','Green','Rose'][i%4]})});assert.equal(r.status,201);tokens.push((await r.json()).token);}
 const deadline=Date.now()+20000;let states=[];
 do{states=await Promise.all(tokens.map(get));if(states.every(s=>s.actor?.ready))break;await sleep(250);}while(Date.now()<deadline);
 assert.ok(states.every(s=>s.actor?.ready),`${states.filter(s=>s.actor?.ready).length}/${count} actors authenticated`);
 assert.equal(new Set(states.map(s=>s.actor.id)).size,count);summary.checks.push(`${count} distinct real authenticated actors`);console.log('PASS distinct actors',count);
 const before=states.map(s=>[s.actor.x,s.actor.y]);
 const requests=await Promise.all(tokens.map((t,i)=>action(t,['walk north 2','walk east 2','walk south 2','walk west 2'][i%4])));
 assert.ok(requests.every(r=>r.code===202));
 const outcomes=await Promise.all(requests.map((r,i)=>result(tokens[i],r.id)));
 assert.ok(outcomes.every(r=>['succeeded','blocked'].includes(r.status)));
 states=await Promise.all(tokens.map(get));const moved=states.filter((s,i)=>s.actor.x!==before[i][0]||s.actor.y!==before[i][1]).length;
 assert.ok(moved>=2);summary.checks.push(`Concurrent movement: ${moved}/${count} moved; other requests truthfully blocked`);console.log('PASS concurrent movements',moved);
 const first=tokens[0],second=tokens[1];
 await sleep(250);const walk=await action(first,'walk north 12');await sleep(300);const other=await action(second,'stop running');await result(second,other.id);let state=await get(first);assert.notEqual(state.results.find(r=>r.id===walk.id)?.status,'cancelled');const stop=await action(first,'quit attacking');assert.equal((await result(first,stop.id)).status,'cancelled');state=await get(first);const stable=[state.actor.x,state.actor.y];await sleep(900);state=await get(first);assert.deepEqual([state.actor.x,state.actor.y],stable);summary.checks.push('Scoped cancellation, immediate override, stable engine position');console.log('PASS cancellation');
 const reconnect=app.sessions.get(first),account=reconnect.player.account,oldId=reconnect.actor.id,oldPosition=[reconnect.actor.x,reconnect.actor.y];reconnect.socket.disconnect();await sleep(300);reconnect.socket.connect();const reconnectDeadline=Date.now()+10000;while((!reconnect.actor||reconnect.actor.id===oldId)&&Date.now()<reconnectDeadline)await sleep(150);assert.equal(reconnect.player.account,account);assert.notEqual(reconnect.actor?.id,oldId);assert.deepEqual([reconnect.actor.x,reconnect.actor.y],oldPosition);summary.checks.push('Real Socket.IO reconnect preserves character and saved position');console.log('PASS reconnect');
 const bad=await action('not-a-player','stop');assert.equal(bad.code,403);summary.checks.push('Unknown controller rejected');
 // Keep the real group connected; exercise nonmutating observations and independent
 // paths every 15 seconds, plus respawn if the native enemy simulation knocks one out.
 let iteration=0;
 while((Date.now()-started)/1000<seconds){
   const tick=Date.now();
   const statuses=await Promise.all(tokens.map(get));
   assert.ok(statuses.every(s=>s.actor?.ready));
   const rs=await Promise.all(tokens.map((t,i)=>action(t,statuses[i].actor.dead?'respawn':iteration%4===0?['walk east 1','walk west 1'][i%2]:'look around')));
   summary.samples.push({elapsedSeconds:Math.round((Date.now()-started)/1000),connected:statuses.filter(s=>s.actor?.ready).length,requestBatchMs:Date.now()-tick,bridgeRssMiB:Math.round(process.memoryUsage().rss/1048576),accepted:rs.filter(r=>r.code===202).length});
   if(iteration%4===0)console.log('SOAK',JSON.stringify(summary.samples.at(-1)));
   iteration++;await sleep(Math.min(15000,Math.max(0,seconds*1000-(Date.now()-started))));
 }
 summary.elapsedSeconds=Math.round((Date.now()-started)/1000);summary.checks.push(`${summary.elapsedSeconds}s real-actor soak`);summary.status='passed';console.log('PASS soak',summary.elapsedSeconds);
}catch(error){summary.status='failed';summary.error=error.message;console.error(error);process.exitCode=1;}
finally{await app.close();const output=process.env.CHAOS_TEST_REPORT||path.join(os.tmpdir(),'chaos-runtime-report.json');fs.writeFileSync(output,JSON.stringify(summary,null,2));console.log('Sanitized report:',output);fs.rmSync(dataDir,{recursive:true,force:true});}
