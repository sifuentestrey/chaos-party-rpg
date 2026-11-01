import test from 'node:test';
import assert from 'node:assert/strict';
import {selectNpcFireResponses} from './reactive-npc-actions.mjs';
const setup=()=>({npcs:{guard:{id:'guard',location:'town',tile:{x:4,y:4},history:[]}},items:{rug:{id:'rug',ownerId:'guard',tile:{x:5,y:4},condition:'burning'}}});
const decide=(s,tick,overrides={})=>selectNpcFireResponses({npcs:s.npcs,items:s.items,location:'town',present:new Set(['guard']),zoneAt:()=> 'town',validTile:()=>true,tick,...overrides});
test('owner NPC must first observe a burning floor object; no instant rescue',()=>{const s=setup();assert.deepEqual(decide(s,10000),[]);assert.deepEqual(decide(s,19999),[]);assert.deepEqual(decide(s,20000),[{npcId:'guard',itemId:'rug'}]);});
test('distant, unseen, different-zone, or carried property cannot trigger a response',()=>{for(const variant of ['distant','unseen','zone','carried']){const s=setup();if(variant==='distant')s.items.rug.tile.x=9;if(variant==='carried')s.items.rug.tile=null;const opts=variant==='unseen'?{present:new Set()}:variant==='zone'?{zoneAt:t=>t.x===4?'town':'forest'}:{};assert.deepEqual(decide(s,10000,opts),[],variant);assert.deepEqual(decide(s,20000,opts),[],variant);}});
test('extinguished property clears the pending response and requires a new warning',()=>{const s=setup();decide(s,10000);s.items.rug.condition='intact';assert.deepEqual(decide(s,20000),[]);assert.equal(s.npcs.guard.fireAlert,undefined);s.items.rug.condition='burning';assert.deepEqual(decide(s,30000),[]);assert.deepEqual(decide(s,40000),[{npcId:'guard',itemId:'rug'}]);});
test('NPC cannot extinguish another NPC or a player item',()=>{const s=setup();s.items.rug.ownerId='other';assert.deepEqual(decide(s,10000),[]);assert.deepEqual(decide(s,20000),[]);});
test('leaving and returning resets the warning timer, preventing instant remote rescue',()=>{
 const s=setup();decide(s,10000);
 assert.deepEqual(decide(s,20000,{present:new Set()}),[]);
 assert.equal(s.npcs.guard.fireAlert,undefined);
 assert.deepEqual(decide(s,30000),[]);
 assert.deepEqual(decide(s,40000),[{npcId:'guard',itemId:'rug'}]);
});
