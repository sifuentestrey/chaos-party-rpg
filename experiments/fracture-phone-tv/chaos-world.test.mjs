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
test('tile fire spreads one hop per tick, persists, and never ignites carried items',t=>{
 const {a,b,engine,file,tick}=fixture(t);
 const table=engine.snapshot(a).ground.find(i=>i.visual==='table');assert.ok(table);
 a.x=table.tile.x+1;a.y=table.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');assert.ok(cloth);
 a.x=table.tile.x+2;
 assert.equal(engine.execute(a,'drop wood splinter').success,true);
 const wood=engine.snapshot(a).ground.find(i=>i.name==='wood splinter');assert.ok(wood);
 a.x=table.tile.x+1;
 succeed(engine,a,'ignite '+table.id);
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===cloth.id).condition,'burning');
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===wood.id).condition,'intact','new fire cannot chain through two tiles in one tick');
 assert.equal(engine.snapshot(b).bag.find(i=>i.name==='cloth strip').condition,'intact','carried items are not floor fuel');
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===wood.id).condition,'burning');
 const restored=createChaosWorld({file,clock:()=>21000});
 assert.equal(restored.snapshot(a).ground.find(i=>i.id===wood.id).condition,'burning','fire state survives restart');
 assert.ok(restored.snapshot(a).story.some(e=>/Fire spreads/.test(e.fact||'')),'fire propagation is remembered as a real world event');
});
test('extinguishing prevents spread and native zone boundaries stop fire',t=>{
 const {a,engine,tick,world}=fixture(t);
 const table=engine.snapshot(a).ground.find(i=>i.visual==='table');
 a.x=table.tile.x+1;a.y=table.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+table.id);
 world.zoneManager.getZoneAt=(x)=>({name:x<=table.tile.x?'west':'east'});
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===cloth.id).condition,'intact','adjacent but separate native zones cannot conduct fire');
 world.zoneManager.getZoneAt=()=>({name:'The Refuge'});
 assert.equal(engine.execute(a,'extinguish '+table.id).success,true);
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===cloth.id).condition,'intact','extinguished objects cannot spread fire');
});
test('a witnessed fire spreading to an NPC-owned rug changes durable personal trust',t=>{
 const {a,guard,engine,file,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');assert.ok(rug);
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+cloth.id);
 const before=engine.snapshot(a).npcs.find(n=>n.name==='guard').trust;
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 const npc=engine.snapshot(a).npcs.find(n=>n.name==='guard');
 assert.equal(npc.trust,before-1);
 assert.ok(npc.memory.some(m=>m.verb==='fire-spread'));
 // Reopen at the same simulated instant: a real later restart is allowed
 // to advance fire and record additional destruction, not rewind time.
 const restored=createChaosWorld({file,clock:()=>11000});
 assert.equal(restored.snapshot(a).npcs.find(n=>n.name==='guard').trust,npc.trust);
 assert.equal(restored.canQuest(a,guard),false);
});
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


