import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {discoverNativeTrees} from './native-scenery.mjs';import {createChaosWorld,shouldUseCreative} from './chaos-world.mjs';
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
test('real map trees use original damage, give wood once, clear only trunk cells, and retain destruction after restart',t=>{
 const {p,engine,file,world,nativeTrees}=nativeFixture(t);const tree=engine.snapshot(p).scenery.find(o=>o.nativeOrigin);assert.ok(tree,'native solid trunk is visible and interactable');assert.equal(shouldUseCreative('please cut down the tree!',{chaos:engine.snapshot(p)}),true);
 assert.equal(shouldUseCreative('kick the tree',{chaos:engine.snapshot(p)}),true);
 assert.equal(shouldUseCreative('smash tree',{chaos:engine.snapshot(p)}),true);
 for(let i=0;i<4;i++){const result=engine.execute(p,['kick the tree','smash tree','hack tree','cut down tree'][i]);assert.equal(result.success,true);assert.equal(result.object.after,9-i*3);}
 for(const tile of nativeTrees[0].footprint)assert.equal(world.isValidPosition(tile.x,tile.y),true);assert.equal(world.isValidPosition(35,210),false,'unrelated native obstacle remains');assert.equal(engine.snapshot(p).bag.filter(i=>i.originId===tree.id).length,0,'public bag does not expose internal origin metadata');
 assert.equal(Object.values(JSON.parse(fs.readFileSync(file)).items).filter(i=>i.originId===tree.id).length,1);assert.equal(engine.execute(p,'chop tree').blocked,true);assert.equal(engine.snapshot(p).nativeChanges.length,1);
 for(const tile of nativeTrees[0].footprint)world.map.grid[tile.y][tile.x]=1;
 const restored=createChaosWorld({file,nativeTrees});assert.equal(restored.snapshot(p).nativeChanges.length,1);assert.equal(world.isValidPosition(tree.tile.x,tree.tile.y),true);
});
test('native tree fire and player extinguishing obey original checks without unlocking unbroken trunks',t=>{
 const {p,engine,tick,world}=nativeFixture(t);let outcome;for(let n=0;n<20;n++){outcome=engine.execute(p,'ignite tree');if(outcome.success)break;assert.equal(outcome.blocked,false);}assert.equal(outcome.success,true);tick();
 assert.equal(engine.execute(p,'put out tree').success,true);const tree=engine.snapshot(p).scenery[0],hp=tree.hp;tick();assert.equal(engine.snapshot(p).scenery[0].hp,hp);assert.equal(world.isValidPosition(tree.tile.x,tree.tile.y),false);
});
test('native NPC witnesses a registered map tree burning down without imaginary ownership or native HP damage',t=>{
 const {p,engine,world,tick,file}=nativeFixture(t);world.entities.guard={id:80,type:'npc',kind:40,name:'guard',x:29,y:200};
 let outcome;for(let n=0;n<20;n++){outcome=engine.execute(p,'ignite tree');if(outcome.success)break;}assert.equal(outcome.success,true);
 const npc=engine.snapshot(p).npcs.find(n=>n.nativeId==='80');assert.ok(npc);for(let n=0;n<12;n++)tick();
 const saved=JSON.parse(fs.readFileSync(file));assert.ok(saved.npcs[npc.id].memories.alice.some(e=>e.verb==='fire-destruction'));assert.equal(p.hitPoints,100);
});
