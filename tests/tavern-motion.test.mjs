import test from 'node:test';
import assert from 'node:assert/strict';
import {seats,landmarks,targetPosition,actorPosition,recoil} from '../public/tavern-motion.js';
test('presentation resolves saved character targets and tolerates missing characters',()=>{
  const players=[{id:'one'},{id:'two'}];
  assert.deepEqual(targetPosition({id:'two'},players,seats[0]),seats[1]);
  assert.deepEqual(targetPosition({kind:'guard'},players,seats[0]),landmarks.guard);
  assert.deepEqual(targetPosition({kind:'self'},players,seats[0]),seats[0]);
  assert.deepEqual(targetPosition({id:'missing'},players,seats[0]),seats[0]);
});
test('declaration approaches without teleporting, holds for reactions, and returns after impact',()=>{
  const home=[100,300],target=[500,300];
  assert.deepEqual(actorPosition(home,target,0,null),home);
  const midway=actorPosition(home,target,425,null),arrived=actorPosition(home,target,850,null);
  assert.ok(midway[0]>home[0]&&midway[0]<arrived[0]);
  assert.equal(arrived[0],448);
  assert.deepEqual(actorPosition(home,target,10000,null),arrived);
  assert.ok(actorPosition(home,target,10000,250)[0]>arrived[0]);
  assert.deepEqual(actorPosition(home,target,10000,1850),home);
  assert.deepEqual(actorPosition(home,target,10000,250,true),home);
  assert.equal(recoil(250,true),0);assert.ok(recoil(350)>0);assert.equal(recoil(700),0);
});
test('24 distinct seats remain above the TV dialogue area',()=>{
  assert.equal(new Set(seats.map(p=>p.join(','))).size,24);
  assert.ok(seats.every(([x,y])=>x>=100&&x<=860&&y+24<=435));
});
