import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRoom,addPlayer,startGame,submit,advance} from '../public/core.js';
import {narrationContext} from '../src/dm-narrator.mjs';
import {prepareAICase} from '../scripts/ai-acceptance-cases.mjs';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {createGameServer} from '../server.mjs';
import {createHost,joinPlayer,pause} from './colyseus-helpers.mjs';

function resolvedScene(){
  const room=createRoom({seed:12345,now:0});
  const actor=addPlayer(room,{token:'private-device-token',name:'Jinx',role:'bard'},0);
  const other=addPlayer(room,{token:'other-private-token',name:'Moss'},0);
  startGame(room,0);
  submit(room,actor.id,{requestId:'grounding-turn',text:'Attack Captain Brick'},1000);
  advance(room,10000);
  return {room,actor,other};
}

test('narration context projects canonical actor, explicit target and speaker state only',()=>{
  const {room,actor}=resolvedScene();
  actor.hp=6;actor.injuries=['bruised shoulder'];actor.status='ready';
  room.world.npcs={guard:{hp:5,maxHp:8,status:'wary',injuries:['split lip'],token:'npc-private',private:{secret:'hidden'}}};
  const guard=room.world.npcs.guard;
  room.world.npcs.guard.extraNested={authorization:'fake'};
  room.world.npcs.guard.status='wary';
  // The target resolver's canonical identity is deliberately explicit.
  room.result.target={id:'guard',kind:'guard',name:'Captain Brick',entityId:'guard',token:'must-not-leak',private:{secret:'hidden'}};
  const context=narrationContext(room),json=JSON.stringify(context);
  assert.deepEqual(context.actor,{id:actor.id,name:'Jinx',role:'bard',hp:6,maxHp:actor.maxHp,status:'ready',injuries:['bruised shoulder']});
  assert.deepEqual(context.target,{id:'guard',kind:'guard',name:'Captain Brick',hp:5,maxHp:8,status:'wary',injuries:['split lip']});
  const speaker=context.speakers.find(s=>s.id==='guard');
  assert.deepEqual({hp:speaker.hp,maxHp:speaker.maxHp,status:speaker.status,injuries:speaker.injuries},{hp:5,maxHp:8,status:'wary',injuries:['split lip']});
  for(const secret of ['private-device-token','other-private-token','npc-private','authorization','hidden','extraNested'])assert.equal(json.includes(secret),false);
  assert.equal(guard.hp,5);
});

test('speaker state uses engine tavern defaults and does not invent absent injuries or status',()=>{
  const {room}=resolvedScene();
  room.world.npcs={guard:{hp:4,maxHp:8}};
  const context=narrationContext(room),speaker=context.speakers.find(s=>s.id==='guard');
  assert.equal(speaker.hp,4);assert.equal(speaker.maxHp,8);
  assert.deepEqual(speaker.injuries,[]);assert.equal(Object.hasOwn(speaker,'status'),false);
});

test('generated patient health and injuries remain canonical after JSON save and reload',()=>{
  const {room}=prepareAICase({id:'narrator-patient',setup:'creature',text:'Inspect person-clearing'});
  advance(room,room.turn.deadline+1);
  const patient=room.world.expedition.creatures['person-clearing'];
  assert.ok(patient.hp<patient.maxHp);assert.deepEqual(patient.injuries,['sprained arm']);
  const context=narrationContext(room),speaker=context.speakers.find(n=>n.id===patient.id);
  assert.equal(context.target.id,patient.id);assert.equal(context.target.hp,patient.hp);
  assert.deepEqual(context.target.injuries,patient.injuries);assert.equal(speaker.hp,patient.hp);
  assert.deepEqual(speaker.injuries,patient.injuries);
  assert.deepEqual(narrationContext(JSON.parse(JSON.stringify(room))),context);
  context.target.injuries.push('caller mutation');speaker.injuries.push('caller mutation');
  assert.deepEqual(patient.injuries,['sprained arm']);
});

test('target projection handles player memory identity and bounded item or fixture state',()=>{
  const {room,actor,other}=resolvedScene();
  other.hp=7;other.status='ready';other.injuries=[];
  room.result.target={id:other.id,kind:'player',name:'Moss'};
  room.dmMemory={version:1,entries:[],people:{}};
  room.result.id='current-turn';room.result.target.id=other.id;
  room.dmMemory.entries.push({id:'old-player-memory',round:1,location:'tavern',actorId:actor.id,actor:'Jinx',attempt:'Help Moss',targetId:other.id,outcome:'success',fact:'Moss was helped.',changes:[]});
  room.dmMemory.entries[0].private={token:'memory-private'};
  for(let n=0;n<4;n++)room.dmMemory.entries.push({id:`new-unrelated-${n}`,round:10+n,location:'tavern',actorId:actor.id,actor:'Jinx',attempt:'Look around',targetId:`other-${n}`,outcome:'success',fact:'A newer room fact.',changes:[]});
  const playerContext=narrationContext(room);
  assert.equal(playerContext.target.id,other.id);assert.equal(playerContext.target.hp,7);
  assert.ok(playerContext.memories.some(m=>m.id==='old-player-memory'));
  assert.equal(JSON.stringify(playerContext).includes('memory-private'),false);
  playerContext.memories.find(m=>m.id==='old-player-memory').changes.push('caller mutation');
  assert.deepEqual(room.dmMemory.entries[0].changes,[]);

  const item=room.world.expedition.items['item-1'];
  Object.assign(item,{name:'Blue bottle',condition:'cracked',token:'secret',properties:{hidden:true}});
  room.result.target={id:'item-1',kind:'item',name:item.name};
  const itemContext=narrationContext(room);
  assert.deepEqual(itemContext.target,{id:'item-1',kind:'item',name:'Blue bottle',injuries:[],condition:'cracked',owner:null,equipped:false});
  assert.equal(JSON.stringify(itemContext).includes('secret'),false);
  assert.equal(JSON.stringify(itemContext).includes('hidden'),false);

  room.world.objects||={};room.world.objects.door={condition:'broken',lit:false,open:true};
  room.result.target={id:'fixture:door',entityId:'fixture:door',kind:'fixture',name:'the tavern door'};
  const fixtureContext=narrationContext(room);
  assert.deepEqual(fixtureContext.target,{id:'fixture:door',kind:'fixture',name:'the tavern door',condition:'broken',lit:false,open:true});
  room.world.expedition.current='clearing';
  const remoteFixtureContext=narrationContext(room);
  assert.deepEqual(remoteFixtureContext.target,{id:'fixture:door',kind:'fixture',name:'the tavern door'});
});

