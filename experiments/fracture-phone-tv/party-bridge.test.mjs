import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {EventEmitter} from 'node:events';
import {createOptionalDM} from './optional-dm.mjs';
import {createPartyBridge} from './party-bridge.mjs';
const post=(base,p,b,headers={})=>fetch(base+p,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(b)});
async function setup(t,options={}){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-room-test-'));const sockets=[];const app=createPartyBridge({root:dir,dataDir:dir,actorKey:'actor-key',tvKey:'tv-key',dmFactory:options.dmFactory,reactionMs:options.reactionMs||10000,port:0,bind:'127.0.0.1',ioFactory:(_url,ioOptions)=>{const s=new EventEmitter();s.auth=ioOptions.auth;s.connected=true;s.connect=()=>{s.connected=true;return s;};s.disconnect=()=>{s.connected=false;s.emit('disconnect');};s.timeout=()=>s;const emit=s.emit.bind(s);s.emit=(event,...args)=>{if(event==='chaos:state'){args[1](null,{ok:true,actor:s.mockActor||{id:sockets.indexOf(s)+1,ready:true,x:12+sockets.indexOf(s)*2,y:12,zone:options.zone||'Town',hp:100,maxHp:100,dead:false}});return true;}if(event==='chaos:save'){args[1](null,{ok:true});return true;}if(event==='chaos:action'){s.lastAction=args[0];const status=s.nextOutcome||'started';s.nextOutcome=null;emit('chaos:receipt',{id:args[0].id,status,message:status});const ackError=s.nextAckError;s.nextAckError=null;args[1](ackError?new Error('Delayed transport acknowledgment'):null,ackError?null:{ok:true});return true;}return emit(event,...args);};sockets.push(s);queueMicrotask(()=>s.emit('message',[1,sockets.length,'Test',12,12,100,100]));return s;}});await app.start();t.after(async()=>{await app.close();fs.rmSync(dir,{force:true,recursive:true});});return {app,dir,sockets,base:`http://127.0.0.1:${app.server.address().port}`};}
test('controller script parses and credentials stay off phone',async t=>{const {app,base}=await setup(t);const html=await(await fetch(base+'/join?key='+app.room.join)).text();assert.doesNotThrow(()=>new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]));assert.ok(!html.includes('actor-key'));assert.ok(!html.includes('tv-key'));assert.ok(!html.includes('password'));});
test('two identities route to distinct actors, results stay private, and reconnect keeps credentials',async t=>{const {app,base,sockets,dir}=await setup(t);const pair=async name=>(await(await post(base,'/pair',{key:app.room.join,name})).json()).token;const a=await pair('Ada'),b=await pair('Bryn');assert.notEqual(a,b);await new Promise(r=>setTimeout(r,20));const r=await post(base,'/action',{token:a,text:'walk north 3'});assert.equal(r.status,202);const {id}=await r.json();assert.equal(sockets[0].lastAction.id,id);assert.equal(sockets[1].lastAction,undefined);const unknown=await post(base,'/action',{token:app.room.join,text:'stop'});assert.equal(unknown.status,403);const state=await(await fetch(base+'/state?token='+b)).json();assert.ok(!state.results.some(r=>r.id===id));assert.ok(!JSON.stringify(state).includes(app.room.players[0].password));const saved=JSON.parse(fs.readFileSync(path.join(dir,'room.json')));assert.equal(saved.players[0].token,a);assert.ok((fs.statSync(path.join(dir,'room.json')).mode&0o077)===0);});
test('room pairing, origin, and TV state access are separated',async t=>{const {app,base}=await setup(t);assert.equal((await post(base,'/pair',{key:'wrong',name:'Ada'})).status,403);assert.equal((await post(base,'/pair',{key:app.room.join,name:'Ada'},{Origin:'https://evil.example'})).status,403);assert.equal((await fetch(base+'/tv-state?key='+app.room.join)).status,403);assert.equal((await fetch(base+'/host?key='+app.room.join)).status,403);assert.equal((await fetch(base+'/tv-state?key=tv-key',{headers:{Origin:'http://evil.example:8000'}})).status,403);});
test('one immutable declaration per reaction window, parallel reactions, movement and STOP bypass',async t=>{const {app,base}=await setup(t);const pair=async name=>(await(await post(base,'/pair',{key:app.room.join,name})).json()).token;const a=await pair('Ada'),b=await pair('Bryn');await new Promise(r=>setTimeout(r,20));assert.equal((await post(base,'/action',{token:a,text:'attack rat'})).status,202);assert.equal((await post(base,'/action',{token:a,text:'attack goblin'})).status,409);assert.equal((await post(base,'/action',{token:b,text:'attack rat'})).status,202);assert.equal(app.room.turn.participants.length,2);assert.equal((await post(base,'/action',{token:a,text:'stop running'})).status,202);await new Promise(r=>setTimeout(r,220));assert.equal((await post(base,'/action',{token:a,text:'walk west'})).status,202);assert.equal(app.room.turn.text,'attack rat');app.room.turn.deadline=Date.now()-1;await new Promise(r=>setTimeout(r,220));assert.equal((await post(base,'/action',{token:a,text:'talk to guard'})).status,202);assert.equal(app.room.turn.text,'talk to guard');});

