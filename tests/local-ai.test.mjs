import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLocalGameMaster,localAIConfig,aiContext} from '../src/local-game-master.mjs';
import {applyAIPlan,validateAIPlan} from '../public/ai-plan.js';
import {createRoom,addPlayer,startGame,submit,advance} from '../public/core.js';
import {createGameServer} from '../server.mjs';
import {createHost,joinPlayer,pause} from './colyseus-helpers.mjs';
function scene(){const r=createRoom({now:0,seed:12345});const p=addPlayer(r,{token:'ai-test-private-token',name:'Jinx'},0);startGame(r,0);submit(r,p.id,{requestId:'input-1',text:'Make that carpet mine'},1000);return {r,p};}
async function fixture(plan={verb:'take',target:'rug',summary:'Take the tavern rug.'},delay=0){
  const requests=[];
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/v1/models'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:[{id:'qwen3:1.7b'}]}));return;}
    let raw='';for await(const c of req)raw+=c;requests.push(JSON.parse(raw));
    await pause(delay);if(res.destroyed)return;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(plan)}}]}));
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const env={CHAOS_AI_BASE_URL:`http://127.0.0.1:${server.address().port}/v1`};const ai=createLocalGameMaster({env});await ai.check();
  return {ai,requests,close:async()=>{ai.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
test('model context contains the world but no private tokens, PINs, request receipts or seed',()=>{const {r,p}=scene();const json=JSON.stringify(aiContext(r,p.id));assert.ok(json.includes('carpet'));assert.ok(json.includes('rug'));assert.equal(json.includes(p.token),false);assert.equal(json.includes(p.pin),false);assert.equal(json.includes('"seed"'),false);assert.equal(json.includes('requests'),false);});
test('AI interpretation preserves locked input and RNG; dice and state changes still happen in core rules',()=>{const {r,p}=scene();const input=r.turn.action,seed=r.seed;assert.equal(applyAIPlan(r,r.turn.id,{verb:'take',target:'rug',summary:'Take the rug.'},'qwen3:1.7b',1300),true);assert.equal(r.turn.action,input);assert.equal(r.seed,seed);assert.equal(r.turn.intent,'steal');assert.equal(r.world.props.rug,true);advance(r,10000);assert.equal(r.stats.rolls,1);assert.equal(r.result.action,input);assert.equal(r.result.ai.status,'applied');assert.equal(r.world.props.rug===false,r.result.success);assert.equal(p.inventory.includes('The Tavern Rug'),r.result.success);});
test('AI plans reject invented entities, extra state changes, prototype keys, and late results',()=>{const {r,p}=scene();for(const plan of [{verb:'take',target:'rug',summary:'Take it',gold:999},{verb:'take',target:'unicorn',summary:'Take it'},{verb:'take',target:'__proto__',summary:'Take it'}])assert.throws(()=>validateAIPlan(plan,r,p.id));const before=JSON.stringify(r);assert.equal(applyAIPlan(r,'stale-turn',{verb:'take',target:'rug',summary:'Take it'},'qwen',1200),false);assert.equal(JSON.stringify(r),before);assert.equal(applyAIPlan(r,r.turn.id,{verb:'take',target:'rug',summary:'Take it'},'qwen',r.turn.deadline),false);});
test('local-only configuration rejects cloud addresses, credentials, redirects and misleading hostnames',()=>{for(const url of ['https://api.example.com/v1','http://10.evil.example/v1','http://user:secret@127.0.0.1/v1','http://8.8.8.8/v1'])assert.throws(()=>localAIConfig({CHAOS_AI_BASE_URL:url}));assert.equal(localAIConfig({CHAOS_AI:'off'}).enabled,false);assert.equal(localAIConfig({CHAOS_AI_BASE_URL:'http://192.168.1.10:8080/v1'}).enabled,true);});
test('real local HTTP protocol sends structured Qwen requests and enforces timeout',async()=>{const f=await fixture();try{const {r,p}=scene();const result=await f.ai.interpret(r,p.id,1000);assert.equal(result.plan.target,'rug');assert.equal(f.requests[0].model,'qwen3:1.7b');assert.equal(f.requests[0].response_format.type,'json_schema');assert.equal(f.requests[0].chat_template_kwargs.enable_thinking,false);}finally{await f.close();}const slow=await fixture(undefined,300);try{const {r,p}=scene();await assert.rejects(()=>slow.ai.interpret(r,p.id,30));}finally{await slow.close();}});
test('actual multiplayer locks before AI reply, calls AI once, preserves reactions and rejects client-supplied plans',async()=>{
  const f=await fixture(undefined,180);const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-ai-test-'));const app=await createGameServer({port:0,dataDir:dir,ai:f.ai});const clients=[];
  try{
    const host=await createHost(app);clients.push(host);const a=await joinPlayer(app,host.room.roomId,{token:'ai-network-actor-token',name:'Jinx'}),b=await joinPlayer(app,host.room.roomId,{token:'ai-network-other-token',name:'Moss'});clients.push(a,b);await host.request('host:command',{command:{type:'start'}});
    const [ack,loser]=await Promise.all([a.request('player:submit',{requestId:'first',text:'Make that carpet mine',plan:{verb:'take',target:'crown'}}),b.request('player:submit',{requestId:'second',text:'Steal the crown'})]);
    assert.equal(ack.accepted,true);assert.equal(loser.ok,false);const room=()=>app.rooms()[host.identity.room.code];assert.equal(room().turn.ai.status,'thinking');assert.equal(room().turn.intent,'weird');
    assert.equal((await a.request('player:submit',{requestId:'first',text:'Changed my mind'})).duplicate,true);
    await b.request('player:submit',{requestId:'rx',kind:'reaction',reaction:'assist',turnId:ack.turnId,text:'I distract Marnie'});
    for(let i=0;i<50&&room().turn.ai.status==='thinking';i++)await pause(20);
    assert.equal(room().turn.ai.status,'applied');assert.equal(room().turn.action,'Make that carpet mine');assert.equal(room().turn.target.kind,'rug');assert.equal(f.requests.length,1);assert.equal(room().turn.reactions.length,1);assert.equal((await b.request('host:ai')).ok,false);
    await host.request('host:command',{command:{type:'resolve'}});assert.equal(room().result.ai.status,'applied');assert.equal(room().stats.rolls,1);
  }finally{await Promise.all(clients.map(c=>c.room.leave(true).catch(()=>{})));await app.close();await f.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('late AI cannot alter a result after host timer skip',async()=>{const f=await fixture(undefined,250),dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-ai-late-')),app=await createGameServer({port:0,dataDir:dir,ai:f.ai});const clients=[];try{const h=await createHost(app);clients.push(h);const p=await joinPlayer(app,h.room.roomId,{token:'ai-late-player-token',name:'Jinx'});clients.push(p);await h.request('host:command',{command:{type:'start'}});await p.request('player:submit',{requestId:'late',text:'Open the door'});await h.request('host:command',{command:{type:'resolve'}});const before=app.rooms()[h.identity.room.code];assert.equal(before.result.ai.status,'fallback');await pause(400);assert.deepEqual(app.rooms()[h.identity.room.code].result,before.result);}finally{await Promise.all(clients.map(c=>c.room.leave(true).catch(()=>{})));await app.close();await f.close();fs.rmSync(dir,{recursive:true,force:true});}});