test('nearby teammate grants one real advantage roll to Bard NPC reconciliation, with durable canonical result',t=>{
 const {a,b,guard,engine,file}=npcFixture(t);
 a.chaosRole='bard';
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 assert.ok(rug);a.x=rug.tile.x;a.y=rug.tile.y;b.x=a.x+1;b.y=a.y;
 engine.snapshot(b);
 const theft=engine.execute(a,'steal '+rug.id);
 assert.equal(theft.blocked,false);
 assert.ok(engine.snapshot(a).npcs.find(n=>n.name==='guard').trust<0);
 assert.equal(engine.execute(b,'help Alice').success,true);
 const appeal=engine.execute(a,'apologize to guard');
 assert.equal(appeal.blocked,false);
 assert.equal(appeal.bonus,3);
 assert.equal(appeal.rolls.length,2);
 assert.equal(appeal.roll,Math.max(...appeal.rolls));
 assert.equal(appeal.assistedBy,'Bob');
 assert.match(appeal.text,/D20 advantage/);
 assert.match(appeal.text,/helped by Bob/);
 assert.equal(engine.snapshot(a).assistedBy,undefined,'one social check consumes help even if the roll fails');
 const npc=engine.snapshot(a).npcs.find(n=>n.name==='guard');
 assert.ok(npc.memory.some(m=>m.verb==='appeal'));
 const stored=JSON.parse(fs.readFileSync(file));
 assert.equal(stored.assists[a.characterId],undefined);
 assert.ok(stored.npcs[npc.id].history.some(m=>m.verb==='appeal'));
 assert.equal(engine.execute(b,'help Alice').success,true);
 const cooldown=engine.execute(a,'apologize to guard');
 assert.equal(cooldown.blocked,true,'cooldown or resolved grievance prevents an extra roll');
 assert.equal(engine.snapshot(a).assistedBy,'Bob','blocked social checks do not consume the next helper roll');
});
test('original D20 help applies to actual NPC theft, not merely crafting, without inventing loot',t=>{
 const {a,b,engine}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 assert.ok(rug);a.x=rug.tile.x;a.y=rug.tile.y;b.x=a.x+1;b.y=a.y;
 engine.snapshot(b);
 assert.equal(engine.execute(b,'help Alice').success,true);
 const result=engine.execute(a,'steal '+rug.id);
 assert.equal(result.blocked,false);
 assert.equal(result.rolls.length,2);
 assert.equal(result.roll,Math.max(...result.rolls));
 assert.equal(result.assistedBy,'Bob');
 assert.equal(engine.snapshot(a).assistedBy,undefined);
 assert.equal(engine.snapshot(a).bag.some(i=>i.id===rug.id),result.success,
  'the actual D20 outcome, not the helper declaration, determines ownership');
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

test('original class +3 modifies actual theft D20, but never native combat or legacy actor checks',t=>{
 const {a,engine,guard}=npcFixture(t);a.chaosRole='rogue';a.chaosPerk='lucky';
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x;a.y=rug.tile.y;
 const result=engine.execute(a,'steal '+rug.id+' from guard');
 assert.equal(result.blocked,false);assert.equal(result.bonus,3);
 assert.match(result.text,/\+3 class/);
 assert.equal(result.success,result.roll===20||(result.roll!==1&&result.roll+3>=result.dc));
 assert.equal(engine.snapshot(a).npcs[0].trust<0,true,'NPC still remembers an attempted theft');
});


test('social amends is a native-NPC-bound original D20 check; Bard bonus, trust and quest gate persist',t=>{
 const {a,b,guard,engine,file}=npcFixture(t);
 const original=engine.snapshot(a),rug=original.ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'steal '+rug.id).blocked,false);
 assert.equal(engine.canQuest(a,guard),false);
 a.chaosRole='bard';
 const first=engine.execute(a,'apologize to guard');
 assert.equal(first.blocked,false,first.text);
 assert.equal(first.bonus,3,'original Bard social skill applies to real NPC trust check');
 assert.ok(Number.isInteger(first.roll));
 assert.equal(first.success,first.roll===20||(first.roll!==1&&first.roll+3>=first.dc));
 assert.match(first.text,/D20/);
 assert.equal(engine.execute(a,'make amends with guard').blocked,true,'cannot spam the same NPC during cooldown');
 assert.equal(engine.canQuest(b,guard),true,'theft and social consequences are personal');
 const trust=engine.snapshot(a).npcs[0].trust;
 const saved=JSON.parse(fs.readFileSync(file));
 assert.ok(saved.npcs[engine.snapshot(a).npcs[0].id].history.some(h=>h.verb==='appeal'&&h.actorId===a.characterId));
 const restarted=createChaosWorld({file});
 assert.equal(restarted.snapshot(a).npcs[0].trust,trust);
 assert.equal(restarted.execute(a,'apologize to guard').blocked,true,'cooldown survives a restart');
 assert.equal(restarted.canQuest(a,guard),trust>=0);
 assert.ok(restarted.snapshot(a).story.some(e=>e.attempt.startsWith('apologize')));
});
test('social apologies reject distant, ambiguous, cross-zone, non-grievance and dead actors without trust changes',t=>{
 const {a,b,guard,engine,file,world}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');a.x=rug.tile.x;a.y=rug.tile.y;
 engine.execute(a,'steal '+rug.id);
 const before=engine.snapshot(a).npcs[0].trust;
 a.x=70;assert.equal(engine.execute(a,'apologize to guard').blocked,true);
 a.x=40;
 world.zoneManager.getZoneAt=(x)=>({id:x===41?'woods':'refuge'});
 assert.equal(engine.execute(a,'apologize to guard').blocked,true,'native zone separation is mandatory');
 world.zoneManager.getZoneAt=()=>({name:'The Refuge'});
 const another={id:92,type:'npc',kind:55,name:'guard',x:42,y:210};world.entities={guard,another};
 assert.equal(engine.execute(a,'apologize to guard').blocked,true,'ambiguous native NPC names reject');
 const exact=engine.snapshot(a).npcs.find(n=>n.nativeId===String(guard.id));
 assert.equal(engine.execute(a,'apologize to '+exact.id).blocked,false,'stable NPC ID disambiguates');
 assert.equal(engine.execute(b,'apologize to '+exact.id).blocked,true,'innocent character cannot farm trust');
 a.isDead=true;assert.equal(engine.execute(a,'apologize to '+exact.id).blocked,true);
 assert.ok(engine.snapshot(a).npcs.find(n=>n.id===exact.id).trust>=before);
 assert.ok(JSON.parse(fs.readFileSync(file)).npcs[exact.id].history.some(h=>h.verb==='appeal'));
});
test('successful amends can restore quest access without gifts, but never farm positive trust',t=>{
 let time=100000;
 const {a,guard,file}=npcFixture(t);
 const engine=createChaosWorld({file,seed:1,now:()=>time,clock:()=>time});
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');a.x=rug.tile.x;a.y=rug.tile.y;
 engine.execute(a,'steal '+rug.id);a.chaosRole='healer';
 assert.equal(engine.canQuest(a,guard),false);
 let result;
 for(let i=0;i<30&& !engine.canQuest(a,guard);i++){
  result=engine.execute(a,'make peace with guard');
  assert.equal(result.blocked,false,result.text);
  assert.equal(result.bonus,3,'Healer social skill is canonical');
  time+=30001;
 }
 assert.equal(engine.canQuest(a,guard),true,'real social success unlocks native quest gate');
 assert.equal(engine.snapshot(a).npcs[0].trust,0,'apology cannot create free positive trust');
 assert.equal(engine.execute(a,'persuade guard').blocked,true,'no trust farming at neutral attitude');
 const reloaded=createChaosWorld({file,now:()=>time,clock:()=>time});
 assert.equal(reloaded.canQuest(a,guard),true);
 assert.match(reloaded.talk(a,guard),/apology/);
});

