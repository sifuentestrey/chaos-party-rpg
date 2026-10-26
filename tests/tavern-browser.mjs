import {pathToFileURL} from 'node:url';
import os from 'node:os';
import path from 'node:path';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'/tmp/chaos-browser/node_modules/playwright/index.mjs').href);
import assert from 'node:assert/strict';
import fs from 'node:fs';
const out=process.env.CHAOS_EVIDENCE_DIR||path.join(os.tmpdir(),'chaos-tavern-evidence');
fs.mkdirSync(out,{recursive:true});
const origin=process.env.CHAOS_TEST_ORIGIN||'http://127.0.0.1:4747';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
// Uses fresh browser profiles and creates a separate test campaign; never loads user saves.
const errors=[],audioRequests=[];const hostContext=await b.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
const h=await hostContext.newPage();h.on('response',r=>{if(r.url().includes('/audio/')&&r.status()===200)audioRequests.push(r.url().split('/').at(-1));});h.on('pageerror',e=>(errors.push(e.stack),console.log(e.stack)));await h.goto(origin+'/host');await h.locator('[data-action=createRoom]').click();await h.waitForSelector('.room-code');const code=await h.locator('.room-code').innerText();
const phones=[];
for(let i=0;i<2;i++){
 const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();p.on('pageerror',e=>(errors.push(e.stack),console.log(e.stack)));await p.goto(origin+'/join?room='+code);await p.locator('#character-name').fill(['Jinx','Sir Snacks'][i]);await p.locator('[data-action=avatar][data-key=hair][data-value="'+(i?3:2)+'"]').click();await p.locator('[data-action=creatorTab][data-value=style]').click();await p.locator('[data-action=avatar][data-key=outfit][data-value="'+(i?3:2)+'"]').click();await p.locator('[data-action=creatorTab][data-value=role]').click();await p.locator('[data-action=enter]').click();await p.waitForSelector('.player-card');phones.push(p);
}
await h.getByRole('button',{name:'Enable game sound'}).click();
await h.locator('[data-action=startStory]').click();await h.waitForTimeout(1200);await h.screenshot({path:out+'/after-host-open.png'});await phones[0].screenshot({path:out+'/after-phone-open.png',fullPage:true,mask:[phones[0].locator('.recovery')]} );
const start=Date.now();
const actions=['Suplex Captain Brick while apologizing','Cast a spell at Captain Brick','Dance on the table and sing about the crown','Ask Marnie about the crown','Inspect the chest behind the bar','Throw a spell at Captain Brick'];
for(let i=0;i<actions.length;i++){
 const p=phones[i%2],q=phones[(i+1)%2];await p.waitForSelector('#action-text',{timeout:20000});await p.locator('#action-text').fill(actions[i]);await p.locator('#action-form button').click();await q.waitForSelector('[data-action=react]');await q.locator('[data-action=react][data-kind=assist]').click();
 await h.waitForTimeout(1100);if(i===0)await h.screenshot({path:out+'/after-host-declaration.png'});
 await h.waitForFunction(()=>!!document.querySelector('.dice-result'),{timeout:20000});await h.waitForTimeout(300);if(i===0)await h.screenshot({path:out+'/after-host-impact.png'});
 await h.waitForFunction(()=>document.body.innerText.includes('ACCEPTING DECLARATIONS'),{timeout:20000});
 console.log('Round',i+1,actions[i]);
}
const remaining=90000-(Date.now()-start);if(remaining>0)await h.waitForTimeout(remaining);
assert.deepEqual(errors,[]);assert.ok(audioRequests.length>0,'licensed impact audio was served');console.log('90-second real multiplayer browser sequence; two independent 390px controllers; no browser errors. Canvas:',await h.locator('[data-scene]').boundingBox());
fs.writeFileSync(out+'/browser-results.json',JSON.stringify({code,rounds:6,controllers:2,durationMs:Date.now()-start,errors,audioRequests},null,2));
const video=h.video();await hostContext.close();await video.saveAs(out+'/tavern-90s.webm');await b.close();
