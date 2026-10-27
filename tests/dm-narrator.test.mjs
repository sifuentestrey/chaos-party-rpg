import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRoom,addPlayer,startGame,submit,advance,hostCommand,publicRoom} from '../public/core.js';
import {recordDMMemory,relevantDMMemory} from '../public/dm-memory.js';
import {narrationContext,validateNarration} from '../src/dm-narrator.mjs';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {createGameServer} from '../server.mjs';
import {createHost,joinPlayer,pause} from './colyseus-helpers.mjs';
import {DM_NARRATION_CASES,prepareDMNarrationCase} from '../scripts/dm-narration-cases.mjs';

function scene(){
  const room=createRoom({seed:12345,now:0}),actor=addPlayer(room,{token:'narrator-private-device-token',name:'Jinx',role:'bard'},0);
  startGame(room,0);submit(room,actor.id,{requestId:'once',text:'Tell Marnie I am her long-lost son, demand free drinks and threaten to burn the tavern'},1000);advance(room,10000);
  return {room,actor};
}
const answer=c=>({turnId:c.turnId,outcome:c.outcome.status,text:'The room pauses to appreciate the sheer confidence involved.',dialogue:[{speakerId:'bartender',line:'If you are family, you can start with the washing up.'}]});
const models=()=>new Response(JSON.stringify({data:[{id:'openai/gpt-oss-20b'}]}));
const response=value=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:700,completion_tokens:90}}));

test('live narration qualification scenarios contain real canonical reactions, blocked powers and remembered NPCs',()=>{
  const rooms=DM_NARRATION_CASES.map(prepareDMNarrationCase);
  assert.equal(rooms[0].result.intent,'social');assert.equal(rooms[0].result.target.kind,'bartender');assert.equal(rooms[0].result.reactions[0].kind,'intervene');
  assert.equal(narrationContext(rooms[1]).outcome.status,'blocked');assert.equal(rooms[1].players[0].gold,3);
  const c=narrationContext(rooms[2]);assert.equal(c.scene.id,'clearing');assert.ok(c.speakers.some(s=>s.id===rooms[2].result.target.entityId));
  assert.ok(c.memories.some(m=>m.targetId===rooms[2].result.target.entityId&&m.id!==rooms[2].result.id));
});

test('narration context distinguishes attempted claims from canonical facts and excludes secrets',()=>{
  const {room,actor}=scene(),context=narrationContext(room),json=JSON.stringify(context);
  assert.ok(context.attempt.includes('long-lost son'));assert.equal(context.outcome.canonical,room.result.narration);
  assert.equal(context.outcome.status,room.result.success?'success':'failure');
  for(const secret of [actor.token,actor.pin,'"seed"','"requests"','host-key'])assert.equal(json.includes(secret),false);
  assert.ok(json.length<12000);assert.equal(publicRoom(room).dmMemory,undefined);
  const before=structuredClone(room);validateNarration(answer(context),context);assert.deepEqual(room,before);
});
test('story validation rejects wrong outcome, stale turn, fabricated speakers and mutation fields',()=>{
  const {room}=scene(),c=narrationContext(room),valid=answer(c);
  assert.equal(validateNarration(valid,c).dialogue[0].name,'Marnie');
  for(const value of [{...valid,outcome:'blocked'},{...valid,turnId:'other-turn'},{...valid,gold:999},
    {...valid,dialogue:[{speakerId:'player-id',line:'I agree.'}]},{...valid,text:'<script>bad()</script>'},
    {...valid,dialogue:[...valid.dialogue,...valid.dialogue]}])assert.throws(()=>validateNarration(value,c));
  room.world.npcs={bartender:{hp:0}};assert.throws(()=>validateNarration(valid,narrationContext(room)));
});
test('canonical memory survives save/reload and retains NPC encounters beyond recent global history',()=>{
  const {room}=scene(),first=structuredClone(room.dmMemory.entries[0]);
  recordDMMemory(room);assert.equal(room.dmMemory.entries.length,1);
  for(let n=1;n<150;n++){room.round++;room.result={...room.result,id:'turn-'+n,target:{kind:'room'},action:'Inspect the room',narration:'No change.'};recordDMMemory(room);}
  const loaded=JSON.parse(JSON.stringify(room));
  assert.equal(loaded.dmMemory.entries.length,120);assert.equal(loaded.dmMemory.people.bartender.encounters[0].id,first.id);
  assert.equal(relevantDMMemory(loaded,{targetId:'bartender',location:'ruins'})[0].id,first.id);
  loaded.result=room.result;loaded.result.story={text:'Marnie gives 900 coins.'};
  assert.equal(JSON.stringify(loaded.dmMemory).includes('900'),false);
  hostCommand(loaded,{type:'redact',eventId:loaded.events.find(e=>e.type==='declaration').id},20000);
  assert.equal(JSON.stringify(loaded.dmMemory).includes('long-lost'),false);
  hostCommand(loaded,{type:'newStory'},21000);assert.deepEqual(loaded.dmMemory,{version:1,entries:[],people:{}});
});
test('free interpretation and narration share persisted request allowance, usage and fixed host',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-narrator-budget-')),calls=[];
  const ai=createLocalGameMaster({env:{CHAOS_AI_PROVIDER:'groq-free',GROQ_API_KEY:'synthetic-only',CHAOS_AI_NARRATION:'on'},dataDir:dir,
    fetcher:async(url,options)=>{if(url.endsWith('/models'))return models();const payload=JSON.parse(options.body);calls.push({url,payload});
      const c=JSON.parse(payload.messages[1].content);return response(c.outcome?answer(c):{verb:'social',target:'bartender',summary:'Try to convince Marnie.'});}});
  try{
    await ai.check();const {room,actor}=scene();await ai.interpret(room,actor.id,1000);const result=await ai.narrate(room,1000);
    assert.equal(result.usage.promptTokens,700);assert.equal(result.story.dialogue[0].name,'Marnie');assert.equal(calls.length,2);
    assert.ok(calls.every(c=>c.url==='https://api.groq.com/openai/v1/chat/completions'));
    assert.equal(calls[1].payload.response_format.json_schema.name,'resolved_story');assert.equal(ai.status().allowance.remaining,98);
    assert.equal(JSON.stringify(calls).includes(actor.token),false);assert.equal(JSON.stringify(calls).includes(actor.pin),false);
  }finally{ai.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('new interpretation aborts optional narration rather than waiting for it',async()=>{
  let started;const began=new Promise(r=>started=r);let aborted=false;
  const ai=createLocalGameMaster({env:{CHAOS_AI_NARRATION:'on'},fetcher:async(url,options)=>{
    if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'qwen3:1.7b'}]}));
    const p=JSON.parse(options.body);
    if(p.response_format.json_schema.name==='resolved_story')return new Promise((resolve,reject)=>{started();options.signal.addEventListener('abort',()=>{aborted=true;reject(Error('Aborted'));},{once:true});});
    return response({verb:'social',target:'bartender',summary:'Try talking.'});
  }});
  try{await ai.check();const {room,actor}=scene(),pending=ai.narrate(room,2000);const rejected=assert.rejects(pending,/Aborted/);await began;
    await ai.interpret(room,actor.id,1000);await rejected;assert.equal(aborted,true);
  }finally{ai.close();}
});

