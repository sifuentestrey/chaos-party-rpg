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
 const joined=await post('/pair',{key:app.room.join,name:'ObjectCI_'+Math.random().toString(36).slice(2,6),role:'rogue'});
 assert.equal(joined.status,201);const token=joined.token;
 let state,deadline=Date.now()+20000;
 do{state=await get(token);if(state.actor?.ready&&state.actor.chaos?.bag?.length===2)break;await sleep(250);}while(Date.now()<deadline);
 assert.equal(state.actor?.chaos?.bag?.length,2,'real Fracture actor must receive two durable Chaos starter materials');
 assert.equal(state.role,'rogue','private room remembers the class');
 assert.equal(state.actor.role,'rogue','native Fracture actor receives the authenticated class');
 // A second authenticated native Fracture actor must grant real, bounded
 // Chaos D20 assistance. One actor controlling two phones is not sufficient.
 const helperName='HelperCI_'+Math.random().toString(36).slice(2,6);
 const joinedHelper=await post('/pair',{key:app.room.join,name:helperName,role:'healer'});
 assert.equal(joinedHelper.status,201);
 const helperToken=joinedHelper.token;
 let helperState;deadline=Date.now()+20000;
 do{helperState=await get(helperToken);if(helperState.actor?.ready&&helperState.actor.chaos?.bag?.length===2)break;await sleep(250);}while(Date.now()<deadline);
 assert.ok(helperState.actor?.ready,'second real native actor must join');
 assert.notEqual(helperState.actor.id,state.actor.id,'each controller must own a different native actor');
 assert.equal(helperState.actor.zone,state.actor.zone,'both actors must be in the same native zone');
 assert.ok(Math.abs(helperState.actor.x-state.actor.x)+Math.abs(helperState.actor.y-state.actor.y)<=2,
  'the native actors must be close enough for real D20 assistance');
 const help=await post('/action',{token:helperToken,text:'help '+state.name});
 assert.equal(help.status,202);
 let helped;deadline=Date.now()+12000;
 do{helperState=await get(helperToken);helped=helperState.results.find(r=>r.id===help.id);if(helped&&['succeeded','failed','blocked'].includes(helped.status))break;await sleep(150);}while(Date.now()<deadline);
 assert.equal(helped?.status,'succeeded','the helper must actually grant the native character an advantage');
 state=await get(token);
 assert.equal(state.actor.chaos.assistedBy,helperName);
 const before=state.actor.chaos.bag.map(i=>i.id);
 const action=await post('/action',{token,text:'make blue hat from cloth strip and wood splinter'});
 assert.equal(action.status,202);
 let result;deadline=Date.now()+12000;
 do{state=await get(token);result=state.results.find(r=>r.id===action.id);if(result&&['succeeded','failed','blocked'].includes(result.status))break;await sleep(150);}while(Date.now()<deadline);
 assert.ok(result,'real native actor must acknowledge the Chaos craft');
 assert.ok(['succeeded','failed'].includes(result.status),JSON.stringify(result));
 assert.ok(Number.isInteger(result.roll)&&result.roll>=1&&result.roll<=20);
 assert.equal(result.dc,10);
 assert.equal(result.bonus,0,'Rogue does not gain a fabricated bonus to crafting');
 assert.equal(result.rolls?.length,2,'a real second actor must grant two original Chaos D20 rolls');
 assert.equal(result.roll,Math.max(...result.rolls),'the native result must use the higher D20');
 assert.equal(result.assistedBy,helperName);
 assert.equal(state.actor.chaos.assistedBy,undefined,'assistance is consumed after one real roll');
 const after=state.actor.chaos.bag;
 if(result.status==='succeeded'){
  assert.ok(after.some(i=>i.name==='blue hat'));
  assert.ok(!after.some(i=>before.includes(i.id)));
 }else{
  assert.ok(before.every(id=>after.some(i=>i.id===id)),'failed roll keeps all materials');
 }
 // A true ten-second, opt-in announcement lets a second real native actor
 // hinder the next original Chaos world check BEFORE it executes. No mock rolls.
 const announced=await post('/action',{token:helperToken,text:'declare make green hat from cloth strip and wood splinter'});
 assert.equal(announced.status,202);
 helperState=await get(helperToken);
 assert.equal(helperState.results.find(r=>r.id===announced.id)?.status,'queued','announcement is not an engine result');
 assert.ok(helperState.declarations.some(d=>d.id===announced.id),'party can see a real reaction window');
 await sleep(250);
 const hinder=await post('/action',{token,text:'hinder '+helperState.name});
 assert.equal(hinder.status,202);
 let hinderResult;deadline=Date.now()+10000;
 do{state=await get(token);hinderResult=state.results.find(r=>r.id===hinder.id);if(hinderResult&&['succeeded','failed','blocked'].includes(hinderResult.status))break;await sleep(150);}while(Date.now()<deadline);
 assert.equal(hinderResult?.status,'succeeded','the first real actor must be able to interfere with the second');
 deadline=Date.now()+3000;
 do{helperState=await get(helperToken);if(helperState.actor.chaos.hinderedBy===state.name)break;await sleep(100);}while(Date.now()<deadline);
 assert.equal(helperState.actor.chaos.hinderedBy,state.name,'the actual target carries the pending disadvantage');
 let hindered;deadline=Date.now()+15000;
 do{helperState=await get(helperToken);hindered=helperState.results.find(r=>r.id===announced.id);if(hindered&&['succeeded','failed','blocked'].includes(hindered.status))break;await sleep(150);}while(Date.now()<deadline);
 assert.ok(hindered&&['succeeded','failed'].includes(hindered.status),'native actor must execute after the reaction window');
 assert.equal(hindered.rolls?.length,2,'a real hinderer supplies two D20 dice');
 assert.equal(hindered.hinderedBy,state.name);
 assert.equal(hindered.rerolled??hindered.roll,Math.min(...hindered.rolls),'disadvantage selects lower die before any original Lucky-ish reroll');
 deadline=Date.now()+3000;
 do{helperState=await get(helperToken);if(helperState.actor.chaos.hinderedBy===undefined)break;await sleep(100);}while(Date.now()<deadline);
 assert.equal(helperState.actor.chaos.hinderedBy,undefined,'interference is consumed after the real check');
 // Reach a known existing oak in the pinned map. Both native actors walk;
 // neither test positions nor scenery HP are injected.
 for(const [actorToken,x] of [[token,29],[helperToken,28]]){
  const request=await post('/action',{token:actorToken,text:'walk to '+x+',198'});assert.equal(request.status,202);
  let moved;deadline=Date.now()+65000;
  do{const current=await get(actorToken);moved=current.results.find(r=>r.id===request.id);if(moved&&['succeeded','blocked','failed'].includes(moved.status))break;await sleep(150);}while(Date.now()<deadline);
  assert.equal(moved?.status,'succeeded','actual native walk to the tree');
 }
 // The action receipt can arrive before the bridge's next authoritative
 // actor-state poll. Wait for the actual native position/scenery snapshot;
 // never mistake a stale /state response for a missing map object.
 let tree;deadline=Date.now()+8000;
 do{
  state=await get(token);
  tree=state.actor?.chaos?.scenery?.find(o=>o.nativeOrigin&&o.tile.x===30&&o.tile.y===197);
  if(tree?.nativeOrigin)break;
  await sleep(150);
 }while(Date.now()<deadline);
 if(!tree?.nativeOrigin){
  const debug=JSON.parse(fs.readFileSync(path.join(process.env.FRACTURE_ROOT,'server/data/chaos-party/objects.json'),'utf8'));
  assert.fail('Native map tree not visible to native actor: '+JSON.stringify({
   actor:{x:state.actor.x,y:state.actor.y,zone:state.actor.zone},
   camp:debug.camp,authoredScenery:Object.values(debug.scenery||{}).filter(o=>o.nativeOrigin).slice(0,65).map(o=>({kind:o.kind,tile:o.tile,scene:o.scene,nativeOrigin:o.nativeOrigin})),
   visibleScenery:state.actor.chaos?.scenery?.map(o=>({kind:o.kind,tile:o.tile,nativeOrigin:o.nativeOrigin}))||[],
   visibleGround:state.actor.chaos?.ground?.length||0
  }));
 }
 assert.equal(tree.hp,12);
 assert.equal(tree.condition,'intact');
 for(let n=0;n<4;n++){
  await sleep(250);
  let chop;const unlockedBy=Date.now()+16000;
  do{
   chop=await post('/action',{token,text:'chop '+tree.id});
   if(chop.status===202)break;
   assert.equal(chop.status,409,'only the real party reaction lock may delay the next strike: '+JSON.stringify(chop));
   assert.match(chop.error||'',/locked|waiting for reactions/i);
   await sleep(400);
  }while(Date.now()<unlockedBy);
  assert.equal(chop.status,202,'the real 10-second reaction window must eventually release the next strike');
  let outcome;deadline=Date.now()+25000;
  do{
   state=await get(token);
   outcome=state.results.find(r=>r.id===chop.id);
   if(outcome&&['succeeded','failed','blocked'].includes(outcome.status))break;
   await sleep(150);
  }while(Date.now()<deadline);
  assert.equal(outcome?.status,'succeeded','real native actor must strike the native map tree: '+JSON.stringify(outcome));
  const updated=state.actor.chaos?.scenery?.find(o=>o.id===tree.id);
  assert.equal(updated?.hp,12-3*(n+1),'the saved world must record real damage');
 }
 assert.equal(state.actor.chaos.scenery.find(o=>o.id===tree.id).condition,'broken');
 deadline=Date.now()+5000;
 do{
  helperState=await get(helperToken);
  if(helperState.actor.chaos?.scenery?.find(o=>o.id===tree.id)?.condition==='broken')break;
  await sleep(150);
 }while(Date.now()<deadline);
 assert.equal(helperState.actor.chaos?.scenery?.find(o=>o.id===tree.id)?.condition,'broken',
  'second native actor must observe the same fallen tree after authoritative refresh');
 await sleep(250);
 const walkThrough=await post('/action',{token,text:'walk to '+tree.tile.x+','+tree.tile.y});
 assert.equal(walkThrough.status,202);
 let walkOutcome;deadline=Date.now()+25000;
 do{
  state=await get(token);
  walkOutcome=state.results.find(r=>r.id===walkThrough.id);
  if(walkOutcome&&['succeeded','failed','blocked'].includes(walkOutcome.status))break;
  await sleep(150);
 }while(Date.now()<deadline);
 assert.equal(walkOutcome?.status,'succeeded','native pathfinding must allow walking through the destroyed native tree: '+JSON.stringify(walkOutcome));
 assert.deepEqual([state.actor.x,state.actor.y],[tree.tile.x,tree.tile.y],
  'native movement must actually reach the formerly blocked tile');

 const file=path.join(process.env.FRACTURE_ROOT,'server/data/chaos-party/objects.json');
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(saved.version,1);
 assert.ok(Object.keys(saved.actors).length>=1);
 assert.ok(Object.keys(saved.items).length>=2);
 assert.equal(saved.scenery?.[tree.id]?.condition,'broken','tree destruction must persist in the separate native-sidecar save');
 console.log(JSON.stringify({status:'passed',checks:['real native actor has Chaos starter materials','server D20 crafting receipt','native actor inventory agrees with result','separate persistent object save','two distinct native actors with one consumed D20 advantage','10-second real declaration followed by native D20 disadvantage from opponent','real native tree attack, shared fall, persistent save and post-destruction movement'],craftStatus:result.status}));
}finally{await app.close();fs.rmSync(dir,{recursive:true,force:true});}