test('real opponent interference selects the lower original D20 without inventing outcomes',t=>{
 let clock=1000;const {a,b,engine,file}=fixture(t,()=>clock);
 engine.snapshot(a);engine.snapshot(b);
 assert.equal(shouldUseCreative('hinder Alice',{}),true);
 assert.equal(shouldUseCreative('interfere with Alice on their roll',{}),true);
 assert.equal(engine.execute(a,'hinder Alice').blocked,true,'self-interference is not an exploit');
 assert.equal(engine.execute(b,'hinder Alice').success,true);
 assert.equal(engine.snapshot(a).hinderedBy,'Bob');
 assert.equal(engine.execute(b,'help Alice').blocked,true,'cannot stack advantage and disadvantage');
 assert.equal(engine.execute(a,'make hat from imaginary cloth').blocked,true);
 assert.equal(engine.snapshot(a).hinderedBy,'Bob','blocked actions do not consume reactions');
 const result=engine.execute(a,'make green hat from cloth strip and wood splinter');
 assert.equal(result.blocked,false);
 assert.equal(result.rolls.length,2);
 assert.equal(result.roll,Math.min(...result.rolls),'the real original disadvantage helper chooses the lower die');
 assert.equal(result.hinderedBy,'Bob');
 assert.equal(result.assistedBy,undefined);
 assert.match(result.text,/D20 disadvantage/);
 assert.match(result.text,/hindered by Bob/);
 assert.equal(engine.snapshot(a).hinderedBy,undefined,'one legitimate roll consumes the intervention');
 assert.equal(JSON.parse(fs.readFileSync(file)).assists[a.characterId],undefined);
 assert.equal(engine.snapshot(a).bag.some(i=>i.name==='green hat'),result.success,'real roll, not declaration, controls item creation');
});
test('interference expires, cannot target an absent actor, and never changes native HP',t=>{
 let clock=1000;const {a,b,engine}=fixture(t,()=>clock);
 engine.snapshot(a);engine.snapshot(b);
 assert.equal(engine.execute(b,'sabotage Alice').success,true);
 b.x=90;
 assert.equal(engine.snapshot(a).hinderedBy,undefined);
 const far=engine.execute(a,'make green hat from cloth strip and wood splinter');
 assert.equal(far.rolls,undefined,'a distant opponent cannot force disadvantage');
 const other=fixture(t,()=>clock);other.engine.snapshot(other.a);other.engine.snapshot(other.b);
 assert.equal(other.engine.execute(other.b,'hinder Alice').success,true);
 clock+=15001;
 assert.equal(other.engine.snapshot(other.a).hinderedBy,undefined);
 assert.equal(other.a.hitPoints,100);
 assert.equal(other.engine.execute(other.b,'hinder Nobody').blocked,true);
});

