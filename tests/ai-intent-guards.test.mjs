import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {applyAIPlan,validateAIPlan} from '../public/ai-plan.js';
import {advance} from '../public/core.js';
const fixture=text=>prepareAICase({id:'repair-fixture',setup:'creature',text});
const plan=(verb,target,extra={})=>({domain:'world',verb,target,item:'',sources:[],name:'',itemType:'tool',slot:'hand',color:'#bd88cf',summary:'Attempt the requested action',...extra});
test('native bandaging resolves a unique title and possessive injury without cloud AI',()=>{
 const {room}=fixture('Bandage the wayfarer’s sprained arm using my cloth strip');
 assert.equal(room.turn.worldLocked,true);advance(room,room.turn.deadline+1);
 assert.equal(room.result.blocked,false);assert.match(room.result.narration,/treat/i);
});
test('an unresolved native target can be clarified without changing the committed verb',()=>{
 const {room}=fixture('Bandage the injured stranger over there'),action=room.turn.action,id=room.turn.id;
 assert.equal(room.turn.worldLocked,false);assert.equal(room.turn.worldPendingVerb,'treat');
 assert.throws(()=>applyAIPlan(room,id,plan('pacify','beast-clearing'),'fixture',room.turn.deadline-1000),/changed the declared action/);
 assert.equal(applyAIPlan(room,id,plan('treat','person-clearing',{item:'item-1'}),'fixture',room.turn.deadline-1000),true);
 assert.equal(room.turn.action,action);assert.equal(room.turn.id,id);
 assert.equal(room.turn.worldLocked,true);assert.equal(applyAIPlan(room,id,plan('treat','beast-clearing'),'fixture',room.turn.deadline-1000),false);
 advance(room,room.turn.deadline+1);assert.equal(room.result.blocked,false);
});
test('a known invalid bandage tool stays blocked and cannot consume another item',()=>{
 const {room,actor}=fixture('Bandage person-clearing with my wood splinter');
 const before=structuredClone(room.world.expedition.items['item-1']);
 assert.equal(room.turn.worldLocked,true);advance(room,room.turn.deadline+1);
 assert.equal(room.result.blocked,true);assert.deepEqual(room.world.expedition.items['item-1'],before);
 assert.equal(room.world.expedition.items['item-1'].ownerId,actor.id);
});
test('vocal pacification cannot consume a cloth as medical treatment',()=>{
 const {room,actor}=fixture('I soothe Cinder Wolf with a ridiculous rap instead of hurting it');const before=structuredClone(room);
 assert.throws(()=>validateAIPlan(plan('treat','beast-clearing',{item:'item-1'}),room,actor.id),/vocal pacification/);
 assert.deepEqual(room,before);assert.doesNotThrow(()=>validateAIPlan(plan('pacify','beast-clearing'),room,actor.id));
});
test('crafting a new item needs existing sources but no existing output identity',()=>{
 const {room,actor}=prepareAICase({id:'new-hat',setup:'craft',text:'Fashion a blue hat from my cloth strip and wood splinter'});
 assert.doesNotThrow(()=>validateAIPlan(plan('craft','',{name:'blue hat',sources:['item-1','item-2'],itemType:'wearable',slot:'head',color:'#7ea7d4'}),room,actor.id));
});
test('AI treatment cannot silently substitute cloth for an explicitly chosen nonmedical item',()=>{
 const {room,actor}=fixture('Use my wood splinter to bandage the wayfarer');
 assert.throws(()=>validateAIPlan(plan('treat','person-clearing',{item:'item-2'}),room,actor.id),/cloth|fiber/);
});

test('native craft resolves my carried components despite duplicate names on the ground',()=>{
 const {room,actor}=prepareAICase({id:'native-craft',setup:'creature',text:'Create a green headband from my cloth strip and wood splinter to wear on my head'});
 assert.equal(room.turn.worldLocked,true);advance(room,room.turn.deadline+1);
 assert.equal(room.result.blocked,false);
 const creation=Object.values(room.world.expedition.items).find(i=>i.name==='green headband');
 assert.ok(creation);assert.equal(creation.ownerId,actor.id);assert.equal(creation.type,'wearable');assert.equal(creation.appearance.color,'#83b48a');
});
