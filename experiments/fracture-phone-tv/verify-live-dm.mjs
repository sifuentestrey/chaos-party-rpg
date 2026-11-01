/** Bounded live free-Groq + existing native entrance + phone/TV proof. Disposable saves only. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||process.env.CHAOS_LIVE_DM_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS||!process.env.CHAOS_TV_KEY)throw Error('Strict live-DM verification requires CHAOS_BETA_TEST=1, CHAOS_LIVE_DM_TEST=1, a disposable room, external browser tools and a TV key');
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE,'utf8')),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-live-dm';
fs.mkdirSync(out,{recursive:true});let browser;
const player=room.players.find(p=>p.name===process.env.CHAOS_DM_TEST_PLAYER)||room.players[0];
const expectedModel=process.env.CHAOS_DM_MODEL||'openai/gpt-oss-120b';
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),state=()=>fetch(base+'/state?token='+player.token).then(r=>r.json());
const dmStatus=()=>fetch(base+'/dm/status?key='+room.host).then(r=>r.json());
async function until(fn,message){const deadline=Date.now()+45000;while(Date.now()<deadline){const result=await fn();if(result)return result;await sleep(150);}throw Error(message);}
function rejectProviderFailure(status){if(status.state==='model-missing'||status.lastError==='model')throw Error(`Configured Groq model ${status.model||expectedModel} is unavailable.`);if(['authentication','configuration','provider','timeout','invalid_reply','quota'].includes(status.lastError))throw Error(`Live Groq verification failed: ${status.lastError}.`);}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const errors=[],host=await browser.newPage();host.on('pageerror',e=>errors.push(e.message));await host.goto(base+'/host?key='+room.host);
 const initial=await until(async()=>{const s=await dmStatus();return s.state!=='checking'?s:null;},'Startup connection did not finish');
 rejectProviderFailure(initial);
 if(initial.provider!=='groq-free')throw Error('Strict live verification requires the existing Groq adapter.');
 if(!initial.available)throw Error('Groq key is unavailable in this disposable runtime. Bind GROQ_API_KEY or use the private host connection before running live verification.');
 if(initial.model!==expectedModel)throw Error(`Configured model ${initial.model||'missing'} does not match expected ${expectedModel}.`);
 if(!initial.knowledgeVersion)throw Error('Game knowledge version is missing from the live DM status.');
 if(!initial.enabled){const toggle=host.locator('#dm');if(await toggle.isHidden())throw Error('Live DM is not enabled and the always-on host has no usable toggle.');await toggle.click();}
 const connected=await until(async()=>{const s=await dmStatus();rejectProviderFailure(s);return s.enabled&&s.state==='connected'?s:null;},'Groq did not connect');
 assert.equal(connected.provider,'groq-free');assert.equal(connected.model,expectedModel);assert.equal(connected.knowledgeVersion,initial.knowledgeVersion);assert.ok(connected.lastSuccessAt,'Connection check did not produce a live timestamp');
 await host.waitForFunction(()=>document.getElementById('dm').dataset.enabled==='true');
 const preferences=JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.CHAOS_TEST_ROOM_FILE),'dm-preferences.json')));
 assert.equal(preferences.enabled,true);
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base+'/join?key='+room.join+'#recover='+player.token);await phone.waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));
 const before=await state();assert.ok(before.actor.entrances.length,'Use a disposable actor near an existing native entrance');
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));
 await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY));await tv.locator('#chaos-tv-controls').waitFor();
 if(before.turn)await sleep(Math.max(0,before.turn.deadline-Date.now()+200));
 const attempt='Would you get me indoors through the closest entrance?';
 const pending=phone.waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');await phone.locator('#text').fill(attempt);await phone.locator('#send-action').click();
 const response=await pending,body=await response.json();assert.equal(response.status(),202,body.error);
 const current=await until(async()=>{const s=await state(),r=s.results.find(r=>r.id===body.id);return r?.status==='succeeded'&&s.story?.id===body.id&&s.story.mode==='optional AI'?s:null;},'Native entry and live AI narration did not finish');
 const result=current.results.find(r=>r.id===body.id);
 assert.notEqual(current.actor.zone,before.actor.zone,'Native engine must actually change buildings');
 const final=await dmStatus(),calls=connected.quota.remaining-final.quota.remaining;assert.ok(calls>=2,'Require actual live interpretation and post-result narration');assert.equal(final.model,expectedModel);assert.equal(final.knowledgeVersion,initial.knowledgeVersion);assert.equal(final.state,'connected','Live verification must not silently fall back offline');
 await phone.waitForFunction(()=>document.getElementById('dm-story').textContent.includes('optional AI'));
 await tv.waitForFunction(()=>{const timeline=document.getElementById('chaos-story-timeline');return !!timeline&&!timeline.hidden&&!!timeline.textContent.trim();});
 await phone.screenshot({path:path.join(out,'live-dm-phone.png'),fullPage:true});await tv.screenshot({path:path.join(out,'live-dm-tv.png')});
 // Crop only the AI card: the rest of the private host page contains recovery links and QR codes.
 await host.locator('.card').filter({has:host.locator('#dm-settings')}).screenshot({path:path.join(out,'connected-host-card.png')});
 assert.deepEqual(errors,[]);
 const report={status:'passed',provider:final.provider,model:final.model,knowledgeVersion:final.knowledgeVersion,startupEnabled:initial.enabled,savedEnabled:true,liveActionRequests:calls,attempt,canonical:{status:result.status,message:result.message,from:before.actor.zone,to:current.actor.zone},story:current.story.text,checks:['saved connection validated and enabled without another setup step','unexpected phone phrasing receives live grounded interpretation','native engine enters an existing building','same confirmed action receives live AI narration','phone and TV display that narration','private host card renders without browser errors'],errors};
 fs.writeFileSync(path.join(out,'live-dm.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){
 const message=error.message.replace(/https?:\/\/\S+/g,'<private test URL>');console.error(message);process.exitCode=1;
}finally{
 await fetch(base+'/dm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:room.host,enabled:false})}).catch(()=>{});await browser?.close();
}
