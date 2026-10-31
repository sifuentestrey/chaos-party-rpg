/** Six actual phone forms, native pacing, travel and a complete Refuge Trial. Disposable saves only. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS)throw Error('Explicit disposable room and browser tools required');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE)),base='http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-hybrid';fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');const players=room.players.slice(0,6),phones=[],errors=[],events=[];let browser,host,tv;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),get=i=>fetch(base+'/state?token='+players[i].token).then(r=>r.json());
const post=async(url,body)=>{const r=await fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const b=await r.json();assert.ok(r.ok,b.error||url);return b;};
const report=()=>fs.writeFileSync(path.join(out,'hybrid.json'),JSON.stringify({events,errors},null,2));
function note(event){events.push(event);report();console.log(JSON.stringify(event));}
async function until(fn,message,ms=65000){const end=Date.now()+ms;while(Date.now()<end){const value=await fn();if(value)return value;await sleep(150);}throw Error(message);}
async function submit(i,text){await sleep(210);const response=phones[i].waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');await phones[i].locator('#text').fill(text);await phones[i].locator('#send-action').click();const r=await response,b=await r.json();assert.equal(r.status(),202,b.error||text);return b.id;}
async function done(i,id){return until(async()=>{const s=await get(i),r=s.results.find(r=>r.id===id);return r&&!['received','started','queued'].includes(r.status)?{s,r}:null;},'No native outcome for submitted action');}
async function act(i,text){const result=await done(i,await submit(i,text));assert.equal(result.r.status,'succeeded',result.r.message);return result;}
async function readyAll(except=-1){for(let i=0;i<phones.length;i++)if(i!==except){await phones[i].locator('#pacing-ready').waitFor({state:'visible'});await phones[i].locator('#pacing-ready').click();}}
async function phase(name){return until(async()=>{const s=await get(0);return s.pacing?.phase===name&&s.actor?.pacing?.phase===name?s:null;},'Missing phase: '+name);}
async function travel(direction){
 await until(async()=>['exploration','planning'].includes((await get(0)).pacing.phase),'No travel window');await post('/pacing',{token:players[0].token,command:'travel',direction});
 const vote=await until(async()=>{const s=await get(0);return s.pacing.travel?.status==='pending'?s.pacing.travel:null;},'No travel vote');
 for(let i=1;i<vote.required;i++){await phones[i].locator('#pacing-yes').waitFor({state:'visible'});await phones[i].locator('#pacing-yes').click();}
 await until(async()=>{const s=await get(0);return s.pacing.travel?.status==='arrived'&&s.pacing.travel.arrived===6;},'Native group did not finish travel');
 note({check:'majority native travel',direction,arrivals:6,area:(await get(0)).pacing.area});
}
try{
 assert.equal(players.length,6);browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(let i=0;i<6;i++){const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true});phones.push(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/join?key='+room.join+'#recover='+players[i].token);await p.waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));}
 host=await browser.newPage();host.on('pageerror',e=>errors.push(e.message));await host.goto(base+'/host?key='+room.host);
 const first=await get(0);assert.equal(first.pacing.enabled,false,'Use a disposable live room before the first Hybrid activation');
 if(first.actor.zone!=='The Refuge')await act(0,'exit');
 const geo=JSON.parse(fs.readFileSync(path.join(process.env.FRACTURE_ROOT,'client/maps/world_client.json'))),solid=new Set(geo.collisions),spots=[];
 for(let y=206;y<211;y++)for(let x=48;x<59;x++)if(!solid.has(y*geo.width+x))spots.push([x,y]);
 await Promise.all(phones.map((p,i)=>act(i,'walk to '+spots[i].join(', '))));
 await host.locator('#pacing-enable').click();await until(async()=>(await get(0)).pacing.enabled,'Host could not enable Hybrid');
 tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey=local-test-tv-key');await tv.locator('#chaos-tv-controls').waitFor();
 note({check:'six independent phones regrouped through native walking',actors:(await Promise.all(players.map((p,i)=>get(i)))).map(s=>({name:s.name,x:s.actor.x,y:s.actor.y})),area:(await get(0)).pacing.area});
 await post('/host/adventure',{key:room.host,action:'start'});
 const beforeTalk=await get(0),a=beforeTalk.pacing.area,npc=beforeTalk.actor.nearby.find(n=>n.type==='npc'&&n.x>=a.x&&n.x<a.x+a.width&&n.y>=a.y&&n.y<a.y+a.height);assert.ok(npc,'Need an existing NPC in the active scene');
 await act(0,'talk to '+npc.id);await until(async()=>(await get(0)).adventure.steps[0].done,'Native conversation did not advance trial');
 await act(0,'use ability');await host.locator('#pacing-attention').click();let planning=await phase('planning');
 const frozen=(await Promise.all(players.map((p,i)=>get(i)))).map(s=>({x:s.actor.x,y:s.actor.y,hp:s.actor.hp})),remaining=planning.actor.ability.remainingMs;
 await sleep(2500);const still=await get(0);assert.ok(Math.abs(still.actor.ability.remainingMs-remaining)<200,'Planning must freeze actual ability duration');
 assert.deepEqual((await Promise.all(players.map((p,i)=>get(i)))).map(s=>({x:s.actor.x,y:s.actor.y,hp:s.actor.hp})),frozen);
 await phones[0].screenshot({path:path.join(out,'phone-planning.png'),fullPage:true});await tv.screenshot({path:path.join(out,'tv-planning.png')});
 await submit(0,'walk east 1');await submit(1,'walk east 1');const bonusResponse=phones[1].waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');await phones[1].locator('#ability-use').click();assert.equal((await bonusResponse).status(),202);
 await until(async()=>{const s=await get(1);return s.pacing.draft?.text.includes('walk east');},'Ability must retain the chosen movement');
 await phones[0].locator('#stop').click();await until(async()=>!(await get(0)).pacing.draft,'STOP did not clear own draft');assert.ok((await get(1)).pacing.draft,'STOP must not clear another player');
 const p1=(await get(1)).actor;await readyAll();await phase('action');await until(async()=>(await get(1)).actor.ability.phased,'Native Phase Shift did not execute');
 assert.equal((await get(0)).actor.x,frozen[0].x);await phase('recap');assert.equal((await get(1)).actor.x,p1.x+1);await tv.screenshot({path:path.join(out,'tv-recap.png')});await phase('exploration');
 note({check:'actual pause, frozen cooldown, own STOP, ability plus action, shared five-second playback and recap',remainingMs:remaining});
 await travel('west');await travel('south');
 await submit(0,'walk to 22, 223');
 await until(async()=>{const s=await get(0);return s.pacing.phase==='planning'||s.actor.nearby.some(n=>n.type==='mob'&&n.name==='rat');},'No existing rat was reachable');
 let s=await get(0),rat=s.actor.nearby.filter(n=>n.type==='mob'&&n.name==='rat').sort((x,y)=>Math.abs(x.x-s.actor.x)+Math.abs(x.y-s.actor.y)-Math.abs(y.x-s.actor.x)-Math.abs(y.y-s.actor.y))[0];assert.ok(rat,'No native rat in view');
 if(s.pacing.phase==='exploration')await submit(0,'attack '+rat.id);await phase('planning');
 const combatBefore=await get(0),hp=combatBefore.actor.hp,mobBefore=combatBefore.actor.nearby.find(n=>n.id===rat.id);await sleep(2200);const combatStill=await get(0);assert.equal(combatStill.actor.hp,hp);assert.deepEqual(combatStill.actor.nearby.find(n=>n.id===rat.id),mobBefore,'Enemy position and HP must freeze before combat');
 const hit=await submit(0,'attack '+rat.id);let kill;await readyAll();
 for(let round=0;round<6;round++){
  await phase('action');const recap=await phase('recap'),result=recap.results.find(r=>r.id===hit);
  if(result?.status==='succeeded'){kill={s:recap,r:result};break;}
  assert.ok(!result||['started','received','queued'].includes(result.status),result?.message);
  await phase('planning');await readyAll();
 }
 assert.ok(kill,'Native attack did not finish within six shared bursts');
 await until(async()=>(await get(0)).adventure.steps[1].done,'Native rat defeat did not advance trial');note({check:'real native rat defeat after planning',message:kill.r.message,hpHeldDuringPlanning:hp});
 await travel('north');await travel('north');
 await until(async()=>(await get(0)).adventure.steps[2].done,'Actual woods arrival did not advance trial');
 await travel('south');await until(async()=>(await get(0)).adventure.status==='completed','Visitor did not actually return to The Refuge');
 note({check:'complete Refuge Trial through native NPC, combat, majority woods travel and return',summary:(await get(0)).adventure.summary});
 await host.locator('#pacing-attention').click();planning=await phase('planning');await readyAll(5);const timeoutStarted=Date.now();await phase('action');assert.ok(Date.now()-timeoutStarted>=23000,'Silent phone must use the genuine planning deadline');await phase('recap');await phase('exploration');note({check:'one silent phone cannot stall the party past the actual 30-second deadline',waitMs:Date.now()-timeoutStarted});
 if(process.env.CHAOS_LIVE_DM_TEST==='1'){
  await post('/dm',{key:room.host,enabled:true});const quotaBefore=await(await fetch(base+'/dm/status?key='+room.host)).json();
  await host.locator('#pacing-attention').click();await phase('planning');const ids=await Promise.all([submit(0,'Please unleash the special talent belonging to my class.'),submit(1,'Could you use my own signature trick now?')]);await readyAll();
  const completed=await Promise.all(ids.map((id,i)=>done(i,id)));for(const result of completed)assert.equal(result.r.status,'succeeded',result.r.message);assert.equal(completed[1].s.actor.ability.phased,true,'Native Rogue Phase Shift must actually activate');await tv.screenshot({path:path.join(out,'live-shared-abilities.png')});await phase('recap');await until(async()=>(await get(0)).pacing.recap?.mode==='optional AI','No validated shared live recap');
  const after=await(await fetch(base+'/dm/status?key='+room.host)).json();assert.equal(quotaBefore.quota.remaining-after.quota.remaining,2,'Use one interpretation batch and one shared recap');
  note({check:'real Groq interprets two choices in one request and narrates one confirmed shared recap',requests:2,canonical:completed.map(r=>({status:r.r.status,message:r.r.message})),recap:(await get(0)).pacing.recap.text});
 }
 assert.deepEqual(errors,[]);note({status:'passed'});
}catch(error){const message=error.message.replace(/https?:\/\/\S+/g,'<private test URL>');note({status:'failed',error:message});console.error(message);process.exitCode=1;if(tv)await tv.screenshot({path:path.join(out,'failure-tv.png')}).catch(()=>{});if(phones[0])await phones[0].screenshot({path:path.join(out,'failure-phone.png'),fullPage:true}).catch(()=>{});
}finally{await post('/dm',{key:room.host,enabled:false}).catch(()=>{});await browser?.close();}
