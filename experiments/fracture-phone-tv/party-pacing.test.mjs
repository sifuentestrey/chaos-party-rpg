import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createPartyPacing,createSimulationClock,PACING_TIMES} from './party-pacing.mjs';
import {sceneAt} from './scene-view.mjs';
function fixture(count=3,spawnY=2){
 let now=100000;const stopped=[],executed=[];
 const world={players:{},mobs:{},zoneManager:{getZoneAt:()=>({name:'Refuge'})}};
 for(let i=0;i<count;i++){const p={id:i+1,x:2+i,y:spawnY,chaosControlled:true,chaosPartyId:'party',hasEnteredGame:true,isDead:false,name:'Player '+i,connection:{_connection:{connected:true}},chaosStopAction:reason=>stopped.push({actor:i+1,reason}),chaosExecutePlan:d=>executed.push(d),chaosExecuteTravel:t=>executed.push({actor:i+1,travel:t.id}),getWorld:()=>world};world.players[p.id]=p;}
 const clock=createSimulationClock({wall:()=>now});const pacing=createPartyPacing({world,clock,sceneAt,wall:()=>now});pacing.enable('party');
 return {world,clock,pacing,people:Object.values(world.players),stopped,executed,advance:ms=>{now+=ms;pacing.tick();}};
}
test('all players choose concurrently; planning freezes simulation and exactly one burst executes',()=>{
 const f=fixture(),{pacing,people,clock}=f;pacing.beginPlanning('A rat engages');const before=clock.now();f.advance(10000);assert.equal(clock.now(),before);
 for(const p of people){pacing.queue(p,{id:'action-'+p.id,text:'fight',intent:{verb:'attack',target:'rat'}});pacing.ready(p,true,1);}
 assert.equal(pacing.phase,'preparation');const plans=pacing.prepare();assert.equal(plans.length,3);assert.ok(pacing.commit(1,plans));assert.equal(f.executed.length,3);assert.equal(pacing.phase,'action');assert.equal(pacing.commit(1,plans),false);
 f.advance(5000);assert.equal(pacing.phase,'recap');assert.equal(clock.now()-before,5000);f.advance(4000);assert.equal(pacing.phase,'exploration');assert.equal(clock.now()-before,5000);
});
test('silent players hold after 30 seconds; extensions and stale readiness use the actual round',()=>{
 const f=fixture();f.pacing.beginPlanning();f.pacing.extend(1);assert.equal(f.pacing.snapshot(f.people[0]).deadline,145000);f.advance(30000);assert.equal(f.pacing.phase,'planning');
 assert.throws(()=>f.pacing.ready(f.people[0],true,0),/closed/);f.advance(15000);assert.equal(f.pacing.phase,'preparation');f.advance(7000);assert.equal(f.pacing.phase,'action');assert.equal(f.executed.length,0);assert.equal(f.stopped.length,3);
});
test('STOP during preparation fences late AI, and one actor cannot cancel another choice',()=>{
 const f=fixture();f.pacing.beginPlanning();for(const p of f.people){f.pacing.queue(p,{id:'a'+p.id,intent:{verb:'attack',target:'rat'}});f.pacing.ready(p,true,1);}
 const plans=f.pacing.prepare();f.pacing.cancel(f.people[0]);f.pacing.commit(1,plans.map(d=>({...d,intent:{verb:'ability'}})));assert.deepEqual(f.executed.map(d=>d.actorId),[2,3]);
});
test('continuing an unfinished action needs a fresh choice; a late join cannot accelerate this round',()=>{
 const f=fixture(2);f.people[0].chaosPendingAction=()=>({id:'old',intent:{verb:'go',x:8,y:8},text:'Walk to the oak'});f.pacing.beginPlanning();
 f.world.players[3]={...f.people[0],id:3};assert.equal(f.pacing.snapshot(f.world.players[3]).eligible,false);assert.throws(()=>f.pacing.ready(f.world.players[3],true,1),/next/);
 f.advance(30000);f.pacing.commit(1,f.pacing.prepare());assert.equal(f.executed.length,0);assert.ok(f.stopped.some(s=>s.actor===1));
});
test('disconnected voters do not hold readiness open, and loss of all phones releases the pause',()=>{
 const f=fixture(2);f.pacing.beginPlanning();f.pacing.ready(f.people[0],true,1);f.people[1].connection._connection.connected=false;f.pacing.tick();assert.equal(f.pacing.phase,'preparation');
 f.people[0].connection._connection.connected=false;f.pacing.tick();assert.equal(f.clock.paused,false);assert.equal(f.pacing.phase,'exploration');
});
test('a strict majority approves native travel; arrivals and blocked edges cannot be invented',()=>{
 const f=fixture();f.people[0].x=1;f.people[1].x=28;f.people[2].x=31;
 const target={id:'east',name:'east',area:sceneAt({x:32,y:2,zone:'Refuge'}),intent:{verb:'go',x:32,y:2}};
 const vote=f.pacing.proposeTravel(f.people[0],target);assert.equal(vote.required,2);assert.equal(f.executed.length,0);assert.equal(f.pacing.walkable(f.people[0],32,2),false);
 f.pacing.voteTravel(f.people[1],vote.id,true);assert.equal(f.pacing.phase,'travel');assert.equal(f.executed.length,3);assert.equal(f.pacing.walkable(f.people[0],32,2),true);assert.equal(f.pacing.walkable(f.people[0],90,2),false);
 f.people[0].x=32;f.pacing.tick();assert.equal(f.pacing.area.x,0);f.people[1].x=33;f.pacing.tick();assert.equal(f.pacing.area.x,32);assert.equal(f.pacing.snapshot().travel.arrived,2);
 f.advance(PACING_TIMES.travel);assert.equal(f.pacing.phase,'exploration');assert.equal(f.pacing.snapshot().travel.arrived,2);
});
test('a declined vote moves nobody and normal scene boundaries allow only returning stragglers',()=>{
 const f=fixture();const target={id:'west',area:sceneAt({x:32,y:2,zone:'Refuge'}),intent:{verb:'go',x:32,y:2}};const v=f.pacing.proposeTravel(f.people[0],target);f.pacing.voteTravel(f.people[1],v.id,false);f.pacing.voteTravel(f.people[2],v.id,false);assert.equal(f.executed.length,0);assert.equal(f.pacing.snapshot().travel.status,'declined');
 assert.equal(f.pacing.walkable(f.people[0],40,2),false);f.people[0].x=34;assert.equal(f.pacing.walkable(f.people[0],33,2),true);assert.equal(f.pacing.walkable(f.people[0],35,2),false);
});
test('twenty players ready in one shared window and a nearby enemy cannot damage during planning',()=>{
 const f=fixture(20);const mob={id:90,target:1,hitPoints:10,isDead:false};f.world.mobs[90]=mob;
 assert.ok(f.pacing.noticeThreat(f.people[0],mob));assert.equal(f.pacing.paused,true);
 for(const p of f.people)f.pacing.ready(p,true,1);assert.equal(f.pacing.phase,'preparation');assert.equal(f.pacing.snapshot().total,20);f.pacing.commit(1,[]);f.advance(5000);f.advance(4000);assert.equal(f.pacing.phase,'planning');assert.equal(f.pacing.roundId,2);
});
test('paused clock survives restart without aging effect deadlines or catching up elapsed ticks',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-clock-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let now=10000;const file=path.join(dir,'clock.json'),clock=createSimulationClock({file,wall:()=>now});clock.pause();now+=60000;assert.equal(clock.now(),10000);
 const recovered=createSimulationClock({file,wall:()=>now});assert.equal(recovered.now(),10000);now+=5000;assert.equal(recovered.now(),15000);recovered.pause();now+=4000;recovered.resume();assert.equal(recovered.now(),15000);
});
test('a signature ability supplements the chosen action without discarding its target',()=>{
 const f=fixture(1),p=f.people[0];f.pacing.beginPlanning();f.pacing.queue(p,{id:'attack',text:'attack rat',intent:{verb:'attack',target:'90'}});f.pacing.queue(p,{id:'buff',text:'Power Strike',intent:{verb:'ability'}});
 assert.equal(f.pacing.snapshot(p).draft.text,'Power Strike · attack rat');f.pacing.ready(p,true,1);f.pacing.commit(1,f.pacing.prepare());assert.deepEqual(f.executed.map(d=>d.id),['buff','attack']);
});
test('a stopped traveller can rejoin along approved native routes after the majority moves on',()=>{
 const f=fixture(),target={id:'east',name:'east',area:sceneAt({x:32,y:2,zone:'Refuge'}),intent:{verb:'go',x:32,y:2}};
 const v=f.pacing.proposeTravel(f.people[0],target);f.pacing.voteTravel(f.people[1],v.id,true);f.people[0].x=32;f.people[1].x=33;f.pacing.tick();f.pacing.cancel(f.people[2]);f.advance(PACING_TIMES.travel);
 assert.equal(f.pacing.snapshot(f.people[2]).outside,true);assert.equal(f.pacing.walkable(f.people[2],31,2),true);f.pacing.rejoin(f.people[2]);assert.equal(f.executed.at(-1).travel,v.id);assert.equal(f.pacing.snapshot(f.people[2]).returning,true);
});
test('STOP before travel approval cancels only that actor, without cancelling the other voters',()=>{
 const f=fixture(),receipts=[];f.people[0].chaosReceipt=(id,status,message)=>receipts.push({id,status,message});
 const target={id:'door',name:'house',area:sceneAt({x:32,y:2,zone:'Refuge'}),intent:{verb:'enter'},request:{id:'entry-request',actorId:1}};
 const v=f.pacing.proposeTravel(f.people[0],target);f.pacing.cancel(f.people[0]);f.pacing.voteTravel(f.people[1],v.id,true);
 assert.deepEqual(f.executed.map(r=>r.actor),[2,3]);assert.equal(receipts.at(-1).status,'cancelled');
});
test('a doorway request cannot succeed until native positions confirm actual arrival',()=>{
 const f=fixture(),receipts=[];f.people[0].chaosReceipt=(id,status)=>receipts.push({id,status});
 const v=f.pacing.proposeTravel(f.people[0],{id:'door',area:sceneAt({x:32,y:2,zone:'Refuge'}),intent:{verb:'enter'},request:{id:'entry',actorId:1}});
 f.pacing.voteTravel(f.people[1],v.id,true);assert.equal(receipts.length,0);for(const p of f.people)p.x=32;f.pacing.tick();assert.deepEqual(receipts,[{id:'entry',status:'succeeded'}]);
});
test('approved travel can reroute around a guard through the transition strip, but cannot claim a woods arrival there',()=>{
 const f=fixture(3,20);f.world.zoneManager.getZoneAt=(x,y)=>({name:y>=15?'Refuge':'Woods'});
 const target={id:'north',area:sceneAt({x:8,y:5,zone:'Woods'}),intent:{verb:'go',x:8,y:5},corridor:Array.from({length:16},(_,i)=>({x:8,y:20-i}))};
 const vote=f.pacing.proposeTravel(f.people[0],target);f.pacing.voteTravel(f.people[1],vote.id,true);
 assert.equal(f.pacing.walkable(f.people[0],7,16),true);f.people[0].x=7;f.people[0].y=16;f.pacing.tick();assert.equal(f.pacing.snapshot().travel.arrived,0);
 f.people[0].y=14;f.pacing.tick();assert.equal(f.pacing.snapshot().travel.arrived,1);
});

