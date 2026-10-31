/** Prove cold-start and abandoned-phone lifecycle against a disposable real server. */
import {createPartyBridge} from './party-bridge.mjs';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
if(process.env.CHAOS_BETA_TEST!=='1')throw Error('Disposable test database only');
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-presence-')),options={root:process.env.FRACTURE_ROOT,dataDir,port:0,bind:'127.0.0.1',idleMs:1200};let app;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 app=createPartyBridge(options);await app.start();let base='http://127.0.0.1:'+app.server.address().port;
 const pair=await fetch(base+'/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:app.room.join,name:'Presence_'+Math.random().toString(36).slice(2,6)})});const {token}=await pair.json();let session=app.sessions.get(token);for(let i=0;i<60&&!session.actor;i++)await sleep(50);assert.ok(session.actor);const account=session.player.account,position=[session.actor.x,session.actor.y];
 for(let i=0;i<80&&session.socket.connected;i++)await sleep(50);assert.equal(session.socket.connected,false,'Absent phone must log out');assert.equal(session.actor,null);
 const wake=await fetch(base+'/state?token='+token);assert.equal(wake.status,200);for(let i=0;i<60&&!session.actor;i++)await sleep(50);assert.ok(session.actor);assert.equal(session.player.account,account);assert.deepEqual([session.actor.x,session.actor.y],position);
 await app.close();app=createPartyBridge(options);await app.start();session=app.sessions.get(token);await sleep(300);assert.equal(session.socket.connected,false);assert.equal(session.actor,null);base='http://127.0.0.1:'+app.server.address().port;await fetch(base+'/state?token='+token);for(let i=0;i<60&&!session.actor;i++)await sleep(50);assert.ok(session.actor);assert.equal(session.player.account,account);
 console.log(JSON.stringify({status:'passed',checks:['abandoned phone saves and logs out','returning phone restores same account and position','cold launcher does not connect saved actors','phone activation resumes native character']},null,2));
}finally{await app?.close();fs.rmSync(dataDir,{recursive:true,force:true});}
