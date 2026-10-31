import test from 'node:test';import assert from 'node:assert/strict';import {familyGuide} from './family-guide.mjs';
test('guidance uses only actual nearby people, objects and ingredients; empty scenes cannot invent actions',()=>{
 assert.deepEqual(familyGuide({ready:true,chaos:{},nearby:[]}).actions,[]);
 const guide=familyGuide({ready:true,x:10,y:10,chaos:{scenery:[{id:'oak-1',name:'tree',kind:'tree',tile:{x:11,y:10},condition:'burning'}],bag:[{id:'cloth',material:'cloth',condition:'intact'},{id:'wood',material:'wood',condition:'intact'}]}});
 assert.equal(guide.actions[0].text,'extinguish oak-1');assert.ok(guide.actions.some(a=>a.text==='make party badge from cloth and wood'));assert.ok(!guide.actions.some(a=>a.text==='ignite oak-1'));
});
test('trial guidance moves through actual fixed native destinations and never claims completion',()=>{
 const guide=familyGuide({ready:true,chaos:{}},{status:'active',steps:[{done:true},{done:true}]});assert.match(guide.actions[0].text,/^walk to /);assert.match(guide.hint,/Glitch Woods/);assert.doesNotMatch(guide.hint,/complete/i);
});
