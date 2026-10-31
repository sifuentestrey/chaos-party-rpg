/** Real phone forms + native engine + TV. Only an explicitly disposable room. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS||!process.env.CHAOS_TV_KEY)throw Error('Explicit disposable room, browser tools and TV key required');
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE,'utf8')),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748';
const players=room.players.slice(-2),out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-reactive-proof';fs.mkdirSync(out,{recursive:true});
assert.equal(players.length,2,'Recover two existing disposable actors; never manufacture their state');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),events=[],errors=[],phones=[];
const get=i=>fetch(base+'/state?token='+players[i].token).then(r=>r.json());
let browser;
async function action(i,text,{allowBlocked=false}={}){
 let state=await get(i);if(state.turn)await sleep(Math.max(0,state.turn.deadline-Date.now()+250));await sleep(250);
 const pending=phones[i].waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');
 await phones[i].locator('#text').fill(text);await phones[i].locator('#send-action').click();const response=await pending,ack=await response.json();assert.equal(response.status(),202,ack.error||text);
 const until=Date.now()+65000;
 while(Date.now()<until){await sleep(150);state=await get(i);const result=state.results.find(r=>r.id===ack.id);
  if(result&&!['received','started'].includes(result.status)){
   const event={text,player:players[i].name,status:result.status,message:result.message,roll:result.roll,x:state.actor.x,y:state.actor.y};events.push(event);console.log(JSON.stringify(event));
   if(!allowBlocked)assert.ok(['succeeded','failed'].includes(result.status),result.message);
   return {result,state};
  }
 }throw Error('No native result: '+text);
}
async function succeed(i,text){for(let n=0;n<12;n++){const value=await action(i,text);if(value.result.status==='succeeded')return value;}throw Error('Twelve real D20 failures: '+text);}
async function waitFor(predicate,ms=20000){const until=Date.now()+ms;while(Date.now()<until){const s=await get(0);if(predicate(s))return s;await sleep(400);}throw Error('World transition timed out');}
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const p of players){const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),phone=await context.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base+'/join?key='+room.join+'#recover='+p.token);await phone.waitForFunction(()=>document.querySelector('#stats').textContent.startsWith('HP'));phones.push(phone);}
 const initial=await get(0);assert.notEqual(initial.actor.id,(await get(1)).actor.id);
 await action(0,`walk to ${initial.actor.chaos.camp.x}, ${initial.actor.chaos.camp.y}`);
 const tree=(await get(0)).actor.chaos.scenery.find(o=>o.kind==='tree'&&o.condition==='intact');assert.ok(tree,'Requires one intact authored tree in disposable world');
 let near;
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const tile={x:tree.tile.x+dx,y:tree.tile.y+dy};const move=await action(0,`walk to ${tile.x}, ${tile.y}`,{allowBlocked:true});if(move.result.status==='succeeded'){near=tile;break;}}
 assert.ok(near,'Tree must have an approachable native tile');await action(1,`walk to ${near.x}, ${near.y}`);
 const tv=await browser.newPage({viewport:{width:1280,height:720}});tv.on('pageerror',e=>errors.push(e.message));await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+process.env.CHAOS_TV_KEY);await tv.locator('#chaos-tv-controls').waitFor();
 await tv.locator('#chaos-camera-options').evaluate(e=>e.open=true);await tv.getByRole('combobox',{name:'Camera mode'}).selectOption('follow');await tv.getByRole('combobox',{name:'Follow player'}).selectOption(String((await get(0)).actor.id));
 const intact=await action(0,`walk to ${tree.tile.x}, ${tree.tile.y}`,{allowBlocked:true});assert.equal(intact.result.status,'blocked','Standing tree blocks real native movement');
 const fixed=await action(0,'push camp tree east',{allowBlocked:true});assert.equal(fixed.result.status,'blocked');assert.match(fixed.result.message,/fixed/);
 const starting=(await get(0)).actor.chaos;
 const material=starting.bag.find(i=>i.material==='wood')||starting.ground.find(i=>i.material==='wood'&&i.name==='wood splinter');assert.ok(material,'Use a real carried combustible object');
 if(starting.bag.some(i=>i.id===material.id))await succeed(0,'drop '+material.id);
 if(material.condition==='broken')await succeed(0,'repair '+material.id);
 await succeed(0,'ignite '+material.id);
 let s=await waitFor(s=>s.actor.chaos.scenery.find(o=>o.id===tree.id)?.condition==='burning');
 await phones[1].waitForFunction(id=>document.querySelector('#world').textContent.includes(id+'] · burning'),tree.id);
 await sleep(1200);await tv.screenshot({path:path.join(out,'reactive-tree-fire-tv.png')});
 events.push({check:'ground fire spreads to tree and second phone updates',hp:s.actor.chaos.scenery.find(o=>o.id===tree.id).hp});
 // Separate players can put out adjacent sources together before they relight each other.
 await Promise.all([succeed(0,'extinguish '+material.id),succeed(1,'put out camp tree')]);
 const rescued=(await get(0)).actor.chaos.scenery.find(o=>o.id===tree.id);assert.equal(rescued.condition,'intact');
 await sleep(11500);assert.equal((await get(0)).actor.chaos.scenery.find(o=>o.id===tree.id).hp,rescued.hp,'Dousing halts damage without resetting HP');
 await succeed(0,'ignite '+tree.id);
 s=await waitFor(s=>s.actor.chaos.scenery.find(o=>o.id===tree.id)?.condition==='broken',140000);
 await phones[1].waitForFunction(id=>document.querySelector('#world').textContent.includes(id+'] · broken · HP 0'),tree.id);
 await phones[1].getByText('World and people',{exact:true}).click();await phones[1].screenshot({path:path.join(out,'reactive-second-phone.png'),fullPage:true});
 await sleep(1200);await tv.screenshot({path:path.join(out,'reactive-tree-stump-tv.png')});
 const walk=await action(0,`walk to ${tree.tile.x}, ${tree.tile.y}`);assert.equal(walk.result.status,'succeeded');assert.deepEqual([walk.state.actor.x,walk.state.actor.y],[tree.tile.x,tree.tile.y]);
 const saved=JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.CHAOS_TEST_ROOM_FILE),'objects.json'),'utf8'));
 assert.equal(saved.scenery[tree.id].condition,'broken');assert.equal(saved.scenery[tree.id].hp,0);
 // A different real native guard retains its own floor rug after the core theft test.
 await action(0,'walk to 47, 197');await action(1,'walk to 47, 197');
 let view=(await get(1)).actor.chaos;
 const owner=view.npcs.find(n=>n.tile.x===47&&n.tile.y===195),rug=owner?.items.find(i=>i.visual==='rug'&&i.tile&&i.condition==='intact');
 assert.ok(rug,'Use real visible native NPC property, never fabricate one');
 const fuel=view.bag.find(i=>i.material==='cloth'&&i.condition==='intact');assert.ok(fuel);
 await succeed(1,'drop '+fuel.id);await succeed(1,'ignite '+fuel.id);
 await waitFor(s=>s.actor.chaos.ground.find(i=>i.id===rug.id)?.condition==='burning');
 const alarm=await action(0,'talk to '+owner.id);assert.match(alarm.result.message,/on fire.*extinguish/i);
 await tv.getByRole('combobox',{name:'Follow player'}).selectOption(String((await get(0)).actor.id));
 await tv.locator('.bubble p').filter({hasText:'on fire! Please extinguish it.'}).first().waitFor();
 await tv.screenshot({path:path.join(out,'reactive-npc-alarm-tv.png')});
 await waitFor(s=>s.actor.chaos.ground.find(i=>i.id===rug.id)?.condition==='intact',25000);
 const afterNpc=JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.CHAOS_TEST_ROOM_FILE),'objects.json'),'utf8'));
 assert.ok(afterNpc.npcs[owner.id].history.some(h=>h.verb==='extinguish'&&h.actorId===owner.id&&h.itemId===rug.id),'Present native NPC must actually extinguish its own property');
 assert.equal(afterNpc.items[rug.id].ownerId,owner.id);
 events.push({check:'real native NPC fire alarm and autonomous extinguish',owner:owner.name,itemId:rug.id,condition:afterNpc.items[rug.id].condition});
 // Return both observers to the persisted stump for reconnect/restart checks.
 await action(0,`walk to ${tree.tile.x}, ${tree.tile.y}`);await action(1,`walk to ${near.x}, ${near.y}`);
 await phones[1].reload();await phones[1].waitForFunction(()=>document.querySelector('#stats').textContent.startsWith('HP'));assert.equal((await get(1)).actor.chaos.scenery.find(o=>o.id===tree.id).condition,'broken');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'reactive.json'),JSON.stringify({status:'passed',checks:['two distinct native actors recovered','standing tree blocks native path','rooted tree push truthfully blocked','real ground item fire spreads to tree','second phone updates without actions','player dousing halts saved tree HP damage','direct ignition uses original D20','server clock burns tree to zero with no further player commands','stump rendered on TV','native actor walks through cleared tile','tree HP and collision state persisted','second phone reload agrees','native NPC warns about actual property fire','present native NPC autonomously extinguishes owned rug','NPC owner and fire response history persist','no browser errors'],tree:{id:tree.id,tile:tree.tile,condition:'broken',hp:0},events,errors},null,2));
}catch(error){fs.writeFileSync(path.join(out,'reactive-failed.json'),JSON.stringify({status:'failed',message:error.message,events,errors},null,2));console.error(error);process.exitCode=1;}finally{await browser?.close();}