test('host may bench and restore registered characters without deleting saves; 20 is an active-slot limit',async t=>{
 const {app,base,dir}=await setup(t);
 const postHost=(token,parked,key=app.room.host)=>post(base,'/host/player',{key,token,parked});
 const tokens=[];
 for(let i=0;i<20;i++){
  const r=await post(base,'/pair',{key:app.room.join,name:'Player'+i});
  assert.equal(r.status,201,'join '+i);tokens.push((await r.json()).token);
 }
 assert.equal((await post(base,'/pair',{key:app.room.join,name:'Extra'})).status,409);
 const savedBefore=JSON.parse(fs.readFileSync(path.join(dir,'room.json')));
 assert.equal((await postHost(tokens[0],true,'wrong')).status,403);
 assert.equal((await postHost('not-a-person',true)).status,400);
 assert.equal((await postHost(tokens[0],true)).status,200);
 assert.equal((await fetch(base+'/state?token='+tokens[0])).status,409);
 assert.equal((await post(base,'/action',{token:tokens[0],text:'move left'})).status,409);
 assert.equal((await post(base,'/pair',{key:app.room.join,name:'Extra'})).status,201);
 assert.equal((await postHost(tokens[0],false)).status,409);
 assert.equal((await postHost(tokens[1],true)).status,200);
 assert.equal((await postHost(tokens[0],false)).status,200);
 const recovered=await fetch(base+'/state?token='+tokens[0]);
 assert.equal(recovered.status,200);
 assert.equal((await (await fetch(base+'/health')).json()).players,20);
 const savedAfter=JSON.parse(fs.readFileSync(path.join(dir,'room.json')));
 assert.equal(savedAfter.players.length,21);
 assert.equal(savedAfter.players[0].token,savedBefore.players[0].token);
 assert.equal(savedAfter.players[0].account,savedBefore.players[0].account);
 assert.equal(savedAfter.players[0].password,savedBefore.players[0].password);
 assert.equal(savedAfter.players[0].parked,false);
 assert.equal(savedAfter.players[1].parked,true);
 assert.ok((fs.statSync(path.join(dir,'room.json')).mode&0o077)===0);
});

test('rapid combat receipts are buffered without losing the event log',async t=>{
 const {app,base,dir}=await setup(t);
 const paired=await post(base,'/pair',{key:app.room.join,name:'Fighter'});
 assert.equal(paired.status,201);
 const {token}=await paired.json(),s=app.sessions.get(token);
 for(let i=0;i<15;i++){
   const id='combat-'+i;
   s.results.set(id,{status:'received'});
   s.socket.emit('chaos:receipt',{id,status:'started',message:'rat HP '+i});
 }
 const file=path.join(dir,'room.json');
 const before=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.ok((before.events||[]).length<15,'transient combat logs should not trigger a disk save per hit');
 await new Promise(r=>setTimeout(r,650));
 const after=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(after.events.length,15);
 assert.equal(after.events.at(-1).message,'rat HP 14');
 assert.equal(after.players[0].token,token);
});

test('unsupported object manipulation and engine-blocked attacks never consume a declaration',async t=>{
 const {app,base,sockets}=await setup(t);
 const r=await post(base,'/pair',{key:app.room.join,name:'Dara'});const {token}=await r.json();
 await new Promise(r=>setTimeout(r,20));
 assert.equal((await post(base,'/action',{token,text:'move the tent'})).status,202);
 assert.equal(app.room.turn,null,'manipulation rejection must not lock a turn');
 sockets[0].nextOutcome='blocked';
 const invalid=await post(base,'/action',{token,text:'attack rat'});
 assert.equal(invalid.status,429,'brief spam throttle remains in force');
 await new Promise(r=>setTimeout(r,220));
 sockets[0].nextOutcome='blocked';
 assert.equal((await post(base,'/action',{token,text:'attack rat'})).status,202);
 assert.equal(app.room.turn,null,'a blocked engine action must not reserve the first-valid declaration');
 await new Promise(r=>setTimeout(r,220));
 assert.equal((await post(base,'/action',{token,text:'attack rat'})).status,202);
 assert.equal(app.room.turn.text,'attack rat');
 assert.equal((await post(base,'/action',{token,text:'attack rat'})).status,409,'a started meaningful action consumes the turn');
});

test('a late socket acknowledgement failure cannot erase a real engine-started action',async t=>{
 const {app,base,sockets}=await setup(t);
 const paired=await post(base,'/pair',{key:app.room.join,name:'Mara'});
 assert.equal(paired.status,201);
 const {token}=await paired.json();
 await new Promise(r=>setTimeout(r,20));
 sockets[0].nextAckError=true;
 const started=await post(base,'/action',{token,text:'attack rat'});
 assert.equal(started.status,202);
 const {id}=await started.json();
 const s=app.sessions.get(token);
 assert.equal(s.results.get(id).status,'started');
 assert.equal(app.room.turn.id,id,'a real engine-started declaration remains valid');
 assert.equal((await post(base,'/action',{token,text:'attack rat'})).status,409);
});

