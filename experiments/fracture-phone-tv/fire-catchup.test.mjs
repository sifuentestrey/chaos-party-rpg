import test from 'node:test';
import assert from 'node:assert/strict';
import {fireCatchup} from './chaos-world.mjs';

test('bounded environmental fire catch-up retains elapsed ticks',()=>{
 let last=1000;const now=101000;let count=0;
 while(true){const next=fireCatchup(last,now);if(!next.steps)break;count+=next.steps;assert.ok(next.steps<=3);assert.ok(next.next>last);last=next.next;}
 assert.equal(count,10);assert.equal(last,now);
 assert.deepEqual(fireCatchup(20000,10000),{steps:0,next:20000});
});
