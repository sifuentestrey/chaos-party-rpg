import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createOptionalDM} from './optional-dm.mjs';
const actor={nearby:[{name:'rat',type:'mob',x:2,y:3}],inventory:[]};
test('AI defaults off, rejects ungrounded plans, and falls back on quota or provider errors',async t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-dm-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let calls=0;const dm=createOptionalDM({dataDir:dir,key:'test-key',fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({choices:[{message:{content:'{"verb":"attack","target":"dragon"}'}}]})};}});assert.equal(await dm.interpret('fight that thing',actor),null);assert.equal(calls,0);dm.enabled=true;assert.equal(await dm.interpret('fight that thing',actor),null);assert.equal(calls,1);assert.equal(await dm.interpret('more',actor),null);assert.equal(calls,1);});
test('approved grounded interpretation is a proposal and never an outcome',async t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-dm-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const dm=createOptionalDM({dataDir:dir,key:'test-key',enabled:true,fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"verb":"attack","target":"rat"}'}}]})})});assert.deepEqual(await dm.interpret('bonk the rodent',actor),{verb:'attack',target:'rat'});});
test('429, malformed plans, and timeouts preserve deterministic fallback',async t=>{for(const response of [async()=>({ok:false,status:429}),async()=>{throw Error('timeout');},async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"verb":"go","x":1,"y":1}'}}]})})]){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-dm-'));try{const dm=createOptionalDM({dataDir:dir,key:'test-key',enabled:true,fetchImpl:response});assert.equal(await dm.interpret('anything',actor),null);}finally{fs.rmSync(dir,{recursive:true,force:true});}}});

test('creative proposals require existing component IDs and cannot supply game outcomes',async t=>{
 for(const [target,ok] of [['make crown from item-1 and item-2',true],['make crown from item-1 and item-999',false],['equip item-2',true],['help Bob craft',true],['help invented player craft',false]]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-dm-craft-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const proposal={verb:'creative',target};const dm=createOptionalDM({dataDir:dir,key:'test-key',enabled:true,fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(proposal)}}]})})});
 const result=await dm.interpret('make something royal',{nearby:[{name:'Bob',type:'player'}],chaos:{bag:[{id:'item-1'},{id:'item-2'}]}});assert.deepEqual(result,ok?proposal:null);
 }
});

test('DM narration reuses canonical validation, supplied memories and safe fallback',async t=>{
 const receipt={id:'turn-7',status:'failed',player:'Ada',message:'The rug was not stolen. Guard noticed.',event:{attempt:'steal rug'},actor:{chaos:{npcs:[{id:'guard-1',name:'Guard',trust:-2,memory:[{verb:'theft'}]}],story:[{fact:'Guard noticed the attempt.'}]}}};
 for(const [answer,ok] of [[{turnId:'turn-7',outcome:'failure',text:'The guard gives Ada a suspicious look.',dialogue:[{speakerId:'guard-1',line:'I remember that attempt.'}]},true],[{turnId:'turn-7',outcome:'success',text:'You stole it!',dialogue:[]},false],[{turnId:'turn-7',outcome:'failure',text:'A dragon appears.',dialogue:[{speakerId:'dragon',line:'Hello'}]},false]]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-story-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let sent;
  const dm=createOptionalDM({dataDir:dir,key:'test',enabled:true,fetchImpl:async(_url,init)=>{sent=JSON.parse(init.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(answer)}}]})};}});
  assert.equal(!!await dm.narrate(receipt),ok);assert.ok(sent.messages[1].content.includes('Guard noticed the attempt'));assert.equal(receipt.status,'failed');
 }
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-story-off-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let calls=0;const dm=createOptionalDM({dataDir:dir,key:'test',fetchImpl:async()=>calls++});assert.equal(await dm.narrate(receipt),null);assert.equal(calls,0);
});