test('majority-approved rally sends independent native go actions; a vote is not movement proof',async t=>{
 const {app,base,sockets}=await setup(t);
 const tokens=[];
 for(const name of ['Ari','Bex','Cal']){
  const response=await post(base,'/pair',{key:app.room.join,name});
  assert.equal(response.status,201);
  tokens.push((await response.json()).token);
 }
 await new Promise(r=>setTimeout(r,30));
 const proposed=await post(base,'/rally/propose',{token:tokens[0]});
 assert.equal(proposed.status,201);
 const {rally}=await proposed.json();
 assert.equal(rally.required,2);
 assert.equal(rally.yes,1);
 assert.equal(rally.status,'pending');
 assert.equal(sockets[1].lastAction,undefined,'proposing is not movement');
 assert.equal((await post(base,'/rally/vote',{token:app.room.join,id:rally.id,yes:true})).status,403);
 const tv=await(await fetch(base+'/tv-state?key=tv-key')).json();
 assert.equal(tv.rally.proposer,'Ari');
 assert.equal(JSON.stringify(tv.rally).includes(tokens[0]),false,'TV cannot see controller tokens');
 const before=await(await fetch(base+'/state?token='+tokens[1])).json();
 assert.equal(before.rally.eligible,true);
 assert.equal(before.rally.voted,false);
 const vote=await post(base,'/rally/vote',{token:tokens[1],id:rally.id,yes:true});
 assert.equal(vote.status,200);
 assert.equal((await vote.json()).rally.status,'approved');
 assert.equal(sockets[0].lastAction,undefined,'proposer already at the meeting point');
 for(const i of [1,2]){
  assert.equal(sockets[i].lastAction.intent.verb,'go');
  assert.deepEqual([sockets[i].lastAction.intent.x,sockets[i].lastAction.intent.y],[12,12]);
  assert.equal(app.sessions.get(tokens[i]).results.get(sockets[i].lastAction.id).status,'started');
 }
 assert.equal((await post(base,'/rally/vote',{token:tokens[2],id:rally.id,yes:true})).status,409);
 const state=await(await fetch(base+'/state?token='+tokens[2])).json();
 assert.equal(state.rally.status,'approved');
 assert.equal(state.results.at(-1).status,'started','rally does not fabricate arrival');
 await new Promise(r=>setTimeout(r,220));
 assert.equal((await post(base,'/action',{token:tokens[1],text:'stop'})).status,202);
 assert.equal(sockets[1].lastAction.intent.verb,'cancel','STOP remains available after majority movement');
});

test('rally proposal is rejected for distant, disconnected, dead or single active actors',async t=>{
 const {app,base,sockets}=await setup(t);
 const a=(await(await post(base,'/pair',{key:app.room.join,name:'Ari'})).json()).token;
 await new Promise(r=>setTimeout(r,20));
 assert.equal((await post(base,'/rally/propose',{token:a})).status,409);
 const b=(await(await post(base,'/pair',{key:app.room.join,name:'Bex'})).json()).token;
 await new Promise(r=>setTimeout(r,20));
 app.sessions.get(b).actor.x=200;
 assert.equal((await post(base,'/rally/propose',{token:a})).status,409);
 app.sessions.get(b).actor.x=14;
 app.sessions.get(b).actor.dead=true;
 assert.equal((await post(base,'/rally/propose',{token:a})).status,409);
 app.sessions.get(b).actor.dead=false;
 sockets[1].disconnect();
 assert.equal((await post(base,'/rally/propose',{token:a})).status,409);
});

test('failed quorum and expired vote never issue native movement',async t=>{
 const {app,base,sockets}=await setup(t);
 const tokens=[];
 for(const name of ['Ari','Bex','Cal']){
  tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 }
 await new Promise(r=>setTimeout(r,30));
 const a=await(await post(base,'/rally/propose',{token:tokens[0]})).json();
 assert.equal((await post(base,'/rally/vote',{token:tokens[1],id:a.rally.id,yes:false})).status,200);
 const denied=await post(base,'/rally/vote',{token:tokens[2],id:a.rally.id,yes:false});
 assert.equal((await denied.json()).rally.status,'declined');
 assert.ok(sockets.every(s=>!s.lastAction),'a rejected rally never moves anyone');
 const b=await(await post(base,'/rally/propose',{token:tokens[0]})).json();
 app.room.rally.deadline=Date.now()-1;
 assert.equal((await post(base,'/rally/vote',{token:tokens[1],id:b.rally.id,yes:true})).status,409);
 assert.equal(app.room.rally.status,'declined');
 assert.ok(sockets.every(s=>!s.lastAction),'an expired rally never moves anyone');
});
test('benched players remain in frozen vote electorate but are never commanded after approval',async t=>{
 const {app,base,sockets}=await setup(t);
 const tokens=[];
 for(const name of ['Ari','Bex','Cal']){
  tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 }
 await new Promise(r=>setTimeout(r,30));
 const rally=(await(await post(base,'/rally/propose',{token:tokens[0]})).json()).rally;
 const bench=await post(base,'/host/player',{key:app.room.host,token:tokens[1],parked:true});
 assert.equal(bench.status,200);
 assert.equal((await(await post(base,'/rally/vote',{token:tokens[2],id:rally.id,yes:true})).json()).rally.status,'approved');
 assert.equal(sockets[1].lastAction,undefined,'host bench blocks forced movement');
 assert.equal(sockets[2].lastAction.intent.verb,'go');
 assert.equal((await post(base,'/rally/vote',{token:tokens[1],id:rally.id,yes:true})).status,403);
});

test('a failed dice declaration consumes the window and refreshes recipient state',async t=>{
 const {app,base,sockets}=await setup(t);const pair=async name=>(await(await post(base,'/pair',{key:app.room.join,name})).json()).token;
 const a=await pair('Ada'),b=await pair('Bryn');await new Promise(r=>setTimeout(r,20));
 // Deliver the engine's terminal receipt before its action acknowledgement, as native does.
 const emit=sockets[0].emit.bind(sockets[0]);sockets[0].emit=(event,...args)=>{if(event==='chaos:action'){emit('chaos:receipt',{id:args[0].id,status:'failed',message:'D20 2 / 10: Craft failed.',roll:2});args[1](null,{ok:true});return true;}return emit(event,...args);};
 const response=await post(base,'/action',{token:a,text:'make hat from cloth strip and wood splinter'});assert.equal(response.status,202);
 assert.equal((await post(base,'/action',{token:a,text:'make hat from cloth strip and wood splinter'})).status,409);
 assert.ok(app.room.turn.participants.includes(a));assert.equal((await post(base,'/action',{token:b,text:'look around'})).status,202);
});