test('twenty fresh exploration actions survive a shared opening without admitting old planning or previous-server input',()=>{
 const f=fixture(20),source=f.pacing.snapshot(f.people[0]),context={instanceId:source.instanceId,phase:source.phase,roundId:source.roundId};
 f.pacing.beginPlanning('A rat engages');
 for(const p of f.people){assert.doesNotThrow(()=>f.pacing.admitAction(context));f.pacing.queue(p,{id:'opening-'+p.id,intent:{verb:'attack',target:'rat'},text:'Attack the rat'});}
 assert.equal(f.pacing.prepare().length,20);
 assert.throws(()=>f.pacing.admitAction({...context,phase:'planning'}),/passed/);
 assert.throws(()=>f.pacing.admitAction({...context,instanceId:'previous-server'}),/connection/);
 for(const p of f.people)f.pacing.ready(p,true,1);f.pacing.commit(1,f.pacing.prepare());assert.equal(f.executed.length,20);
 f.advance(5000);f.advance(4000);assert.throws(()=>f.pacing.admitAction(context),/passed/);
 f.pacing.beginPlanning();assert.throws(()=>f.pacing.admitAction(context),/passed/);
 assert.throws(()=>f.pacing.admitAction({...context,phase:'planning',roundId:1}),/passed/);
 const fresh=f.pacing.snapshot(f.people[0]);assert.doesNotThrow(()=>f.pacing.admitAction(fresh));
});

