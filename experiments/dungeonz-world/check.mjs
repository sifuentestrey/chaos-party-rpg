import assert from 'node:assert/strict';
import {WoodDoor,Damage} from './engine.js';
let occupied=false;
const events=[];
const board={addStatic(){},removeStatic(){},emitToNearbyPlayers(...args){events.push(args);}};
const door=new WoodDoor({row:13,col:38,board});
door.getBoardTile=()=>({containsAnyDestroyables:()=>occupied});
const actor={energy:0,modEnergy(n){this.energy+=n;}};
try{
  door.interaction(actor);assert.equal(door.isLowBlocked(),true);
  actor.energy=10;door.interaction(actor);assert.equal(actor.energy,9);assert.equal(door.isLowBlocked(),false);
  clearTimeout(door.reactivationTimer);
  occupied=true;door.activate();assert.equal(door.isLowBlocked(),false);
  clearTimeout(door.reactivationTimer);
  occupied=false;door.activate();assert.equal(door.isLowBlocked(),true);
  const hit=new Damage({amount:3,types:[Damage.Types.Physical]});
  assert.equal(hit.canAffectTarget({damageTypeImmunities:[Damage.Types.Physical]}),false);
  assert.equal(hit.canAffectTarget({damageTypeImmunities:[Damage.Types.Magical]}),true);
  assert.ok(events.length>=2);
  console.log('PASS: actual upstream door energy, collision, occupancy, events; damage immunity.');
}finally{door.onDestroy();}
