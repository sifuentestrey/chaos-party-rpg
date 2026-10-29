import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeRally,voteRally,settleRally,rallyView} from './party-rally.mjs';

const party=(n=3)=>Array.from({length:n},(_,i)=>({token:'p'+i,ready:true,dead:false,zone:'Town',x:12+i%3,y:12}));
test('strict majority is frozen at proposal time and requires a real second voter',()=>{
 for(const [n,required] of [[2,2],[3,2],[4,3],[20,11]]){
  const p=party(n),r=proposeRally(p,'p0',1000,'r'+n);
  assert.equal(r.required,required);
  assert.equal(r.deadline,11000);
  assert.equal(settleRally(r,1001),'pending');
  for(let i=1;i<required;i++)voteRally(r,'p'+i,true,1001+i);
  assert.equal(r.status,'approved');
  assert.equal(rallyView(r,'p1',1002)?.eligible,true);
 }
});
test('votes are one-time, identity-bound, and late/replayed votes are rejected',()=>{
 const r=proposeRally(party(4),'p0',1000,'one');
 assert.throws(()=>voteRally(r,'outsider',true,1001),/electorate/);
 assert.throws(()=>voteRally(r,'p0',false,1001),/locked/);
 assert.equal(voteRally(r,'p1',false,1001),'pending');
 assert.throws(()=>voteRally(r,'p1',true,1002),/locked/);
 assert.equal(voteRally(r,'p2',false,1002),'declined');
 assert.equal(r.votes.p1,false);
 assert.throws(()=>voteRally(r,'p3',true,1003),/no open/);
 assert.equal(rallyView(r,'p3',1004).status,'declined');
 assert.equal(rallyView(r,'p3',20000),null);
 const late=proposeRally(party(),'p0',1000,'late');
 assert.equal(settleRally(late,11000),'declined');
 assert.throws(()=>voteRally(late,'p1',true,11001),/no open/);
});
test('rally is bounded to distinct ready characters in the same area and within 12 tiles',()=>{
 assert.throws(()=>proposeRally(party(1),'p0',0,'a'),/two/);
 assert.throws(()=>proposeRally(party(21),'p0',0,'a'),/20/);
 const distant=party();distant[1].x=30;
 assert.throws(()=>proposeRally(distant,'p0',0,'a'),/twelve tiles/);
 const split=party();split[1].zone='Glitch Woods';
 assert.throws(()=>proposeRally(split,'p0',0,'a'),/same area/);
 const dead=party();dead[2].dead=true;
 assert.throws(()=>proposeRally(dead,'p0',0,'a'),/ready character/);
 const duplicate=party();duplicate[1].token='p0';
 assert.throws(()=>proposeRally(duplicate,'p0',0,'a'),/distinct/);
});
