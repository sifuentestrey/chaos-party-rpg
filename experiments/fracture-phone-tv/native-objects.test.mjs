import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {discoverNativeObjects} from './native-scenery.mjs';
import {createChaosWorld,shouldUseCreative} from './chaos-world.mjs';
import {reconcileNativeMap} from './native-map-state.ts';
import {createOptionalDM} from './optional-dm.mjs';
function fixture(t,{grass=false}={}){
 const map={width:172,height:314,tilesize:16,data:Array(172*314).fill(592),blocking:[],collisions:[],doors:[{x:21,y:203,tx:100,ty:200}]};const solid=[];
 function stamp(first,w,h,x,y){for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){const gid=first+dy*20+dx,index=(y+dy)*172+x+dx;map.data[index]=[592,gid];if(dy>0||h===1){solid.push(gid);map.collisions.push(index);}}}
 stamp(141,2,3,10,200);stamp(45,7,8,18,196);stamp(18,3,4,32,200);stamp(301,3,4,42,200);stamp(98,2,1,50,200);stamp(241,1,1,16,204);
 // A campfire is not a collision in the native atlas.
 map.collisions=map.collisions.filter(i=>i!==204*172+16);solid.splice(solid.indexOf(241),1);
 if(grass){for(const x of [10,11,12,13])map.data[199*172+x]=155;map.data[199*172+14]=425;map.collisions.push(199*172+14);}
 const nativeTrees=discoverNativeObjects(map,solid),dir=fs.mkdtempSync(path.join(os.tmpdir(),'existing-fracture-objects-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'objects.json');
 function worldFromMap(){const copy=structuredClone(map);copy.grid=Array.from({length:314},(_,y)=>Array.from({length:172},(_,x)=>copy.collisions.includes(y*172+x)?1:0));return {id:'native',map:copy,entities:{},players:{},zoneManager:{getZoneAt:()=>({id:'zone'})},isValidPosition(x,y){return x>0&&x<172&&y>0&&y<314&&this.map.grid[y]?.[x]===0;},pushToPlayer(){}};}
 const world=worldFromMap();let now=1000;
 const p={id:1,characterId:'a',name:'Ash',chaosControlled:true,hasEnteredGame:true,x:9,y:202,hitPoints:90,maxHitPoints:100,getWorld:()=>world,regenHealthBy(n){this.hitPoints=Math.min(100,this.hitPoints+n);},health(){return {hp:this.hitPoints};}};world.players.a=p;
 const engine=createChaosWorld({file,nativeTrees,nativeDoors:map.doors,seed:1,clock:()=>now});engine.snapshot(p);
 return {map,nativeTrees,engine,world,p,file,worldFromMap,tick(){now+=10000;return engine.snapshot(p);}};
}
function succeed(engine,p,command){let r;for(let n=0;n<40;n++){r=engine.execute(p,command);assert.equal(r.blocked,false,r.text);if(r.success)return r;}assert.fail('No successful D20 check: '+r.text);}
test('native tent move changes exact art and complete collision, persists, and restores on a fresh world',t=>{
 const {engine,p,world,file,nativeTrees,worldFromMap}=fixture(t);const tent=engine.snapshot(p).scenery.find(o=>o.kind==='tent');assert.ok(tent);assert.equal(shouldUseCreative('drag tent east',{...p,chaos:engine.snapshot(p)}),true);
 const before=structuredClone(world.map.data);const moved=succeed(engine,p,'drag '+tent.id+' east');assert.ok(moved.roll);assert.deepEqual(moved.object.tile,engine.snapshot(p).scenery.find(o=>o.id===tent.id).interactionTile,'action receipt must show the real new position, not the old contact tile');assert.equal(Object.hasOwn(engine.snapshot(p).scenery.find(o=>o.id===tent.id),'hp'),false);
 assert.equal(world.isValidPosition(10,202),true);assert.equal(world.isValidPosition(12,202),false);assert.deepEqual(world.map.data[202*172+10],[592]);assert.ok(world.map.data[202*172+12].includes(182));assert.deepEqual(world.map.data[210*172+30],before[210*172+30]);
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
 const next=worldFromMap(),restored=createChaosWorld({file,nativeTrees});restored.prepareWorld(next);assert.equal(next.isValidPosition(10,202),true);assert.equal(next.isValidPosition(12,202),false);assert.ok(next.map.data[202*172+12].includes(182));
});
test('native movement rejects a blocked far corner, occupied footprint, door and other actor without consuming a die',t=>{
 const {engine,p,world,file}=fixture(t);const command='push tent east',before=fs.readFileSync(file,'utf8');
 world.map.grid[200][12]=1;assert.equal(engine.execute(p,command).blocked,true);world.map.grid[200][12]=0;
 world.entities.friend={id:2,x:12,y:202,type:'player'};assert.equal(engine.execute(p,command).blocked,true);delete world.entities.friend;
 p.chaosControlled=false;assert.equal(engine.execute(p,command).blocked,true);p.chaosControlled=true;
 assert.equal(fs.readFileSync(file,'utf8'),before);p.x=70;assert.equal(engine.execute(p,command).blocked,true);
});
test('a player login record without a native world body cannot invisibly block a prop',t=>{
 const {engine,p,world}=fixture(t);world.players.login={id:9,type:'player',x:12,y:202,hasEnteredGame:false};world.players.departed={id:10,type:'player',x:12,y:201,hasEnteredGame:true};
 succeed(engine,p,'push tent east');assert.equal(engine.snapshot(p).scenery.find(o=>o.kind==='tent').tile.x,11);
});
test('native stone material, fire containment and wetness have genuine different consequences',t=>{
 const {engine,p,world,tick,file}=fixture(t);p.x=31;p.y=203;assert.equal(engine.execute(p,'ignite boulder').blocked,true);assert.equal(engine.execute(p,'pick up boulder').blocked,true);succeed(engine,p,'roll boulder east');assert.equal(world.isValidPosition(32,203),true);assert.equal(world.isValidPosition(35,203),false);
 p.x=15;p.y=204;const fire=engine.snapshot(p).scenery.find(o=>o.kind==='fire');assert.equal(fire.condition,'burning');tick();assert.equal(engine.snapshot(p).scenery.find(o=>o.id===fire.id).condition,'burning');
 assert.equal(engine.execute(p,'put out campfire').success,true);assert.deepEqual(world.map.data[204*172+16],[592]);assert.equal(engine.execute(p,'ignite campfire').blocked,true);tick();tick();tick();succeed(engine,p,'ignite campfire');assert.ok(world.map.data[204*172+16].includes(241));assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
});
test('existing house upper roof burns or breaks and can be restored without removing the facade or doorway',t=>{
 const {engine,p,world,map}=fixture(t);p.x=17;p.y=203;const lower=structuredClone(world.map.data[203*172+20]);const roof=engine.snapshot(p).scenery.find(o=>o.kind==='roof');assert.ok(roof);
 succeed(engine,p,'break '+roof.id);assert.deepEqual(world.map.data[197*172+18],[592]);assert.deepEqual(world.map.data[203*172+20],lower);assert.equal(world.isValidPosition(20,203),false);assert.deepEqual(map.doors,[{x:21,y:203,tx:100,ty:200}]);
 succeed(engine,p,'repair '+roof.id);assert.ok(world.map.data[197*172+18].includes(65));assert.equal(world.isValidPosition(18,197),false);
});
test('real native water uses native health API and persisted cooldown; NPC warns and douses adjacent real scenery',t=>{
 const {engine,p,world,tick,file}=fixture(t);p.x=41;p.y=203;assert.equal(engine.execute(p,'drink from well').success,true);assert.equal(p.hitPoints,95);assert.equal(engine.execute(p,'drink well').blocked,true);
 p.x=9;p.y=202;world.entities.guard={id:8,type:'npc',kind:40,name:'guard',x:9,y:201};succeed(engine,p,'ignite tent');assert.ok(engine.snapshot(p).npcs[0].concern);tick();assert.equal(engine.snapshot(p).scenery.find(o=>o.kind==='tent').condition,'burning');tick();assert.equal(engine.snapshot(p).scenery.find(o=>o.kind==='tent').condition,'intact');
 const saved=JSON.parse(fs.readFileSync(file));assert.ok(Object.values(saved.npcs)[0].history.some(h=>h.verb==='extinguish'));assert.equal(p.hitPoints,95,'fire does not fabricate native damage');
});
test('reconciliation is reversible and preserves independently painted layers',()=>{
 const map={width:8,data:Array(64).fill(155),grid:Array.from({length:8},()=>Array(8).fill(0))};map.data[18]=[155,141,999];map.grid[2][2]=1;
 const def={id:'tent',tile:{x:2,y:2},cells:[{x:2,y:2,gid:141}],footprint:[{x:2,y:2}]};
 reconcileNativeMap(map,[def],[{id:'tent',tile:{x:3,y:2},condition:'intact'}]);assert.deepEqual(map.data[18],[155,999]);assert.deepEqual(map.data[19],[155,141]);assert.equal(map.grid[2][3],1);
 reconcileNativeMap(map,[def],[]);assert.deepEqual(map.data[18],[155,141,999]);assert.equal(map.data[19],155);assert.equal(map.grid[2][2],1);assert.equal(map.grid[2][3],0);
});
test('native grass fire spreads one hop, exposes existing soil, and actual nearby water protects the next patch',t=>{
 const {engine,p,tick,world,file}=fixture(t,{grass:true});succeed(engine,p,'ignite tent');p.x=11;p.y=199;
 let s=tick();const grass=s.scenery.filter(o=>o.kind==='grass').sort((a,b)=>a.tile.x-b.tile.x);assert.equal(grass[0].condition,'burning');assert.equal(grass[1].condition,'intact');
 s=tick();assert.equal(s.scenery.find(o=>o.id===grass[0].id).condition,'broken');assert.equal(s.scenery.find(o=>o.id===grass[1].id).condition,'intact');assert.deepEqual(world.map.data[199*172+10],[592]);assert.equal(world.map.data[199*172+12],155);assert.equal(world.isValidPosition(14,199),false);assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
});
test('failed native save leaves object art, collision, position and dice unchanged',t=>{
 const {engine,p,world,file}=fixture(t);const before=fs.readFileSync(file,'utf8'),art=structuredClone(world.map.data);fs.renameSync(file,file+'.retained');fs.mkdirSync(file);
 assert.throws(()=>engine.execute(p,'push tent east'));fs.rmdirSync(file);fs.renameSync(file+'.retained',file);
 assert.equal(fs.readFileSync(file,'utf8'),before);assert.deepEqual(world.map.data,art);assert.equal(world.isValidPosition(10,202),false);assert.equal(engine.snapshot(p).scenery.find(o=>o.kind==='tent').tile.x,10);
});
test('live DM contract grounds native physical proposals in exact IDs and actual capabilities',async t=>{
 const {engine,p,file}=fixture(t);let target='push fracture:native:native-tent-10-200 east';const dm=createOptionalDM({dataDir:path.dirname(file),key:'test',enabled:true,fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({verb:'creative',target})}}]})})});t.after(()=>dm.close());
 const actor={...p,chaos:engine.snapshot(p)};assert.ok(await dm.interpret('slide the canvas shelter aside',actor));target='push fracture:native:imaginary-tent east';assert.equal(await dm.interpret('slide it',actor),null);target='ignite fracture:native:native-boulder-32-200';actor.chaos.scenery.push({id:'fracture:native:native-boulder-32-200',cells:[{}],capabilities:{flammable:false}});assert.equal(await dm.interpret('melt the rock',actor),null);
});

