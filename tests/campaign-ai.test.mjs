import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {createGameServer} from '../server.mjs';
import {createHost,joinPlayer,pause} from './colyseus-helpers.mjs';
test('actual multiplayer validates a simulated world interpretation, preserves declaration/reactions, and saves appearance',async()=>{
 const calls=[];const response={domain:'world',verb:'craft',target:'',item:'',sources:['item-1','item-2'],name:'purple raincatcher',itemType:'wearable',slot:'body',color:'#bd88cf',summary:'Weave the carried parts into a wearable raincatcher.'};
 const model=http.createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');if(req.url==='/v1/models')return res.end(JSON.stringify({data:[{id:'test-world-fixture'}]}));let body='';for await(const c of req)body+=c;calls.push(JSON.parse(body));await pause(120);res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(response)}}]}));});await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const ai=createLocalGameMaster({env:{CHAOS_AI_BASE_URL:'http://127.0.0.1:'+model.address().port+'/v1',CHAOS_AI_MODEL:'test-world-fixture'}}),dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-world-ai-'));
 let app=await createGameServer({port:0,dataDir:dir,ai}),h,a,b;const clients=[];
 try{
  h=await createHost(app);clients.push(h);a=await joinPlayer(app,h.room.roomId,{name:'Jinx',token:'world-ai-player-token'});clients.push(a);await h.request('host:command',{command:{type:'start'}});
  const skip=async()=>{for(let n=0;n<20;n++){const reply=await h.request('host:command',{command:{type:'resolve'}});if(reply.ok)return;assert.equal(reply.code,'SLOW_DOWN');await pause(200);}assert.fail('Host limiter never recovered');};
  const act=async(text,p=a)=>{const ack=await p.request('player:submit',{requestId:crypto.randomUUID(),text});assert.equal(ack.accepted,true);await skip();await skip();};
  await act('Take item-1');await act('Take item-2');assert.equal(calls.length,0);
  b=await joinPlayer(app,h.room.roomId,{name:'Moss',token:'world-ai-helper-token'});clients.push(b);await act('Inspect item-3',b);
  const text='I weave my scraps into something purple I can wear';const ack=await a.request('player:submit',{requestId:'world-creative-once',text,plan:{hp:1000}});assert.equal(ack.accepted,true,JSON.stringify(ack));
  const live=()=>app.rooms()[h.identity.room.code];assert.equal(live().turn.action,text);assert.equal(live().turn.ai.status,'thinking');assert.equal(Object.values(live().world.expedition.items).some(i=>i.name===response.name),false);
  await b.request('player:submit',{requestId:'world-assist',kind:'reaction',reaction:'assist',turnId:ack.turnId,text:'I hold the pieces together'});
  for(let n=0;n<60&&live().turn.ai.status==='thinking';n++)await pause(20);
  assert.equal(live().turn.ai.status,'applied');assert.equal(calls.length,1);assert.equal(calls[0].response_format.json_schema.schema.properties.domain.enum[0],'world');assert.equal(calls[0].messages[1].content.includes('world-ai-player-token'),false);
  await skip();assert.equal(live().result.reactions.length,1);assert.equal(live().result.action,text);assert.equal(live().stats.rolls,1);assert.equal(live().players[0].hp<=live().players[0].maxHp,true);
  if(live().result.success){const made=Object.values(live().world.expedition.items).find(i=>i.name===response.name);assert.equal(made.type,'wearable');assert.equal(made.slot,'body');assert.equal(made.appearance.color,'#bd88cf');assert.deepEqual(app.store.rooms[live().code].world.expedition.items[made.id],made);}
 }finally{await Promise.all(clients.map(c=>c.room.leave(true).catch(()=>{})));await app.close();model.closeAllConnections();await new Promise(r=>model.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
