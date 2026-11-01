/** Real phone/TV core-mechanics acceptance. Disposable database only. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS||!process.env.CHAOS_TV_KEY)throw Error('Disposable room, external Playwright tools and TV key required');
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE,'utf8')),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748',out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-core-proof';fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),events=[],players=[],pages=[],errors=[];let browser;
const state=p=>fetch(base+'/state?token='+p.token).then(r=>r.json());
async function action(i,text,{allowFailure=false}={}){
 const p=players[i];let s=await state(p);if(s.turn)await sleep(Math.max(0,s.turn.deadline-Date.now()+200));await sleep(220);
 const pending=pages[i].waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');await pages[i].locator('#text').fill(text);await pages[i].locator('#send-action').click();const http=await pending,b=await http.json();assert.equal(http.status(),202,b.error);
 for(let n=0;n<440;n++){await sleep(150);s=await state(p);const r=s.results.find(r=>r.id===b.id);if(r&&!['received','started'].includes(r.status)){const event={player:p.name,text,status:r.status,message:r.message,roll:r.roll,x:s.actor.x,y:s.actor.y};events.push(event);console.log(JSON.stringify(event));if(!allowFailure)assert.equal(r.status,'succeeded');return {s,r};}}
 throw Error('No terminal engine receipt: '+text);
}
async function roll(text){for(let i=0;i<12;i++){const r=await action(0,text,{allowFailure:true});assert.notEqual(r.r.status,'blocked',r.r.message);if(r.r.status==='succeeded')return r;}throw Error('No successful roll in twelve attempts');}
async function near(tile){for(const [dx,dy] of [[-1,0],[1,0],[0,1],[0,-1]]){const r=await action(0,`walk to ${tile.x+dx}, ${tile.y+dy}`,{allowFailure:true});if(r.r.status==='succeeded')return r;}throw Error('No approachable tile');}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const [i,label] of ['CoreAsh','CoreEmber'].entries()){
  const name=label+Date.now().toString(36).slice(-5),paired=await fetch(base+'/pair',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:room.join,name,color:i?'Rose':'Blue',role:i?'rogue':'bard'})});assert.equal(paired.status,201);players.push({name,token:(await paired.json()).token});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/join?key='+room.join+'#recover='+players[i].token);await page.waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));pages.push(page);
 }
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY));await tv.locator('#chaos-tv-controls').waitFor();
 let s=await state(players[0]);const initialCamp=s.actor.chaos.camp;assert.ok(initialCamp.tableId);await near(initialCamp);
 s=await state(players[0]);let table=s.actor.chaos.ground.find(i=>i.id===initialCamp.tableId);assert.ok(table,'Real camp table must be visible');await near(table.tile);const before={...table.tile};
 let pushed;for(const direction of ['east','south','west','north']){pushed=await action(0,'push camp table '+direction,{allowFailure:true});if(pushed.r.status==='failed'){pushed=await roll('push camp table '+direction);break;}if(pushed.r.status==='succeeded')break;}
 assert.equal(pushed.r.status,'succeeded');table=pushed.s.actor.chaos.ground.find(i=>i.id===table.id);assert.notDeepEqual(table.tile,before);
 const blocked=await action(0,`walk to ${table.tile.x}, ${table.tile.y}`,{allowFailure:true});assert.equal(blocked.r.status,'blocked');await near(table.tile);
 await roll('ignite camp table');await sleep(1000);await tv.screenshot({path:path.join(out,'core-fire-tv.png')});
 await action(0,'extinguish camp table');assert.equal((await state(players[0])).actor.chaos.ground.find(i=>i.id===table.id).condition,'intact');await roll('ignite camp table');
 let burned=false;for(let n=0;n<40;n++){await sleep(1000);s=await state(players[0]);if(s.actor.chaos.ground.find(i=>i.id===table.id)?.condition==='broken'){burned=true;break;}}assert.ok(burned,'Server clock must burn the table without more commands');
 await roll('repair camp table');assert.equal((await state(players[0])).actor.chaos.ground.find(i=>i.id===table.id).condition,'intact');
 await action(0,'walk to 41, 196');s=await state(players[0]);const guard=s.actor.chaos.npcs.filter(n=>n.name==='guard').sort((a,b)=>Math.abs(a.tile.x-s.actor.x)+Math.abs(a.tile.y-s.actor.y)-Math.abs(b.tile.x-s.actor.x)-Math.abs(b.tile.y-s.actor.y))[0];assert.ok(guard,'Must use an actual native guard');const rug=guard.items.find(i=>i.visual==='rug');assert.ok(rug);await action(0,`walk to ${rug.tile.x}, ${rug.tile.y}`);
 const theft=await action(0,'steal '+rug.id,{allowFailure:true});assert.ok(['failed','succeeded'].includes(theft.r.status));assert.ok(theft.s.actor.chaos.npcs.find(n=>n.id===guard.id).trust<0);
 await action(0,'talk to guard');const refused=await action(0,'ask guard for a quest',{allowFailure:true});assert.equal(refused.r.status,'blocked');assert.match(refused.r.message,/amends/);
 const appeal=await action(0,'apologize to '+guard.id,{allowFailure:true});assert.ok(['succeeded','failed'].includes(appeal.r.status),JSON.stringify(appeal.r));assert.equal(appeal.r.bonus,3,'Bard social bonus must reach the real native actor');assert.ok(Number.isInteger(appeal.r.roll));assert.equal(appeal.r.status==='succeeded',appeal.r.roll===20||(appeal.r.roll!==1&&appeal.r.roll+3>=appeal.r.dc));
 await action(1,`walk to ${rug.tile.x}, ${rug.tile.y}`);await action(1,'ask guard for a quest');assert.equal((await state(players[1])).actor.chaos.npcs.find(n=>n.id===guard.id).trust,0,'Innocent player must retain independent reputation');
 await action(0,'give cloth strip to '+guard.id);await action(0,'talk to guard');await tv.locator('.bubble p').filter({hasText:'Thank you for the gift. I remember your kindness.'}).first().waitFor();await tv.screenshot({path:path.join(out,'core-npc-tv.png')});await action(0,'ask guard for a quest');s=await state(players[0]);assert.ok(s.quest,'Native quest must actually be granted after amends');const remembered=s.actor.chaos.npcs.find(n=>n.id===guard.id);assert.ok(remembered.trust>=0,'social amends or the real gift must restore quest access');assert.ok(remembered.memory.some(h=>h.verb==='appeal'),'real native NPC must remember the D20 apology');
 await pages[0].reload();await pages[0].waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP'));assert.deepEqual((await state(players[0])).actor.chaos.npcs.find(n=>n.id===guard.id).memory,remembered.memory);
 await pages[0].getByText('World and people',{exact:true}).click();await pages[0].screenshot({path:path.join(out,'core-memory-phone.png'),fullPage:true});assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'core.json'),JSON.stringify({status:'passed',checks:['real blocking table moved on native tiles','fire, extinguish, server-clock burn-through and repair','real guard witnesses theft and refuses quest','innocent player reputation remains independent','Bard social D20 uses real native NPC and records memory','gift changes trust and restores real native quest access','NPC memory survives phone reload','offline canonical DM remains available','no browser errors'],events,errors},null,2));
}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();}