test('offline DM uses terminal native facts and never treats started as success',async t=>{const {app,base,sockets}=await setup(t);const token=(await(await post(base,'/pair',{key:app.room.join,name:'Ada'})).json()).token;await new Promise(r=>setTimeout(r,20));const request=await post(base,'/action',{token,text:'talk to guard'});const {id}=await request.json();let state=await(await fetch(base+'/state?token='+token)).json();assert.equal(state.story,undefined);sockets[0].emit('chaos:receipt',{id,status:'succeeded',message:'Guard remembers the gift.'});state=await(await fetch(base+'/state?token='+token)).json();assert.deepEqual(state.story,{id,text:'Guard remembers the gift.',mode:'offline'});});

test('host can configure, test and enable isolated AI without revealing credentials to phones',async t=>{
 const {app,base,dir}=await setup(t,{dmFactory:({dataDir})=>createOptionalDM({dataDir,key:'',fetchImpl:async(_url,init)=>{const context=JSON.parse(JSON.parse(init.body).messages[1].content);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({turnId:context.turnId,outcome:context.outcome.status,text:context.outcome.canonical,dialogue:[]})}}]})};}})});
 assert.equal((await fetch(base+'/dm/status?key='+app.room.join)).status,403);
 const secret='fake-groq-key-for-host-only';assert.equal((await post(base,'/dm/configure',{key:app.room.join,apiKey:secret})).status,403);
 assert.equal((await post(base,'/dm/configure',{key:app.room.host,apiKey:secret})).status,200);
 const file=path.join(dir,'dm-config.json');assert.equal(fs.statSync(file).mode&0o077,0);
 assert.equal((await post(base,'/dm/test',{key:app.room.host})).status,200);
 assert.equal((await post(base,'/dm',{key:app.room.host,enabled:true})).status,200);
 const status=await(await fetch(base+'/dm/status?key='+app.room.host)).json();assert.equal(status.state,'connected');assert.ok(!JSON.stringify(status).includes(secret));
 const html=await(await fetch(base+'/host?key='+app.room.host)).text();assert.ok(!html.includes(secret));
 const phone=await(await fetch(base+'/join?key='+app.room.join)).text();assert.ok(!phone.includes(secret));
});

test('host-only Refuge Trial persists real multi-phone evidence, not phone text or AI claims',async t=>{
 const {app,base,sockets,dir}=await setup(t,{zone:'The Refuge'});
 assert.equal((await post(base,'/host/adventure',{key:'wrong',action:'start'})).status,403);
 assert.equal((await post(base,'/host/adventure',{key:app.room.host,action:'start'})).status,409);
 const pair=async name=>(await(await post(base,'/pair',{key:app.room.join,name})).json()).token;
 const ada=await pair('Ada'),bryn=await pair('Bryn');
 await new Promise(r=>setTimeout(r,40));
 // Mock actor refresh is authoritative and reports The Refuge, not a client field.
 assert.equal((await post(base,'/host/adventure',{key:app.room.host,action:'start'})).status,201);
 const started=await(await fetch(base+'/state?token='+ada)).json();
 assert.equal(started.adventure.status,'active');
 assert.equal(started.adventure.steps.filter(s=>s.done).length,0);
 const talkRequest=await post(base,'/action',{token:ada,text:'talk to guard'});
 assert.equal(talkRequest.status,202);
 const {id:talkId}=await talkRequest.json();
 assert.equal((await(await fetch(base+'/state?token='+ada)).json()).adventure.steps[0].done,false);
 sockets[0].emit('chaos:receipt',{id:talkId,status:'succeeded',message:'Spoke to guard.'});
 assert.equal(app.room.adventure.npc.player,'Ada');
 app.room.turn.deadline=Date.now()-1;
 const attackRequest=await post(base,'/action',{token:bryn,text:'attack rat'});
 assert.equal(attackRequest.status,202);
 const {id:attackId}=await attackRequest.json();
 sockets[1].emit('chaos:receipt',{id:attackId,status:'started',message:'Hit',combat:{before:29,after:10,dead:false}});
 assert.equal(app.room.adventure.proof,null);
 sockets[1].emit('chaos:receipt',{id:attackId,status:'started',message:'Rat defeated',combat:{before:10,after:0,dead:true}});
 assert.equal(app.room.adventure.proof.route,'combat');
 sockets[1].emit('chaos:receipt',{id:attackId,status:'started',message:'duplicate',combat:{before:10,after:0,dead:true}});
 assert.equal(app.room.adventure.proof.player,'Bryn');
 sockets[0].emit('chaos:position',{ready:true,dead:false,zone:'Glitch Woods'});
 assert.equal(app.room.adventure.woods.player,'Ada');
 sockets[1].emit('chaos:position',{ready:true,dead:false,zone:'The Refuge'});
 assert.equal(app.room.adventure.status,'active','a teammate waiting in town cannot complete the return');
 sockets[0].emit('chaos:position',{ready:true,dead:false,zone:'The Refuge'});
 assert.equal(app.room.adventure.status,'completed');
 const phone=await(await fetch(base+'/state?token='+bryn)).json();
 const tv=await(await fetch(base+'/tv-state?key=tv-key')).json();
 assert.equal(phone.adventure.status,'completed');
 assert.equal(tv.adventure.status,'completed');
 assert.equal(phone.adventure.steps.filter(s=>s.done).length,4);
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'room.json'),'utf8'));
 assert.equal(saved.adventure.status,'completed');
 assert.equal(saved.adventure.proof.route,'combat');
 assert.equal((await post(base,'/host/adventure',{key:app.room.host,action:'start'})).status,409);
 // A completed trial can be explicitly replayed, never silently restarted.
 assert.equal((await post(base,'/host/adventure',{key:'wrong',action:'replay'})).status,403);
 const replay=await post(base,'/host/adventure',{key:app.room.host,action:'replay'});
 assert.equal(replay.status,201);
 const second=await replay.json();
 assert.equal(second.adventure.run,2);
 assert.equal(second.adventure.status,'active');
 assert.equal(second.adventure.steps.filter(s=>s.done).length,0);
 assert.equal(app.room.adventureHistory.length,1);
 assert.equal(app.room.adventureHistory[0].route,'combat');
 assert.equal(JSON.stringify(app.room.adventureHistory).includes(ada),false,'archived run never exposes personal recovery tokens');
 // A late old engine receipt remains a valid old result, but cannot progress
 // the new adventure even if the native socket delivers it after replay.
 sockets[0].emit('chaos:receipt',{id:talkId,status:'succeeded',message:'Delayed guard response.'});
 assert.equal(app.room.adventure.npc,null);
 assert.equal((await post(base,'/host/adventure',{key:app.room.host,action:'replay'})).status,409,
  'an active trial cannot be erased by another replay');
 // Finish the old reaction window and respect the per-player action throttle.
 if(app.room.turn)app.room.turn.deadline=Date.now()-1;
 await new Promise(r=>setTimeout(r,220));
 const newTalk=await post(base,'/action',{token:ada,text:'talk to guard'});
 assert.equal(newTalk.status,202);
 const {id:newTalkId}=await newTalk.json();
 sockets[0].emit('chaos:receipt',{id:newTalkId,status:'succeeded',message:'New guard response.'});
 assert.equal(app.room.adventure.npc.player,'Ada');
 const savedAgain=JSON.parse(fs.readFileSync(path.join(dir,'room.json'),'utf8'));
 assert.equal(savedAgain.adventure.run,2);
 assert.equal(savedAgain.adventureHistory.length,1);
});

