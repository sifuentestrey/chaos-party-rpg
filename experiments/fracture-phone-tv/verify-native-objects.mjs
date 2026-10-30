/** Disposable pinned Fracture end-to-end proof: phone text -> grounded DM
 * proposal -> authenticated native D20 -> real oak art/collision/save.
 * AI is stubbed here; no Groq call or claim of live-model acceptance.
 */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import assert from 'node:assert/strict';import {createPartyBridge} from './party-bridge.mjs';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.FRACTURE_ROOT||!process.env.CHAOS_ACTOR_KEY||!process.env.CHAOS_TV_KEY||!process.env.CHAOS_WORLD_MODULE)
 throw Error('Disposable pinned native checkout and isolated actor keys required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-native-dm-'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let proposals=0;
const dmFactory=()=>({
 enabled:true,
 interpretEnvironment:async(text,actor)=>{
  if(!/\b(?:oak|tree)\b/i.test(text))return null;
  const tree=(actor?.chaos?.scenery||[]).find(o=>o.nativeOrigin&&o.kind==='tree'&&o.condition!=='broken'&&
   Math.abs(o.tile.x-actor.x)+Math.abs(o.tile.y-actor.y)<=1);
  if(!tree)return null;
  proposals++;
  return {action:'break',targetId:tree.id,ability:'strength',dc:14,description:'Try to fell the existing oak.'};
 },
 interpret:async()=>null,narrate:async()=>null,close:()=>{}
});
const app=createPartyBridge({root:process.env.FRACTURE_ROOT,dataDir:dir,actorKey:process.env.CHAOS_ACTOR_KEY,
 tvKey:process.env.CHAOS_TV_KEY,port:0,bind:'127.0.0.1',dmFactory});
let base;
const get=token=>fetch(base+'/state?token='+token).then(r=>r.json());
const post=async(p,b)=>{const r=await fetch(base+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});return {status:r.status,...await r.json()};};
async function outcome(token,id,timeout=65000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  const s=await get(token),r=s.results.find(v=>v.id===id);
  if(r&&['succeeded','failed','blocked','cancelled'].includes(r.status))return {result:r,state:s};
  await sleep(150);
 }
 throw Error('Native action did not finish: '+id);
}
async function move(token,x,y){
 for(let i=0;i<4;i++){
  const request=await post('/action',{token,text:'walk to '+x+','+y});
  if(request.status===429){await sleep(250);continue;}
  assert.equal(request.status,202,JSON.stringify(request));
  return (await outcome(token,request.id)).result;
 }
 throw Error('Native action rate limit did not clear');
}
try{
 await app.start();base='http://127.0.0.1:'+app.server.address().port;
 const tokens=[];
 for(const name of ['OakA_','OakB_']){
  const joined=await post('/pair',{key:app.room.join,name:name+Math.random().toString(36).slice(2,6),role:'knight'});
  assert.equal(joined.status,201);tokens.push(joined.token);
 }
 let states,deadline=Date.now()+20000;
 do{states=await Promise.all(tokens.map(get));if(states.every(s=>s.actor?.ready&&s.actor.zone))break;await sleep(250);}while(Date.now()<deadline);
 assert.ok(states.every(s=>s.actor?.ready),'Both actors must join the actual native Fracture server');
 assert.notEqual(states[0].actor.id,states[1].actor.id,'Each phone must own a separate native actor');
 // Discover the authoritative generated native-art inventory, never assume a
 // painted tree is eligible: other solid artwork can overlap its canopy.
 const nativeSource=fs.readFileSync(path.join(process.env.FRACTURE_ROOT,'server/ts/chaos-native-scenery.ts'),'utf8');
 const match=/export const nativeTrees = (.+);/.exec(nativeSource);
 assert.ok(match,'Pinned overlay must expose its verified native tree inventory');
 const nativeTrees=JSON.parse(match[1]);
 assert.ok(nativeTrees.length>0,'No map-verified native trees are available; do not fabricate one');
 const origin=states[0].actor;
 const choices=nativeTrees.slice().sort((a,b)=>
  (Math.abs(a.tile.x-origin.x)+Math.abs(a.tile.y-origin.y))-
  (Math.abs(b.tile.x-origin.x)+Math.abs(b.tile.y-origin.y))).slice(0,6);
 let tree=null,adjacent=false;
 for(const candidate of choices){
  const neighbors=[{x:candidate.tile.x-1,y:candidate.tile.y},{x:candidate.tile.x,y:candidate.tile.y+1},
   {x:candidate.tile.x,y:candidate.tile.y-1},{x:candidate.tile.x+1,y:candidate.tile.y}];
  for(const p of neighbors){
   const r=await move(tokens[0],p.x,p.y);
   if(r.status!=='succeeded')continue;
   const s=await get(tokens[0]);
   if(Math.abs(s.actor.x-candidate.tile.x)+Math.abs(s.actor.y-candidate.tile.y)!==1)continue;
   tree=s.actor.chaos?.scenery?.find(o=>o.nativeOrigin&&o.id.endsWith(':'+candidate.id));
   if(tree){adjacent=true;break;}
  }
  if(adjacent)break;
 }
 assert.ok(adjacent&&tree?.nativeOrigin,'No reachable, visible, verified native oak: '+JSON.stringify({candidates:choices.map(t=>t.tile),actor:(await get(tokens[0])).actor?.zone}));
 assert.equal(tree.hp,undefined,'Native scenery must not expose hidden durability');
 // The second actor remains a separate authenticated Fracture character.
 // Its later snapshot must observe the same saved native map mutation.
 const unsupported=await post('/action',{token:tokens[0],text:'Move the imaginary boulder'});
 assert.equal(unsupported.status,202);
 assert.equal((await outcome(tokens[0],unsupported.id)).result.status,'blocked','Unverified boulder cannot move');
 let felled=false,rolls=0;
 for(let i=0;i<12;i++){
  const s=await get(tokens[0]);if(s.turn)app.room.turn.deadline=Date.now()-1; // CI-only time advance; never alters engine dice/world.
  await sleep(250);
  const attempt=await post('/action',{token:tokens[0],text:'Could I topple that oak and clear the trail?'});
  assert.equal(attempt.status,202,JSON.stringify(attempt));
  const {result,state}=await outcome(tokens[0],attempt.id);
  assert.ok(['succeeded','failed'].includes(result.status),JSON.stringify(result));
  assert.ok(Number.isInteger(result.roll)&&result.roll>=1&&result.roll<=20,'Native D20 must decide the outcome');
  assert.equal(result.dc,14,'AI cannot lower the native oak DC');
  assert.equal(state.actor.chaos.scenery.find(o=>o.id===tree.id)?.hp,undefined);
  rolls++;
  if(result.status==='succeeded'){felled=true;break;}
  assert.ok(!state.actor.chaos.nativeChanges.some(id=>tree.id.endsWith(id)),'Failed D20 cannot destroy native collision');
 }
 assert.ok(felled,'Repeated genuine native checks did not fell the oak');
 assert.ok(proposals>=1,'Open-ended phone wording must reach the grounded DM proposal adapter');
 deadline=Date.now()+8000;let second;
 do{second=await get(tokens[1]);if(second.actor.chaos?.nativeChanges?.some(id=>tree.id.endsWith(id)))break;await sleep(150);}while(Date.now()<deadline);
 assert.ok(second.actor.chaos.nativeChanges.some(id=>tree.id.endsWith(id)),'Second native actor sees the same persisted tree change');
 const saved=JSON.parse(fs.readFileSync(path.join(process.env.FRACTURE_ROOT,'server/data/chaos-party/objects.json'),'utf8'));
 assert.equal(saved.scenery?.[tree.id]?.condition,'broken');
 assert.equal(Object.values(saved.items).filter(i=>i.originId===tree.id).length,0,'No invented wood or scenery prop spawned');
 const passage=await move(tokens[0],tree.tile.x,tree.tile.y);
 assert.equal(passage.status,'succeeded','Native pathfinding must traverse the original cleared trunk');
 const after=await get(tokens[0]);
 assert.deepEqual([after.actor.x,after.actor.y],[tree.tile.x,tree.tile.y]);
 console.log(JSON.stringify({status:'passed',checks:['two authenticated native actors','existing pinned-map oak only',
  'open-ended phone intent -> grounded mock DM proposal -> authoritative native D20',
  'failed checks preserve collision','successful check persists native tree fall',
  'second actor sees shared change','original trunk becomes walkable','no new art or props'],rolls,
  aiModel:'stubbed; live Groq and physical Mac/phone/TV remain unverified'}));
}finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}