test('typed AI DM moves an existing Fracture tent with a real D20, original tiles and durable collision',t=>{
 const {engine,p,world,file,nativeTrees,worldFromMap}=fixture(t);
 const tent=engine.snapshot(p).scenery.find(o=>o.kind==='tent');
 assert.ok(tent?.nativeAdapter,'the exact native object must expose an authoritative adapter');
 const proposal={action:'move_east',targetId:tent.id,ability:'strength',dc:10,description:'Shift the existing tent one tile east.'};
 const before=fs.readFileSync(file,'utf8');
 assert.equal(engine.adjudicateEnvironment(p,{...proposal,dc:1}).blocked,true);
 assert.equal(engine.adjudicateEnvironment(p,{...proposal,targetId:'fracture:native:invented-tent'}).blocked,true);
 assert.equal(fs.readFileSync(file,'utf8'),before,'invalid model proposals consume no dice or saved changes');
 let result;
 for(let n=0;n<40;n++){result=engine.adjudicateEnvironment(p,proposal);assert.equal(result.blocked,false,result.text);if(result.success)break;}
 assert.equal(result.success,true,'a genuine D20 eventually moves the existing tent');
 assert.ok(Number.isInteger(result.roll));assert.equal(result.dc,10);
 assert.equal(world.isValidPosition(10,202),true);
 assert.equal(world.isValidPosition(12,202),false);
 assert.ok(world.map.data[202*172+12].includes(182),'original atlas art moves, not a synthetic prop');
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
 const restoredWorld=worldFromMap(),restored=createChaosWorld({file,nativeTrees});
 restored.prepareWorld(restoredWorld);
 assert.equal(restoredWorld.isValidPosition(12,202),false,'restarted collision follows the original tent');
});
test('typed AI DM repairs an actual native roof, but never moves protected architecture',t=>{
 const {engine,p,world,file}=fixture(t);p.x=17;p.y=203;
 const roof=engine.snapshot(p).scenery.find(o=>o.kind==='roof');
 assert.ok(roof?.nativeAdapter);
 const push={action:'move_east',targetId:roof.id,ability:'strength',dc:roof.dc,description:'Move the whole house.'};
 assert.equal(engine.adjudicateEnvironment(p,push).blocked,true);
 let broken;
 for(let n=0;n<40;n++){
  broken=engine.adjudicateEnvironment(p,{action:'break',targetId:roof.id,ability:'strength',dc:16,description:'Bring down the existing roof.'});
  assert.equal(broken.blocked,false,broken.text);if(broken.success)break;
 }
 assert.equal(broken.success,true);
 let repaired;
 for(let n=0;n<40;n++){
  repaired=engine.adjudicateEnvironment(p,{action:'repair',targetId:roof.id,ability:'dexterity',dc:12,description:'Restore the original roof.'});
  assert.equal(repaired.blocked,false,repaired.text);if(repaired.success)break;
 }
 assert.equal(repaired.success,true);
 assert.ok(world.map.data[197*172+18].includes(65),'the exact original roof art returns');
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
});
test('optional AI environment proposal can select an existing movable tent without inventing geometry',async t=>{
 const {engine,p,file}=fixture(t);
 const tent=engine.snapshot(p).scenery.find(o=>o.kind==='tent');
 const proposal={action:'move_east',targetId:tent.id,ability:'strength',dc:10,description:'Try to move the tent east.'};
 const dm=createOptionalDM({dataDir:path.dirname(file),key:'test',enabled:true,
  fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(proposal)}}]})})});
 t.after(()=>dm.close());
 const actor={...p,ready:true,dead:false,chaos:engine.snapshot(p)};
 assert.deepEqual(await dm.interpretEnvironment('Could you shift the canvas shelter to the right?',actor),proposal);
 assert.deepEqual(await dm.interpretEnvironment('Could you shift the canvas shelter to the right?',{...actor,x:7}),proposal,'the model may suggest a visible target before the engine walks into reach');
 assert.equal(await dm.interpretEnvironment('Could you shift it?',{...actor,chaos:{scenery:[]}}),null);
});