test('native NPC warns then saves a real burning rug and remembers its own action',t=>{
 const {a,guard,engine,file,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');assert.ok(rug);
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');assert.ok(cloth);
 succeed(engine,a,'ignite '+cloth.id);
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 assert.match(engine.talk(a,guard),/on fire.*extinguish/i);
 tick(); // Native guard physically adjacent; resolves an actual extinguish.
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'intact');
 const npc=engine.snapshot(a).npcs.find(n=>n.name==='guard');
 assert.ok(JSON.parse(fs.readFileSync(file)).npcs[npc.id].history.some(h=>h.verb==='extinguish'&&h.itemId===rug.id));
 assert.equal(npc.concern,null);
 const reloaded=createChaosWorld({file});
 assert.equal(reloaded.snapshot(a).ground.find(i=>i.id===rug.id).condition,'intact');
 assert.doesNotMatch(reloaded.talk(a,guard)||'',/on fire|burned through/i);
});

test('restorative aid only applies to NPC floor property; ownership never transfers',t=>{
 const {a,guard,engine,file,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+cloth.id);tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 assert.equal(engine.execute(a,'extinguish '+rug.id).success,true,'players may safely extinguish witnessed NPC property');
 const saved=JSON.parse(fs.readFileSync(file));
 assert.equal(saved.items[rug.id].ownerId,engine.snapshot(a).npcs.find(n=>n.name==='guard').id);
 saved.items[rug.id].condition='broken';saved.items[rug.id].heat=3;delete saved.items[rug.id].tile;
 fs.writeFileSync(file,JSON.stringify(saved));
 const restored=createChaosWorld({file,clock:()=>11000});
 assert.equal(restored.execute(a,'repair '+rug.id).blocked,true,'NPC-carried property cannot be accessed as floor scenery');
 assert.equal(JSON.parse(fs.readFileSync(file)).items[rug.id].ownerId,saved.items[rug.id].ownerId);
});

test('native NPC autonomously extinguishes adjacent owned fire after a warning tick, with durable history',t=>{
 const {a,guard,engine,file,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+cloth.id);
 tick(); // Fire spreads to the rug; first warning tick.
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 tick(); // Real nearby native NPC responds after a full warning tick.
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'intact');
 const saved=JSON.parse(fs.readFileSync(file));
 assert.equal(saved.items[rug.id].ownerId,engine.snapshot(a).npcs.find(n=>n.name==='guard').id);
 assert.ok(Object.values(saved.npcs).some(n=>n.history.some(h=>h.verb==='extinguish'&&h.itemId===rug.id)));
 const restored=createChaosWorld({file});
 assert.equal(restored.snapshot(a).ground.find(i=>i.id===rug.id).condition,'intact');
});

test('NPC cannot auto-extinguish when native body has left the scene',t=>{
 const {a,guard,engine,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+cloth.id);
 tick();guard.x+=4;
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
});

test('unattended NPC property burns through; returning owner sees damage without invented witness',t=>{
 const {a,guard,engine,world,file,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+cloth.id);
 tick(); // Rug catches fire; NPC has time to warn.
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 world.entities={}; // The native NPC has actually left the scene.
 tick();tick();tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'broken');
 world.entities={guard};
 const npc=engine.snapshot(a).npcs.find(n=>n.name==='guard');
 assert.match(npc.concern,/repair/);
 assert.equal(npc.memory.some(h=>h.verb==='fire-destruction'),false,'no remote eyewitness record');
 const saved=JSON.parse(fs.readFileSync(file));
 assert.equal(saved.items[rug.id].condition,'broken');
 succeed(engine,a,'repair '+rug.id);
 assert.equal(engine.snapshot(a).npcs.find(n=>n.name==='guard').concern,null);
});

