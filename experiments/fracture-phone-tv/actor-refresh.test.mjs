import test from 'node:test';
import assert from 'node:assert/strict';
import {beginActorRefresh,finishActorRefresh,invalidateActorRefresh} from './actor-refresh.mjs';
const session=()=>({socket:{connected:true},actor:{id:4},player:{parked:false},epoch:0,refreshSeq:0,refreshTicket:null});
test('one native state request in flight per actor; timeout retries with a new ticket',()=>{
 const s=session(),first=beginActorRefresh(s,1000);
 assert.equal(first.seq,1);
 assert.equal(beginActorRefresh(s,1500),null);
 const second=beginActorRefresh(s,3001);
 assert.equal(second.seq,2);
 assert.equal(finishActorRefresh(s,first),false,'late old reply must not overwrite actor');
 assert.equal(finishActorRefresh(s,second),true);
 assert.equal(s.refreshTicket,null);
 assert.equal(beginActorRefresh(s,3100).seq,3);
});
test('disconnect/reconnect and benched actors cannot apply old native snapshots',()=>{
 const s=session(),first=beginActorRefresh(s,100);
 s.socket.connected=false;s.actor=null;s.epoch++;invalidateActorRefresh(s);
 s.socket.connected=true;s.actor={id:9};
 assert.equal(finishActorRefresh(s,first),false);
 const fresh=beginActorRefresh(s,200);
 assert.equal(finishActorRefresh(s,fresh),true);
 s.player.parked=true;
 assert.equal(beginActorRefresh(s,300),null);
});
test('native timeout releases gate; no actor or disconnected socket never starts polling',()=>{
 const s=session(),ticket=beginActorRefresh(s,10);
 assert.equal(finishActorRefresh(s,ticket),true);
 s.actor=null;assert.equal(beginActorRefresh(s,20),null);
 s.actor={id:4};s.socket.connected=false;assert.equal(beginActorRefresh(s,30),null);
});