test('one existing native small rock can be picked up, carried, dropped and restored with original art and collision',t=>{
 const {engine,p,world,file,nativeTrees,worldFromMap}=fixture(t);
 p.x=49;p.y=200;
 const pebble=engine.snapshot(p).scenery.find(o=>o.nativeOrigin?.x===50&&o.nativeOrigin?.y===200);
 assert.ok(pebble?.capabilities.portable,'only the verified existing small-rock stamp is portable');
 assert.equal(world.isValidPosition(50,200),false);
 const picked=engine.execute(p,'pick up '+pebble.id);
 assert.equal(picked.success,true,picked.text);
 assert.equal(picked.roll,undefined,'a small loose rock does not require a strength roll');
 assert.equal(world.isValidPosition(50,200),true,'original collision is removed when held');
 assert.equal(world.isValidPosition(51,200),true,'the entire original small-rock footprint is released');
 assert.deepEqual(world.map.data[200*172+50],[592],'the original atlas layer disappears while held');
 assert.deepEqual(world.map.data[200*172+51],[592],'the second original atlas cell also disappears');
 assert.equal(engine.snapshot(p).scenery.some(o=>o.id===pebble.id),false,'held rock is not painted on the ground');
 assert.equal(engine.snapshot(p).bag.filter(o=>o.id===pebble.id&&o.carried).length,1);
 assert.equal(engine.execute(p,'take '+pebble.id).success,false,'cannot duplicate the same native rock');
 const second={...p,id:2,characterId:'other',name:'Other',x:52,y:200};
 world.players.other=second;
 assert.equal(engine.execute(second,'drop '+pebble.id).success,false,'another actor cannot drop the owner's rock');
 p.x=52;p.y=200;
 const before=fs.readFileSync(file,'utf8');
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]])world.map.grid[p.y+dy][p.x+dx]=1;
 assert.equal(engine.execute(p,'drop '+pebble.id).blocked,true,'no fabricated placement through a blocked tile');
 assert.equal(fs.readFileSync(file,'utf8'),before,'blocked drop cannot change durable state');
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]])world.map.grid[p.y+dy][p.x+dx]=0;
 const dropped=engine.execute(p,'put down '+pebble.id);
 assert.equal(dropped.success,true,dropped.text);
 assert.deepEqual(dropped.object.tile,{x:53,y:200});
 assert.equal(world.isValidPosition(53,200),false,'same original rock collision follows its new tile');
 assert.equal(world.isValidPosition(50,200),true);
 assert.ok(world.map.data[200*172+53].includes(98),'the actual first original Fracture tile is repainted');
 assert.ok(world.map.data[200*172+54].includes(99),'the actual second original Fracture tile is repainted');
 assert.equal(engine.snapshot(p).bag.some(o=>o.id===pebble.id),false);
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0,'no synthetic inventory prop or art is created');
 const next=worldFromMap(),restored=createChaosWorld({file,nativeTrees});
 restored.prepareWorld(next);
 assert.equal(next.isValidPosition(50,200),true);
 assert.equal(next.isValidPosition(53,200),false);
 assert.ok(next.map.data[200*172+53].includes(98),'restart keeps the exact existing atlas rock');
 assert.ok(next.map.data[200*172+54].includes(99));
});