test('context arrays are detached and large participant context stays within its character budget',()=>{
  const {room,actor}=resolvedScene();
  actor.injuries=['scraped hand'];
  const context=narrationContext(room);
  context.actor.injuries.push('caller mutation');
  assert.deepEqual(actor.injuries,['scraped hand']);
  for(let n=0;n<18;n++)room.players.push({...room.players[0],id:`player-${n}`,name:`Player ${n} ${'N'.repeat(80)}`,token:`private-${n}`});
  room.result.reactions=room.players.slice(1).map((p,n)=>({playerId:p.id,kind:'custom',text:'R'.repeat(500)}));
  const crowded=narrationContext(room);
  assert.ok(JSON.stringify(crowded).length<=12000);
  assert.ok(crowded.reactions.length<=20);
  assert.ok(crowded.reactions.every(r=>r.name.length<=18&&r.text.length<=120));
  assert.equal(JSON.stringify(crowded).includes('private-'),false);
});

test('redacting an earlier memory while current narration is pending suppresses its stale publication',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-grounding-redact-'));
  let releaseNarration;const secondReply=new Promise(resolve=>releaseNarration=resolve);
  let calls=0;const seenContexts=[];
  const ai=createLocalGameMaster({env:{CHAOS_AI_NARRATION:'on'},fetcher:async(url,options)=>{
    if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'qwen3:1.7b'}]}));
    const payload=JSON.parse(options.body),context=JSON.parse(payload.messages[1].content);
    if(!context.outcome)return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({verb:'open',target:'door',summary:'Try the tavern door.'})}}]}));
    calls++;seenContexts.push(context);
    const line=`synthetic narrative ${calls}`;
    if(calls===2)await secondReply;
    return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({turnId:context.turnId,outcome:context.outcome.status,text:line,dialogue:[]})}}]}));
  }});
  let app=await createGameServer({port:0,dataDir:dir,ai});const clients=[];
  t.after(async()=>{releaseNarration();await Promise.all(clients.filter(c=>c.room.connection?.isOpen).map(c=>c.room.leave(true).catch(()=>{})));await app.close();fs.rmSync(dir,{recursive:true,force:true});});
  const host=await createHost(app);clients.push(host);
  const first=await joinPlayer(app,host.room.roomId,{token:'grounding-first-device-token',name:'Jinx'});clients.push(first);
  const second=await joinPlayer(app,host.room.roomId,{token:'grounding-second-device-token',name:'Moss'});clients.push(second);
  await host.request('host:command',{command:{type:'start'}});
  const live=()=>app.rooms()[host.identity.room.code];
  const resolve=async()=>{const r=await host.request('host:command',{command:{type:'resolve'}});assert.equal(r.ok,true,JSON.stringify(r));};
  const act=async(client,requestId)=>{const r=await client.request('player:submit',{requestId,text:'Open the tavern door'});assert.equal(r.accepted,true,JSON.stringify(r));
    for(let n=0;n<40&&live().turn.ai?.status==='thinking';n++)await pause(5);await resolve();};
  await act(first,'first-grounding-turn');
  for(let n=0;n<50&&live().result.story.status==='thinking';n++)await pause(10);
  assert.equal(live().result.story.status,'ready');
  const firstStoryTurnId=live().result.id;
  const oldDeclaration=live().events.filter(e=>e.type==='declaration').at(-1);
  await resolve(); // finish the reveal window before the next player acts
  await act(second,'second-grounding-turn');
  assert.equal(live().result.story.status,'thinking');
  const currentTurnId=live().result.id;
  assert.ok(seenContexts[1].memories.some(m=>m.id===firstStoryTurnId));
  const redacted=await host.request('host:command',{command:{type:'redact',eventId:oldDeclaration.id}});
  assert.equal(redacted.ok,true);
  releaseNarration();await pause(50);
  assert.equal(live().result.story.status,'fallback');
  assert.equal(live().events.filter(e=>e.type==='storyteller').length,1);
  assert.equal(live().events.some(e=>e.type==='storyteller'&&e.turnId===firstStoryTurnId),true);
  assert.equal(live().events.some(e=>e.type==='storyteller'&&e.turnId===currentTurnId),false);
  assert.equal(JSON.stringify(live().dmMemory).includes('synthetic narrative'),false);
});
