import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {EventEmitter} from 'node:events';
import {createPartyBridge} from './party-bridge.mjs';
const post=(base,p,b,headers={})=>fetch(base+p,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(b)});
async function setup(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-room-test-'));const sockets=[];const app=createPartyBridge({root:dir,dataDir:dir,actorKey:'actor-key',tvKey:'tv-key',port:0,bind:'127.0.0.1',ioFactory:()=>{const s=new EventEmitter();s.connected=true;s.connect=()=>{s.connected=true;return s;};s.disconnect=()=>{s.connected=false;s.emit('disconnect');};s.timeout=()=>s;const emit=s.emit.bind(s);s.emit=(event,...args)=>{if(event==='chaos:state'){args[1](null,{ok:true,actor:{id:sockets.indexOf(s)+1,ready:true,x:12,y:12,hp:100}});return true;}if(event==='chaos:save'){args[1](null,{ok:true});return true;}if(event==='chaos:action'){s.lastAction=args[0];const status=s.nextOutcome||'started';s.nextOutcome=null;emit('chaos:receipt',{id:args[0].id,status,message:status});args[1](null,{ok:true});return true;}return emit(event,...args);};sockets.push(s);queueMicrotask(()=>s.emit('message',[1,sockets.length,'Test',12,12,100,100]));return s;}});await app.start();t.after(async()=>{await app.close();fs.rmSync(dir,{force:true,recursive:true});});return {app,dir,sockets,base:`http://127.0.0.1:${app.server.address().port}`};}
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
