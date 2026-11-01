import test from 'node:test';import assert from 'node:assert/strict';
import {gameNow,gameTimeout,setChaosClock} from './chaos-clock.ts';import {createSimulationClock} from './party-pacing.mjs';
test('native effect timers use paused simulation time, while real request timestamps keep advancing',async t=>{
 let wall=1000;const clock=createSimulationClock({wall:()=>wall});setChaosClock(clock);t.after(()=>setChaosClock(null));let fired=false;
 const timer=gameTimeout({},()=>fired=true,100);t.after(()=>clearTimeout(timer));clock.pause();wall+=30000;await new Promise(r=>setTimeout(r,35));assert.equal(fired,false);assert.equal(gameNow({}),1000);
 clock.resume();wall+=99;await new Promise(r=>setTimeout(r,35));assert.equal(fired,false);wall++;await new Promise(r=>setTimeout(r,35));assert.equal(fired,true);
});
test('an ordinary native world keeps wall time while the isolated party clock is paused',t=>{
 const clock=createSimulationClock({wall:()=>1000});clock.pause();setChaosClock(clock);t.after(()=>setChaosClock(null));
 const before=Date.now(),native=gameNow({getWorld:()=>({})});assert.ok(native>=before&&native<=Date.now());assert.equal(gameNow({getWorld:()=>({chaosClock:clock})}),1000);
});
test('an overdue native callback also waits until the paused world resumes',async t=>{
 let wall=1000;const clock=createSimulationClock({wall:()=>wall});setChaosClock(clock);t.after(()=>setChaosClock(null));let fired=false;
 const timer=gameTimeout({},()=>fired=true,1);t.after(()=>clearTimeout(timer));wall+=10;clock.pause();await new Promise(r=>setTimeout(r,35));assert.equal(fired,false);clock.resume();await new Promise(r=>setTimeout(r,35));assert.equal(fired,true);
});
