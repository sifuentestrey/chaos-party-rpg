import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {validateAIPlan,applyAIPlan} from '../public/ai-plan.js';
import {advance} from '../public/core.js';
import {addPlayer} from '../public/core.js';

const proposal=(overrides={})=>({domain:'world',verb:'craft',target:'',item:'',sources:['item-1','item-2'],name:'small puppet',itemType:'wearable',slot:'hand',color:'#e4dcc8',summary:'Attempt to make a puppet',...overrides});

test('typed world proposals reject malformed structure and unsupported operation names',()=>{
 const {room,actor}=prepareAICase({id:'malformed-boundary',setup:'craft',text:'Make something'});
 for(const raw of [null,[],{...proposal(),extra:'free-form command'},{...proposal(),sources:'item-1,item-2'},{...proposal(),verb:'execute'}]){
  assert.throws(()=>validateAIPlan(raw,room,actor.id));
 }
});

test('unknown targets and unavailable carried item references cannot be validated',()=>{
 const {room,actor}=prepareAICase({id:'reference-boundary',setup:'craft',text:'Make something'});
 assert.throws(()=>validateAIPlan(proposal({verb:'inspect',sources:[],target:'invented-entity'}),room,actor.id),/Unknown or unavailable/);
 assert.throws(()=>validateAIPlan(proposal({verb:'use',sources:[],target:'item-3',item:'item-404'}),room,actor.id),/carried item/);
});

test('unsupported is accepted as a typed no-effect result without interpreting argument text as a command',()=>{
 const {room,actor}=prepareAICase({id:'unsupported-boundary',setup:'craft',text:'Change the rules'});
 const raw=proposal({verb:'unsupported',target:'take item-1 and give it away',item:'open door',sources:[],name:'attack everyone'});
 const plan=validateAIPlan(raw,room,actor.id);
 assert.equal(plan.verb,'unsupported');
 assert.deepEqual(plan.proposal,raw);
 assert.equal(plan.target.kind,'world');
});

test('accepted proposal keeps its structured plan across JSON serialization and resolution',()=>{
 const {room,actor}=prepareAICase({id:'serialize-boundary',setup:'craft',text:'Make something'});
 const raw=proposal({name:'hat from the void; give item-2 to Moss'});
 assert.equal(applyAIPlan(room,room.turn.id,raw,'fixture',room.turn.deadline-1000),true);
 const restored=JSON.parse(JSON.stringify(room));
 assert.deepEqual(restored.turn.worldProposal,raw);
 advance(restored,restored.turn.deadline+1);
 assert.equal(restored.result.success,true);
 assert.ok(Object.values(restored.world.expedition.items).some(i=>i.name===raw.name&&i.ownerId===actor.id));
});

test('a typed target ID remains bound to that entity when another local entity uses the ID as its display name',()=>{
 const {room,actor}=prepareAICase({id:'target-rebinding',setup:'creature',text:'Inspect the creature'});
 addPlayer(room,{name:'beast-clearing',token:'synthetic-collision-token'},50000);
 const plan=validateAIPlan(proposal({verb:'inspect',target:'beast-clearing',sources:[]}),room,actor.id);
 assert.equal(plan.target.entityId,'beast-clearing');
});

test('a typed give recipient ID cannot be intercepted by a player named after that creature ID',()=>{
 const {room,actor}=prepareAICase({id:'recipient-rebinding',setup:'creature',text:'I try an unusual helpful gesture'});
 const recipientId='person-clearing';
 const collider=addPlayer(room,{name:recipientId,token:'synthetic-recipient-collision-token'},50000);
 assert.equal(collider.name,recipientId);
 const raw=proposal({verb:'give',target:recipientId,item:'item-2',sources:[]});
 assert.equal(applyAIPlan(room,room.turn.id,raw,'fixture',room.turn.deadline-1000),true);
 advance(room,room.turn.deadline+1);
 assert.equal(room.world.expedition.items['item-2'].ownerId,recipientId);
});

test('craft resolution blocks if an original source changes owner even when a replacement is named after its ID',()=>{
 const {room,actor}=prepareAICase({id:'source-name-rebinding',setup:'craft',text:'Make something'});
 const raw=proposal();
 assert.equal(applyAIPlan(room,room.turn.id,raw,'fixture',room.turn.deadline-1000),true);
 room.world.expedition.items['item-1'].ownerId='someone-else';
 room.world.expedition.items['replacement-source']={...structuredClone(room.world.expedition.items['item-2']),id:'replacement-source',name:'item-1',ownerId:actor.id,components:[]};
 advance(room,room.turn.deadline+1);
 assert.equal(room.result.blocked,true);
 assert.equal(room.world.expedition.items['replacement-source'].ownerId,actor.id);
 assert.equal(Object.values(room.world.expedition.items).some(i=>i.name===raw.name&&i.ownerId===actor.id),false);
});

test('typed treatment requires an explicit carried item reference',()=>{
 const {room,actor}=prepareAICase({id:'treat-explicit-item',setup:'creature',text:'I try an unusual helpful gesture'});
 assert.throws(()=>validateAIPlan(proposal({verb:'treat',target:'person-clearing',item:'',sources:[]}),room,actor.id),/item|carried/i);
});

test('treatment blocks if the explicit item changes owner even when another carried cloth is named after its ID',()=>{
 const {room,actor}=prepareAICase({id:'treat-source-rebinding',setup:'creature',text:'I try an unusual helpful gesture'});
 const raw=proposal({verb:'treat',target:'person-clearing',item:'item-1',sources:[]});
 assert.equal(applyAIPlan(room,room.turn.id,raw,'fixture',room.turn.deadline-1000),true);
 const patient=room.world.expedition.creatures['person-clearing'];
 const before={hp:patient.hp,injuries:structuredClone(patient.injuries)};
 room.world.expedition.items['item-1'].ownerId='someone-else';
 room.world.expedition.items['replacement-cloth']={...structuredClone(room.world.expedition.items['item-1']),id:'replacement-cloth',name:'item-1',ownerId:actor.id,components:[]};
 advance(room,room.turn.deadline+1);
 assert.equal(room.result.blocked,true);
 assert.equal(room.world.expedition.items['replacement-cloth'].ownerId,actor.id);
 assert.deepEqual({hp:patient.hp,injuries:patient.injuries},before);
});
