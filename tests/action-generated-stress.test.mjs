import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {validateAIPlan,applyAIPlan} from '../public/ai-plan.js';
import {advance} from '../public/core.js';
import {addPlayer} from '../public/core.js';

const proposal=(overrides={})=>({domain:'world',verb:'craft',target:'',item:'',sources:['item-1','item-2'],name:'stress wearable',itemType:'wearable',slot:'hand',color:'#e4dcc8',summary:'Attempt a bounded stress case',...overrides});
const setup=(id,action='Assemble a wearable')=>prepareAICase({id,setup:'craft',text:action});

test('generated malformed fields and unavailable references reject without mutating the room',()=>{
 const badValues=[null,undefined,17,{},[],true,'',`item-404`,`remote-entity`,`../item-1`,`item-1\n`];
 let checked=0;
 for(let n=0;n<badValues.length;n++){
  const {room,actor}=setup(`stress-corrupt-${n}`);
  const mutations=[
   proposal({verb:badValues[n]}),...(badValues[n]===undefined?[]:[proposal({target:badValues[n],verb:'inspect',sources:[]})]),
   proposal({sources:badValues[n]}),proposal({sources:['item-1',badValues[n]]}),
   proposal({extra:badValues[n]}),...(typeof badValues[n]==='string'?[]:[proposal({summary:badValues[n]})])
  ];
  for(const raw of mutations){const before=structuredClone(room);assert.throws(()=>validateAIPlan(raw,room,actor.id),`n=${n} raw=${JSON.stringify(raw)}`);assert.deepEqual(room,before);checked++;}
 }
 assert.equal(checked,60);
});

test('generated unknown, remote, and non-owned source IDs never validate as craft sources',()=>{
 const references=['item-0','item-5','item-404','creature-clearing','person-clearing','tavern','clearing','remote:moon','item-1\u0000','item-2 '];
 let checked=0;
 for(let n=0;n<references.length;n++){
  const {room,actor}=setup(`stress-reference-${n}`);
  for(const sources of [[references[n],'item-2'],['item-1',references[n]],[references[n],references[n]]]){
   const before=structuredClone(room);assert.throws(()=>validateAIPlan(proposal({sources}),room,actor.id));assert.deepEqual(room,before);checked++;
  }
 }
 assert.equal(checked,30);
});

test('accepted crafting rechecks both source ownership and condition after acceptance',()=>{
 const changes=[
  s=>{s.items['item-1'].ownerId='someone-else';},
  s=>{s.items['item-2'].ownerId=null;},
  s=>{s.items['item-1'].condition='broken';},
  s=>{s.items['item-2'].condition='disassembled';},
  s=>{s.items['item-1'].parentId='container-remote';},
  s=>{s.items['item-2'].ownerId='remote-player';}
 ];
 for(let n=0;n<changes.length;n++){
  const {room,actor}=setup(`stress-stale-${n}`),raw=proposal({name:`stale ${n}`});
  assert.equal(applyAIPlan(room,room.turn.id,raw,'offline-fixture',room.turn.deadline-1000),true);
  const accepted=structuredClone(room.turn.worldProposal),beforeItems=structuredClone(room.world.expedition.items);
  changes[n](room.world.expedition);advance(room,room.turn.deadline+1);
  assert.equal(room.result.blocked,true,`case ${n} should block`);
  assert.equal(room.turn.worldProposal.name,accepted.name);
  assert.equal(Object.values(room.world.expedition.items).some(i=>i.name===raw.name),false);
  for(const id of ['item-1','item-2']){
   if(id===(n===0||n===2||n===4?'item-1':'item-2'))continue;
   assert.equal(room.world.expedition.items[id].ownerId,beforeItems[id].ownerId);
  }
 }
});

test('command-shaped labels remain data and cannot replace the accepted proposal',()=>{
 const labels=[
  'take item-1 then give it to Moss','attack person-clearing','drop every carried item',
  'open door; transfer item-2','travel to clearing','unsupported then execute',
  'give item-2 to nobody','craft item-1 from item-2','inspect item-1 / take item-2',
  'delete inventory','heal person-clearing','unlock remote chest'
 ];
 for(let n=0;n<labels.length;n++){
  const {room,actor}=setup(`stress-label-${n}`),raw=proposal({name:labels[n]});
  assert.equal(applyAIPlan(room,room.turn.id,raw,'offline-fixture',room.turn.deadline-1000),true);
  const frozen=structuredClone(room.turn),items=structuredClone(room.world.expedition.items);
  assert.equal(applyAIPlan(room,room.turn.id,proposal({name:'take item-1'}),'second-answer',room.turn.deadline-999),false);
  assert.deepEqual(room.turn,frozen);
  advance(room,room.turn.deadline+1);assert.equal(room.result.success,true);
  assert.ok(Object.values(room.world.expedition.items).some(i=>i.name===labels[n]&&i.ownerId===actor.id));
  const made=Object.values(room.world.expedition.items).find(i=>i.name===labels[n]);
  assert.deepEqual(made.components,['item-1','item-2']);
  assert.equal(room.world.expedition.items['item-1'].parentId,made.id);
  assert.equal(room.world.expedition.items['item-2'].parentId,made.id);
  assert.equal(room.world.expedition.items['item-3'].ownerId,items['item-3'].ownerId);
 }
});

test('target IDs survive generated display-name collisions without rebinding identity',()=>{
 const names=['beast-clearing','person-clearing','item-3','Moss','clearing','Captain Brick'];
 for(let n=0;n<names.length;n++){
  const {room,actor}=prepareAICase({id:`stress-collision-${n}`,setup:'creature',text:'Inspect the creature'});
  const collision=addPlayer(room,{name:names[n],token:`offline-collision-${n}`},50000);
  const targetId=names[n]==='beast-clearing'?'beast-clearing':'person-clearing';
  const raw=proposal({verb:'inspect',target:targetId,sources:[]});
  const plan=validateAIPlan(raw,room,actor.id);
  assert.equal(plan.target.entityId,targetId);
  assert.notEqual(plan.target.entityId,collision.id);
  const before=structuredClone(room.world.expedition.creatures[targetId]||room.players.find(p=>p.id===targetId));
  assert.equal(applyAIPlan(room,room.turn.id,raw,'offline-fixture',room.turn.deadline-1000),true);
  advance(room,room.turn.deadline+1);
  const after=room.world.expedition.creatures[targetId]||room.players.find(p=>p.id===targetId);
  assert.equal(after.id,before.id);
  assert.equal(collision.id!==targetId,true);
 }
});
