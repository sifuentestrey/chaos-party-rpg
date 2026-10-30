/** Exercise the actual native Fracture server with Chaos object rules installed.
 * Uses only a disposable CI checkout/database; never point at family saves.
 */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {createPartyBridge} from './party-bridge.mjs';
if(process.env.CHAOS_BETA_TEST!=='1')throw Error('Disposable CI only: CHAOS_BETA_TEST=1 required');
if(!process.env.FRACTURE_ROOT||!process.env.CHAOS_ACTOR_KEY||!process.env.CHAOS_TV_KEY||!process.env.CHAOS_WORLD_MODULE)throw Error('Native server, isolated actor keys and object module required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-native-objects-'));
const app=createPartyBridge({root:process.env.FRACTURE_ROOT,dataDir:dir,actorKey:process.env.CHAOS_ACTOR_KEY,tvKey:process.env.CHAOS_TV_KEY,port:0,bind:'127.0.0.1'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let base;
const get=token=>fetch(base+'/state?token='+token).then(r=>r.json());
const post=async(p,b)=>{const r=await fetch(base+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});return {status:r.status,...await r.json()};};
try{
 await app.start();base='http://127.0.0.1:'+app.server.address().port;
 const joined=await post('/pair',{key:app.room.join,name:'ObjectCI_'+Math.random().toString(36).slice(2,6)});
 assert.equal(joined.status,201);const token=joined.token;
 let state,deadline=Date.now()+20000;
 do{state=await get(token);if(state.actor?.ready&&state.actor.chaos?.bag?.length===2)break;await sleep(250);}while(Date.now()<deadline);
 assert.equal(state.actor?.chaos?.bag?.length,2,'real Fracture actor must receive two durable Chaos starter materials');
 const before=state.actor.chaos.bag.map(i=>i.id);
 const action=await post('/action',{token,text:'make blue hat from cloth strip and wood splinter'});
 assert.equal(action.status,202);
 let result;deadline=Date.now()+12000;
 do{state=await get(token);result=state.results.find(r=>r.id===action.id);if(result&&['succeeded','failed','blocked'].includes(result.status))break;await sleep(150);}while(Date.now()<deadline);
 assert.ok(result,'real native actor must acknowledge the Chaos craft');
 assert.ok(['succeeded','failed'].includes(result.status),JSON.stringify(result));
 assert.ok(Number.isInteger(result.roll)&&result.roll>=1&&result.roll<=20);
 assert.equal(result.dc,10);
 const after=state.actor.chaos.bag;
 if(result.status==='succeeded'){
  assert.ok(after.some(i=>i.name==='blue hat'));
  assert.ok(!after.some(i=>before.includes(i.id)));
 }else{
  assert.ok(before.every(id=>after.some(i=>i.id===id)),'failed roll keeps all materials');
 }
 const file=path.join(process.env.FRACTURE_ROOT,'server/data/chaos-party/objects.json');
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(saved.version,1);
 assert.ok(Object.keys(saved.actors).length>=1);
 assert.ok(Object.keys(saved.items).length>=2);
 console.log(JSON.stringify({status:'passed',checks:['real native actor has Chaos starter materials','server D20 crafting receipt','native actor inventory agrees with result','separate persistent object save'],craftStatus:result.status}));
}finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}
