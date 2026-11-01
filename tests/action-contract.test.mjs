import test from 'node:test';
import assert from 'node:assert/strict';
import {actionContract} from '../src/action-contract.mjs';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {applyAIPlan,validateAIPlan} from '../public/ai-plan.js';
import {advance} from '../public/core.js';
const proposal=name=>({domain:'world',verb:'craft',target:'',item:'',sources:['item-1','item-2'],name,itemType:'wearable',slot:'hand',color:'#e4dcc8',summary:'Attempt a creation'});
test('the hosted contract supports crafting without keyword routing and grounds all references',()=>{
 const {room,actor}=prepareAICase({id:'new-wording',setup:'craft',text:'Assemble a little finger puppet from the things in my pockets'});
 const c=actionContract(room,actor.id),p=c.schema.properties;
 assert.ok(p.domain.enum.includes('world'));assert.ok(p.verb.enum.includes('craft'));
 assert.deepEqual(p.item.enum,['','item-1','item-2']);assert.deepEqual(p.sources.items.enum,['item-1','item-2']);
 assert.equal(JSON.stringify(c).includes(actor.token),false);assert.equal(JSON.stringify(c).includes(actor.pin),false);
});
test('remote scene contract excludes tavern fixtures and uncarried source IDs',()=>{
 const {room,actor}=prepareAICase({id:'remote-contract',setup:'creature',text:'Attempt something'}),p=actionContract(room,actor.id).schema.properties;
 assert.deepEqual(p.domain.enum,['world']);assert.equal(p.target.enum.includes('rug'),false);assert.equal(p.sources.items.enum.includes('item-5'),false);
});
test('typed crafting preserves arbitrary names containing grammar words through resolution',()=>{
 for(const name of ['hat from the void','ring and a song','glove to wear on my hand','give item-2 to nobody']){
  const {room,actor}=prepareAICase({id:'typed-label',setup:'craft',text:'Assemble a novelty wearable'});
  const raw=proposal(name);assert.equal(applyAIPlan(room,room.turn.id,raw,'fixture',room.turn.deadline-1000),true);
  raw.name='changed after acceptance'; // The accepted proposal owns a copy.
  advance(room,room.turn.deadline+1);assert.equal(room.result.success,true);
  assert.ok(Object.values(room.world.expedition.items).some(i=>i.name===name&&i.ownerId===actor.id));
 }
});
test('typed proposals recheck ownership at resolution instead of trusting a stale preflight',()=>{
 const {room,actor}=prepareAICase({id:'stale-source',setup:'craft',text:'Assemble a novelty wearable'});
 const raw=proposal('new hat');applyAIPlan(room,room.turn.id,raw,'fixture',room.turn.deadline-1000);
 room.world.expedition.items['item-1'].ownerId='someone-else';
 advance(room,room.turn.deadline+1);assert.equal(room.result.blocked,true);
 assert.equal(room.world.expedition.items['item-2'].ownerId,actor.id);
 assert.equal(Object.values(room.world.expedition.items).some(i=>i.name==='new hat'),false);
});
test('unavailable world references are rejected before accepting a proposal',()=>{
 const {room,actor}=prepareAICase({id:'remote-reference',setup:'creature',text:'Inspect a distant object'});
 assert.throws(()=>validateAIPlan({...proposal(''),verb:'inspect',sources:[],target:'item-3'},room,actor.id),/unavailable/);
});

test('typed operations share the native ownership and feasibility checks across action families',async()=>{
 const {planWorldProposal,itemPlan}=await import('../public/world-items.js');
 const matrix=[
  [{verb:'take',target:'item-3'},'Take item-3'],
  [{verb:'drop',target:'item-2'},'Drop item-2'],
  [{verb:'equip',target:'item-1'},'Equip item-1'],
  [{verb:'unequip',target:'item-2'},'Unequip item-2'],
  [{verb:'separate',target:'item-2'},'Separate item-2'],
  [{verb:'inspect',target:'item-3'},'Inspect item-3'],
  [{verb:'open',target:'item-3'},'Open item-3'],
  [{verb:'move',target:'item-3'},'Move item-3'],
  [{verb:'ignite',target:'item-1'},'Ignite item-1'],
  [{verb:'extinguish',target:'item-1'},'Extinguish item-1'],
  [{verb:'repair',target:'item-2'},'Repair item-2'],
  [{verb:'drink',target:'item-3'},'Drink item-3'],
  [{verb:'attack',target:'item-3',item:'item-2'},'Attack item-3 with item-2'],
  [{verb:'use',target:'item-3',item:'item-2'},'Use item-2 on item-3'],
  [{verb:'travel',target:'clearing'},'Travel to clearing'],
  [{verb:'craft',name:'new hat',sources:['item-1','item-2']},'Make new hat from item-1 and item-2']
 ];
 for(const [raw,text] of matrix){
  const {room,actor}=prepareAICase({id:'parity',setup:'craft',text:'Assemble something'});
  const typed=planWorldProposal(room,actor,raw),native=itemPlan(room,actor,text);
  for(const field of ['verb','error','itemId','targetId','sourceIds','recipientId','destination','automatic','dc'])assert.deepEqual(typed?.[field],native?.[field],raw.verb+':'+field);
 }
});

test('domain labels cannot discard item arguments for a world-only operation',async()=>{
 const {routeActionProposal}=await import('../src/action-contract.mjs');
 const {room,actor}=prepareAICase({id:'ownership-transfer',setup:'craft',text:'Offer my splinter to Moss'});
 const recipient=room.players.find(p=>p.name==='Moss');
 const raw={...proposal(''),domain:'tavern',verb:'give',item:'item-2',target:recipient.id,sources:[]};
 const routed=routeActionProposal(raw,room);assert.equal(routed.domain,'world');assert.equal(routed.item,'item-2');
 assert.doesNotThrow(()=>validateAIPlan(routed,room,actor.id));
 const contract=actionContract(room,actor.id);assert.equal(contract.context.palette.white,'#e4dcc8');assert.ok(contract.schema.properties.color.enum.includes(contract.context.palette.white));
});

test('an accepted typed action cannot be replaced by another model answer on the same turn',()=>{
 const {room,actor}=prepareAICase({id:'immutable-proposal',setup:'craft',text:'Assemble a wearable'});
 const id=room.turn.id,now=room.turn.deadline-1000;
 assert.equal(applyAIPlan(room,id,proposal('first wearable'),'fixture',now),true);
 const before=structuredClone(room.turn);
 assert.equal(applyAIPlan(room,id,proposal('replacement'),'fixture',now+1),false);
 assert.deepEqual(room.turn,before);assert.equal(room.turn.actorId,actor.id);
});
