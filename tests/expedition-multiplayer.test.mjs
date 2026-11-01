import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createGameServer} from '../server.mjs';import {createHost,joinPlayer} from './colyseus-helpers.mjs';
test('twenty actual controllers approve shared expedition travel without splitting or inflating votes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-expedition-20-')),clients=[];const app=await createGameServer({port:0,dataDir:dir});let host;
 try{
  host=await createHost(app);for(const player of await Promise.all(Array.from({length:20},(_,i)=>joinPlayer(app,host.room.roomId,{token:'expedition-multiplayer-'+i,name:'Guest '+i}))))clients.push(player);
  await host.request('host:command',{command:{type:'start'}});await host.request('host:command',{command:{type:'continueCampaign'}});const code=host.identity.room.code;
  assert.equal((await clients[0].request('host:command',{command:{type:'continueCampaign'}})).ok,false);
  const declare=await clients[0].request('player:submit',{requestId:'first-travel',text:'Travel to clearing'});assert.equal(declare.accepted,true);
  for(let i=1;i<10;i++)assert.equal((await clients[i].request('player:submit',{requestId:'first-vote-'+i,kind:'reaction',reaction:'assist',text:'Yes, travel together',turnId:declare.turnId})).accepted,true);
  let resolved=await host.request('host:command',{command:{type:'resolve'}});assert.equal(resolved.room.result.success,false);assert.equal(resolved.room.world.expedition.current,'tavern');await host.request('host:command',{command:{type:'resolve'}});
  const second=await clients[1].request('player:submit',{requestId:'second-travel',text:'Travel to clearing'});assert.equal(second.accepted,true);
  for(const i of [0,2,3,4,5,6,7,8,9,10])assert.equal((await clients[i].request('player:submit',{requestId:'second-vote-'+i,kind:'reaction',reaction:'assist',text:'Yes, travel together',turnId:second.turnId})).accepted,true);
  const duplicate=await clients[0].request('player:submit',{requestId:'second-vote-0',kind:'reaction',reaction:'assist',text:'Yes, travel together',turnId:second.turnId});assert.equal(duplicate.duplicate,true);
  resolved=await host.request('host:command',{command:{type:'resolve'}});assert.equal(resolved.room.result.success,true);assert.equal(resolved.room.world.expedition.current,'clearing');assert.equal(resolved.room.players.length,20);assert.equal(resolved.room.stats.rolls,0);assert.equal(app.store.rooms[code].world.expedition.expedition.status,'active');
 }finally{await Promise.all(clients.map(c=>c.room.connection?.isOpen?c.room.leave(true).catch(()=>{}):Promise.resolve()));if(host?.room.connection?.isOpen)await host.room.leave(true);await app.close();fs.rmSync(dir,{recursive:true,force:true});}
});