test('saved original Chaos class stays bound to the correct native actor, not phone text',async t=>{
 const {app,base,sockets,dir}=await setup(t);
 const a=await post(base,'/pair',{key:app.room.join,name:'Rhea',role:'rogue'});
 assert.equal(a.status,201);const {token:rogueToken}=await a.json();
 const b=await post(base,'/pair',{key:app.room.join,name:'Kira',role:'knight'});
 assert.equal(b.status,201);const {token:knightToken}=await b.json();
 assert.equal(sockets[0].auth.chaosRole,'rogue');assert.equal(sockets[1].auth.chaosRole,'knight');
 assert.equal(sockets[0].auth.chaosPerk,'lucky');
 assert.equal((await(await fetch(base+'/state?token='+rogueToken)).json()).role,'rogue');
 assert.equal((await(await fetch(base+'/state?token='+knightToken)).json()).role,'knight');
 assert.equal((await post(base,'/pair',{key:app.room.join,name:'Cheat',role:'__proto__'})).status,400);
 const old=await post(base,'/pair',{key:app.room.join,name:'Legacy'});assert.equal(old.status,201);
 assert.equal(sockets[2].auth.chaosRole,null);assert.equal(sockets[2].auth.chaosPerk,null);
 const room=JSON.parse(fs.readFileSync(path.join(dir,'room.json'),'utf8'));
 assert.equal(room.players[0].role,'rogue');assert.equal(room.players[1].role,'knight');
 const action=await post(base,'/action',{token:rogueToken,text:'attack rat',role:'knight',perk:'lucky'});
 assert.equal(action.status,202);assert.equal(sockets[0].lastAction.intent.verb,'attack');
 assert.equal(sockets[0].lastAction.role,undefined,'phone cannot override class on action');
});

