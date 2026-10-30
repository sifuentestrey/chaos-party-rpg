import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createChaosWorld,shouldUseCreative} from './chaos-world.mjs';
function fixture(t,assistNow=()=>Date.now()){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-objects-')),file=path.join(dir,'objects.json');t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const world={players:{},zoneManager:{getZoneAt:()=>({name:'The Refuge'})},isValidPosition:(x,y)=>x>0&&y>0&&x<100&&y<314};const player=(id,name,x=40)=>({characterId:id,name,chaosName:name,x,y:210,hitPoints:100,maxHitPoints:100,chaosControlled:true,hasEnteredGame:true,isDead:false,getWorld:()=>world});const a=player('alice','Alice'),b=player('bob','Bob',41);world.players={alice:a,bob:b};let now=1000;const engine=createChaosWorld({file,seed:1,clock:()=>now,now:assistNow});return {a,b,engine,file,world,tick:()=>{now+=10000;return engine.snapshot(a);}};}
test('original crafting, wearing, giving and separation work without a legacy map',t=>{const {a,b,engine,file}=fixture(t);const initial=engine.snapshot(a);assert.equal(initial.bag.length,2);assert.ok(initial.ground.length);assert.ok(initial.ground.every(i=>i.tile));let crafted;for(let i=0;i<12;i++){crafted=engine.execute(a,'make blue hat from cloth strip and wood splinter');if(crafted.success)break;assert.equal(engine.snapshot(a).bag.length,2);}assert.ok(crafted.success);assert.ok(crafted.roll>=10);let bag=engine.snapshot(a).bag;assert.equal(bag.length,1);assert.equal(bag[0].name,'blue hat');assert.equal(engine.execute(a,'equip blue hat').success,true);assert.equal(engine.snapshot(a).wearables[0].color,'#7ea7d4');assert.equal(engine.execute(a,'give blue hat to Bob').success,true);assert.equal(engine.snapshot(a).bag.length,0);assert.ok(engine.snapshot(b).bag.some(i=>i.name==='blue hat'));assert.equal(engine.execute(b,'separate blue hat').success,true);assert.ok(engine.snapshot(b).bag.some(i=>i.name==='cloth strip'));const data=JSON.parse(fs.readFileSync(file));assert.ok(Object.values(data.items).every(i=>!i.location||i.location.startsWith('fracture:')));});
test('material ownership, range, persistence and reconnect do not mint duplicates',t=>{const {a,b,engine,file}=fixture(t);engine.snapshot(a);engine.snapshot(b);const floor=engine.snapshot(a).ground[0];a.x=60;assert.equal(engine.execute(a,'take '+floor.id).blocked,true);a.x=40;assert.equal(engine.execute(a,'take '+floor.id).success,true);assert.equal(engine.execute(b,'take '+floor.id).blocked,true);assert.equal(engine.execute(a,'give '+floor.id+' to Bob').success,true);b.x=80;assert.equal(engine.execute(a,'give cloth strip to Bob').blocked,true);const count=Object.keys(JSON.parse(fs.readFileSync(file)).items).length;const restored=createChaosWorld({file});restored.snapshot({...a,id:999});assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).items).length,count);assert.ok(restored.snapshot(b).bag.some(i=>i.id===floor.id));assert.ok(!shouldUseCreative('equip sword2',{chaos:restored.snapshot(a)}));assert.ok(shouldUseCreative('make mask from cloth strip and wood splinter',{}));});
test('failed persistence rolls back crafting and dice state',t=>{const {a,engine,file}=fixture(t);const initial=engine.snapshot(a).bag;const saved=fs.readFileSync(file,'utf8');fs.renameSync(file,file+'.backup');fs.mkdirSync(file);assert.throws(()=>engine.execute(a,'make blue hat from cloth strip and wood splinter'));assert.deepEqual(engine.snapshot(a).bag,initial);fs.rmdirSync(file);fs.renameSync(file+'.backup',file);assert.equal(fs.readFileSync(file,'utf8'),saved);});
test('adjacent actors across a native grid boundary can exchange items',t=>{const {a,b,engine}=fixture(t);a.x=27;b.x=28;engine.snapshot(a);engine.snapshot(b);assert.equal(engine.execute(a,'give cloth strip to Bob').success,true);assert.equal(engine.snapshot(b).bag.filter(i=>i.name==='cloth strip').length,2);});

test('failed first-character save can retry without losing starter objects',t=>{const {a,engine,file}=fixture(t);fs.mkdirSync(file);assert.throws(()=>engine.snapshot(a));fs.rmdirSync(file);assert.equal(engine.snapshot(a).bag.length,2);const loaded=createChaosWorld({file});assert.equal(loaded.snapshot(a).bag.length,2);});

