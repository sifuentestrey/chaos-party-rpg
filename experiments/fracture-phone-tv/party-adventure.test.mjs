import test from 'node:test';
import assert from 'node:assert/strict';
import {startAdventure,replayAdventure,receiptEvidence,zoneEvidence,advanceAdventure,adventureView,proposeTrialChoice,voteTrialChoice,settleTrialChoice,trialChoiceView} from './party-adventure.mjs';
const actor=(zone='The Refuge')=>({ready:true,dead:false,zone});
const receipt=(id,status,extra={})=>({id,status,...extra});
const talk=id=>receiptEvidence(receipt(id,'succeeded'),{verb:'talk'},actor(),'Ada');
const kill=id=>receiptEvidence(receipt(id,'started',{combat:{before:10,after:0,dead:true}}),{verb:'attack'},actor(),'Bryn');
const craft=id=>receiptEvidence(receipt(id,'succeeded',{event:{outcome:'success',attempt:'craft green headband from cloth strip'}}),{verb:'creative'},actor(),'Ada');
test('real cooperative proof + actual zone travel yields one durable, reward-free ending',()=>{
 const a=startAdventure(100);assert.equal(a.status,'active');
 assert.ok(advanceAdventure(a,talk('t1'),200));
 assert.ok(advanceAdventure(a,kill('k1'),300));
 assert.equal(a.proof.route,'combat');
 assert.ok(advanceAdventure(a,zoneEvidence(actor('Glitch Woods'),'Bryn','bryn-token'),400));
 assert.equal(advanceAdventure(a,zoneEvidence(actor('The Refuge'),'Ada','ada-token'),450),null,'a teammate who never entered the woods cannot finish');
 assert.ok(advanceAdventure(a,zoneEvidence(actor('The Refuge'),'Bryn','bryn-token'),500));
 assert.equal(a.status,'completed');assert.equal(a.completedAt,500);
 assert.equal(adventureView(a).steps.filter(s=>s.done).length,4);
 assert.equal(advanceAdventure(a,talk('t2'),600),null);
 const saved=JSON.parse(JSON.stringify(a));assert.equal(adventureView(saved).status,'completed');
 assert.equal(saved.proof.player,'Bryn');
});
test('craft route uses original Chaos item parser and confirmed success only',()=>{
 const a=startAdventure(100);
 assert.ok(craft('c1'),'valid original craft text');
 assert.ok(advanceAdventure(a,craft('c1'),200));
 assert.equal(a.proof.route,'craft');
 assert.ok(advanceAdventure(a,talk('t1'),300));
 assert.ok(advanceAdventure(a,zoneEvidence(actor('Glitch Woods'),'Ada','ada-token'),400));
 assert.ok(advanceAdventure(a,zoneEvidence(actor('The Refuge'),'Ada','ada-token'),500));
 assert.equal(a.status,'completed');
});
test('no story progression from text, fabricated outcomes, failed rolls, AI narration or native misses',()=>{
 const a=startAdventure(100);
 const examples=[
  [receipt('k0','received',{combat:{before:10,after:0,dead:true}}),{verb:'attack'}],
  [receipt('k1','started',{combat:{before:10,after:9,dead:false}}),{verb:'attack'}],
  [receipt('k2','started',{combat:{before:10,after:0,dead:false}}),{verb:'attack'}],
  [receipt('k3','started',{combat:{before:10,after:1,dead:true}}),{verb:'attack'}],
  [receipt('k4','started',{combat:{before:0,after:0,dead:true}}),{verb:'attack'}],
  [receipt('k5','started',{combat:{before:10,after:0,dead:true}}),{verb:'talk'}],
  [receipt('t0','blocked'),{verb:'talk'}],
  [receipt('c0','failed',{event:{outcome:'failure',attempt:'craft green headband from cloth strip'}}),{verb:'creative'}],
  [receipt('c1','succeeded',{event:{outcome:'success',attempt:'steal rug'}}),{verb:'creative'}],
  [receipt('c2','succeeded',{event:{outcome:'failure',attempt:'craft green headband from cloth strip'}}),{verb:'creative'}],
  [receipt('c3','succeeded',{message:'DM says you crafted it'}),{verb:'creative'}]
 ];
 for(const [r,i] of examples)assert.equal(receiptEvidence(r,i,actor(),'Ada'),null,r.id);
 assert.equal(a.proof,null);assert.equal(a.npc,null);
 assert.equal(receiptEvidence(receipt('t1','succeeded'),{verb:'talk'},actor(),'Ada').kind,'npc');
 assert.equal(receiptEvidence(receipt('t1','succeeded'),{verb:'talk'},{ready:false},'Ada'),null);
});
test('no early travel credit, no dead/unready zone spoof, and no replay of the same action ID',()=>{
 const a=startAdventure(100);
 assert.equal(advanceAdventure(a,zoneEvidence(actor('Glitch Woods'),'Ada','ada-token'),110),null);
 assert.equal(zoneEvidence(actor('Glitch Woods'),'Ada','ada-token')?.kind,'zone');
 assert.equal(zoneEvidence({ready:true,dead:true,zone:'Glitch Woods'},'Ada','ada-token'),null);
 assert.equal(zoneEvidence({ready:false,dead:false,zone:'Glitch Woods'},'Ada','ada-token'),null);
 assert.equal(zoneEvidence(actor('Unknown area'),'Ada','ada-token'),null);
 assert.ok(advanceAdventure(a,talk('t1'),120));
 assert.equal(advanceAdventure(a,talk('t1'),121),null);
 assert.ok(advanceAdventure(a,kill('k1'),130));
 assert.ok(advanceAdventure(a,zoneEvidence(actor('Glitch Woods'),'Ada','ada-token'),140));
 assert.equal(advanceAdventure(a,zoneEvidence(actor('Glitch Woods'),'Ada','ada-token'),141),null);
 assert.equal(advanceAdventure(a,zoneEvidence(actor('The Refuge'),'Ada','ada-token'),150).completed,true);
});
test('unsupported persisted version is read-only and cannot erase or rewrite progress',()=>{
 const a={version:99,id:'refuge-trial-v1',status:'active',proof:{route:'craft'}};
 const copy=JSON.stringify(a);
 assert.equal(advanceAdventure(a,talk('t1'),123),null);
 assert.equal(adventureView(a).status,'unsupported');
 assert.equal(JSON.stringify(a),copy);
});

