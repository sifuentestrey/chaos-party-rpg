import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {submit,advance} from '../public/core.js';
import {visibleItems} from '../public/world-items.js';
function fixture(){
 let {room,actor}=prepareAICase({id:'containers',setup:'craft',text:'Inspect the room'});advance(room,room.turn.deadline+1);advance(room,room.deadline+1);let now=100000;
 for(const id of ['bag-a','bag-b','bag-c'])room.world.expedition.items[id]={...structuredClone(room.world.expedition.items['item-3']),id,name:id,ownerId:actor.id,location:null,open:true,contents:[],components:[]};
 return {get room(){return room;},get items(){return room.world.expedition.items;},actor,
  act(text){now+=30000;submit(room,actor.id,{requestId:'container-'+now,text},now);advance(room,room.turn.deadline+1);const result=room.result;advance(room,room.deadline+1);return result;},
  reload(){room=JSON.parse(JSON.stringify(room));}};
}
test('repeated puts never duplicate membership or inflate capacity',()=>{
 const f=fixture();assert.equal(f.act('Put item-1 into bag-a').success,true);
 for(let n=0;n<20;n++)f.act('Put item-1 into bag-a');
 assert.deepEqual(f.items['bag-a'].contents,['item-1']);
});
test('moving a contained item updates both parents and stale containers cannot steal it',()=>{
 const f=fixture();f.act('Put item-1 into bag-a');assert.equal(f.act('Put item-1 into bag-b').success,true);f.reload();
 assert.deepEqual(f.items['bag-a'].contents,[]);assert.deepEqual(f.items['bag-b'].contents,['item-1']);assert.equal(f.items['item-1'].containerId,'bag-b');
 f.act('Drop bag-a');assert.equal(f.items['item-1'].ownerId,f.actor.id);assert.equal(f.items['item-1'].location,null);
});
test('closed ancestors hide descendants even when an inner container is open',()=>{
 const f=fixture();f.act('Put item-1 into bag-b');f.act('Put bag-b into bag-a');f.act('Close bag-a');f.reload();
 const ids=visibleItems(f.room).map(i=>i.id);assert.equal(ids.includes('item-1'),false);assert.equal(ids.includes('bag-b'),false);
 assert.equal(f.act('Take item-1').blocked,true);f.act('Open bag-a');assert.ok(visibleItems(f.room).some(i=>i.id==='item-1'));
});
test('corrupt or missing containment ancestors fail closed without hanging',()=>{
 const f=fixture();f.items['bag-a'].containerId='bag-b';f.items['bag-b'].containerId='bag-a';f.items['item-1'].containerId='bag-a';
 assert.equal(visibleItems(f.room).some(i=>i.id==='item-1'),false);
 f.items['item-1'].containerId='missing-parent';assert.equal(visibleItems(f.room).some(i=>i.id==='item-1'),false);
});

test('consumed or disassembled container ancestors cannot expose their children',()=>{
 for(const kind of ['consumed','disassembled','not-container']){
  const f=fixture();f.act('Put item-1 into bag-a');
  if(kind==='consumed')f.items['bag-a'].parentId='a-composite';
  if(kind==='disassembled')f.items['bag-a'].condition='disassembled';
  if(kind==='not-container')f.items['bag-a'].type='tool';
  assert.equal(visibleItems(f.room).some(i=>i.id==='item-1'),false,kind);
 }
});
test('a capacity rejection does not detach the item from its previous container',async()=>{
 const {resolveEntity}=await import('../public/entity-rules.js');
 const f=fixture();f.act('Put item-1 into bag-a');
 for(let n=0;n<8;n++){
  const id='filler-'+n;f.items[id]={...structuredClone(f.items['item-2']),id,ownerId:f.actor.id,containerId:'bag-b'};f.items['bag-b'].contents.push(id);
 }
 const before=structuredClone(f.items);
 const result=resolveEntity(f.room,f.room.world.expedition,f.actor,{verb:'put',targetId:'bag-b',itemId:'item-1'},true);
 assert.equal(result.blocked,true);assert.deepEqual(f.items,before);
});

test('opened quest-style fixture containers retain access to their contents',()=>{
 const f=fixture();f.act('Put item-1 into bag-a');f.items['bag-a'].type='fixture';
 assert.ok(visibleItems(f.room).some(i=>i.id==='item-1'));
 assert.equal(f.act('Take item-1').success,true);assert.equal(f.items['item-1'].containerId,undefined);
});
