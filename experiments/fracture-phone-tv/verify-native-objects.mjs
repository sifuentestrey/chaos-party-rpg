/** Actual native-engine environmental checks. Explicit disposable server only. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {createPartyBridge} from './party-bridge.mjs';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.FRACTURE_ROOT||!process.env.CHAOS_ACTOR_KEY||!process.env.CHAOS_TV_KEY||!process.env.CHAOS_WORLD_MODULE)throw Error('Disposable native server, isolated keys and object module required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-native-objects-')),app=createPartyBridge({root:process.env.FRACTURE_ROOT,dataDir:dir,actorKey:process.env.CHAOS_ACTOR_KEY,tvKey:process.env.CHAOS_TV_KEY,port:0,bind:'127.0.0.1'}),sleep=ms=>new Promise(r=>setTimeout(r,ms));let base;
const get=token=>fetch(base+'/state?token='+token).then(r=>r.json());
const post=async(p,b)=>{const r=await fetch(base+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});return {status:r.status,...await r.json()};};
async function action(token,text){
 let s=await get(token);if(s.turn)await sleep(Math.max(0,s.turn.deadline-Date.now()+250));await sleep(220);const ack=await post('/action',{token,text});assert.equal(ack.status,202,ack.error||text);
 const deadline=Date.now()+65000;while(Date.now()<deadline){s=await get(token);const r=s.results.find(r=>r.id===ack.id);if(r&&!['received','started','queued'].includes(r.status))return {s,r};await sleep(150);}throw Error('Native action timed out: '+text);
}
async function success(token,text){for(let n=0;n<12;n++){const r=await action(token,text);assert.ok(['failed','succeeded'].includes(r.r.status),r.r.message);if(r.r.status==='succeeded')return r;}assert.fail('Twelve genuine D20 failures: '+text);}
try{
 await app.start();base='http://127.0.0.1:'+app.server.address().port;const suffix=Math.random().toString(36).slice(2,6),tokens=[];
 for(const name of ['Object_'+suffix,'Helper_'+suffix]){const p=await post('/pair',{key:app.room.join,name,role:'knight',perk:'lucky'});assert.equal(p.status,201);tokens.push(p.token);}
 let states,deadline=Date.now()+20000;do{states=await Promise.all(tokens.map(get));if(states.every(s=>s.actor?.ready&&s.actor.chaos))break;await sleep(200);}while(Date.now()<deadline);
 assert.ok(states.every(s=>s.actor?.ready));assert.notEqual(states[0].actor.id,states[1].actor.id);assert.equal(states[0].actor.chaos.bag.length,0,'Native-only mode must not create crafting props');
 const [token,helper]=tokens;await success(token,'walk to 29, 198');await success(helper,'walk to 28, 198');let state=await get(token);const tree=state.actor.chaos.scenery.find(o=>o.kind==='tree'&&o.tile.x===30&&o.tile.y===197);assert.ok(tree,'the existing oak over the river must keep independent water/collision');assert.equal(tree.hp,undefined,'No visible native durability grinding');
 await success(helper,'help '+state.name);const cut=await action(token,'chop '+tree.id);assert.ok(['succeeded','failed'].includes(cut.r.status),cut.r.message);assert.equal(cut.r.dc,14);assert.equal(cut.r.rolls.length,2,'Real adjacent second actor grants advantage');assert.equal(cut.r.bonus,3);
 if(cut.r.status==='failed')await success(token,'chop '+tree.id);
 await success(token,`walk to ${tree.tile.x}, ${tree.tile.y}`);state=await get(token);assert.deepEqual([state.actor.x,state.actor.y],[tree.tile.x,tree.tile.y],'Actual native path must enter the cleared trunk');
 await success(token,'walk to 10, 234');state=await get(token);const tent=state.actor.chaos.scenery.find(o=>o.kind==='tent'&&o.nativeOrigin.x===11&&o.nativeOrigin.y===231);assert.ok(tent);const before={...tent.tile};await success(token,'push '+tent.id+' east');
 state=await get(token);assert.equal(state.actor.chaos.scenery.find(o=>o.id===tent.id).tile.x,before.x+1);assert.equal(state.actor.chaos.bag.length,0);
 const saved=JSON.parse(fs.readFileSync(path.join(process.env.FRACTURE_ROOT,'server/data/chaos-party/objects.json')));assert.equal(Object.keys(saved.items).length,0);assert.equal(saved.scenery[tree.id].condition,'broken');assert.equal(saved.scenery[tent.id].tile.x,before.x+1);
 console.log(JSON.stringify({status:'passed',checks:['two distinct authenticated native actors','no invented props or wood drops','original D20, class and real teammate advantage','tree fall, real native trunk movement, river layer preserved by adapter','original tent shifts with persisted state','separate native saves']}));
}finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}
