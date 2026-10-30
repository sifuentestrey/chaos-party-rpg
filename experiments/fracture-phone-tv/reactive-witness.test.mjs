import test from 'node:test';
import assert from 'node:assert/strict';
import {recordEnvironmentalIncident,propertyConcern} from './reactive-witness.mjs';
const sample=()=>({owner:{id:'owner',location:'world',tile:{x:1,y:1},trust:{},history:[],memories:{}},observer:{id:'observer',location:'world',tile:{x:3,y:1},trust:{},history:[],memories:{}},elsewhere:{id:'elsewhere',location:'other',tile:{x:1,y:1},trust:{},history:[],memories:{}}});
const item={id:'rug',ownerId:'owner',name:'blue rug',tile:{x:2,y:1},condition:'burning'};
test('a witnessed fire changes only the owner’s trust and records separate personal memory',()=>{
 const npcs=sample();const witnesses=recordEnvironmentalIncident(npcs,{kind:'fire-spread',item,actorId:'actor-1',round:3,location:'world',canWitness:(npc,tile)=>Math.abs(npc.tile.x-tile.x)<=2});
 assert.deepEqual(witnesses,['owner','observer']);
 assert.equal(npcs.owner.trust['actor-1'],-1);
 assert.equal(npcs.observer.trust['actor-1'],undefined);
 assert.equal(npcs.elsewhere.history.length,0);
 assert.equal(npcs.owner.memories['actor-1'][0].itemId,'rug');
 assert.equal(npcs.observer.memories['actor-1'][0].verb,'fire-spread');
});
test('unattributed environmental events never blame a player',()=>{
 const npcs=sample();recordEnvironmentalIncident(npcs,{kind:'fire-destruction',item,round:4,location:'world',canWitness:()=>true});
 assert.equal(npcs.owner.trust['actor-1'],undefined);
 assert.equal(npcs.owner.memories['actor-1'],undefined);
 assert.equal(npcs.owner.history[0].actorId,null);
});
test('zone/visibility callback prevents impossible witnesses; memory remains bounded',()=>{
 const npcs=sample();for(let i=0;i<18;i++)recordEnvironmentalIncident(npcs,{kind:'fire-spread',item,actorId:'actor-1',round:i+1,location:'world',canWitness:npc=>npc.id==='owner'});
 assert.equal(npcs.owner.history.length,12);assert.equal(npcs.owner.memories['actor-1'].length,4);
 assert.equal(npcs.observer.history.length,0);assert.equal(npcs.owner.trust['actor-1'],-10);
});
test('NPC concern follows live property condition, not invented scene narration',()=>{
 const npcs=sample();const items={rug:{...item}};
 assert.match(propertyConcern(items,npcs.owner,()=>true),/on fire/);
 items.rug.condition='broken';items.rug.heat=3;assert.match(propertyConcern(items,npcs.owner,()=>true),/repair/);
 items.rug.condition='intact';assert.equal(propertyConcern(items,npcs.owner,()=>true),null);
 items.rug.condition='burning';assert.equal(propertyConcern(items,npcs.owner,()=>false),null);
 assert.equal(propertyConcern(items,npcs.observer,()=>true),null);
});
test('invalid incidents do not mutate state',()=>{
 const npcs=sample(),before=structuredClone(npcs);
 assert.deepEqual(recordEnvironmentalIncident(npcs,{kind:'fire',item,actorId:'actor-1',round:1,location:'world',canWitness:()=>true}),[]);
 assert.deepEqual(npcs,before);
});

test('repeated observation of the same object and tick cannot double-penalize the owner',()=>{
 const npcs=sample(),event={kind:'fire-spread',item,actorId:'actor-1',round:9,location:'world',canWitness:()=>true};
 assert.deepEqual(recordEnvironmentalIncident(npcs,event),['owner','observer']);
 assert.deepEqual(recordEnvironmentalIncident(npcs,event),[]);
 assert.equal(npcs.owner.trust['actor-1'],-1);
 assert.equal(npcs.owner.memories['actor-1'].length,1);
});