test('announced world action waits for a real help/hinder reaction before native execution',async t=>{
 const {app,base,sockets}=await setup(t,{reactionMs:90});
 const a=(await(await post(base,'/pair',{key:app.room.join,name:'Ada'})).json()).token;
 const b=(await(await post(base,'/pair',{key:app.room.join,name:'Bryn'})).json()).token;
 await new Promise(r=>setTimeout(r,20));
 const q=await post(base,'/action',{token:a,text:'declare craft green hat from cloth strip and wood splinter'});
 assert.equal(q.status,202);const {id}=await q.json();
 assert.equal(sockets[0].lastAction,undefined,'a declaration must not fabricate a native craft');
 assert.equal(app.sessions.get(a).results.get(id).status,'queued');
 const visible=await(await fetch(base+'/state?token='+b)).json();
 assert.equal(visible.declarations.length,1);assert.equal(visible.declarations[0].player,'Ada');
 assert.equal(JSON.stringify(visible.declarations).includes(a),false);
 const tv=await(await fetch(base+'/tv-state?key=tv-key')).json();
 assert.equal(tv.declarations.length,1);
 assert.equal(JSON.stringify(tv.declarations).includes(app.room.players[0].password),false);
 const h=await post(base,'/action',{token:b,text:'hinder Ada'});
 assert.equal(h.status,202);assert.equal(sockets[1].lastAction.intent.verb,'creative');
 assert.equal(sockets[1].lastAction.intent.target,'hinder Ada');
 assert.equal(app.room.turn,null,'reaction is not a second irreversible action declaration');
 assert.equal((await post(base,'/action',{token:a,text:'steal rug'})).status,409,'actor cannot overwrite queued declaration');
 await new Promise(r=>setTimeout(r,120));
 assert.equal(sockets[0].lastAction.id,id,'the same receipt ID is retained through the delayed dispatch');
 assert.equal(sockets[0].lastAction.intent.verb,'creative');
 assert.equal(sockets[0].lastAction.intent.target,'craft green hat from cloth strip and wood splinter');
 assert.equal(app.sessions.get(a).results.get(id).status,'started');
 assert.equal(app.room.turn,null,'announced action does not open a second 10-second lock after execution');
 assert.equal(app.pending.size,0);
});
test('STOP cancels only the owner pending action; no later native world mutation',async t=>{
 const {app,base,sockets}=await setup(t,{reactionMs:80});
 const a=(await(await post(base,'/pair',{key:app.room.join,name:'Ada'})).json()).token;
 const b=(await(await post(base,'/pair',{key:app.room.join,name:'Bryn'})).json()).token;
 await new Promise(r=>setTimeout(r,20));
 const q=await(await post(base,'/action',{token:a,text:'announce steal guard rug'})).json();
 assert.equal((await post(base,'/action',{token:b,text:'stop'})).status,202);
 assert.equal(app.pending.size,1,'another player cannot cancel the declaration');
 assert.equal((await post(base,'/action',{token:a,text:'stop'})).status,202);
 assert.equal(app.sessions.get(a).results.get(q.id).status,'cancelled');
 await new Promise(r=>setTimeout(r,115));
 assert.equal(sockets[0].lastAction.intent.verb,'cancel','only the native STOP should run');
 assert.equal(app.pending.size,0);
});
test('benched, disconnected and cross-zone characters cannot execute queued world actions',async t=>{
 const {app,base,sockets}=await setup(t,{reactionMs:70});
 const a=(await(await post(base,'/pair',{key:app.room.join,name:'Ada'})).json()).token;
 await new Promise(r=>setTimeout(r,20));
 const first=await(await post(base,'/action',{token:a,text:'declare craft green hat from cloth strip'})).json();
 assert.equal((await post(base,'/host/player',{key:app.room.host,token:a,parked:true})).status,200);
 assert.equal(app.sessions.get(a).results.get(first.id).status,'cancelled');
 await new Promise(r=>setTimeout(r,90));assert.equal(sockets[0].lastAction,undefined);
 assert.equal((await post(base,'/host/player',{key:app.room.host,token:a,parked:false})).status,200);
 await fetch(base+'/state?token='+a);sockets[0].emit('message',[1,1,'Ada',12,12,100,100]);
 await new Promise(r=>setTimeout(r,220));
 const second=await(await post(base,'/action',{token:a,text:'declare repair camp table'})).json();
 app.sessions.get(a).actor.zone='Glitch Woods';
 await new Promise(r=>setTimeout(r,100));
 assert.equal(app.sessions.get(a).results.get(second.id).status,'cancelled');
 assert.equal(sockets[0].lastAction,undefined);
 await new Promise(r=>setTimeout(r,220));
 const third=await(await post(base,'/action',{token:a,text:'declare repair camp table'})).json();
 sockets[0].disconnect();
 assert.equal(app.sessions.get(a).results.get(third.id).status,'cancelled');
 await new Promise(r=>setTimeout(r,100));assert.equal(sockets[0].lastAction,undefined);
});
test('unsupported staged commands never reserve a window or invoke AI',async t=>{
 const {app,base,sockets}=await setup(t,{reactionMs:50});
 const a=(await(await post(base,'/pair',{key:app.room.join,name:'Ada'})).json()).token;
 await new Promise(r=>setTimeout(r,20));
 for(const text of ['declare attack rat','declare move left','declare teleport to castle']){
  const r=await post(base,'/action',{token:a,text});assert.equal(r.status,400,text);
 }
 assert.equal(app.pending.size,0);assert.equal(sockets[0].lastAction,undefined);
});

test('two players can declare in parallel; one STOP never cancels the other native action',async t=>{
 const {app,base,sockets}=await setup(t,{reactionMs:90});
 const tokens=[];
 for(const name of ['Ada','Bryn'])tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 await new Promise(r=>setTimeout(r,20));
 const a=await(await post(base,'/action',{token:tokens[0],text:'declare repair camp table'})).json();
 const b=await(await post(base,'/action',{token:tokens[1],text:'declare make green hat from cloth strip and wood splinter'})).json();
 assert.equal(app.pending.size,2,'there is no global serial queue');
 assert.equal((await post(base,'/action',{token:tokens[0],text:'stop'})).status,202);
 assert.equal(app.sessions.get(tokens[0]).results.get(a.id).status,'cancelled');
 assert.equal(app.pending.size,1);
 await new Promise(r=>setTimeout(r,125));
 assert.equal(sockets[0].lastAction.intent.verb,'cancel');
 assert.equal(sockets[1].lastAction.id,b.id);
 assert.equal(app.sessions.get(tokens[1]).results.get(b.id).status,'started');
 assert.equal(app.pending.size,0);
});

