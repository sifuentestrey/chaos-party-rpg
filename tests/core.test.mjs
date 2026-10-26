import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom,addPlayer,editPlayer,startGame,submit,advance,hostCommand,publicRoom } from '../public/core.js';

function setup(n=4){const r=createRoom({code:'TEST42',seed:73825,now:1000,reactionMs:8000});for(let i=0;i<n;i++)addPlayer(r,{token:'token-that-is-long-enough-'+i,name:'Player '+i,role:['rogue','bard','wizard','knight'][i%4]},1000);startGame(r,1000);return r;}
const action=(r,p,text='Inspect behind the bar',now=2000,id='req-'+Math.random())=>submit(r,p.id,{requestId:id,text},now);
const react=(r,p,kind='assist',now=2300,id='rx-'+Math.random())=>submit(r,p.id,{requestId:id,kind:'reaction',reaction:kind,turnId:r.turn.id,text:'I '+kind+' with confidence'},now);

test('only the first of 20 declarations can initiate; the accepted attempt never changes',()=>{
  const r=setup(20);let accepted=0;
  for(const p of r.players)try{action(r,p,p.name+' searches the bar',2000);accepted++;}catch(e){assert.equal(e.code,'BUSY');}
  assert.equal(accepted,1);assert.equal(r.turn.actorId,r.players[0].id);assert.equal(r.turn.action,'Player 0 searches the bar');assert.equal(r.round,1);
});
test('idempotency repeats the same receipt without submitting or rolling twice',()=>{
  const r=setup();const first=action(r,r.players[0],'Inspect the bar',2000,'same-request');
  const second=action(r,r.players[0],'Change my mind and attack',2100,'same-request');
  assert.equal(second.duplicate,true);assert.equal(first.seq,second.seq);assert.equal(r.turn.action,'Inspect the bar');
  advance(r,10001);const rolls=r.stats.rolls;action(r,r.players[0],'Something else',11000,'same-request');assert.equal(r.stats.rolls,rolls);
});
test('reactions are timestamped, monotonic, one per player, and resolve in acceptance order',()=>{
  const r=setup();action(r,r.players[0],'Steal a coin');const b=react(r,r.players[2],'assist',2200),a=react(r,r.players[1],'intervene',2200);
  assert.ok(b.seq<a.seq);assert.throws(()=>react(r,r.players[2]),e=>e.code==='REACTED');
  advance(r,10000);assert.deepEqual(r.result.reactions.map(x=>x.playerId),[r.players[2].id,r.players[1].id]);
  assert.equal(r.result.assistance,1);assert.equal(r.result.interference,1);
});
test('the initiating player cannot react to their own action; expired/old reactions fail',()=>{
  const r=setup();action(r,r.players[0]);assert.throws(()=>react(r,r.players[0]),e=>e.code==='ACTOR');
  assert.throws(()=>react(r,r.players[1],'assist',10000),e=>e.code==='WINDOW_CLOSED');assert.equal(r.phase,'reveal');
});
test('a pause preserves the remaining reaction time and disallows new inputs',()=>{
  const r=setup();action(r,r.players[0]);hostCommand(r,{type:'pause'},5000);assert.equal(r.remaining,5000);
  assert.equal(advance(r,100000),false);assert.throws(()=>react(r,r.players[1],'assist',100000),e=>e.code==='PAUSED');
  hostCommand(r,{type:'pause'},100000);assert.equal(r.deadline,105000);advance(r,104999);assert.equal(r.phase,'react');advance(r,105000);assert.equal(r.phase,'reveal');
});
test('cooldown prevents monopolizing, while a lone connected player can continue',()=>{
  const r=setup();action(r,r.players[0]);advance(r,10000);advance(r,16500);
  assert.throws(()=>action(r,r.players[0],'Inspect',17000),e=>e.code==='COOLDOWN');
  r.players.slice(1).forEach(p=>p.connected=false);action(r,r.players[0],'Inspect',17000);assert.equal(r.phase,'react');
});
test('public snapshots never expose tokens, PINs, request receipts, or random seed',()=>{
  const r=setup();const p=publicRoom(r);assert.equal(p.seed,undefined);assert.equal(p.requests,undefined);assert.equal(p.players[0].token,undefined);assert.equal(p.players[0].pin,undefined);
  p.players[0].hp=0;assert.notEqual(r.players[0].hp,0);
});
test('rejoining preserves character, health, inventory, and identity; names are unique',()=>{
  const r=setup();const p=r.players[0];p.hp=4;p.inventory.push('Crown');p.connected=false;
  const joined=addPlayer(r,{token:p.token,name:'New name'},3000);assert.equal(joined.id,p.id);assert.equal(joined.hp,4);assert.equal(joined.connected,true);assert.equal(joined.name,'Player 0');
  assert.throws(()=>addPlayer(r,{token:'another-long-token',name:'Player 0'}),e=>e.code==='NAME_TAKEN');
});
test('appearance edits are allowed but class/perk are locked during the heist',()=>{
  const r=setup();const p=r.players[0];editPlayer(r,p.id,{role:'healer',perk:'tough',avatar:{hair:4,color:3},name:p.name});assert.equal(p.role,'rogue');assert.equal(p.perk,'lucky');assert.equal(p.avatar.hair,4);
});
test('seeded rules and reaction order produce identical outcomes after save/reload',()=>{
  const r=setup();action(r,r.players[0],'Cast a spell at the guards');react(r,r.players[1]);const loaded=JSON.parse(JSON.stringify(r));
  advance(r,10000);advance(loaded,10000);assert.deepEqual(loaded.result,r.result);assert.equal(loaded.seed,r.seed);
});
test('complete heist: gather clues, take the crown, escape with a party victory',()=>{
  // Search across seeds rather than mocking the resolution path: all turns use real dice.
  const r=setup(1);r.players[0].perk='lucky';let now=2000;
  for(let i=0;i<200&&!r.quest.escaped;i++){
    const text=r.quest.crown?'Flee through the exit with the crown':r.quest.clues>=3?'Steal the crown from the chest':'Inspect behind the bar for clues';
    action(r,r.players[0],r.players[0].hp<=0?'Rest and heal':text,now,'heist-'+i);advance(r,now+8000);advance(r,now+14500);now+=15000;
  }
  assert.equal(r.quest.clues,3);assert.equal(r.quest.crown,true);assert.equal(r.quest.escaped,true);assert.equal(r.phase,'ended');assert.equal(r.players[0].inventory.includes('The Duke’s Crown'),true);
});
test('guard sweep is deterministic, protects fleeing reactors, and never makes HP negative',()=>{
  const r=setup();r.chaos=9;action(r,r.players[0],'Punch Captain Brick');react(r,r.players[1],'flee');const hp=r.players[1].hp;advance(r,10000);assert.equal(r.chaos,5);assert.equal(r.players[1].hp,hp);assert.ok(r.players.every(p=>p.hp>=0));assert.ok(r.result.changes.some(x=>x.includes('Guard sweep')));
});
test('host mute, redact, scene reset, and new story preserve authorized boundaries',()=>{
  const r=setup();hostCommand(r,{type:'mute',playerId:r.players[0].id},1500);assert.throws(()=>action(r,r.players[0]),e=>e.code==='MUTED');
  hostCommand(r,{type:'mute',playerId:r.players[0].id},1600);action(r,r.players[0],'Silly words');hostCommand(r,{type:'redact',eventId:r.turn.seq},2200);assert.equal(r.turn.action,'[Hidden by the host]');
  hostCommand(r,{type:'resetScene'},2500);assert.equal(r.phase,'open');assert.equal(r.turn,null);hostCommand(r,{type:'newStory'},3000);assert.equal(r.phase,'lobby');assert.equal(r.players.length,4);assert.equal(r.quest.clues,0);
});
