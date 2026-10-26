import test from 'node:test';
import assert from 'node:assert/strict';
import {Rng,RateLimiter,ClockSync} from '../src/framework.mjs';
import {createRoom,addPlayer,startGame,submit,advance,withGameRng} from '../public/core.js';

test('reused PartyFrame RNG checkpoints restore the exact next draws',()=>{
  const rng=new Rng(12);rng.next();const checkpoint=rng.snapshot(),expected=[rng.int(1,20),rng.int(1,20),rng.next()];
  const resumed=new Rng(0);resumed.restore(checkpoint);assert.deepEqual([resumed.int(1,20),resumed.int(1,20),resumed.next()],expected);
});
test('reused PartyFrame token buckets isolate clients and refill by authoritative time',()=>{
  const limiter=new RateLimiter({capacity:2,refillPerSecond:1});assert.equal(limiter.tryConsume('a',1000),true);assert.equal(limiter.tryConsume('a',1000),true);assert.equal(limiter.tryConsume('a',1000),false);assert.equal(limiter.tryConsume('b',1000),true);assert.equal(limiter.tryConsume('a',2000),true);limiter.forget('a');assert.equal(limiter.tryConsume('a',2000),true);
});
test('reused PartyFrame clock corrects a one-minute device skew and rejects a stale radio sample',t=>{
  let localNow=60100;t.mock.method(Date,'now',()=>localNow);
  const clock=new ClockSync(()=>{});clock.handlePong(60000,1050);assert.equal(clock.rtt,100);assert.equal(clock.offset,-59000);assert.equal(clock.now(),1100);
  localNow=60600;clock.handlePong(60500,1550);assert.equal(clock.remaining(3000),1400);
  localNow=70000;clock.handlePong(64000,5000);assert.equal(clock.offset,-59000);
});
test('game plugin consumes the framework RNG and persists its continuation',()=>{
  const r=createRoom({seed:832,now:1000});const p=addPlayer(r,{name:'Test',token:'test-framework-token',role:'wizard'},1000);startGame(r,1000);
  const rng=new Rng(999);withGameRng(r,rng,()=>submit(r,p.id,{requestId:'framework-action',text:'Cast a spell'},2000));
  withGameRng(r,rng,()=>advance(r,10000));assert.equal(r.seed,rng.snapshot());assert.equal(r.stats.rolls,1);
});