test('major travel requires authenticated strict-majority vote; native path/zone remain authoritative',async t=>{
 const {app,base,sockets}=await setup(t,{zone:'The Refuge'});
 const tokens=[];
 for(const name of ['Ada','Bryn','Cal'])tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 await new Promise(r=>setTimeout(r,25));
 for(let i=0;i<3;i++){app.sessions.get(tokens[i]).actor={id:i+1,ready:true,dead:false,zone:'The Refuge',x:41+i,y:195};}
 assert.equal((await post(base,'/expedition/propose',{token:app.room.join,destination:'woods'})).status,403);
 assert.equal((await post(base,'/expedition/propose',{token:tokens[0],destination:'999,999'})).status,409);
 assert.equal((await post(base,'/expedition/propose',{token:tokens[0],destination:'refuge'})).status,409);
 assert.ok(sockets.every(s=>!s.lastAction),'rejected travel cannot move anyone');
 const proposal=await post(base,'/expedition/propose',{token:tokens[0],destination:'woods'});
 assert.equal(proposal.status,201);
 const {rally}=await proposal.json();
 assert.equal(rally.kind,'expedition');assert.equal(rally.destination,'Glitch Woods');assert.equal(rally.required,2);
 assert.equal((await post(base,'/rally/vote',{token:app.room.join,id:rally.id,yes:true})).status,403);
 assert.ok(sockets.every(s=>!s.lastAction),'proposal is not movement');
 const voted=await post(base,'/rally/vote',{token:tokens[1],id:rally.id,yes:true});
 assert.equal((await voted.json()).rally.status,'approved');
 for(const s of sockets){assert.equal(s.lastAction.intent.verb,'go');assert.deepEqual([s.lastAction.intent.x,s.lastAction.intent.y],[34,188]);}
 assert.equal((await(await fetch(base+'/tv-state?key=tv-key')).json()).rally.arrived,0,'approved is not arrived');
 assert.equal((await post(base,'/rally/vote',{token:tokens[2],id:rally.id,yes:true})).status,409);
 const html=await(await fetch(base+'/join?key='+app.room.join)).text();
 assert.ok(html.includes('Vote to travel to Glitch Woods'));
 assert.ok(!html.includes('actor-key'));
 await new Promise(r=>setTimeout(r,220));
 assert.equal((await post(base,'/action',{token:tokens[1],text:'stop'})).status,202);
 assert.equal(sockets[1].lastAction.intent.verb,'cancel');
});
test('expedition cannot command a benched member or a player who leaves the departure zone',async t=>{
 const {app,base,sockets}=await setup(t,{zone:'The Refuge'});
 const tokens=[];for(const name of ['Ada','Bryn','Cal'])tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 await new Promise(r=>setTimeout(r,25));
 for(let i=0;i<3;i++)app.sessions.get(tokens[i]).actor={id:i+1,ready:true,dead:false,zone:'The Refuge',x:41+i,y:195};
 const proposal=(await(await post(base,'/expedition/propose',{token:tokens[0],destination:'woods'})).json()).rally;
 assert.equal((await post(base,'/host/player',{key:app.room.host,token:tokens[1],parked:true})).status,200);
 app.sessions.get(tokens[2]).actor.zone='Glitch Woods';
 assert.equal((await(await post(base,'/rally/vote',{token:tokens[2],id:proposal.id,yes:true})).json()).rally.status,'approved');
 assert.equal(sockets[0].lastAction.intent.verb,'go');
 assert.equal(sockets[1].lastAction,undefined);
 assert.equal(sockets[2].lastAction,undefined);
});
test('only a native reported destination-zone transition records a travel arrival',async t=>{
 const {app,base,sockets}=await setup(t,{zone:'The Refuge'});
 const tokens=[];for(const name of ['Ada','Bryn'])tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 await new Promise(r=>setTimeout(r,25));
 for(let i=0;i<2;i++){const actor={id:i+1,ready:true,dead:false,zone:'The Refuge',x:41+i,y:195};app.sessions.get(tokens[i]).actor=actor;sockets[i].mockActor=actor;}
 const vote=(await(await post(base,'/expedition/propose',{token:tokens[0],destination:'woods'})).json()).rally;
 assert.equal((await(await post(base,'/rally/vote',{token:tokens[1],id:vote.id,yes:true})).json()).rally.status,'approved');
 assert.equal((await(await fetch(base+'/tv-state?key=tv-key')).json()).rally.arrived,0);
 sockets[0].mockActor={...sockets[0].mockActor,x:34,y:188,zone:'The Refuge'};
 await new Promise(r=>setTimeout(r,1100));
 assert.equal((await(await fetch(base+'/tv-state?key=tv-key')).json()).rally.arrived,0,'coordinates without native zone do not prove arrival');
 sockets[0].mockActor={...sockets[0].mockActor,zone:'Glitch Woods'};
 await new Promise(r=>setTimeout(r,1100));
 const tv=await(await fetch(base+'/tv-state?key=tv-key')).json();
 assert.equal(tv.rally.arrived,1);
 assert.equal(JSON.stringify(tv.rally).includes(tokens[0]),false);
 assert.equal(app.room.events.filter(e=>e.status==='arrived').length,1);
 await new Promise(r=>setTimeout(r,1100));
 assert.equal(app.room.events.filter(e=>e.status==='arrived').length,1,'arrival cannot be double-counted');
});

test('an unfinished approved expedition cannot be silently replaced by another vote',async t=>{
 const {app,base}=await setup(t,{zone:'The Refuge'});
 const tokens=[];for(const name of ['Ada','Bryn'])tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 await new Promise(r=>setTimeout(r,25));
 for(let i=0;i<2;i++)app.sessions.get(tokens[i]).actor={id:i+1,ready:true,dead:false,zone:'The Refuge',x:41+i,y:195};
 const proposal=(await(await post(base,'/expedition/propose',{token:tokens[0],destination:'woods'})).json()).rally;
 assert.equal((await(await post(base,'/rally/vote',{token:tokens[1],id:proposal.id,yes:true})).json()).rally.status,'approved');
 assert.equal((await post(base,'/rally/propose',{token:tokens[0]})).status,409);
 assert.equal((await post(base,'/expedition/propose',{token:tokens[0],destination:'woods'})).status,409);
 assert.equal(app.room.rally.id,proposal.id);
 app.room.rally.resolvedAt=Date.now()-45001;
 assert.equal((await post(base,'/rally/propose',{token:tokens[0]})).status,201,'stale travel does not lock future votes');
});

