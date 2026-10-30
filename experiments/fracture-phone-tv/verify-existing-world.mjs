/** Two real phone forms and the native TV; existing artwork only. Disposable room required. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS||!process.env.CHAOS_TV_KEY)throw Error('Explicit disposable room, browser tools and TV key required');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE)),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-existing-world';fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const players=[],phones=[],events=[],errors=[],frames=[];let browser,tv,cdp,lastFrame=0;
const post=(url,body)=>fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const state=i=>fetch(base+'/state?token='+players[i].token).then(r=>r.json());
const report=(status,error)=>fs.writeFileSync(path.join(out,'existing-world.json'),JSON.stringify({status,error,events,errors},null,2));
async function action(i,text,{allowBlocked=false}={}){
 let s=await state(i);if(s.turn)await sleep(Math.max(0,s.turn.deadline-Date.now()+250));await sleep(220);
 const pending=phones[i].waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');await phones[i].locator('#text').fill(text);await phones[i].locator('#form button').click();const r=await pending,b=await r.json();assert.equal(r.status(),202,b.error||text);
 const deadline=Date.now()+65000;
 while(Date.now()<deadline){await sleep(200);s=await state(i);const result=s.results.find(r=>r.id===b.id);if(result&&!['started','received','queued'].includes(result.status)){
  const e={player:players[i].name,text,status:result.status,message:result.message,roll:result.roll,dc:result.dc,rolls:result.rolls,object:result.object,x:s.actor.x,y:s.actor.y};events.push(e);report('running');console.log(JSON.stringify(e));if(!allowBlocked)assert.ok(['succeeded','failed'].includes(result.status),result.message);return {s,r:result};
 }}throw Error('Timed out: '+text);
}
async function success(i,text){for(let n=0;n<10;n++){const r=await action(i,text);if(r.r.status==='succeeded')return r;}throw Error('Ten real failed checks: '+text);}
async function shot(name){await sleep(1200);await tv.screenshot({path:path.join(out,name+'.png')});}
try{
 const readyBy=Date.now()+20000;let ready=false;
 while(Date.now()<readyBy){try{ready=(await fetch(base+'/health')).ok;}catch{}if(ready)break;await sleep(250);}assert.ok(ready,'Disposable bridge did not start');
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const [i,name] of ['Ash','Bram'].entries()){
  let p=room.players.find(p=>p.name===name);if(!p){const r=await post('/pair',{key:room.join,name,color:i?'Rose':'Blue',role:i?'healer':'knight',perk:'lucky'});assert.equal(r.status,201);p=await r.json();p.name=name;}players.push(p);
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/join?key='+room.join+'#recover='+p.token);await phone.waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));phones.push(phone);
 }
 assert.notEqual((await state(0)).actor.id,(await state(1)).actor.id);
 tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY));await tv.locator('#chaos-tv-controls').waitFor();await tv.getByRole('combobox',{name:'Follow player'}).selectOption(String((await state(0)).actor.id));
 if(process.env.CHAOS_RECORD_VIDEO==='1'){
  fs.mkdirSync(path.join(out,'frames'),{recursive:true});cdp=await tv.context().newCDPSession(tv);cdp.on('Page.screencastFrame',async e=>{try{if(e.metadata.timestamp-lastFrame>=0.099){const file=String(frames.length).padStart(6,'0')+'.jpg';fs.writeFileSync(path.join(out,'frames',file),Buffer.from(e.data,'base64'));frames.push({file,at:e.metadata.timestamp});lastFrame=e.metadata.timestamp;}await cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId});}catch{}});await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1280,maxHeight:720,everyNthFrame:2});
 }
 await success(0,'walk to 10, 234');await success(1,'walk to 9, 234');await shot('native-tent-before');
 if(process.env.CHAOS_LIVE_DM_TEST==='1'){
  const tested=await(await post('/dm/test',{key:room.host})).json();assert.ok(tested.ok,JSON.stringify(tested.status));await post('/dm',{key:room.host,enabled:true});
  const ai=await action(0,'Could you shove the canvas shelter a little farther to the right for me?');assert.ok(Number.isInteger(ai.r.roll),'Live interpretation must reach an actual native D20 action');
  const deadline=Date.now()+12000;let current;do{await sleep(250);current=await state(0);if(current.story?.id===ai.r.id&&current.story.mode==='optional AI')break;}while(Date.now()<deadline);
  assert.equal(current.story?.mode,'optional AI');assert.equal(current.story.id,ai.r.id);events.push({liveDM:true,canonical:ai.r.message,narration:current.story.text});await post('/dm',{key:room.host,enabled:false});
  if(ai.r.status==='failed')await success(0,'push tent east');
 }else await success(0,'push tent east');
 await shot('native-tent-after');
 await success(0,'ignite tent');await shot('native-tent-burning');await success(0,'extinguish tent');
 await success(0,'walk to 11, 235');if((await state(0)).actor.chaos.scenery.some(o=>o.kind==='fire'&&o.condition==='burning'))await success(0,'extinguish campfire');await shot('native-campfire-out');
 await success(0,'walk to 11, 220');await shot('native-roof-before');await success(0,'break house roof');await shot('native-roof-after');await success(0,'repair house roof');await shot('native-roof-repaired');
 await success(0,'walk to 35, 236');await success(1,'walk to 34, 236');await shot('native-boulder-before');
 const immunity=await action(0,'ignite boulder',{allowBlocked:true});assert.equal(immunity.r.status,'blocked');
 await success(1,'walk to Ash');await success(1,'help Ash');await success(0,'push boulder east');await shot('native-boulder-after');
 const saved=JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.CHAOS_TEST_ROOM_FILE),'objects.json')));assert.equal(Object.keys(saved.items).length,0,'No synthetic props or new loot');assert.ok(Object.values(saved.scenery).every(o=>o.nativeOrigin),'Every scenery record comes from existing map art');assert.deepEqual(errors,[]);await phones[0].screenshot({path:path.join(out,'native-phone.png'),fullPage:true});report('passed');
}catch(error){const message=error.message.replace(/https?:\/\/\S+/g,'<private test URL>');report('failed',message);console.error(message);process.exitCode=1;}
finally{
 await post('/dm',{key:room.host,enabled:false}).catch(()=>{});if(cdp)await cdp.send('Page.stopScreencast').catch(()=>{});
 if(frames.length){let list='';for(let n=0;n<frames.length;n++)list+="file 'frames/"+frames[n].file+"'\nduration "+(n+1<frames.length?Math.max(.02,frames[n+1].at-frames[n].at):.5)+'\n';fs.writeFileSync(path.join(out,'recording.ffconcat'),list);fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(frames));}await browser?.close();
}
