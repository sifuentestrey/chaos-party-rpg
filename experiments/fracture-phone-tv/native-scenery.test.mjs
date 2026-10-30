import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {discoverNativeTrees} from './native-scenery.mjs';import {createChaosWorld,shouldUseCreative,unsupportedNativeEnvironment} from './chaos-world.mjs';
function mapFixture(){const map={width:172,height:314,tilesize:16,data:Array(172*314).fill(155),blocking:[],collisions:[],doors:[]};for(let dy=0;dy<5;dy++)for(let dx=0;dx<4;dx++){const n=(200+dy)*172+30+dx;map.data[n]=[155,213+dy*20+dx];if(dy>=3&&dx>=1&&dx<=2)map.collisions.push(n);}return map;}
test('complete native trees register; incomplete art and independent solid layers never gain destructive permission',()=>{
 const map=mapFixture();assert.equal(discoverNativeTrees(map,[274,275,294,295,999]).length,1);
 map.data[200*172+30]=155;assert.deepEqual(discoverNativeTrees(map,[274,275,294,295]),[]);
 const wall=mapFixture();wall.data[203*172+31]=[999,274];assert.deepEqual(discoverNativeTrees(wall,[999,274,275,294,295]),[]);
 const blocked=mapFixture();blocked.blocking.push(203*172+31);assert.deepEqual(discoverNativeTrees(blocked,[274,275,294,295]),[]);
 const rockUnderCanopy=mapFixture();rockUnderCanopy.data[201*172+30]=[155,233,999];
 assert.deepEqual(discoverNativeTrees(rockUnderCanopy,[274,275,294,295,999]),[],'solid rock under existing canopy cannot be erased');
 const overlapped=mapFixture();overlapped.data[203*172+31]=[155,274,275];
 assert.deepEqual(discoverNativeTrees(overlapped,[274,275,294,295]),[],'overlapping native tree artwork cannot lose another tree collision');
});
function nativeFixture(t){const map=mapFixture(),nativeTrees=discoverNativeTrees(map,[274,275,294,295]);const dir=fs.mkdtempSync(path.join(os.tmpdir(),'native-map-mechanics-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'objects.json');const grid=Array.from({length:314},()=>Array(172).fill(0));for(const n of map.collisions)grid[Math.floor(n/172)][n%172]=1;grid[210][35]=1;
 const world={id:'test',map:{grid},entities:{},players:{},zoneManager:{getZoneAt:()=>({name:'The Refuge'})},isValidPosition:(x,y)=>x>0&&x<172&&y>0&&y<314&&grid[y][x]===0};
 const p={id:1,characterId:'alice',name:'Alice',chaosControlled:true,hasEnteredGame:true,isDead:false,x:30,y:204,hitPoints:100,maxHitPoints:100,getWorld:()=>world};world.players.alice=p;let now=1000;
 const engine=createChaosWorld({file,nativeTrees,seed:1,clock:()=>now});return {p,engine,file,world,nativeTrees,tick:()=>{now+=10000;return engine.snapshot(p)}};}
test('existing native oak takes one D20 check per chop, never displays HP, and clears only its real trunk',t=>{
 const {p,engine,file,world,nativeTrees}=nativeFixture(t);
 const tree=engine.snapshot(p).scenery.find(o=>o.nativeOrigin);
 assert.ok(tree);assert.equal(Object.hasOwn(tree,'hp'),false);
 assert.equal(shouldUseCreative('please cut down the tree!',{chaos:engine.snapshot(p)}),true);
 assert.equal(shouldUseCreative('kick the tree',{chaos:engine.snapshot(p)}),true);
 let result;
 for(let n=0;n<40;n++){
  const before=JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp;
  result=engine.execute(p,'chop tree');
  assert.equal(result.blocked,false);assert.equal(result.dc,14);
  assert.ok(Number.isInteger(result.roll));assert.doesNotMatch(result.text,/\\bHP\\b/i);
  assert.ok(result.object===undefined||result.object.after===null,'native durability is never displayed, including failed rolls');
  if(!result.success)assert.equal(JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp,before,'a failed check does not chip durability');
  else break;
 }
 assert.equal(result.success,true);
 for(const tile of nativeTrees[0].footprint)assert.equal(world.isValidPosition(tile.x,tile.y),true);
 assert.equal(world.isValidPosition(35,210),false,'unrelated native obstacle remains');
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0,'no new wood props or fake loot');
 assert.equal(engine.snapshot(p).nativeChanges.length,1);
 assert.equal(engine.execute(p,'chop tree').blocked,true);
 for(const tile of nativeTrees[0].footprint)world.map.grid[tile.y][tile.x]=1;
 const restored=createChaosWorld({file,nativeTrees});
 assert.equal(restored.snapshot(p).nativeChanges.length,1);
 assert.equal(world.isValidPosition(tree.tile.x,tree.tile.y),true,'saved collision release survives restart');
});
test('live native Fracture mode never seeds imaginary props, trees, rugs or camp tables',t=>{
 const {p,engine,file,world}=nativeFixture(t);
 world.entities.guard={id:80,type:'npc',kind:40,name:'guard',x:29,y:200};
 const view=engine.snapshot(p);
 assert.equal(view.bag.length,0);assert.equal(view.ground.length,0);
 assert.equal(view.scenery.length,1);assert.ok(view.scenery[0].nativeOrigin);
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
 assert.equal(engine.execute(p,'push boulder').blocked,true,'unmapped native assets are not fake movable objects');
 for(const action of ['push boulder','pick up rock','hide in bush','burn grass']){
  assert.equal(shouldUseCreative(action,{chaos:view}),true,action+' must reach the grounded action resolver');
  const result=engine.execute(p,action);
  assert.equal(result.blocked,true,action);
  assert.equal(result.success,false,action);
  assert.match(result.text,/no verified movable or reactive/i,action);
 }
 assert.equal(shouldUseCreative('walk north',{chaos:view}),false,'ordinary native movement stays native');
 assert.equal(engine.execute(p,'make mask from cloth strip and wood splinter').blocked,true);
 assert.throws(()=>engine.registerScenery('fracture:test','imaginary','tree',{x:30,y:202}),/validated native/);
 assert.equal(engine.snapshot(p).scenery.length,1);
});
test('native tree fire and player extinguishing obey original checks without unlocking unbroken trunks',t=>{
 const {p,engine,tick,world,file}=nativeFixture(t);let outcome;for(let n=0;n<20;n++){outcome=engine.execute(p,'ignite tree');if(outcome.success)break;assert.equal(outcome.blocked,false);}assert.equal(outcome.success,true);tick();
 assert.equal(engine.execute(p,'put out tree').success,true);const tree=engine.snapshot(p).scenery[0],hp=JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp;tick();assert.equal(JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp,hp);assert.equal(world.isValidPosition(tree.tile.x,tree.tile.y),false);
});
test('native NPC witnesses a registered map tree burning down without imaginary ownership or native HP damage',t=>{
 const {p,engine,world,tick,file}=nativeFixture(t);world.entities.guard={id:80,type:'npc',kind:40,name:'guard',x:29,y:200};
 let outcome;for(let n=0;n<20;n++){outcome=engine.execute(p,'ignite tree');if(outcome.success)break;}assert.equal(outcome.success,true);
 const npc=engine.snapshot(p).npcs.find(n=>n.nativeId==='80');assert.ok(npc);for(let n=0;n<12;n++)tick();
 const saved=JSON.parse(fs.readFileSync(file));assert.ok(saved.npcs[npc.id].memories.alice.some(e=>e.verb==='fire-destruction'));assert.equal(p.hitPoints,100);
});

test('felling an existing native tree is a single D20 action with persistent world consequences, not visible HP grinding',t=>{
 const {p,engine,file,world}=nativeFixture(t);
 const tree=engine.snapshot(p).scenery.find(o=>o.nativeOrigin);
 assert.ok(tree);
 p.chaosControlled=false;
 assert.equal(engine.execute(p,'fell the tree').blocked,true,'no unauthenticated environmental changes');
 p.chaosControlled=true;
 p.x=60;
 assert.equal(engine.execute(p,'fell the tree').blocked,true,'out-of-range actors cannot fell a native tree');
 p.x=30;
 let result;
 for(let i=0;i<40;i++){
  const prior=JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp;
  result=engine.execute(p,'fell the tree');
  assert.equal(result.blocked,false);
  assert.ok(Number.isInteger(result.roll));
  assert.equal(result.dc,14);
  assert.doesNotMatch(result.text,/\bHP\b/i,'do not expose object health bar');
  if(!result.success)assert.equal(JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp,prior,'failed ability check cannot chip durability');
  else break;
 }
 assert.equal(result.success,true,'an eventual successful D20 check fells the tree');
 assert.equal(engine.snapshot(p).nativeChanges.length,1);
 assert.equal(world.isValidPosition(tree.tile.x,tree.tile.y),true,'only the original tree trunk collision is cleared');
 assert.equal(Object.values(JSON.parse(fs.readFileSync(file)).items).filter(i=>i.originId===tree.id).length,0,'no new prop or invented loot is spawned');
 assert.equal(engine.execute(p,'fell the tree').blocked,true,'cannot fell already cleared native tree again');
});

test('unmapped native rocks and shrubs cannot produce fictional movement or destructibility',t=>{
 const {p,engine,world}=nativeFixture(t);
 const before=engine.snapshot(p);
 for(const action of ['push boulder north','pick up rock','hide in bush','smash rock','burn grass']){
  const outcome=engine.execute(p,action);
  assert.equal(outcome.success,false,action);
  assert.equal(outcome.blocked,true,action);
  assert.match(outcome.text,/no verified movable or reactive/i,action);
 }
 assert.deepEqual(engine.snapshot(p).nativeChanges,before.nativeChanges);
 assert.equal(world.isValidPosition(35,210),false,'existing native solid tile is not changed');
 assert.equal(unsupportedNativeEnvironment('walk left'),null,'ordinary native controls are untouched');
});

test('direct native scenery damage cannot bypass the single D20 felling rule',t=>{
 const {p,engine,file,world}=nativeFixture(t);
 const tree=engine.snapshot(p).scenery.find(o=>o.nativeOrigin);
 let result;
 for(let i=0;i<40;i++){
  const hp=JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp;
  result=engine.strikeScenery(p,tree.id.slice('fracture:test:'.length),1);
  assert.equal(result.attempted,true);assert.equal(result.dc,14);
  if(!result.changed)assert.equal(JSON.parse(fs.readFileSync(file)).scenery[tree.id].hp,hp);
  else break;
 }
 assert.equal(result.changed,true);
 assert.equal(engine.snapshot(p).nativeChanges.length,1);
 assert.equal(world.isValidPosition(tree.tile.x,tree.tile.y),true);
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,0);
});
