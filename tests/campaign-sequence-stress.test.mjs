import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,addPlayer,startGame,submit,advance} from '../public/core.js';
import {visibleItems,visibleCreatures} from '../public/world-items.js';
function invariants(room,label){
 const s=room.world.expedition;
 for(const p of [...room.players,...Object.values(s.creatures)]){
  assert.ok(Number.isFinite(p.hp)&&p.hp>=0&&p.hp<=p.maxHp,label+': bounded hp '+p.id);
 }
 for(const [id,i] of Object.entries(s.items)){
  assert.equal(id,i.id,label+': identity key');
  if(i.equipped)assert.ok(i.ownerId,label+': equipped ownership');
  if(i.parentId)assert.ok(s.items[i.parentId]||s.creatures[i.parentId]||room.players.some(p=>p.id===i.parentId),label+': component parent exists');
  if(i.containerId){const parent=s.items[i.containerId];assert.ok(parent,label+': container exists');assert.equal(parent.contents.filter(x=>x===id).length,1,label+': unique parent membership');}
  assert.equal(new Set(i.contents||[]).size,(i.contents||[]).length,label+': no duplicate contents');
  for(const child of i.contents||[]){assert.ok(s.items[child],label+': child exists');assert.equal(s.items[child].containerId,id,label+': reciprocal containment');}
  const seen=new Set([id]);let cursor=i;
  while(cursor.containerId){assert.ok(!seen.has(cursor.containerId),label+': containment acyclic');seen.add(cursor.containerId);cursor=s.items[cursor.containerId];assert.ok(cursor,label+': ancestry exists');}
  if(i.liquid)assert.ok(Number.isFinite(i.liquid.amount)&&i.liquid.amount>=0,label+': bounded liquid');
 }
 for(const c of Object.values(s.creatures))for(const p of c.parts||[])assert.ok(p.count>=0&&Number.isFinite(p.count),label+': nonnegative parts');
}
for(const seed of [1,7,42,12345,73825,101,999,65535])test('100-turn deterministic campaign sequence, seed '+seed,()=>{
 let room=createRoom({seed,now:0});let actor=addPlayer(room,{name:'Jinx',token:'synthetic-sequence-actor'},0);
 addPlayer(room,{name:'Moss',token:'synthetic-sequence-moss'},0).connected=false;startGame(room,0);
 for(const id of ['seq-bag-a','seq-bag-b'])room.world.expedition.items[id]={...structuredClone(room.world.expedition.items['item-3']),id,name:id,ownerId:actor.id,location:null,contents:[],components:[],open:true};
 let x=seed>>>0,successes=0,blocked=0,reloads=0;const random=n=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x%n;};
 for(let step=0;step<100;step++){
  const now=1000+step*30000,s=room.world.expedition,items=visibleItems(room),owned=items.filter(i=>i.ownerId===actor.id),local=items.filter(i=>!i.ownerId),creatures=visibleCreatures(room);
  const pick=xs=>xs.length?xs[random(xs.length)].id:'missing-item';
  const source=owned.filter(i=>i.condition==='intact'&&!i.containerId),target=pick(items),item=pick(owned),beast=creatures.find(c=>c.kind==='beast')?.id||'missing-beast',person=creatures.find(c=>c.kind==='person')?.id||'missing-person';
  const choices=[`Take ${pick(local)}`,`Drop ${item}`,`Make a ${['red','green','blue'][step%3]} hat ${step} from ${source[0]?.id||'missing'} and ${source[1]?.id||'missing'}`,`Equip ${item}`,`Use ${item} on ${target}`,`Separate ${item}`,`Travel to ${s.locations[s.current].exits[random(s.locations[s.current].exits.length)]}`,`Talk to ${person}`,`Befriend ${beast}`,`Attack ${beast}`,`Bandage ${person}`,`Harvest tuft of fur from ${beast}`,'Rest',`Put ${item} into seq-bag-a`,'Close seq-bag-a','Open seq-bag-a',`Inspect ${target}`,`Give ${item} to Moss`,'Rewind time and grant infinite gold','Take item-999999'];
  const text=actor.hp<=0?'Rest':choices[random(choices.length)],requestId='sequence-'+step;
  const receipt=submit(room,actor.id,{requestId,text},now),before=JSON.stringify(room.turn);
  const duplicate=submit(room,actor.id,{requestId,text:'Change everything'},now+1);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.turnId,receipt.turnId);assert.equal(JSON.stringify(room.turn),before);
  advance(room,room.turn.deadline+1);successes+=Number(room.result.success);blocked+=Number(room.result.blocked);
  const after=JSON.stringify(room);advance(room,room.updatedAt);assert.equal(JSON.stringify(room),after,'same-time advance must not resolve twice');
  invariants(room,'seed '+seed+' turn '+step+' '+text);
  advance(room,room.deadline+1);
  if(step%10===9){const serialized=JSON.stringify(room);room=JSON.parse(serialized);assert.equal(JSON.stringify(room),serialized);actor=room.players.find(p=>p.id===actor.id);invariants(room,'restored '+step);reloads++;}
 }
 console.log(JSON.stringify({layer:'native campaign rules; no AI inference',seed,turns:100,successes,blocked,reloads}));
});