test('explicit replay archives the completed run and starts with empty, separate progress',()=>{
 const old=startAdventure(100,1,'11111111-1111-4111-8111-111111111111');
 advanceAdventure(old,talk('t1'),110);
 advanceAdventure(old,craft('c1'),120);
 advanceAdventure(old,zoneEvidence(actor('Glitch Woods'),'Ada','private-token'),130);
 advanceAdventure(old,zoneEvidence(actor('The Refuge'),'Ada','private-token'),140);
 assert.equal(old.status,'completed');
 const next=replayAdventure(old,[],150,'22222222-2222-4222-8222-222222222222');
 assert.equal(next.adventure.run,2);
 assert.equal(next.adventure.status,'active');
 assert.equal(next.adventure.npc,null);
 assert.equal(next.adventure.proof,null);
 assert.deepEqual(next.adventure.visitors,[]);
 assert.equal(next.history.length,1);
 assert.equal(next.history[0].route,'craft');
 assert.equal(next.history[0].completedAt,140);
 assert.equal(JSON.stringify(next.history).includes('private-token'),false);
 assert.equal(old.status,'completed','original completed save is never mutated');
 assert.equal(adventureView(next.adventure).run,2);
});
test('replay rejects unfinished/unknown saves and limits private history without overwriting it',()=>{
 const id='33333333-3333-4333-8333-333333333333';
 const active=startAdventure(1);
 assert.throws(()=>replayAdventure(active,[],10,id),/completed/);
 assert.throws(()=>replayAdventure({id:'refuge-trial-v1',version:99,status:'completed'},[],10,id),/supported/);
 assert.throws(()=>replayAdventure({...active,status:'completed'},[],10,'bad'),/instance ID/);
 assert.throws(()=>replayAdventure({...active,status:'completed'},'corrupt',10,id),/history/);
 const old={...active,status:'completed',run:12,completedAt:100};
 const history=Array.from({length:10},(_,i)=>({run:i+1}));
 const result=replayAdventure(old,history,200,id);
 assert.equal(result.adventure.run,13);
 assert.deepEqual(result.history.map(h=>h.run),[2,3,4,5,6,7,8,9,10,12]);
 assert.equal(history.length,10,'old history remains intact');
});
test('native action receipts from an earlier run never complete a newly started trial',()=>{
 const old=startAdventure(100,1,'11111111-1111-4111-8111-111111111111');
 const next=startAdventure(200,2,'22222222-2222-4222-8222-222222222222');
 const prior={verb:'talk',adventureInstance:old.instanceId};
 const current={verb:'talk',adventureInstance:next.instanceId};
 const r=receipt('talk-old','succeeded');
 assert.equal(receiptEvidence(r,prior,actor(),'Ada',next.instanceId),null);
 assert.equal(advanceAdventure(next,receiptEvidence(r,prior,actor(),'Ada',next.instanceId),210),null);
 assert.equal(next.npc,null);
 assert.equal(receiptEvidence(r,current,actor(),'Ada',next.instanceId).kind,'npc');
 assert.ok(advanceAdventure(next,receiptEvidence(r,current,actor(),'Ada',next.instanceId),220));
 assert.equal(next.npc.player,'Ada');
});

