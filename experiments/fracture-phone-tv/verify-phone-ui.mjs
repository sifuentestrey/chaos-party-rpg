/** Actual phone layout, wardrobe and native equipment rehearsal. Disposable saves only. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {itemLabel} from './phone-items.mjs';

if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE||!process.env.CHAOS_BROWSER_TOOLS)
 throw Error('Explicit disposable room and browser tools required');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE));
const base='http://localhost:4748',player=room.players[0];
const out=process.env.CHAOS_BROWSER_REPORT_DIR||'/tmp/chaos-phone-ui';
fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS,'package.json'))('playwright-core');
const errors=[],events=[];
let browser;
const state=()=>fetch(base+'/state?token='+player.token).then(r=>r.json());
async function until(fn,message){
 const deadline=Date.now()+45000;
 while(Date.now()<deadline){const result=await fn();if(result)return result;await new Promise(r=>setTimeout(r,150));}
 throw Error(message);
}
async function action(page,click){
 const response=page.waitForResponse(r=>r.url()===base+'/action'&&r.request().method()==='POST');
 await click();const r=await response,b=await r.json();assert.equal(r.status(),202,b.error);
 const result=await until(async()=>{const s=await state();return s.results.find(v=>v.id===b.id&&!['received','queued','started'].includes(v.status));},'Native action did not finish');
 events.push({status:result.status,message:result.message});
 return result;
}
try{
 assert.equal(room.phase,'playing');
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/join?key='+room.join+'#recover='+player.token);
 await page.waitForFunction(()=>document.getElementById('stats').textContent.startsWith('HP')&&document.body.classList.contains('phone-playing'));
 assert.deepEqual(await page.locator('.controller-section h2').allTextContents(),['Your Action','Abilities','Gear / Inventory']);
 assert.equal(await page.locator('#suggestions button').count(),0);
 await page.locator('#phone-dock').waitFor();
 for(const width of [320,375,390]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,'Phone must not scroll horizontally');
  await page.locator('#phone-dock a[href="#your-gear"]').click();
  assert.ok(await page.locator('#wardrobe-link').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  events.push({viewport:width,bodyHeight:await page.evaluate(()=>document.documentElement.scrollHeight)});
 }
 await page.locator('#phone-dock a[href="#your-action"]').click();
 await page.locator('#text').fill('stop');
 assert.equal(await page.locator('#phone-dock').isVisible(),false,'Hide fixed dock while typing');
 assert.equal((await action(page,()=>page.locator('#text').press('Enter'))).status,'cancelled');
 assert.equal(await page.locator('#text').inputValue(),'');
 await page.locator('#text').blur();
 await action(page,()=>page.locator('#quick-stop').click());
 await page.locator('#wardrobe-link').click();
 assert.equal(await page.locator('#phone-dock').isVisible(),false);
 await page.locator('#creator-title').getByText('Your wardrobe',{exact:true}).waitFor();
 await page.locator('#creator-cancel').click();
 await page.locator('#phone-dock').waitFor();

 // Collect an existing native weapon through the actual phone, then equip it.
 let s=await state(),item=s.actor.inventory.find(i=>/^(sword[12]|axe|morningstar)$/.test(i.name));
 if(!item){
  const target=s.actor.nearby.find(i=>i.type==='item'&&/^(sword[12]|axe|morningstar)$/.test(i.name));
  assert.ok(target,'Need a real nearby native weapon or one already in this disposable bag');
  await page.locator('#text').fill('take '+target.id);
  assert.equal((await action(page,()=>page.locator('#send-action').click())).status,'succeeded');
  s=await state();item=s.actor.inventory.find(i=>i.name===target.name);assert.ok(item,'Native pickup must put real weapon in bag');
 }
 await until(async()=>await page.locator('#bag-items .item-card[data-item="native:'+item.name+'"]').count(),'Native bag card did not render');
 await page.locator('#phone-dock a[href="#your-action"]').click();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:path.join(out,'phone-with-inventory.png'),fullPage:true});
 await page.locator('#phone-dock a[href="#your-gear"]').click();
 const card=page.locator('#bag-items .item-card[data-item="native:'+item.name+'"]');
 assert.equal((await action(page,()=>card.getByRole('button',{name:/Equip/}).click())).status,'succeeded');
 await until(async()=>(await state()).actor.weapon===item.name,'Native equipment did not change');
 await until(async()=>await page.locator('#equipped-items [data-item="weapon"] .item-name').textContent()===itemLabel(item.name),'Equipped card did not update');
 const icon=await fetch(base+'/controller/assets/item-'+item.name+'.png');assert.equal(icon.status,200);assert.equal(icon.headers.get('content-type'),'image/png');
 assert.equal((await fetch(base+'/controller/assets/unknown.png')).status,404);
 await page.locator('#phone-dock a[href="#your-action"]').click();
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(600);
 await page.screenshot({path:path.join(out,'phone-controller.png'),fullPage:true});
 await page.screenshot({path:path.join(out,'phone-viewport.png')});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'phone-ui.json'),JSON.stringify({status:'passed',events,errors},null,2));
 console.log(JSON.stringify({status:'passed',events}));
}catch(error){
 const message=error.message.replace(/https?:\/\/\S+/g,'<private test URL>');
 fs.writeFileSync(path.join(out,'phone-ui.json'),JSON.stringify({status:'failed',error:message,events,errors},null,2));
 console.error(message);process.exitCode=1;
}finally{await browser?.close();}