test('auto-approach uses the resolved action item, not a duplicate floor name',t=>{const {a,b,engine}=fixture(t);engine.snapshot(a);engine.snapshot(b);engine.execute(a,'drop cloth strip');b.x=44;assert.equal(engine.approach(b,'drop cloth strip'),null);assert.equal(engine.approach(b,'inspect cloth strip'),null);const floor=engine.snapshot(b).ground.find(i=>i.name==='cloth strip');assert.deepEqual(engine.approach(b,'take '+floor.id),floor.tile);assert.equal(engine.execute(b,'drop cloth strip').success,true);});

function npcFixture(t){const f=fixture(t);const guard={id:91,type:'npc',kind:55,name:'guard',x:41,y:210};f.world.entities={guard};return {...f,guard};}
function succeed(engine,p,text){let r;for(let n=0;n<30;n++){r=engine.execute(p,text);if(r.success||r.blocked)break;}assert.ok(r.success,JSON.stringify(r));return r;}
test('original fire, repair and movable blocking objects have durable native tiles',t=>{const {a,engine,file,world,tick}=fixture(t);let table=engine.snapshot(a).ground.find(i=>i.visual==='table');assert.ok(table);assert.equal(engine.isBlocked(a,table.tile.x,table.tile.y),true);const old={...table.tile};a.x=table.tile.x-1;a.y=table.tile.y;succeed(engine,a,'push camp table east');table=engine.snapshot(a).ground.find(i=>i.id===table.id);assert.equal(table.tile.x,old.x+1);assert.equal(engine.isBlocked(a,old.x,old.y),false);assert.equal(engine.isBlocked(a,table.tile.x,table.tile.y),true);a.x++;succeed(engine,a,'ignite camp table');tick();tick();tick();assert.equal(engine.isBlocked(a,table.tile.x,table.tile.y),false);assert.equal(engine.snapshot(a).ground.find(i=>i.id===table.id).condition,'broken');succeed(engine,a,'repair camp table');assert.equal(engine.isBlocked(a,table.tile.x,table.tile.y),true);succeed(engine,a,'ignite camp table');assert.equal(engine.execute(a,'extinguish camp table').success,true);const restored=createChaosWorld({file});assert.equal(restored.snapshot(a).ground.find(i=>i.id===table.id).condition,'intact');world.isValidPosition=(x,y)=>x!==table.tile.x+1;assert.equal(engine.execute(a,'push camp table east').blocked,true);});
test('theft, witnesses, personal trust, amends and DM memory survive reload',t=>{const {a,b,guard,engine,file}=npcFixture(t);const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');assert.ok(rug);a.x=rug.tile.x;a.y=rug.tile.y;const theft=engine.execute(a,'steal '+rug.id+' from guard');assert.equal(theft.blocked,false);assert.ok(engine.snapshot(a).npcs[0].trust<0);assert.equal(engine.canQuest(a,guard),false);assert.equal(engine.canQuest(b,guard),true);assert.match(engine.talk(a,guard),/remember/);const restored=createChaosWorld({file});assert.equal(restored.canQuest({...a,id:999},guard),false);assert.ok(restored.snapshot(a).story.some(e=>e.attempt.startsWith('steal')));assert.equal(restored.execute(a,'give cloth strip to guard').success,true);assert.equal(restored.canQuest(a,guard),true);assert.match(restored.talk(a,guard),/gift/);const data=JSON.parse(fs.readFileSync(file));assert.ok(data.dmMemory.people[restored.snapshot(a).npcs[0].id].encounters.length);});
test('unseen NPCs do not learn private actions; native bodies and other players stay protected',t=>{const {a,b,guard,engine,world}=npcFixture(t);engine.snapshot(a);world.isValidPosition=(x,y)=>x!==41;a.x=39;engine.execute(a,'drop cloth strip');assert.equal(engine.talk(a,guard),null);assert.equal(engine.execute(a,'ignite guard').blocked,true);world.isValidPosition=()=>true;engine.snapshot(b);assert.equal(engine.execute(a,'ignite '+engine.snapshot(b).bag[0].id).blocked,true);});

test('NPC personal memories survive other players filling the recent event log',t=>{const {a,b,guard,engine,file}=npcFixture(t);const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');a.x=rug.tile.x;a.y=rug.tile.y;engine.execute(a,'steal '+rug.id);const wood=engine.snapshot(b).bag.find(i=>i.name==='wood splinter');for(let n=0;n<20;n++){assert.ok(engine.execute(b,'drop '+wood.id).success);assert.ok(engine.execute(b,'take '+wood.id).success);}const restored=createChaosWorld({file});assert.ok(restored.snapshot(a).npcs.find(n=>n.name==='guard').memory.some(h=>h.verb==='steal'));assert.match(restored.talk(a,guard),/remember/);assert.equal(restored.canQuest(a,guard),false);});

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
 assert.equal(JSON.parse(fs.readFileSync(file)).assists[a.characterId],undefined);a.chaosName='Alice East';engine.snapshot(a);assert.equal(engine.execute(b,'assist Alice East').success,true,'A name ending in a direction must remain intact');
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

test('original NPC theft, failed-roll witness memory and durable trust use a real native NPC',t=>{
 const {a,engine,world,file}=fixture(t);
 const guard={id:841210,kind:42,name:'Guard',type:'npc',x:41,y:210};
 world.npcs={[guard.id]:guard};
 const initial=engine.snapshot(a);
 assert.equal(initial.npcs.length,1);
 assert.ok(initial.npcs[0].items.every(i=>i.visual==='rug'),'Only explicitly seeded Chaos rugs are added; native gear is never invented');assert.equal(initial.npcs[0].nativeId,String(guard.id));
 const item=initial.bag.find(i=>i.name==='cloth strip');
 assert.ok(item);
 assert.equal(engine.execute(a,'give '+item.id+' to Guard').success,true);
 assert.equal(engine.snapshot(a).bag.some(i=>i.id===item.id),false);
 assert.ok(engine.snapshot(a).npcs[0].items.some(i=>i.id===item.id&&i.name===item.name));const giftTrust=engine.snapshot(a).npcs[0].trust;
 assert.equal(shouldUseCreative('steal '+item.id+' from Guard',{}),true);
 let result;
 for(let i=0;i<30;i++){
  result=engine.execute(a,'steal '+item.id+' from Guard');
  assert.equal(result.blocked,false,result.text);
  assert.ok(Number.isInteger(result.roll));
  assert.equal(result.dc,11);
  if(result.success)break;
  assert.ok(engine.snapshot(a).npcs[0].trust<giftTrust,'failed theft lowers the witness relationship');
 }
 assert.equal(result.success,true,'eventually succeeds under original D20 resolver');
 assert.equal(engine.snapshot(a).bag.some(i=>i.id===item.id),true);
 const npc=engine.snapshot(a).npcs[0];
 assert.equal(npc.attitude,npc.trust<0?'hostile':npc.trust>0?'friendly':'neutral');
 assert.ok(npc.trust<=giftTrust-2);
 const stored=JSON.parse(fs.readFileSync(file));
 assert.equal(stored.npcs[npc.id].attitude,'hostile');
 assert.ok(stored.npcs[npc.id].history.some(h=>h.verb==='theft'&&h.actorId===a.characterId));
 const restored=createChaosWorld({file});
 assert.equal(restored.snapshot(a).npcs[0].trust,npc.trust,'memory survives independent restart');
 assert.equal(restored.snapshot(a).bag.some(i=>i.id===item.id),true,'item ownership survives restart');
});
test('NPC ownership and proximity are checked by the original resolver before theft',t=>{
 const {a,engine,world}=fixture(t);
 const guard={id:841210,name:'Guard',kind:42,type:'npc',x:41,y:210};
 const merchant={id:842210,name:'Merchant',kind:43,type:'npc',x:42,y:210};
 world.npcs={[guard.id]:guard,[merchant.id]:merchant};
 engine.snapshot(a);
 assert.equal(engine.execute(a,'give cloth strip to Guard').success,true);
 assert.equal(engine.execute(a,'steal cloth strip from Merchant').blocked,true,'cannot steal an item from the wrong NPC');
 assert.equal(engine.snapshot(a).npcs.find(n=>n.name==='Guard').trust,2,'invalid attempt does not change trust earned by the prior gift');
 a.x=70;
 assert.equal(engine.execute(a,'steal cloth strip from Guard').blocked,true,'distant NPC is not available');
 assert.equal(engine.snapshot(a).bag.some(i=>i.name==='cloth strip'),false);
 a.x=40;
 assert.equal(engine.snapshot(a).npcs.find(n=>n.name==='Guard').items.some(i=>i.name==='cloth strip'),true);
});

test('legacy native-ID NPC saves migrate without losing trust, memories or owned objects',t=>{const {a,engine,file,world}=fixture(t);const bag=engine.snapshot(a).bag,guard={id:841210,name:'Guard',kind:42,type:'npc',x:41,y:210};world.npcs={[guard.id]:guard};const saved=JSON.parse(fs.readFileSync(file));saved.npcs={[guard.id]:{attitude:'hostile',trust:{[a.characterId]:-4},history:[{verb:'theft',actorId:a.characterId,success:false,round:1}]}};saved.items[bag[0].id].ownerId=String(guard.id);fs.writeFileSync(file,JSON.stringify(saved));const restored=createChaosWorld({file});const npc=restored.snapshot(a).npcs[0];assert.equal(npc.nativeId,String(guard.id));assert.equal(npc.trust,-4);assert.ok(npc.memory.some(m=>m.verb==='theft'));assert.ok(npc.items.some(i=>i.id===bag[0].id));assert.equal(restored.canQuest(a,guard),false);const durable=JSON.parse(fs.readFileSync(file));assert.equal(durable.items[bag[0].id].ownerId,npc.id);assert.equal(durable.npcs[npc.id].trust[a.characterId],-4);});

test('native-confirmed mob defeat becomes durable canonical DM memory and witnessed NPC dialogue',t=>{
 const {a,b,guard,engine,file}=npcFixture(t);
 engine.snapshot(a);
 const mob={id:441,kind:4,type:'mob',name:'rat',x:40,y:211,isDead:false};
 const original=fs.readFileSync(file,'utf8');
 assert.equal(engine.recordNativeDefeat(a,mob,{before:8,after:0,tile:{x:40,y:211}}),null,'unconfirmed death cannot enter story');
 assert.equal(engine.recordNativeDefeat(a,{...mob,isDead:true},{before:8,after:8,tile:{x:40,y:211}}),null,'zero native damage cannot enter story');
 assert.equal(fs.readFileSync(file,'utf8'),original,'rejected combat must not alter save');
 mob.isDead=true;
 const event=engine.recordNativeDefeat(a,mob,{before:8,after:0,tile:{x:40,y:211}});
 assert.ok(event?.id.startsWith('native-defeat-'));
 assert.match(event.fact,/8 → 0 HP/);
 assert.ok(event.witnesses.includes('guard'));
 assert.equal(engine.recordNativeDefeat(a,mob,{before:8,after:0,tile:{x:40,y:211}}),null,'same native entity instance cannot record duplicate defeat');
 assert.match(engine.talk(a,guard),/saw you fighting when rat fell/);
 assert.equal(engine.talk(b,guard),null,'an innocent player is not credited with the fight');
 const saved=JSON.parse(fs.readFileSync(file));
 assert.equal(saved.dmMemory.entries.filter(e=>e.id===event.id).length,1);
 assert.equal(saved.dmMemory.entries.at(-1).targetId,'native-mob:441');
 const restored=createChaosWorld({file});
 assert.match(restored.talk(a,guard),/rat fell/);
 assert.ok(restored.snapshot(a).story.some(e=>e.id===event.id&&e.outcome==='success'));
 assert.equal(restored.snapshot(a).npcs[0].trust,0,'native fighting is observed, not arbitrarily rewarded with trust');
});
test('native combat memory never credits off-zone, distant, dead or unauthenticated characters',t=>{
 const {a,guard,engine,file,world}=npcFixture(t);
 engine.snapshot(a);
 const mob={id:511,kind:4,type:'mob',name:'rat',x:41,y:210,isDead:true};
 const saved=fs.readFileSync(file,'utf8');
 const death={before:4,after:0,tile:{x:41,y:210}};
 assert.equal(engine.recordNativeDefeat({...a,chaosControlled:false},mob,death),null);
 assert.equal(engine.recordNativeDefeat({...a,isDead:true},mob,death),null);
 assert.equal(engine.recordNativeDefeat({...a,hasEnteredGame:false},mob,death),null);
 assert.equal(engine.recordNativeDefeat(a,mob,{...death,tile:{x:90,y:210}}),null);
 world.zoneManager.getZoneAt=(x)=>({id:x<41?'refuge':'woods'});
 assert.equal(engine.recordNativeDefeat(a,mob,death),null,'native zone boundary prevents cross-zone witness memory');
 assert.equal(fs.readFileSync(file,'utf8'),saved);
 world.zoneManager.getZoneAt=()=>({name:'The Refuge'});
 world.isValidPosition=(x,y)=>x!==41;
 const valid=engine.recordNativeDefeat(a,mob,death);
 assert.ok(valid,'actual adjacent combat may still be recorded even if a map tile becomes blocked');
 assert.equal(valid.witnesses.length,0,'NPC behind a solid tile must not witness combat');
 assert.equal(engine.talk(a,guard),null);
});
