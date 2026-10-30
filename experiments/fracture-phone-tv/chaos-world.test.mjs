import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createChaosWorld,shouldUseCreative} from './chaos-world.mjs';
function fixture(t,now=()=>Date.now()){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-objects-')),file=path.join(dir,'objects.json');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const world={players:{},zoneManager:{getZoneAt:()=>({name:'The Refuge'})},isValidPosition:(x,y)=>x>0&&y>0&&x<100&&y<314};const player=(id,name,x=40)=>({characterId:id,name,chaosName:name,x,y:210,hitPoints:100,maxHitPoints:100,chaosControlled:true,hasEnteredGame:true,isDead:false,getWorld:()=>world});const a=player('alice','Alice'),b=player('bob','Bob',41);world.players={alice:a,bob:b};const engine=createChaosWorld({file,seed:1,now});return {a,b,engine,file,world};}
test('original crafting, wearing, giving and separation work without a legacy map',t=>{const {a,b,engine,file}=fixture(t);const initial=engine.snapshot(a);assert.equal(initial.bag.length,2);assert.ok(initial.ground.length);assert.ok(initial.ground.every(i=>i.tile));let crafted;for(let i=0;i<12;i++){crafted=engine.execute(a,'make blue hat from cloth strip and wood splinter');if(crafted.success)break;assert.equal(engine.snapshot(a).bag.length,2);}assert.ok(crafted.success);assert.ok(crafted.roll>=10);let bag=engine.snapshot(a).bag;assert.equal(bag.length,1);assert.equal(bag[0].name,'blue hat');assert.equal(engine.execute(a,'equip blue hat').success,true);assert.equal(engine.snapshot(a).wearables[0].color,'#7ea7d4');assert.equal(engine.execute(a,'give blue hat to Bob').success,true);assert.equal(engine.snapshot(a).bag.length,0);assert.ok(engine.snapshot(b).bag.some(i=>i.name==='blue hat'));assert.equal(engine.execute(b,'separate blue hat').success,true);assert.ok(engine.snapshot(b).bag.some(i=>i.name==='cloth strip'));const data=JSON.parse(fs.readFileSync(file));assert.ok(Object.values(data.items).every(i=>!i.location||i.location.startsWith('fracture:')));});
test('material ownership, range, persistence and reconnect do not mint duplicates',t=>{const {a,b,engine,file}=fixture(t);engine.snapshot(a);engine.snapshot(b);const floor=engine.snapshot(a).ground[0];a.x=60;assert.equal(engine.execute(a,'take '+floor.id).blocked,true);a.x=40;assert.equal(engine.execute(a,'take '+floor.id).success,true);assert.equal(engine.execute(b,'take '+floor.id).blocked,true);assert.equal(engine.execute(a,'give '+floor.id+' to Bob').success,true);b.x=80;assert.equal(engine.execute(a,'give cloth strip to Bob').blocked,true);const count=Object.keys(JSON.parse(fs.readFileSync(file)).items).length;const restored=createChaosWorld({file});restored.snapshot({...a,id:999});assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,count);assert.ok(restored.snapshot(b).bag.some(i=>i.id===floor.id));assert.ok(!shouldUseCreative('equip sword2',{chaos:restored.snapshot(a)}));assert.ok(shouldUseCreative('make mask from cloth strip and wood splinter',{}));});
test('failed persistence rolls back crafting and dice state',t=>{const {a,engine,file}=fixture(t);const initial=engine.snapshot(a).bag;const saved=fs.readFileSync(file,'utf8');fs.renameSync(file,file+'.backup');fs.mkdirSync(file);assert.throws(()=>engine.execute(a,'make blue hat from cloth strip and wood splinter'));assert.deepEqual(engine.snapshot(a).bag,initial);fs.rmdirSync(file);fs.renameSync(file+'.backup',file);assert.equal(fs.readFileSync(file,'utf8'),saved);});
test('adjacent actors across a native grid boundary can exchange items',t=>{const {a,b,engine}=fixture(t);a.x=27;b.x=28;engine.snapshot(a);engine.snapshot(b);assert.equal(engine.execute(a,'give cloth strip to Bob').success,true);assert.equal(engine.snapshot(b).bag.filter(i=>i.name==='cloth strip').length,2);});

test('failed first-character save can retry without losing starter objects',t=>{const {a,engine,file}=fixture(t);fs.mkdirSync(file);assert.throws(()=>engine.snapshot(a));fs.rmdirSync(file);assert.equal(engine.snapshot(a).bag.length,2);const loaded=createChaosWorld({file});assert.equal(loaded.snapshot(a).bag.length,2);});

test('auto-approach uses the resolved action item, not a duplicate floor name',t=>{const {a,b,engine}=fixture(t);engine.snapshot(a);engine.snapshot(b);engine.execute(a,'drop cloth strip');b.x=44;assert.equal(engine.approach(b,'drop cloth strip'),null);assert.equal(engine.approach(b,'inspect cloth strip'),null);const floor=engine.snapshot(b).ground.find(i=>i.name==='cloth strip');assert.deepEqual(engine.approach(b,'take '+floor.id),floor.tile);assert.equal(engine.execute(b,'drop cloth strip').success,true);});