const voters=()=>[
 {token:'ada',ready:true,dead:false,zone:'The Refuge',x:41,y:195},
 {token:'bryn',ready:true,dead:false,zone:'The Refuge',x:42,y:195},
 {token:'cal',ready:true,dead:false,zone:'The Refuge',x:43,y:195}
];
test('original majority vote semantics choose a persistent, real-outcome-only trial branch',()=>{
 const a=startAdventure(100,1,'11111111-1111-4111-8111-111111111111');
 assert.throws(()=>proposeTrialChoice(a,voters(),'ada','craft',110,'vote1'),/Meet a local/);
 advanceAdventure(a,talk('t1'),120);
 assert.throws(()=>proposeTrialChoice(a,voters(),'ada','fake',130,'vote1'),/fight or craft/);
 const vote=proposeTrialChoice(a,voters(),'ada','craft',140,'vote1');
 assert.equal(vote.required,2);assert.equal(vote.status,'pending');
 assert.equal(trialChoiceView(vote,'bryn',141).voted,false);
 assert.throws(()=>voteTrialChoice(vote,'intruder',true,142),/electorate/);
 assert.throws(()=>voteTrialChoice(vote,'ada',true,142),/already locked/);
 voteTrialChoice(vote,'bryn',true,143);
 assert.equal(settleTrialChoice(vote,a,144,'Ada').approved,true);
 assert.equal(settleTrialChoice(vote,a,145,'Ada'),null);
 assert.equal(a.choice.route,'craft');
 assert.equal(advanceAdventure(a,kill('k1'),150),null,'a real kill cannot silently bypass a voted craft route');
 assert.equal(a.proof,null);
 assert.ok(advanceAdventure(a,craft('c1'),160));
 assert.equal(adventureView(a).choice,'craft');
 assert.ok(advanceAdventure(a,zoneEvidence(actor('Glitch Woods'),'Ada','ada'),170));
 assert.ok(advanceAdventure(a,zoneEvidence(actor('The Refuge'),'Ada','ada'),180));
 const saved=JSON.parse(JSON.stringify(a));assert.equal(saved.choice.route,'craft');
 const next=replayAdventure(saved,[],200,'22222222-2222-4222-8222-222222222222');
 assert.equal(next.history[0].choice,'craft');assert.equal(next.adventure.choice,null);
});
test('story vote cannot change a completed proof, expired vote, stale run, or another party position',()=>{
 const a=startAdventure(100,1,'11111111-1111-4111-8111-111111111111');
 advanceAdventure(a,talk('t1'),110);
 assert.throws(()=>proposeTrialChoice(a,[voters()[0]],'ada','combat',120,'v1'),/two nearby/);
 assert.throws(()=>proposeTrialChoice(a,voters().map(v=>({...v,zone:'Glitch Woods'})),'ada','combat',120,'v1'),/The Refuge/);
 assert.throws(()=>proposeTrialChoice(a,[voters()[0],{...voters()[1],x:100}],'ada','combat',120,'v1'),/twelve tiles/);
 const rejected=proposeTrialChoice(a,voters(),'ada','combat',130,'v1');
 voteTrialChoice(rejected,'bryn',false,131);voteTrialChoice(rejected,'cal',false,132);
 assert.equal(settleTrialChoice(rejected,a,133,'Ada').approved,false);assert.equal(a.choice,null);
 const expired=proposeTrialChoice(a,voters(),'ada','craft',200,'v2');
 assert.equal(settleTrialChoice(expired,a,10201,'Ada').approved,false);assert.equal(a.choice,null);
 const stale=proposeTrialChoice(a,voters(),'ada','combat',11000,'v3');
 voteTrialChoice(stale,'bryn',true,11001);
 advanceAdventure(a,craft('c1'),11002);
 assert.equal(settleTrialChoice(stale,a,11003,'Ada').approved,false);
 assert.equal(a.choice,null);assert.equal(a.proof.route,'craft');
 assert.throws(()=>proposeTrialChoice(a,voters(),'ada','combat',11004,'v4'),/completed or chosen proof/);
 const next=startAdventure(12000,2,'22222222-2222-4222-8222-222222222222');
 advanceAdventure(next,talk('t2'),12001);
 const cross=proposeTrialChoice(next,voters(),'ada','craft',12002,'v5');
 voteTrialChoice(cross,'bryn',true,12003);
 const replay=startAdventure(12004,3,'33333333-3333-4333-8333-333333333333');
 advanceAdventure(replay,talk('t3'),12005);
 assert.equal(settleTrialChoice(cross,replay,12006,'Ada').approved,false);assert.equal(replay.choice,null);
});

test('native-only party can explicitly replace an unavailable saved craft objective by majority vote',()=>{
 const a=startAdventure(100);advanceAdventure(a,talk('t1'),110);a.choice={route:'craft',by:'Old party',at:120};const original=structuredClone(a.choice);
 assert.throws(()=>proposeTrialChoice(a,voters(),'ada','combat',130,'normal'),/chosen proof/);
 const vote=proposeTrialChoice(a,voters(),'ada','combat',140,'recovery',{allowCraft:false});assert.deepEqual(a.choice,original,'Opening a vote never rewrites a save');assert.equal(settleTrialChoice(vote,a,141,'Ada'),null);
 voteTrialChoice(vote,'bryn',true,142);assert.equal(settleTrialChoice(vote,a,143,'Ada').approved,true);assert.equal(a.choice.route,'combat');assert.deepEqual(a.choiceHistory,[original]);assert.ok(advanceAdventure(a,kill('real-kill'),150));
 assert.throws(()=>proposeTrialChoice(a,voters(),'ada','combat',160,'cannot-rewrite-proof',{allowCraft:false}),/completed or chosen proof/);
});