test('player extinguishing a rug resets NPC warning before a later re-ignition',t=>{
 const {a,engine,tick}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x+1;a.y=rug.tile.y;
 assert.equal(engine.execute(a,'drop cloth strip').success,true);
 const cloth=engine.snapshot(a).ground.find(i=>i.name==='cloth strip');
 succeed(engine,a,'ignite '+cloth.id);
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 assert.equal(engine.execute(a,'extinguish '+rug.id).success,true);
 tick(); // Still-burning cloth reignites the rug, but the NPC warning restarts.
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'burning');
 tick();
 assert.equal(engine.snapshot(a).ground.find(i=>i.id===rug.id).condition,'intact');
});


test('authored tree: phone action routes to persistent damage, TV snapshot, shared collision and restart',t=>{
 const {a,b,engine,file}=fixture(t);
 const first=engine.snapshot(a);
 const tree=first.scenery.find(o=>o.kind==='tree');
 assert.ok(tree,'a Chaos-authored tree is placed on an otherwise walkable native tile');
 assert.equal(tree.hp,12);
 assert.equal(tree.visual,'tree');
 assert.equal(engine.isBlocked(a,tree.tile.x,tree.tile.y),true);
 assert.equal(shouldUseCreative('attack tree',{chaos:first}),true);
 assert.equal(shouldUseCreative('chop the camp tree',{chaos:first}),true);
 assert.equal(shouldUseCreative('attack rat',{chaos:first}),false);
 assert.deepEqual(engine.approach(a,'attack tree'),tree.tile,'a distant actor auto-approaches the tree');
 a.x=tree.tile.x-1;a.y=tree.tile.y;
 for(let n=0;n<4;n++){
  const outcome=engine.execute(a,'attack tree');
  assert.equal(outcome.success,true,'the native actor receives a truthful Chaos scenery outcome');
  assert.equal(engine.snapshot(a).scenery.find(o=>o.id===tree.id).hp,Math.max(0,12-(n+1)*3));
 }
 assert.equal(engine.isBlocked(a,tree.tile.x,tree.tile.y),false,'fallen tree releases sidecar movement');
 b.x=tree.tile.x+1;b.y=tree.tile.y; // second actor enters the same visibility radius
 assert.equal(engine.snapshot(b).scenery.find(o=>o.id===tree.id)?.condition,'broken','a nearby second player sees the same tree');
 const restored=createChaosWorld({file});
 assert.equal(restored.snapshot(a).scenery.filter(o=>o.id===tree.id).length,1,'restart never duplicates the tree');
 assert.equal(restored.isBlocked(a,tree.tile.x,tree.tile.y),false);
 assert.equal(restored.execute(a,'attack tree').blocked,true,'a destroyed tree cannot be damaged again');
 assert.equal(restored.execute(a,'attack native tree').blocked,true,'unregistered native art is not invented');
});
test('no walkable authored-tree tile means no scenery or fabricated destruction',t=>{
 const {a,engine,world}=fixture(t);
 world.isValidPosition=(x,y)=>x===a.x&&y===a.y;
 const view=engine.snapshot(a);
 assert.deepEqual(view.scenery,[]);
 assert.equal(shouldUseCreative('attack tree',{chaos:view}),false);
 assert.equal(engine.execute(a,'attack tree').blocked,true);
});

test('authored fire respects native zones within the same world',t=>{
 const {a,engine,world,tick,file}=fixture(t);
 const tree=engine.snapshot(a).scenery[0];
 a.x=tree.tile.x-1;a.y=tree.tile.y;
 engine.execute(a,'drop cloth strip');
 succeed(engine,a,'ignite cloth strip');
 world.zoneManager.getZoneAt=x=>({name:x<tree.tile.x?'west':'east'});
 tick();
 assert.equal(JSON.parse(fs.readFileSync(file)).scenery[tree.id].condition,'intact');
});

