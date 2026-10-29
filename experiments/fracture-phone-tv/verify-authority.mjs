/** Negative protocol checks against a disposable, actually running Fracture server. */
import {createPartyBridge} from './party-bridge.mjs';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
if(process.env.CHAOS_BETA_TEST!=='1')throw Error('Disposable test database only: CHAOS_BETA_TEST=1 required');
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-authority-')),app=createPartyBridge({root:process.env.FRACTURE_ROOT,dataDir,port:0,bind:'127.0.0.1'}),checks=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{await app.start();const base='http://127.0.0.1:'+app.server.address().port;const r=await fetch(base+'/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:app.room.join,name:'Auth_'+randomUUID().slice(0,6)})});assert.equal(r.status,201);const {token}=await r.json();const session=app.sessions.get(token);for(let i=0;i<80&&!session.actor?.ready;i++)await sleep(100);assert.ok(session.actor?.ready);
const key=process.env.CHAOS_ACTOR_KEY,actorId=session.actor.id;
const send=body=>new Promise((resolve,reject)=>session.socket.timeout(2000).emit('chaos:action',body,(error,r)=>error?reject(error):resolve(r)));
const baseAction=()=>({key,actorId,id:randomUUID(),issuedAt:Date.now(),intent:{verb:'cancel'}});
for(const [name,body] of [['wrong private key',{...baseAction(),key:'wrong'}],['cross-actor identity',{...baseAction(),actorId:'someone-else'}],['stale queued action',{...baseAction(),issuedAt:Date.now()-4000}],['invented damage',{...baseAction(),intent:{verb:'attack',target:'rat',damage:999}}],['arbitrary teleport',{...baseAction(),intent:{verb:'teleport',x:100,y:100}}]]){const response=await send(body);assert.ok(response.error,name);checks.push(name+' rejected');}
const action=baseAction();assert.equal((await send(action)).ok,true);assert.match((await send(action)).error,/Duplicate/);checks.push('duplicate action rejected');
const state=await new Promise((resolve,reject)=>session.socket.timeout(2000).emit('chaos:state',{key},(error,r)=>error?reject(error):resolve(r)));assert.equal(state.ok,true);assert.equal(String(state.actor.id),String(actorId));
console.log(JSON.stringify({status:'passed',checks},null,2));
}finally{await app.close();fs.rmSync(dataDir,{recursive:true,force:true});}
