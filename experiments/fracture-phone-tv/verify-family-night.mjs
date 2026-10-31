/** Real family-night rehearsal. Requires a separate disposable native world.
 * Phone forms drive actions; a timestamped CDP recording captures the native TV.
 */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS)throw Error('Explicit disposable native room and external browser tools required');
const root=path.dirname(process.env.CHAOS_TEST_ROOM_FILE),room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE,'utf8'));
const base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-family-night';fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),players=[],phones=[],events=[],errors=[],frames=[];let browser,tv,cdp,lastFrame=0;
const get=i=>fetch(base+'/state?token='+players[i].token).then(r=>r.json());
function report(status,error){fs.writeFileSync(path.join(out,'family-night.json'),JSON.stringify({status,error,events,errors},null,2));}
async function action(i,text,{blocked=false}={}){
 let s=await get(i);if(s.turn)await sleep(Math.max(0,s.turn.deadline-Date.now()+250));await sleep(200);
 const pending=phones[i].waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');
 await phones[i].locator('#text').fill(text);await phones[i].locator('#form button').click();const response=await pending,ack=await response.json();assert.equal(response.status(),202,ack.error||text);
 const until=Date.now()+65000;
 while(Date.now()<until){await sleep(150);s=await get(i);const r=s.results.find(r=>r.id===ack.id);if(r&&!['received','started','queued'].includes(r.status)){
  const event={player:players[i].name,text,status:r.status,message:r.message,roll:r.roll,rolls:r.rolls,combat:r.combat,object:r.object,x:s.actor.x,y:s.actor.y,zone:s.actor.zone,adventure:s.adventure?.status};events.push(event);report('running');console.log(JSON.stringify(event));
  if(!blocked)assert.ok(['succeeded','failed'].includes(r.status),r.message);return {s,r};
 }}throw Error('Native action timed out: '+text);
}
async function success(i,text){for(let n=0;n<12;n++){const result=await action(i,text);if(result.r.status==='succeeded')return result;}throw Error('Twelve actual failed rolls: '+text);}
async function until(predicate,timeout=25000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const states=await Promise.all(players.map((_,i)=>get(i)));if(predicate(states))return states;await sleep(300);}throw Error('World transition timed out');}
async function shot(name){await sleep(1000);await tv.screenshot({path:path.join(out,name+'.png')});}
async function vote(kind,lead=0){const key=kind==='fight'?'trial-fight':kind==='woods'?'travel-woods':'travel-refuge';const yes=kind==='fight'?'trial-yes':'rally-yes';await phones[lead].locator('#'+key).evaluate(el=>el.closest('details').open=true);await phones[lead].locator('#'+key).click();await phones[1-lead].locator('#'+yes).evaluate(el=>el.closest('details').open=true);await phones[1-lead].locator('#'+yes).waitFor({state:'visible'});await phones[1-lead].locator('#'+yes).click();}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const [i,label] of ['Ash','Bram'].entries()){
  let p=room.players.find(p=>p.name===label);
  if(!p){const response=await fetch(base+'/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:room.join,name:label,color:i?'Rose':'Blue',role:i?'rogue':'bard'})});assert.equal(response.status,201);p=await response.json();p.name=label;}
  players.push(p);const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/join?key='+room.join+'#recover='+p.token);await phone.waitForFunction(()=>document.querySelector('#stats').textContent.startsWith('HP'));phones.push(phone);
 }
 assert.notEqual((await get(0)).actor.id,(await get(1)).actor.id);
 tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY));await tv.locator('#chaos-tv-controls').waitFor();await sleep(1200);await tv.locator('#chaos-camera-options').evaluate(e=>e.open=true);await tv.getByRole('combobox',{name:'Camera mode'}).selectOption('follow');await tv.getByRole('combobox',{name:'Follow player'}).selectOption(String((await get(0)).actor.id));
 if(process.env.CHAOS_RECORD_VIDEO==='1'){
  const dir=path.join(out,'frames');fs.mkdirSync(dir,{recursive:true});cdp=await tv.context().newCDPSession(tv);
  cdp.on('Page.screencastFrame',async event=>{try{const at=event.metadata.timestamp;if(at-lastFrame>=0.099){const file=String(frames.length).padStart(6,'0')+'.jpg';fs.writeFileSync(path.join(dir,file),Buffer.from(event.data,'base64'));frames.push({file,at});lastFrame=at;}await cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId});}catch{}});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:1280,maxHeight:720,everyNthFrame:2});
 }
 // Start a real, optional room adventure through the actual private host page.
 const host=await browser.newPage();await host.goto(base+'/host?key='+room.host);await host.locator('#adventure-start').click();await host.close();
 await success(0,'walk to 41, 196');await success(1,'walk to 42, 196');await success(0,'talk to guard');await success(0,'ask guard for a quest');
 await vote('fight');await until(s=>s[0].adventure?.choice==='combat');await shot('family-start');
 // A different real outcome cannot silently satisfy the party's chosen fight.
 await success(0,'help Bram');await success(1,'make green hat from cloth strip and wood splinter');await success(1,'equip green hat');assert.equal((await get(0)).adventure.steps[1].done,false);
 // Set a dropped ingredient alight near the real guard's own rug.
 let s=(await get(0)),guard=s.actor.chaos.npcs.find(n=>n.tile.x===41&&n.tile.y===195),rug=guard.items.find(i=>i.visual==='rug'&&i.tile);assert.ok(rug);
 await success(0,'walk to 41, 197');await success(0,'drop cloth strip');const fuel=(await get(0)).actor.chaos.ground.find(i=>i.name==='cloth strip'&&i.tile.x===41&&i.tile.y===197);assert.ok(fuel);await success(0,'ignite '+fuel.id);
 await until(states=>states[0].actor.chaos.ground.find(i=>i.id===rug.id)?.condition==='burning');
 await success(1,'talk to '+guard.id);await shot('family-fire-alarm');
 await until(states=>states[0].actor.chaos.ground.find(i=>i.id===rug.id)?.condition==='intact');
 const saved=JSON.parse(fs.readFileSync(path.join(root,'objects.json')));assert.ok(saved.npcs[guard.id].history.some(h=>h.verb==='extinguish'&&h.actorId===guard.id));
 // A native map tree: the untouched original canopy is present before we act.
 await success(0,'walk to 29, 198');await success(1,'walk to 28, 198');s=await get(0);const tree=s.actor.chaos.scenery.find(o=>o.nativeOrigin&&o.tile.x===30&&o.tile.y===197&&o.condition==='intact');assert.ok(tree,'Native map tree must be recognized, not spawned as an overlay');await shot('family-native-tree-before');
 for(let n=0;n<4;n++){const hit=await success(0,'chop '+tree.id);assert.equal(hit.r.object.after,9-n*3);}
 await until(states=>states.every(s=>s.actor.chaos.nativeChanges.includes(tree.id.split(':').at(-1))));await shot('family-native-tree-after');
 await success(0,`walk to ${tree.tile.x}, ${tree.tile.y}`);await success(1,`walk to ${tree.tile.x+1}, ${tree.tile.y}`);
 assert.equal((await get(0)).actor.x,tree.tile.x);assert.equal((await get(1)).actor.x,tree.tile.x+1);
 assert.ok((await get(0)).actor.chaos.bag.some(i=>i.name==='wood offcut'));
 // A real gift makes amends for the witnessed fire before asking for another job.
 await success(0,'walk to 41, 196');await success(1,'walk to 42, 196');await success(0,'give wood splinter to '+guard.id);await success(0,'talk to '+guard.id);
 // Native combat: choose only an actual nearby, living rat.
 await success(0,'walk to 34, 210');await success(1,'walk to 35, 210');s=await get(0);const rat=s.actor.nearby.filter(e=>e.type==='mob'&&e.name==='rat'&&e.hp>0).sort((a,b)=>Math.abs(a.x-s.actor.x)+Math.abs(a.y-s.actor.y)-Math.abs(b.x-s.actor.x)-Math.abs(b.y-s.actor.y))[0];assert.ok(rat,'No fabricated enemy');await success(0,'attack '+rat.id);assert.equal((await get(0)).adventure.steps[1].done,true);await shot('family-combat');
 await success(0,'walk to 34, 210');await success(1,'walk to 35, 210');await vote('woods');await until(states=>states.every(s=>s.actor.zone==='Glitch Woods'),65000);await shot('family-woods');
 await vote('refuge');await until(states=>states.every(s=>s.actor.zone==='The Refuge'),65000);await until(states=>states[0].adventure.status==='completed');await until(states=>states.every(s=>s.actor.x===34&&s.actor.y===210),65000);await shot('family-completed');
 assert.deepEqual(errors,[]);report('passed');
}catch(error){report('failed',error.message);console.error(error);process.exitCode=1;}
finally{
 if(cdp)await cdp.send('Page.stopScreencast').catch(()=>{});
 if(frames.length){let list='';for(let n=0;n<frames.length;n++){list+="file 'frames/"+frames[n].file+"'\n";list+='duration '+(n+1<frames.length?Math.max(0.02,frames[n+1].at-frames[n].at):0.5)+'\n';}fs.writeFileSync(path.join(out,'recording.ffconcat'),list);fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(frames));}
 await browser?.close();
}
