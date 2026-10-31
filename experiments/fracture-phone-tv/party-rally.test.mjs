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


import {proposeExpedition,expeditionEligible,EXPEDITION_WAYPOINTS} from './party-rally.mjs';
test('major travel votes use only pinned map destinations, never client-supplied coordinates',()=>{
 const actors=[{token:'ada',ready:true,dead:false,zone:'The Refuge',x:41,y:195},{token:'bryn',ready:true,dead:false,zone:'The Refuge',x:43,y:195}];
 const vote=proposeExpedition(actors,'ada','woods',1000,'travel1');
 assert.equal(vote.kind,'expedition');
 assert.equal(vote.arrivalZone,'Glitch Woods');
 assert.deepEqual(vote.waypoint,{x:34,y:188});
 assert.equal(vote.required,2);
 assert.equal(settleRally(vote,1001),'pending');
 assert.equal(voteRally(vote,'bryn',true,1002),'approved');
 assert.equal(rallyView(vote,'bryn',1003).destination,'Glitch Woods');
 assert.equal(expeditionEligible(vote,actors[1]),true);
 assert.equal(expeditionEligible(vote,{...actors[1],zone:'Glitch Woods'}),false);
 assert.equal(expeditionEligible(vote,{...actors[1],x:900}),false);
 assert.equal(expeditionEligible(vote,{...actors[1],dead:true}),false);
 assert.equal(EXPEDITION_WAYPOINTS.woods.end.x,34);
 assert.throws(()=>proposeExpedition(actors,'ada','999,999',1000,'bad'),/known Fracture/);
 assert.throws(()=>proposeExpedition(actors,'ada','__proto__',1000,'bad'),/known Fracture/);
 assert.throws(()=>proposeExpedition(actors.map(a=>({...a,zone:'Glitch Woods'})),'ada','woods',1000,'bad'),/start in The Refuge/);
 assert.throws(()=>proposeExpedition(actors.map(a=>({...a,x:a.x+70})),'ada','woods',1000,'bad'),/departure area/);
});
test('return trip is separate from local rally, with native movement and real zone still required',()=>{
 const actors=[{token:'ada',ready:true,dead:false,zone:'Glitch Woods',x:34,y:188},{token:'bryn',ready:true,dead:false,zone:'Glitch Woods',x:35,y:188}];
 const vote=proposeExpedition(actors,'ada','refuge',1000,'return1');
 assert.deepEqual(vote.waypoint,{x:34,y:210});
 assert.equal(vote.arrivalZone,'The Refuge');
 assert.equal(vote.status,'pending');
 assert.equal(voteRally(vote,'bryn',false,1001),'declined');
 assert.equal(vote.arrivals,undefined,'a rejected vote never fabricates an arrival');
});

test('20-person expedition requires eleven approvals and cannot bypass an expired quorum',()=>{
 const actors=Array.from({length:20},(_,i)=>({token:'member'+i,ready:true,dead:false,zone:'The Refuge',x:41+i%3,y:195}));
 const vote=proposeExpedition(actors,'member0','woods',1000,'large-party');
 assert.equal(vote.required,11);
 for(let i=1;i<10;i++)assert.equal(voteRally(vote,'member'+i,true,1000+i),'pending');
 assert.equal(settleRally(vote,11000),'declined');
 assert.equal(vote.arrivals,undefined);
 assert.throws(()=>voteRally(vote,'member10',true,11001),/no open/);
});

test('expedition vote stays visible while native actors travel and briefly after confirmed arrival',()=>{
 const actors=[{token:'a',ready:true,dead:false,zone:'The Refuge',x:41,y:195},{token:'b',ready:true,dead:false,zone:'The Refuge',x:42,y:195}];
 const vote=proposeExpedition(actors,'a','woods',1000,'slow-travel');
 voteRally(vote,'b',true,1001);
 vote.arrivals=['a'];
 assert.equal(rallyView(vote,null,1001+20000).arrived,1,'a slow walk must not disappear after eight seconds');
 assert.equal(rallyView(vote,null,1001+45001),null,'expired travel window is bounded');
 vote.arrivals=['a','b'];vote.lastArrivalAt=46000;
 assert.equal(rallyView(vote,null,46001).arrived,2);
 assert.equal(rallyView(vote,null,54001),null);
});