test('a twenty-person offline recap stays readable and prioritizes real world consequences',()=>{
 const f=fixture(20);f.pacing.beginPlanning();for(const p of f.people){f.pacing.queue(p,{id:'a'+p.id,intent:p.id===1?{verb:'attack',target:'rat'}:{verb:'move',dx:1,dy:0,steps:1}});f.pacing.ready(p,true,1);}f.pacing.commit(1,f.pacing.prepare());
 for(const p of [...f.people].reverse())f.pacing.record(p,{id:'a'+p.id,status:'succeeded',message:p.id===1?'The rat falls.':'Walked one tile.'});
 f.advance(5000);const recap=f.pacing.snapshot().recap;assert.equal(recap.outcomes.length,20);assert.equal(recap.text.split('\n').length,3);assert.match(recap.text.split('\n')[0],/The rat falls/);
});

test('crossing the destination boundary is not arrival until the native formation position is reached',()=>{
 const f=fixture(2),target={id:'east',area:sceneAt({x:32,y:2,zone:'Refuge'}),intent:{verb:'go',x:38,y:2}};
 f.people[0].chaosTravelArrived=()=>f.people[0].x===38;f.people[1].chaosTravelArrived=()=>f.people[1].x===39;
 const vote=f.pacing.proposeTravel(f.people[0],target);f.pacing.voteTravel(f.people[1],vote.id,true);f.people[0].x=32;f.people[1].x=33;f.pacing.tick();assert.equal(f.pacing.snapshot().travel.arrived,0);
 f.people[0].x=38;f.pacing.tick();assert.equal(f.pacing.snapshot().travel.arrived,1);f.people[1].x=39;f.pacing.tick();assert.equal(f.pacing.snapshot().travel.arrived,2);assert.equal(f.pacing.phase,'exploration');
});

test('a recovered paused clock commits its resumed offset before a second restart',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-restart-clock-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'clock.json');let wall=100;const options={file,wall:()=>wall};
 createSimulationClock(options).pause();wall=1100;const firstRestart=createSimulationClock(options);assert.equal(firstRestart.now(),100);wall=1600;assert.equal(firstRestart.now(),600);assert.equal(createSimulationClock(options).now(),600);assert.equal(JSON.parse(fs.readFileSync(file)).pausedAt,null);
});
