import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createChaosWorld,shouldUseCreative,nativeDoorAttempt} from './chaos-world.mjs';
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-native-doors-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'objects.json');
 const world={id:'test',players:{},entities:{},zoneManager:{getZoneAt:()=>({name:'The Refuge'})},isValidPosition:(x,y)=>x>0&&y>0&&x<100&&y<314};
 const player=(id,x,y)=>({characterId:id,name:id,x,y,chaosControlled:true,hasEnteredGame:true,isDead:false,hitPoints:100,maxHitPoints:100,getWorld:()=>world});
 const alice=player('alice',40,210),bob=player('bob',46,210);world.players={alice,bob};
 const nativeDoors=[{x:45,y:210,tx:80,ty:230},{x:80,y:230,tx:45,ty:210}];
 const engine=createChaosWorld({file,nativeDoors,seed:4});
 return {alice,bob,engine,file,world,nativeDoors};
}
test('existing Fracture doorway is interactable without creating new scenery or assets',t=>{
 const {alice,bob,engine,file,world}=fixture(t);
 assert.equal(nativeDoorAttempt('please brace the doorway shut'),'hold');
 assert.equal(shouldUseCreative('hold door',{}),true);
 assert.deepEqual(engine.approach(alice,'hold door'),{x:45,y:210});
 assert.equal(engine.execute(alice,'hold door').blocked,true);
 alice.x=44;
 engine.snapshot(bob);const before=Object.keys(JSON.parse(fs.readFileSync(file)).scenery).length;
 assert.equal(engine.execute(alice,'hold door').success,true);
 assert.equal(engine.isBlocked(bob,45,210),true);
 assert.equal(engine.isBlocked(bob,80,230),true);
 assert.equal(engine.snapshot(bob).doors[0].heldBy,'alice');
 assert.equal(Object.keys(JSON.parse(fs.readFileSync(file)).scenery).length,before);
 assert.equal(engine.execute(bob,'release door').blocked,true);
 assert.equal(engine.execute(alice,'release door').success,true);
 assert.equal(engine.isBlocked(bob,45,210),false);
 assert.deepEqual(JSON.parse(fs.readFileSync(file)).doorBarricades,undefined,'temporary holds never become phantom saved props');
 assert.equal(world.isValidPosition(45,210),true,'native map remains unchanged');
});
test('other character can force an occupied doorway with original D20; hold never survives restart',t=>{
 const {alice,bob,engine,file,nativeDoors}=fixture(t);alice.x=44;
 engine.snapshot(alice);engine.snapshot(bob);
 assert.equal(engine.execute(alice,'hold door').success,true);
 let forced=false;
 for(let i=0;i<20;i++){
  const result=engine.execute(bob,'force door');
  assert.equal(result.blocked,false);assert.equal(result.dc,12);
  if(result.success){forced=true;break;}
  assert.equal(engine.isBlocked(bob,45,210),true);
 }
 assert.equal(forced,true);assert.equal(engine.isBlocked(bob,45,210),false);
 engine.execute(alice,'hold door');
 const restored=createChaosWorld({file,nativeDoors,seed:4});
 assert.equal(restored.isBlocked(bob,45,210),false);
});
