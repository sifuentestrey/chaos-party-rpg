import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHost,joinPlayer} from './colyseus-helpers.mjs';
// Copy outside the repository so a missing bundled dependency cannot accidentally
// resolve from the development checkout's node_modules.
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-standalone-release-'));
const bundle=path.join(dir,'server.cjs');
fs.copyFileSync(path.resolve('release/Chaos_Party_Mac/server.cjs'),bundle);
fs.cpSync(path.resolve('release/Chaos_Party_Mac/public'),path.join(dir,'public'),{recursive:true});
const require=createRequire(import.meta.url),{createGameServer}=require(bundle);
const app=await createGameServer({port:0,dataDir:path.join(dir,'data')});
const clients=[];
try{
  const origin='http://127.0.0.1:'+app.port;
  for(const resource of ['/','/app.js','/core.js','/render.js','/ninja.js','/party-client.js','/vendor/partyframe-client.js','/vendor/partyframe-rng.js','/style.css','/assets/kenney/dungeon.png','/assets/ninja/actors/Villager.png','/assets/ninja/fx/slash.png']){
    assert.equal((await fetch(origin+resource)).status,200,resource);
  }
  const runtime=await fetch(origin+'/runtime.js').then(r=>r.text());assert.ok(runtime.includes('"standalone":false'));assert.ok(runtime.includes('PartyFrame'));
  assert.equal((await fetch(origin+'/api/host-key',{headers:{Origin:'http://untrusted.example','Sec-Fetch-Site':'cross-site'}})).status,403);
  const host=await createHost(app);clients.push(host);
  const a=await joinPlayer(app,host.room.roomId,{name:'Release Actor',token:'standalone-actor-token'});clients.push(a);
  const b=await joinPlayer(app,host.room.roomId,{name:'Release Reactor',token:'standalone-reactor-token'});clients.push(b);
  assert.equal((await b.request('host:command',{command:{type:'start'}})).ok,false);
  await host.request('host:command',{command:{type:'start'}});
  const action=await a.request('player:submit',{requestId:'packaged-declaration',text:'Cast a spell at Captain Brick'});assert.equal(action.accepted,true);
  const reaction=await b.request('player:submit',{requestId:'packaged-reaction',kind:'reaction',reaction:'assist',turnId:action.turnId,text:'I distract the guards'});assert.equal(reaction.accepted,true);
  const resolved=await host.request('host:command',{command:{type:'resolve'}});assert.equal(resolved.room.stats.rolls,1);assert.equal(resolved.room.result.assistance,1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'data/campaigns.json'),'utf8')).rooms[resolved.room.code].stats.rolls,1);
  console.log('Standalone bundled release passed outside the repository: no node_modules, PartyFrame host + two controllers, declaration/reaction/roll, assets, authorization and saved campaign.');
}finally{
  await Promise.all(clients.map(x=>x.room.connection?.isOpen?x.room.leave(true).catch(()=>{}):Promise.resolve()));await app.close();fs.rmSync(dir,{recursive:true,force:true});
}
