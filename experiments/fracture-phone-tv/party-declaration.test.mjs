import test from 'node:test';import assert from 'node:assert/strict';
import {stagedAction,isReaction,publicDeclarations,REACTION_MS} from './party-declaration.mjs';
test('opt-in world checks only, not ordinary combat, teleport or fabricated actions',()=>{
 for(const text of ['declare craft green hat from cloth strip','announce: steal guard rug','prepare push camp table east','declare apologize to guard']){
  const r=stagedAction(text);assert.equal(r.intent.verb,'creative',text);assert.ok(r.text.length);
 }
 for(const text of ['declare attack rat','declare teleport to castle','declare help Ada','declare move left','announce dance on the roof']){
  assert.match(stagedAction(text).error,/supported Chaos D20/);
 }
 assert.equal(stagedAction('attack rat'),null);
 assert.equal(REACTION_MS,10000);
});
test('reactive help/hinder are real creative world intents, not declarations or movement',()=>{
 for(const text of ['help Ada','assist Ada','hinder Ada','interfere with Ada on their roll','sabotage Ada'])assert.equal(isReaction(text),true,text);
 for(const text of ['help me','attack rat','stop','steal guard rug'])assert.equal(isReaction(text),false,text);
});
test('public pending view never exposes tokens, actor IDs or internal state',()=>{
 const m=new Map([['private-token',{id:'id-1',name:'Ada',text:'steal guard rug',dueAt:11000,actorId:333,epoch:8}],['secret',{id:'id-2',name:'Bryn',text:'craft hat',dueAt:999}]]);
 const view=publicDeclarations(m,1000);assert.equal(view.length,1);assert.equal(view[0].player,'Ada');assert.ok(!JSON.stringify(view).includes('private-token'));assert.ok(!JSON.stringify(view).includes('333'));
});