test('nearby distinct phones can grant one original D20 advantage roll to a real craft',t=>{
 let clock=1000;const {a,b,engine,file}=fixture(t,()=>clock);
 engine.snapshot(a);engine.snapshot(b);
 assert.equal(shouldUseCreative('help Alice craft',{}),true);
 assert.equal(shouldUseCreative('assist Alice',{}),true);
 assert.equal(engine.execute(a,'help Alice').blocked,true,'self-help is forbidden');
 assert.equal(engine.execute(b,'help Alice craft').success,true);
 assert.equal(engine.snapshot(a).assistedBy,'Bob');
 assert.equal(engine.execute(b,'aid Alice').blocked,true,'help cannot stack');
 const crafted=engine.execute(a,'make green hat from cloth strip and wood splinter');
 assert.ok(crafted.rolls&&crafted.rolls.length===2,crafted.text);
 assert.equal(crafted.roll,Math.max(...crafted.rolls),'original D&D5e advantage selects the higher D20');
 assert.equal(crafted.assistedBy,'Bob');
 assert.match(crafted.text,/D20 advantage/);
 assert.equal(engine.snapshot(a).assistedBy,undefined,'advantage is consumed after one valid roll');
 assert.equal(JSON.parse(fs.readFileSync(file)).assists[a.characterId],undefined);
});
test('assistance expires, requires live proximity and never creates free crafting materials',t=>{
 let clock=1000;const {a,b,engine,file}=fixture(t,()=>clock);
 engine.snapshot(a);engine.snapshot(b);
 assert.equal(engine.execute(b,'help Alice').success,true);
 clock+=15001;
 assert.equal(engine.snapshot(a).assistedBy,undefined);
 const expired=engine.execute(a,'make blue hat from cloth strip and wood splinter');
 assert.equal(expired.rolls,undefined,'expired assistance is not a second roll');
 // A separate fresh pair avoids conflating a successful first craft with
 // missing materials on the second attempt.
 const other=fixture(t,()=>clock);other.engine.snapshot(other.a);other.engine.snapshot(other.b);
 const before=other.engine.snapshot(other.b).bag.length;
 assert.equal(other.engine.execute(other.b,'help Alice').success,true);
 assert.equal(other.engine.snapshot(other.b).bag.length,before,'help never duplicates inventory');
 other.b.x=70;
 const distant=other.engine.execute(other.a,'make green belt from cloth strip and wood splinter');
 assert.equal(distant.blocked,false,'the unassisted craft must be a valid attempt');
 assert.equal(distant.rolls,undefined,'moving away removes advantage');
 assert.equal(other.engine.snapshot(other.a).assistedBy,undefined,'no active help should remain after craft');
});
test('invalid craft cannot consume help and a dead helper cannot grant advantage',t=>{
 let clock=1000;const {a,b,engine}=fixture(t,()=>clock);
 engine.snapshot(a);engine.snapshot(b);
 assert.equal(engine.execute(b,'help Alice').success,true);
 assert.equal(engine.execute(a,'make hat from nonexistent cloth and wood splinter').blocked,true);
 assert.equal(engine.snapshot(a).assistedBy,'Bob','blocked attempts must not consume help');
 b.isDead=true;
 const result=engine.execute(a,'make blue hat from cloth strip and wood splinter');
 assert.equal(result.rolls,undefined,'dead helpers cannot grant advantage');
});

test('native zone boundary blocks cross-zone gifts, pickup, inspection and approach even on adjacent tiles',t=>{
 const {a,b,engine,world}=fixture(t);
 world.zoneManager.getZoneAt=(x,y)=>({id:x<42?'village':'forest',name:x<42?'The Refuge':'Glitch Woods'});
 a.x=41;b.x=42;
 engine.snapshot(a);engine.snapshot(b);
 assert.equal(engine.execute(a,'give wood splinter to Bob').blocked,true,'adjacent is not sufficient across native zones');
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const floor=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 assert.ok(floor,'a real floor item must exist on the origin tile');
 assert.equal(engine.snapshot(b).ground.some(i=>i.id===floor.id),false,'do not reveal a floor item across zones');
 assert.equal(engine.approach(b,'take '+floor.id),null,'cannot auto-approach an object in another zone');
 assert.equal(engine.execute(b,'take '+floor.id).blocked,true,'cannot acquire an item across zones');
 assert.equal(engine.execute(b,'inspect '+floor.id).blocked,true,'cannot inspect it from another zone');
 b.x=41;
 assert.equal(engine.execute(b,'take '+floor.id).success,true,'the item is collectible once actually in its zone');
 assert.ok(engine.snapshot(b).bag.some(i=>i.id===floor.id));
});
test('native collision tiles block two-step gifts through walls, but a clear route works',t=>{
 const {a,b,engine,world}=fixture(t);
 a.x=40;b.x=42;
 const original=world.isValidPosition;
 world.isValidPosition=(x,y)=>original(x,y)&&x!==41;
 engine.snapshot(a);engine.snapshot(b);
 const rejected=engine.execute(a,'give cloth strip to Bob');
 assert.equal(rejected.blocked,true,'distance two across a solid tile is not reachability');
 assert.equal(engine.snapshot(a).bag.some(i=>i.name==='cloth strip'),true,'blocked gifts retain ownership');
 world.isValidPosition=original;
 assert.equal(engine.execute(a,'give cloth strip to Bob').success,true,'clear two-step path allows a gift');
 assert.equal(engine.snapshot(b).bag.filter(i=>i.name==='cloth strip').length,2);
});
