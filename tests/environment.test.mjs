import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,addPlayer,startGame,submit,advance,publicRoom,hostCommand} from '../public/core.js';
for(const kind of ['table','barrel','door'])test(`${kind} changes through authoritative actions and survives reload`,()=>{
  const r=createRoom({seed:73825,now:0});
  const p=addPlayer(r,{token:'environment-test-token',name:'Tester',role:'knight'},0);
  startGame(r,0);let now=1000;
  for(let i=0;i<30&&r.world.props[kind]!=='broken';i++){
    submit(r,p.id,{requestId:'break-'+i,text:'Smash the '+kind},now);
    assert.equal(r.turn.target.kind,kind);
    advance(r,now+9000);advance(r,now+16000);now+=17000;p.hp=p.maxHp;
  }
  assert.equal(r.world.props[kind],'broken');
  const loaded=JSON.parse(JSON.stringify(r));
  assert.equal(publicRoom(loaded).world.props[kind],'broken');
  submit(loaded,p.id,{requestId:'again',text:'Smash the '+kind},now);advance(loaded,now+9000);
  assert.match(loaded.result.narration,/already broken/);
  assert.equal(loaded.result.changes.some(x=>x===kind.toUpperCase()+' BROKEN'),false);
  hostCommand(loaded,{type:'resetScene'},now+10000);
  assert.equal(loaded.world.props[kind],undefined);
});