test('two real phone identities can commit a durable trial objective vote, without authorizing native outcomes',async t=>{
 const {app,base,dir}=await setup(t,{zone:'The Refuge'});
 const tokens=[];for(const name of ['Ada','Bryn','Cal'])tokens.push((await(await post(base,'/pair',{key:app.room.join,name})).json()).token);
 await new Promise(r=>setTimeout(r,30));
 assert.equal((await post(base,'/adventure/choice/propose',{token:tokens[0],route:'craft'})).status,409,'trial must be started');
 assert.equal((await post(base,'/host/adventure',{key:app.room.host,action:'start'})).status,201);
 assert.equal((await post(base,'/adventure/choice/propose',{token:tokens[0],route:'craft'})).status,409,'must speak to NPC first');
 // A server-confirmed native NPC receipt, not player text, unlocks the decision.
 const s=app.sessions.get(tokens[0]);s.results.set('talk1',{status:'received'});s.attempts.set('talk1',{verb:'talk',text:'talk to guard',adventureInstance:app.room.adventure.instanceId});
 s.socket.emit('chaos:receipt',{id:'talk1',status:'succeeded',message:'Talked to native guard',actor:s.actor});
 assert.equal(app.room.adventure.npc.player,'Ada');
 assert.equal((await post(base,'/adventure/choice/propose',{token:tokens[0],route:'fake'})).status,409);
 const proposed=await post(base,'/adventure/choice/propose',{token:tokens[0],route:'craft'});assert.equal(proposed.status,201);
 const {choiceVote}=await proposed.json();assert.equal(choiceVote.required,2);
 assert.equal((await post(base,'/adventure/choice/propose',{token:tokens[1],route:'combat'})).status,409);
 assert.equal((await post(base,'/adventure/choice/vote',{token:app.room.join,id:choiceVote.id,yes:true})).status,403);
 assert.equal((await post(base,'/adventure/choice/vote',{token:tokens[0],id:choiceVote.id,yes:true})).status,409);
 const tv=await(await fetch(base+'/tv-state?key=tv-key')).json();
 assert.equal(tv.choiceVote.route,'craft');assert.equal(JSON.stringify(tv.choiceVote).includes(tokens[0]),false);
 const second=await post(base,'/adventure/choice/vote',{token:tokens[1],id:choiceVote.id,yes:true});
 assert.equal(second.status,200);assert.equal((await second.json()).adventure.choice,'craft');
 assert.equal((await post(base,'/adventure/choice/vote',{token:tokens[2],id:choiceVote.id,yes:true})).status,409);
 assert.equal((await post(base,'/adventure/choice/propose',{token:tokens[2],route:'combat'})).status,409);
 assert.equal(app.room.adventure.proof,null,'voting must not create items, kills or fake objective progress');
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'room.json'),'utf8'));
 assert.equal(saved.adventure.choice.route,'craft');assert.equal(saved.choiceVote,undefined,'vote credentials and ephemeral ballots are not persisted');
 const state=await(await fetch(base+'/state?token='+tokens[2])).json();assert.equal(state.adventure.choice,'craft');
});

test('native environmental changes notify another authenticated phone without room log fabrication',async t=>{
 const {app,base}=await setup(t);
 assert.equal((await fetch(base+'/changes?token=invalid')).status,403);
 const pair=async name=>(await(await post(base,'/pair',{key:app.room.join,name})).json()).token;
 const watcher=await pair('Watcher'),actorToken=await pair('Builder');
 await new Promise(r=>setTimeout(r,40));
 const session=app.sessions.get(actorToken);
 const initial={...session.actor,zone:'Town',chaos:{ground:[{id:'table',condition:'intact',hp:4,tile:{x:3,y:4}}],npcs:[],story:[],camp:null}};
 session.socket.mockActor=initial;
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const deadline=Date.now()+2400;
 while(session.worldFingerprint===null&&Date.now()<deadline)await sleep(50);
 assert.notEqual(session.worldFingerprint,null,'native snapshot baseline must arrive');
 const controller=new AbortController();
 try{
  const stream=await fetch(base+'/changes?token='+watcher,{signal:controller.signal});
  assert.equal(stream.status,200);
  assert.match(stream.headers.get('content-type'),/text\/event-stream/);
  const reader=stream.body.getReader(),decoder=new TextDecoder();
  const first=await reader.read();
  assert.match(decoder.decode(first.value),/connected/);
  session.socket.mockActor={...initial,chaos:{...initial.chaos,ground:[{...initial.chaos.ground[0],condition:'burning',hp:3}]}};
  const event=await Promise.race([
   reader.read().then(v=>decoder.decode(v.value)),
   sleep(2600).then(()=>{throw Error('No world-change notification arrived');})
  ]);
  assert.match(event,/event: change/);
  assert.match(event,/data: \{\}/,'event carries no private world or account data');
  assert.equal((app.room.events||[]).some(e=>e.message?.includes('burning')),false,'world notification must not fabricate a room event');
 }finally{controller.abort();}
});
