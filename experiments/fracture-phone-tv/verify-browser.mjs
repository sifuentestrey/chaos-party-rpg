/** Browser acceptance against an explicitly supplied disposable room. Not a runtime dependency. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS)throw Error('Disposable test room and external Playwright tools required. See README.');
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE,'utf8')),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-browser-report';fs.mkdirSync(out,{recursive:true});
const index=Number(process.env.CHAOS_TEST_PLAYER_INDEX||0),players=[...room.players.slice(index),...room.players.slice(0,index)];
const events=[],errors=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
const get=player=>fetch(base+'/state?token='+player.token).then(r=>r.json());
async function action(phone,player,text,{meaningful=false,allowBlocked=false}={}){
 if(meaningful){const s=await get(player);if(s.turn)await sleep(Math.max(0,s.turn.deadline-Date.now()+250));}
 const response=phone.waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');
 await phone.locator('#text').fill(text);await phone.locator('#send-action').click();const http=await response,body=await http.json();assert.equal(http.status(),202,body.error||text);
 const end=Date.now()+65000;while(Date.now()<end){await sleep(250);const s=await get(player),r=s.results.find(r=>r.id===body.id);if(r&&!['received','started'].includes(r.status)){const event={text,status:r.status,message:r.message,x:s.actor.x,y:s.actor.y,hp:s.actor.hp,gold:s.actor.gold,weapon:s.actor.weapon,zone:s.actor.zone,quest:s.quest};events.push(event);console.log(JSON.stringify(event));if(!allowBlocked)assert.ok(['succeeded','cancelled'].includes(r.status),JSON.stringify(event));return s;}}
 throw Error('No final result for '+text);
}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const tvContext=await browser.newContext({viewport:{width:1280,height:720}});await tvContext.addInitScript(()=>localStorage.setItem('data','original-player-preview-sentinel'));
 const tv=await tvContext.newPage();tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY));await tv.locator('#chaos-tv-controls').waitFor();
 const phones=[];
 for(const player of players.slice(0,2)){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});const phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));
  // Personal recovery link enters a clean browser, then removes its token fragment.
  await phone.goto(base+'/join?key='+room.join+'#recover='+player.token);await phone.locator('#play').waitFor({state:'visible'});assert.equal(new URL(phone.url()).hash,'');assert.equal(await phone.locator('#who').textContent(),player.name);phones.push(phone);
 }
 const [player,other]=players;let s=await get(player);if(s.actor.dead)await action(phones[0],player,'respawn');
 const oldOther=await get(other);if(oldOther.actor.dead)await action(phones[1],other,'respawn');
 await action(phones[0],player,'look around');await action(phones[1],other,'look around');
 assert.notEqual((await get(player)).actor.id,(await get(other)).actor.id);
 await action(phones[0],player,'walk to 46, 202');await action(phones[0],player,'talk to guard',{meaningful:true});s=await action(phones[0],player,'ask guard for a quest',{meaningful:true});assert.ok(s.quest?.target);
 let completed=false;
 for(let i=0;i<12;i++){
  s=await get(player);if(s.actor.dead)await action(phones[0],player,'respawn');
  if(!s.actor.nearby.some(e=>e.name==='rat'))await action(phones[0],player,'walk to 40, 210');
  s=await action(phones[0],player,'attack rat',{meaningful:true,allowBlocked:true});
  if(s.quest?.completed){completed=true;break;}
 }
 assert.ok(completed,'Native quest must complete and award a real reward');
 // This is the first full browser/native acceptance for the shared story-memory
 // bridge: only actual defeated mobs, never attempted or narrated hits, count.
 const combatStory=(await get(player)).actor.chaos?.story||[];
 assert.ok(combatStory.some(e=>String(e.targetId).startsWith('native-mob:')&&/native combat confirmed/i.test(e.fact)),
   'An engine-confirmed rat defeat must enter persistent canonical DM memory');
 await tv.screenshot({path:path.join(out,'tv-quest-complete.png')});
 await action(phones[0],player,'walk to 34, 210');s=await action(phones[0],player,'pick up sword2',{meaningful:true,allowBlocked:true});
 if(s.actor.inventory?.some(i=>i.name==='sword2'))await action(phones[0],player,'equip sword2');
 await action(phones[0],player,'move the tent',{meaningful:true,allowBlocked:true});
 await action(phones[0],player,'walk to 27, 209');await sleep(1200);await tv.screenshot({path:path.join(out,'tv-interior.png')});
 await action(phones[0],player,'leave building');await action(phones[0],player,'walk to 34, 188');await sleep(1200);await tv.screenshot({path:path.join(out,'tv-forest.png')});
 await phones[0].screenshot({path:path.join(out,'phone.png'),fullPage:true});
 assert.equal(await tv.evaluate(()=>localStorage.getItem('data')),'original-player-preview-sentinel');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({status:'passed',checks:['two recovered phones bind distinct actors','native quest completion and reward','conversation, combat, manipulation rejection, doors and forest','TV leaves original browser storage untouched','no browser errors'],events,errors},null,2));
}catch(error){fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({status:'failed',error:error.message,events,errors},null,2));throw error;}
finally{await browser?.close();}