async function networkFixture(t,{delay=70}={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-narrator-network-')),calls=[];
  // A synthetic endpoint adapter tests transport/lifecycle only, never model quality.
  const ai=createLocalGameMaster({env:{CHAOS_AI_NARRATION:'on'},fetcher:async(url,options)=>{
    if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'qwen3:1.7b'}]}));
    const payload=JSON.parse(options.body),c=JSON.parse(payload.messages[1].content);
    if(!c.outcome)return response({verb:/Close/i.test(c.attempt)?'close':'open',target:'door',summary:'Use the tavern door.'});
    calls.push(c);await pause(delay);
    return response(answer(c));
  }});
  let app=await createGameServer({port:0,dataDir:dir,ai});const clients=[];
  t.after(async()=>{await Promise.all(clients.filter(c=>c.room.connection?.isOpen).map(c=>c.room.leave(true).catch(()=>{})));await app.close();fs.rmSync(dir,{recursive:true,force:true});});
  const host=await createHost(app);clients.push(host);const actor=await joinPlayer(app,host.room.roomId,{token:'narrator-network-actor',name:'Jinx'});clients.push(actor);
  await host.request('host:command',{command:{type:'start'}});
  const live=()=>app.rooms()[host.identity.room.code];
  const resolve=async()=>{const reply=await host.request('host:command',{command:{type:'resolve'}});assert.equal(reply.ok,true,JSON.stringify(reply));};
  const act=async()=>{const reply=await actor.request('player:submit',{requestId:crypto.randomUUID(),text:'Open the tavern door'});assert.equal(reply.accepted,true);
    for(let n=0;n<30&&live().turn.ai?.status==='thinking';n++)await pause(5);await resolve();};
  return {live,act,resolve,calls,app,host,actor,dir,clients,setApp:value=>app=value};
}
test('actual multiplayer resolves first, adds optional prose without changing rules, saves and resumes it',async t=>{
  const f=await networkFixture(t);await f.act();const before=f.live();
  assert.equal(before.phase,'reveal');assert.equal(before.result.story.status,'thinking');assert.equal(before.world.objects.door.open,true);
  for(let n=0;n<50&&f.live().result.story.status==='thinking';n++)await pause(10);
  const after=f.live();assert.equal(after.result.story.status,'ready');assert.deepEqual(after.world,before.world);assert.equal(after.seed,before.seed);
  assert.deepEqual(after.players,before.players);assert.equal(f.calls.length,1);assert.equal(after.events.at(-1).type,'storyteller');
  assert.deepEqual(f.app.store.rooms[after.code].dmMemory,after.dmMemory);
  await Promise.all(f.clients.map(c=>c.room.leave(true)));await f.app.close();
  const restarted=await createGameServer({port:0,dataDir:f.dir,ai:createLocalGameMaster({env:{CHAOS_AI:'off'}})});f.setApp(restarted);
  const resumed=await createHost(restarted,{resumeCode:after.code});f.clients.push(resumed);
  assert.deepEqual(resumed.identity.room.result.story,after.result.story);assert.deepEqual(restarted.store.rooms[after.code].dmMemory,after.dmMemory);
});
test('a late narrative cannot overwrite a new turn; host redaction cancels pending prose',async t=>{
  const f=await networkFixture(t,{delay:150});await f.act();await f.resolve();
  const next=await f.actor.request('player:submit',{requestId:'new-turn',text:'Close the tavern door'});assert.equal(next.accepted,true);
  await pause(220);assert.equal(f.live().turn.id,next.turnId);assert.equal(f.live().result,null);assert.equal(f.live().events.some(e=>e.type==='storyteller'),false);
  await f.resolve();const declaration=f.live().events.filter(e=>e.type==='declaration').at(-1);
  const hidden=await f.host.request('host:command',{command:{type:'redact',eventId:declaration.id}});assert.equal(hidden.ok,true);
  await pause(220);assert.equal(f.live().result.story.status,'fallback');assert.equal(f.live().events.some(e=>e.type==='storyteller'),false);
});
