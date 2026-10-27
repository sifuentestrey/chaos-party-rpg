import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Client} from 'colyseus.js';
import {createGameServer} from '../server.mjs';
import {createHost,joinPlayer,observe,pause} from './colyseus-helpers.mjs';

test('actual PartyFrame room: 20 clients, race, reactions, reconnection, PIN recovery, restart',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-partyframe-'));
  let app=await createGameServer({port:0,dataDir:dir});let host;const clients=[];
  try{
    host=await createHost(app);const code=host.identity.room.code,id=host.room.roomId;
    assert.equal(host.room.state.settings.maxPlayers,24);assert.equal(host.room.state.gameId,'chaos-tavern');
    const joins=await Promise.all(Array.from({length:20},async(_,i)=>{
      const profile={name:'Guest '+i,token:'partyframe-device-token-'+i,role:'bard',avatar:{hair:i%6,color:i%6}};
      const player=await joinPlayer(app,id,profile);clients.push(player);assert.equal(player.identity.ok,true);return {...player,profile};
    }));
    assert.equal(app.rooms()[code].players.length,20);assert.equal(app.rooms()[code].players.filter(p=>p.connected).length,20);
    assert.equal((await joins[0].request('host:command',{command:{type:'start'}})).ok,false);
    joins[0].room.send('session-action',{type:'start-game'});await pause(30);assert.equal(app.rooms()[code].phase,'lobby');
    assert.equal((await host.request('host:command',{command:{type:'start'}})).ok,true);
    app.gameServer.simulateLatency(250);
    const started=performance.now();
    const declarations=await Promise.all(joins.map((x,i)=>x.request('player:submit',{requestId:'race-'+i,text:'I smash barrel '+i})));
    const raceMs=Math.round(performance.now()-started);
    assert.equal(declarations.filter(x=>x.accepted&&x.kind==='action').length,1);
    const winner=declarations.findIndex(x=>x.accepted),first=declarations[winner];
    const duplicate=await joins[winner].request('player:submit',{requestId:'race-'+winner,text:'I change my mind'});assert.equal(duplicate.duplicate,true);assert.equal(duplicate.seq,first.seq);
    const responses=await Promise.all(joins.filter((_,i)=>i!==winner).map((x,i)=>x.request('player:submit',{requestId:'reaction-'+i,kind:'reaction',reaction:i%3===0?'intervene':'assist',turnId:first.turnId,text:'I help with a distraction'})));
    assert.equal(responses.filter(x=>x.ok).length,19);assert.equal(app.rooms()[code].turn.reactions.length,19);
    app.gameServer.simulateLatency(0);
    const reconnect=joins.find((_,i)=>i!==winner),persistentId=reconnect.identity.playerId;
    const token=reconnect.room.reconnectionToken;reconnect.room.connection.close(1000);
    // Wait for server-side disconnect/reconnection registration, not a guessed delay.
    const disconnectDeadline=performance.now()+3000;
    while(app.rooms()[code].players.find(p=>p.id===persistentId)?.connected&&performance.now()<disconnectDeadline)await pause(10);
    assert.equal(app.rooms()[code].players.find(p=>p.id===persistentId)?.connected,false,'server must observe disconnect before reconnect');
    const again=await observe(await new Client('http://127.0.0.1:'+app.port).reconnect(token));clients.push(again);
    assert.equal(again.room.sessionId,reconnect.room.sessionId);assert.equal(again.identity.playerId,persistentId);assert.equal(again.identity.room.players.length,20);
    const recovered=await joinPlayer(app,id,{token:'new-device-recovery-token',name:'Ignored'},{recoveryPin:reconnect.identity.recoveryPin});clients.push(recovered);
    assert.equal(recovered.identity.playerId,persistentId);assert.notEqual(recovered.identity.token,reconnect.profile.token);
    assert.equal((await again.request('player:profile',{profile:{name:'Stale control'}})).ok,false);
    again.room.send('session-action',{type:'set-profile',name:'Stale renamed',avatar:'🦊',color:'#ff5d5d'});await pause(30);
    assert.notEqual(app.rooms()[code].players.find(p=>p.id===persistentId).name,'Stale renamed');
    await host.request('host:command',{command:{type:'resolve'}});const resolved=app.rooms()[code];assert.equal(resolved.result.reactions.length,19);assert.equal(resolved.stats.rolls,1);
    const snapshot=(await host.request('room:sync')).room;assert.equal(snapshot.players[0].token,undefined);assert.equal(snapshot.players[0].pin,undefined);assert.equal(snapshot.seed,undefined);
    await pause(70);const projected=JSON.parse(host.room.state.game.json);assert.equal(projected.result.id,resolved.result.id);assert.equal(projected.framework.name,'PartyFrame');
    await host.request('host:command',{command:{type:'resolve'}});
    const next=joins.find((_,i)=>i!==winner&&i!==joins.indexOf(reconnect));
    const opened=await next.request('player:submit',{requestId:'real-door',text:'Open the tavern door'});assert.equal(opened.accepted,true);
    await host.request('host:command',{command:{type:'resolve'}});
    assert.equal(app.rooms()[code].world.objects.door.open,true);assert.equal(app.rooms()[code].stats.rolls,1);
    assert.equal((await recovered.request('room:sync')).room.world.objects.door.open,true);
    const finalResult=app.rooms()[code].result.id;
    const key=app.hostKey;await Promise.all(clients.map(x=>x.room.connection?.isOpen?x.room.leave(true).catch(()=>{}):Promise.resolve()));await host.room.leave(true);await app.close();
    app=await createGameServer({port:0,dataDir:dir});assert.equal(app.hostKey,key);
    host=await createHost(app,{resumeCode:code});assert.equal(host.identity.room.players.length,20);assert.equal(host.identity.room.result.id,finalResult);assert.equal(host.identity.room.players.every(p=>!p.connected),true);assert.equal(host.identity.room.world.objects.door.open,true);
    const after=await joinPlayer(app,host.room.roomId,{token:recovered.identity.token});clients.push(after);assert.equal(after.identity.playerId,persistentId);assert.equal(after.identity.room.players.length,20);
    const unauthorized=await fetch('http://127.0.0.1:'+app.port+'/api/host-key',{headers:{Origin:'http://untrusted.example','Sec-Fetch-Site':'cross-site'}});assert.equal(unauthorized.status,403);
    console.log(JSON.stringify({framework:'PartyFrame',transport:'Colyseus',clients:20,reactions:19,initiators:1,raceMs,reconnectSameSeat:true,recovery:true,restart:true}));
  }finally{
    await Promise.all(clients.map(x=>x.room.connection?.isOpen?x.room.leave(true).catch(()=>{}):Promise.resolve()));if(host?.room.connection?.isOpen)await host.room.leave(true).catch(()=>{});await app.close();fs.rmSync(dir,{recursive:true,force:true});
  }
});
