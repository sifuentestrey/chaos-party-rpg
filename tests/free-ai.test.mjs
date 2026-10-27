import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLocalGameMaster,localAIConfig} from '../src/local-game-master.mjs';
import {createFreeAIBudget} from '../src/free-ai-budget.mjs';
import {createRoom,addPlayer,startGame,submit} from '../public/core.js';
const env={CHAOS_AI_PROVIDER:'groq-free',GROQ_API_KEY:'synthetic-fixture-only'};
const scene=()=>{const r=createRoom({seed:1,now:0}),p=addPlayer(r,{token:'synthetic-player-private-token',name:'Jinx'},0);startGame(r,0);submit(r,p.id,{text:'Make that carpet mine',requestId:'first'},1000);return {r,p};};
const models=()=>new Response(JSON.stringify({data:[{id:'openai/gpt-oss-20b'}]}),{headers:{'content-type':'application/json'}});
const answer=()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({verb:'take',target:'rug',summary:'Try to take the rug'})}}]}),{headers:{'content-type':'application/json'}});
test('free provider is explicit, fixed-host, opt-in and has no model/provider fallback',()=>{
 assert.equal(localAIConfig({CHAOS_AI:'off',...env}).enabled,false);assert.equal(localAIConfig(env).baseUrl,'https://api.groq.com/openai/v1');
 assert.throws(()=>localAIConfig({...env,CHAOS_AI_BASE_URL:'http://evil.test'}));assert.throws(()=>localAIConfig({...env,CHAOS_AI_MODEL:'some-paid-model'}));assert.throws(()=>localAIConfig({CHAOS_AI_PROVIDER:'automatic'}));
});
test('missing key sends no requests and status contains no credential values',async()=>{
 let calls=0;const ai=createLocalGameMaster({env:{CHAOS_AI_PROVIDER:'groq-free'},fetcher:async()=>{calls++;throw Error('No network allowed');}});
 try{assert.equal((await ai.check()).state,'not-configured');assert.equal(calls,0);const {r,p}=scene();await assert.rejects(()=>ai.interpret(r,p.id,100));assert.equal(calls,0);}finally{ai.close();}
});
test('hosted adapter uses server-only authorization and the documented structured protocol',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-free-protocol-')),calls=[];
 const ai=createLocalGameMaster({env,dataDir:dir,fetcher:async(url,options)=>{calls.push({url,options});return url.endsWith('/models')?models():answer();}});
 try{
  assert.equal((await ai.check()).available,true);const {r,p}=scene();const result=await ai.interpret(r,p.id,1000);assert.equal(result.plan.target,'rug');
  assert.ok(calls.every(c=>c.url.startsWith('https://api.groq.com/openai/v1/')));assert.equal(calls[1].options.headers.Authorization,'Bearer '+env.GROQ_API_KEY);assert.equal(calls[1].options.redirect,'error');
  const body=JSON.parse(calls[1].options.body);assert.equal(body.reasoning_effort,'low');assert.equal(body.include_reasoning,false);assert.equal(body.max_completion_tokens,1024);assert.equal(body.max_tokens,undefined);assert.equal(body.chat_template_kwargs,undefined);assert.equal(body.response_format.type,'json_schema');assert.equal(body.model,'openai/gpt-oss-20b');
  assert.equal(JSON.stringify(ai.status()).includes(env.GROQ_API_KEY),false);assert.equal(calls[1].options.body.includes(p.token),false);assert.equal(calls[1].options.body.includes(p.pin),false);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'ai-free-usage.json'))).count,1);
 }finally{ai.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('rate-limit responses stop further calls, count attempts, and never retry or switch provider',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-free-429-'));let time=100000,calls=0;
 const ai=createLocalGameMaster({env,dataDir:dir,now:()=>time,fetcher:async url=>{if(url.endsWith('/models'))return models();calls++;return new Response('{}',{status:429,headers:{'retry-after':'2'}});}});
 try{await ai.check();const {r,p}=scene();await assert.rejects(()=>ai.interpret(r,p.id,1000),/quota/);await assert.rejects(()=>ai.interpret(r,p.id,1000),/cooling/);assert.equal(calls,1);time+=61000;await assert.rejects(()=>ai.interpret(r,p.id,1000),/quota/);assert.equal(calls,2);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'ai-free-usage.json'))).count,2);}finally{ai.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('persistent local quotas survive restart; malformed or future ledgers fail conservatively',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-free-usage-'));let time=Date.UTC(2026,9,27);
 try{
  let budget=createFreeAIBudget(dir,{now:()=>time});for(let n=0;n<4;n++)budget.reserve();assert.throws(()=>budget.reserve(),/cooling/);
  budget=createFreeAIBudget(dir,{now:()=>time});assert.throws(()=>budget.reserve(),/cooling/);
  for(let n=4;n<100;n++){time+=61000;budget.reserve();}assert.throws(()=>budget.reserve(),/daily/);
  time-=86400000;assert.throws(()=>budget.reserve(),/daily/);
  time+=2*86400000;budget.reserve();assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'ai-free-usage.json'))).count,1);
  fs.writeFileSync(path.join(dir,'ai-free-usage.json'),'broken');assert.throws(()=>budget.reserve());
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