test('batched fire catch-up agrees with individual ticks for authored scenery',t=>{
 const results=[];
 for(const batched of [false,true]){
  const {a,engine,file,tick}=fixture(t);
  const tree=engine.snapshot(a).scenery[0];a.x=tree.tile.x-1;a.y=tree.tile.y;
  engine.execute(a,'drop cloth strip');succeed(engine,a,'ignite cloth strip');
  if(batched)createChaosWorld({file,clock:()=>31000}).snapshot(a);
  else {tick();tick();tick();}
  const saved=JSON.parse(fs.readFileSync(file));
  results.push({condition:saved.scenery[tree.id].condition,hp:saved.scenery[tree.id].hp});
 }
 assert.deepEqual(results[0],results[1]);
 assert.equal(results[0].condition,'burning');
});
test('players can douse authored fire through original rules and canonical receipts',t=>{
 const {a,b,engine,file,tick}=fixture(t);
 const tree=engine.snapshot(a).scenery[0];a.x=tree.tile.x-1;a.y=tree.tile.y;
 succeed(engine,a,'ignite camp tree');tick();
 assert.equal(engine.snapshot(a).scenery[0].condition,'burning');
 const hp=engine.snapshot(a).scenery[0].hp;
 assert.equal(shouldUseCreative('put out the camp tree',{chaos:engine.snapshot(a)}),true);
 assert.equal(engine.execute(a,'put out the camp tree').success,true);
 tick();assert.equal(engine.snapshot(a).scenery[0].hp,hp);
 assert.equal(engine.snapshot(a).scenery[0].condition,'intact');
 assert.equal(engine.isBlocked(a,tree.tile.x,tree.tile.y),true);
 b.x=a.x;b.y=a.y;
 assert.equal(engine.snapshot(b).scenery[0].condition,'intact');
 assert.equal(createChaosWorld({file,clock:()=>21000}).snapshot(a).scenery[0].condition,'intact');
 assert.ok(engine.snapshot(a).story.some(e=>/extinguish/i.test(e.fact)));
 assert.equal(engine.execute(a,'push camp tree east').blocked,true,'rooted scenery cannot be pushed');
});
test('authored damage rolls back when the durable save fails',t=>{
 const {a,engine,file}=fixture(t);const tree=engine.snapshot(a).scenery[0];
 a.x=tree.tile.x-1;a.y=tree.tile.y;
 fs.renameSync(file,file+'.saved');fs.mkdirSync(file);
 assert.throws(()=>engine.execute(a,'attack tree'));
 fs.rmdirSync(file);fs.renameSync(file+'.saved',file);
 assert.equal(engine.snapshot(a).scenery[0].hp,12);
});
test('authored and ordinary objects conduct fire one hop per tick in both directions',t=>{
 const {a,engine,tick}=fixture(t);const tree=engine.snapshot(a).scenery[0];
 a.x=tree.tile.x-1;a.y=tree.tile.y;engine.execute(a,'drop cloth strip');
 a.x--;engine.execute(a,'drop wood splinter');a.x++;
 succeed(engine,a,'ignite camp tree');tick();
 let view=engine.snapshot(a);
 assert.equal(view.ground.find(i=>i.name==='cloth strip').condition,'burning');
 assert.equal(view.ground.find(i=>i.name==='wood splinter').condition,'intact');
 tick();view=engine.snapshot(a);
 assert.equal(view.ground.find(i=>i.name==='wood splinter').condition,'burning');
 assert.equal(engine.execute(a,'extinguish '+tree.id).success,true,'full displayed IDs work too');
});
test('stable NPC identities bind to the current native body after reconnect',t=>{
 const {a,guard,engine,file}=npcFixture(t);const original=engine.snapshot(a).npcs.find(n=>n.nativeId==='91');
 assert.ok(original);guard.id=912;
 const restored=createChaosWorld({file});const current=restored.snapshot(a).npcs.find(n=>n.id===original.id);
 assert.equal(current.nativeId,'912');assert.equal(current.id,original.id);assert.deepEqual(current.items.map(i=>i.id),original.items.map(i=>i.id));
});

test('chosen Charming perk changes real NPC apology roll without changing theft or native HP',t=>{
 const {a,guard,engine,file}=npcFixture(t);
 const rug=engine.snapshot(a).ground.find(i=>i.owner==='guard');
 a.x=rug.tile.x;a.y=rug.tile.y;
 a.chaosRole='bard';a.chaosPerk='charming';
 const theft=engine.execute(a,'steal '+rug.id);
 assert.equal(theft.blocked,false);
 assert.equal(theft.bonus,0,'Bard and Charming do not gain theft bonuses');
 assert.equal(engine.canQuest(a,guard),false);
 const hp=a.hitPoints;
 const apology=engine.execute(a,'apologize to guard');
 assert.equal(apology.blocked,false,apology.text);
 assert.equal(apology.bonus,3);
 assert.equal(apology.perkBonus,2);
 assert.match(apology.text,/\+3 class \+2 Charming/);
 assert.equal(apology.success,apology.roll===20||(apology.roll!==1&&apology.roll+5>=apology.dc));
 assert.equal(a.hitPoints,hp,'native HP remains untouched by social perks');
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.ok(saved.npcs[engine.snapshot(a).npcs[0].id].history.some(h=>h.verb==='appeal'));
});
