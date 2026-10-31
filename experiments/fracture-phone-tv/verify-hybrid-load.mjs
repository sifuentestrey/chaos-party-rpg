/** Twenty real native actors through shared planning. HTTP controllers, not twenty physical phones. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.FRACTURE_ROOT)throw Error('Explicit disposable native room required');
const base='http://localhost:4748',room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE)),players=room.players.filter(p=>!p.parked).slice(0,20),events=[];
const out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-hybrid-load';fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),get=p=>fetch(base+'/state?token='+p.token).then(r=>r.json());
const post=async(url,data)=>{const r=await fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),b=await r.json();assert.ok(r.ok,b.error||url);return b;};
async function until(fn,label){const end=Date.now()+45000;while(Date.now()<end){const result=await fn();if(result)return result;await sleep(150);}throw Error(label);}
let keepAlive;
try{
 for(const p of players)await get(p);
 await until(async()=>{const s=await get(players[0]);return s.actor?.ready&&s.pacing.enabled;},'Recover an existing Hybrid party first');
 while(players.length<20){const b=await post('/pair',{key:room.join,name:'PaceLoad'+String(players.length+1).padStart(2,'0'),role:'knight',perk:'lucky'});players.push({token:b.token});}
 keepAlive=setInterval(()=>{void Promise.all(players.map(get));},2000);
 let states=await until(async()=>{const s=await Promise.all(players.map(get));return s.every(p=>p.actor?.ready)?s:null;},'Twenty native actors did not connect');
 assert.equal(new Set(states.map(s=>s.actor.id)).size,20);
 for(const s of states){const a=s.pacing.area;assert.equal(s.actor.zone,a.zone,'Fresh actors must join the actual party area');assert.ok(s.actor.x>=a.x&&s.actor.x<a.x+a.width&&s.actor.y>=a.y&&s.actor.y<a.y+a.height,'Fresh actor spawned outside the current scene');}
 const geo=JSON.parse(fs.readFileSync(path.join(process.env.FRACTURE_ROOT,'client/maps/world_client.json'))),solid=new Set(geo.collisions),plateau=new Set(geo.plateau);
 for(let round=0;round<2;round++){
  await until(async()=>{const s=await get(players[0]);return s.pacing.phase==='exploration';},'Finish the current encounter before load rehearsal');
  await post('/host/pacing',{key:room.host,command:'attention'});
  states=await until(async()=>{const s=await Promise.all(players.map(get));return s.every(v=>v.pacing.phase==='planning'&&v.actor.pacing.phase==='planning'&&v.pacing.total===20)?s:null;},'All twenty must observe the same current planning window');
  const stale=await fetch(base+'/pacing',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:players[0].token,command:'ready',instanceId:'previous-native-instance',roundId:states[0].pacing.roundId,ready:true})});assert.equal(stale.status,409,'A previous server instance must never ready a new round');
  const frozen=states.map(s=>[s.actor.x,s.actor.y,s.actor.hp]);await sleep(1200);assert.deepEqual((await Promise.all(players.map(get))).map(s=>[s.actor.x,s.actor.y,s.actor.hp]),frozen);
  const plans=states.map(s=>{const p=s.actor,a=s.pacing.area;for(const [name,dx,dy] of [['west',-1,0],['east',1,0],['south',0,1],['north',0,-1]]){const x=p.x+dx,y=p.y+dy;if(x>=a.x&&x<a.x+a.width&&y>=a.y&&y<a.y+a.height&&!solid.has(y*geo.width+x)&&plateau.has(y*geo.width+x)===plateau.has(p.y*geo.width+p.x))return {text:'walk '+name+' 1',x,y};}throw Error('No adjacent native floor for '+s.name);});
  const started=Date.now(),accepted=await Promise.all(players.map((p,i)=>post('/action',{token:p.token,text:plans[i].text})));
  const ackMs=Date.now()-started;await Promise.all(players.map(p=>post('/pacing',{token:p.token,command:'ready',instanceId:states[0].pacing.instanceId,roundId:states[0].pacing.roundId,ready:true})));
  const finished=await until(async()=>{const s=await Promise.all(players.map(get));return s.every((v,i)=>v.results.some(r=>r.id===accepted[i].id&&!['received','queued','started'].includes(r.status)))?s:null;},'Native movement did not complete for all twenty');
  for(let i=0;i<20;i++){const result=finished[i].results.find(r=>r.id===accepted[i].id);assert.equal(result.status,'succeeded',finished[i].name+': '+result.message);assert.deepEqual([finished[i].actor.x,finished[i].actor.y],[plans[i].x,plans[i].y]);}
  events.push({round:round+1,actors:20,uniqueNativeActors:20,allMoved:true,allHeldDuringPlanning:true,acceptedBatchMs:ackMs});console.log(JSON.stringify(events.at(-1)));
  await until(async()=>(await get(players[0])).pacing.phase==='exploration','Round did not return to exploration');
 }
 fs.writeFileSync(path.join(out,'twenty-actors.json'),JSON.stringify({status:'passed',type:'software native actors; not physical devices',events},null,2));console.log(JSON.stringify({status:'passed',actors:20}));
}catch(error){const message=error.message.replace(/https?:\/\/\S+/g,'<private test URL>');fs.writeFileSync(path.join(out,'twenty-actors.json'),JSON.stringify({status:'failed',error:message,events},null,2));console.error(message);process.exitCode=1;}finally{clearInterval(keepAlive);}
