/** Real creator forms and native actors; run only against an explicitly disposable room. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS||!process.env.CHAOS_TV_KEY)throw Error('Explicit disposable room, browser tools and TV key required');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE)),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-creator';fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const roles=['knight','rogue','wizard','healer'],names=['Ash','Bram','Cora','Dara'],players=[],phones=[],events=[],errors=[];let browser,tv;
const post=(url,body)=>fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const state=i=>fetch(base+'/state?token='+players[i].token).then(r=>r.json());
const report=(status,error)=>fs.writeFileSync(path.join(out,'character-creation.json'),JSON.stringify({status,error,events,errors},null,2));
async function until(fn,message,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(v)return v;await sleep(200);}throw Error(message);}
async function action(i,text){
 const r=await post('/action',{token:players[i].token,text}),b=await r.json();assert.equal(r.status,202,b.error||text);
 const result=await until(async()=>{const s=await state(i),r=s.results.find(r=>r.id===b.id);return r&&!['received','started','queued'].includes(r.status)?{s,r}:null;},'Action timeout: '+text,65000);
 events.push({player:names[i],text,status:result.r.status,message:result.r.message,effect:result.r.abilityEffect,x:result.s.actor.x,y:result.s.actor.y});report('running');return result;
}
try{
 assert.equal(room.phase,'creation','Verifier requires a fresh disposable creator room');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(let i=0;i<4;i++){
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),p=await c.newPage();phones.push(p);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/join?key='+room.join);await p.waitForFunction(()=>typeof document.getElementById('creator-next').onclick==='function');
  await p.locator('#name').fill(names[i]);await p.locator('#body').selectOption(['elf','orc','human','elf'][i]);await p.locator('#outfit').selectOption(['clotharmor','leatherarmor','redarmor','goldenarmor'][i]);await p.locator('#clothing').selectOption(String(i+1));await p.locator('#accessory').selectOption(['flower','glasses','hat','crown'][i]);await p.locator('#skin').selectOption(String(i+1));if(i<2)await p.locator('#hair').selectOption(String(i+1));
  await p.locator('#preview-turn').click();await p.locator('#preview-pose').click();await sleep(300);await p.screenshot({path:path.join(out,'creator-'+roles[i]+'.png'),fullPage:true});
  await p.locator('#creator-next').click();await p.locator('#role').selectOption(roles[i]);await p.locator('#creator-next').click();
  const response=p.waitForResponse(r=>r.url()===base+'/pair'&&r.request().method()==='POST');await p.locator('#join').click();const paired=await response;assert.equal(paired.status(),201);players.push(await paired.json());
  await p.locator('#creation-wait').waitFor();const s=await state(i);assert.equal(s.actor,null);assert.equal(s.phase,'creation');assert.equal(s.appearance.outfit,['clotharmor','leatherarmor','redarmor','goldenarmor'][i]);
 }
 assert.equal((await(await fetch(base+'/health')).json()).connected,0,'Lobby cannot spawn vulnerable bodies');events.push({lobby:true,profiles:4,noNativeActors:true});
 tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY));await tv.getByText('Create your adventurers',{exact:true}).waitFor();await sleep(2500);await tv.screenshot({path:path.join(out,'tv-creation.png')});
 const host=await browser.newPage();await host.goto(base+'/host?key='+room.host);await host.locator('#begin-adventure').click();
 for(let i=0;i<4;i++)await phones[i].waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));
 const started=await Promise.all(players.map((_,i)=>state(i)));assert.equal(new Set(started.map(s=>s.actor.id)).size,4);assert.ok(started.every(s=>s.actor.level===1));events.push({started:true,actors:started.map(s=>({name:s.name,id:s.actor.id,x:s.actor.x,y:s.actor.y,level:s.actor.level,armor:s.actor.armor,ability:s.actor.ability.id}))});
 await tv.locator('#chaos-camera-options').evaluate(e=>e.open=true);await tv.getByRole('combobox',{name:'Camera mode'}).selectOption('follow');await tv.getByRole('combobox',{name:'Follow player'}).selectOption(String(started[0].actor.id));await sleep(1200);await tv.screenshot({path:path.join(out,'tv-party.png')});
 for(let i=0;i<3;i++){
  await phones[i].locator('#ability-use').click();await until(async()=>{const s=await state(i);return s.actor.ability.readyAt>Date.now()?s:null;},'Signature did not execute');
  const s=await state(i);assert.ok(s.actor.ability.readyAt>Date.now());if(i===0)assert.ok(s.actor.ability.empowered);if(i===1)assert.ok(s.actor.ability.phased);events.push({nativeAbility:s.actor.ability.id,confirmed:true});
 }
 const full=await action(3,'mend');assert.equal(full.r.status,'blocked');assert.equal(full.s.actor.ability.readyAt,0);
 const before=(await state(0)).actor;const moved=await action(0,'walk north 3');assert.equal(moved.r.status,'succeeded');assert.notDeepEqual([moved.s.actor.x,moved.s.actor.y],[before.x,before.y]);
 // Cosmetic editing must leave class, native equipment and game position untouched.
 const old=await state(1);await phones[1].locator('[data-open-wardrobe]').last().click();await phones[1].locator('#outfit').selectOption('goldenarmor');await phones[1].locator('#join').click();await until(async()=>((await state(1)).appearance.outfit==='goldenarmor'),'Wardrobe not saved');const changed=await state(1);assert.equal(changed.role,old.role);assert.equal(changed.actor.armor,old.actor.armor);assert.equal(changed.actor.ability.readyAt,old.actor.ability.readyAt);
 await phones[1].reload();await phones[1].waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));const recovered=await state(1);assert.equal(recovered.appearance.outfit,'goldenarmor');assert.equal(recovered.actor.ability.readyAt,old.actor.ability.readyAt);events.push({wardrobe:true,recovery:true,armorUnchanged:true});
 await phones[3].screenshot({path:path.join(out,'phone-healer.png'),fullPage:true});await sleep(2000);await tv.screenshot({path:path.join(out,'tv-wardrobe.png')});assert.deepEqual(errors,[]);report('passed');console.log(JSON.stringify({status:'passed',events}));
}catch(error){const message=error.message.replace(/https?:\/\/\S+/g,'<private test URL>');report('failed',message);console.error(message);process.exitCode=1;}
finally{await browser?.close();}