test('typed AI DM proposes a genuine native small-rock pickup and owner-only drop without fabricated loot',async t=>{
 const {engine,p,file,world}=fixture(t);p.x=49;p.y=200;
 const pebble=engine.snapshot(p).scenery.find(o=>o.nativeOrigin?.x===50&&o.nativeOrigin?.y===200);
 const pickup={action:'take',targetId:pebble.id,ability:'none',dc:0,description:'Pick up this verified loose pebble.'};
 let proposal=pickup;
 const dm=createOptionalDM({dataDir:path.dirname(file),key:'test',enabled:true,
  fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(proposal)}}]})})});
 t.after(()=>dm.close());
 const actor=()=>({...p,ready:true,dead:false,chaos:engine.snapshot(p)});
 assert.deepEqual(await dm.interpretEnvironment('Can I pocket that tiny stone?',actor()),pickup);
 assert.equal(engine.adjudicateEnvironment(p,{...pickup,targetId:'invented-stone'}).blocked,true);
 assert.equal(engine.adjudicateEnvironment(p,{...pickup,dc:1}).blocked,true);
 assert.equal(engine.adjudicateEnvironment(p,pickup).success,true);
 assert.equal(world.isValidPosition(50,200),true);
 p.x=52;p.y=200;
 proposal={action:'drop',targetId:pebble.id,ability:'none',dc:0,description:'Put down the same carried rock.'};
 assert.deepEqual(await dm.interpretEnvironment('Put the rock down here',actor()),proposal);
 assert.equal(engine.adjudicateEnvironment(p,proposal).success,true);
 assert.equal(world.isValidPosition(53,200),false);
});
