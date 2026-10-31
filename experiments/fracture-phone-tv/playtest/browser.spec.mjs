import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const {test,expect}=createRequire(path.join(process.env.CHAOS_BROWSER_TOOLS||'/tmp/chaos-browser-tools','package.json'))('@playwright/test');
if(process.env.CHAOS_BETA_TEST!=='1'||!process.env.CHAOS_TEST_ROOM_FILE)throw Error('Use explicit disposable room state only.');
const room=JSON.parse(fs.readFileSync(process.env.CHAOS_TEST_ROOM_FILE)),base=process.env.CHAOS_TEST_BRIDGE||'http://localhost:4748';
const state=async()=>await(await fetch(base+'/state?token='+room.players[0].token)).json();
const post=async(url,data)=>{const r=await fetch(base+url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error((await r.json()).error||'Controller request failed');return r.json();};
let heartbeat;
test.beforeAll(async()=>{
 heartbeat=setInterval(()=>{for(const p of room.players.slice(0,6))void fetch(base+'/state?token='+p.token).catch(()=>{});},5000);heartbeat.unref();
 let s;for(let i=0;i<100;i++){const ss=await Promise.all(room.players.slice(0,6).map(p=>fetch(base+'/state?token='+p.token).then(r=>r.json())));s=ss[0];if(ss.every(v=>v.actor?.ready)&&['exploration','planning'].includes(s.pacing.phase))break;await new Promise(r=>setTimeout(r,150));}
 if(s.pacing.phase==='exploration')await post('/host/pacing',{key:room.host,command:'attention'});
 s=await state();for(let i=0;i<4;i++)await post('/host/pacing',{key:room.host,command:'extend',instanceId:s.pacing.instanceId,roundId:s.pacing.roundId});
});
test.afterAll(async()=>{
 clearInterval(heartbeat);
 const s=await state();if(s.pacing.phase==='planning')for(const p of room.players.slice(0,6)){const own=await(await fetch(base+'/state?token='+p.token)).json();if(own.pacing.phase==='planning'&&own.pacing.eligible)await post('/pacing',{token:p.token,command:'ready',instanceId:own.pacing.instanceId,roundId:own.pacing.roundId,ready:true});}
});

async function recover(page){await page.goto(base+'/join?key='+room.join+'#recover='+room.players[0].token);await page.waitForFunction(()=>document.body.classList.contains('phone-playing'));await expect(page.locator('#character-name')).toHaveText(room.players[0].name);await page.waitForTimeout(1000);}
const report=(info,name,value)=>fs.writeFileSync(info.outputPath(name),JSON.stringify(value,null,2));

test('phone touch layout and inventory remain usable at common widths',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await recover(page);const sizes=[];
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});await page.locator('#phone-dock a[href="#your-gear"]').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  const button=page.locator('#bag-items button').last();await expect(button).toBeVisible();await button.evaluate(e=>e.scrollIntoView({block:'center'}));
  const hit=await button.evaluate(e=>{const r=e.getBoundingClientRect(),d=document.querySelector('#phone-dock').getBoundingClientRect();return {uncovered:r.bottom<=d.top-4&&e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)),height:r.height};});
  expect(hit.uncovered).toBe(true);expect(hit.height).toBeGreaterThanOrEqual(44);sizes.push({width,inventoryButtonUncovered:true});
 }
 await page.locator('#phone-dock a[href="#your-action"]').click();await page.locator('#text').focus();await expect(page.locator('#phone-dock')).toBeHidden();await page.locator('#text').fill('I take a moment to look around.');
 await page.setViewportSize({width:390,height:430});await page.locator('#send-action').scrollIntoViewIfNeeded();await expect(page.locator('#send-action')).toBeInViewport();
 await page.locator('#text').fill('');await page.locator('#text').blur();await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:info.outputPath('phone-controller.png'),fullPage:true});
 await expect(page).toHaveScreenshot('phone-controller.png',{animations:'disabled',mask:[page.locator('#controller-avatar'),page.locator('#health-value'),page.locator('#health-meter'),page.locator('#ability-use'),page.locator('#log'),page.locator('#dm-story'),page.locator('#pacing-panel')],maskColor:'#1b292c',maxDiffPixelRatio:.012});
 expect(errors).toEqual([]);report(info,'phone.json',{status:'passed',sizes,compactViewportSubmitVisible:true,errors});
});

test('wardrobe uses real previews and cancel preserves the recovered appearance',async({page},info)=>{
 await recover(page);const before=(await state()).appearance;await page.locator('#wardrobe-link').click();await expect(page.locator('#phone-dock')).toBeHidden();
 const height=()=>page.locator('#character-preview').evaluate(canvas=>{const {data,width,height}=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);let min=height,max=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>0){min=Math.min(min,y);max=Math.max(max,y);}return max-min+1;});
 await page.locator('#body').selectOption('ogre');await page.waitForTimeout(900);const ogre=await height();
 await page.locator('#body').selectOption('fairy');await page.waitForTimeout(900);const fairy=await height();expect(ogre).toBeGreaterThan(fairy);
 await page.screenshot({path:info.outputPath('fairy-wardrobe.png'),fullPage:true});await page.locator('#creator-cancel').click();await expect(page.locator('#your-action')).toBeVisible();expect((await state()).appearance).toEqual(before);
 report(info,'wardrobe.json',{status:'passed',nativePreviewHeights:{ogre,fairy},cancelPreservedAppearance:true});
});

test('fresh player can preview existing heritage and outfit options before joining',async({page},info)=>{
 await page.setViewportSize({width:375,height:812});await page.goto(base+'/join?key='+room.join);await expect(page.locator('#pair')).toBeVisible();
 expect(await page.locator('#body option').count()).toBe(6);expect(await page.locator('#outfit option').count()).toBe(8);
 await page.locator('#body').selectOption('elf');await page.locator('#outfit').selectOption('dress');await page.waitForTimeout(1000);await page.screenshot({path:info.outputPath('creator.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(375);report(info,'creator.json',{status:'passed',heritages:6,verifiedOutfits:8,newPlayerNotSubmitted:true});
});

test('shared TV has readable framing at 1080p and a stable camera on resize',async({page,browser},info)=>{
 const errors=[],network=[];await recover(page);const tv=await browser.newPage({viewport:{width:1920,height:1080}});
 tv.on('pageerror',e=>errors.push(e.message));tv.on('console',m=>{if(m.type()==='error')errors.push(m.text());});tv.on('response',r=>{if(r.status()>=400)network.push({path:new URL(r.url()).pathname,status:r.status()});});tv.on('requestfailed',r=>network.push({path:new URL(r.url()).pathname,error:r.failure()?.errorText}));
 await tv.addInitScript(()=>{window.__missingEntityStacks=[];const error=console.error.bind(console);console.error=(...args)=>{if(String(args[0]).startsWith('Unknown entity id'))window.__missingEntityStacks.push({message:args.join(' '),stack:new Error().stack});error(...args);};window.__spriteReadErrors=[];const read=CanvasRenderingContext2D.prototype.getImageData;CanvasRenderingContext2D.prototype.getImageData=function(...args){try{return read.apply(this,args);}catch(e){window.__spriteReadErrors.push({name:e.name,message:e.message,width:this.canvas.width,height:this.canvas.height});throw e;}};});
 await tv.goto('http://localhost:8000/?chaosTV='+encodeURIComponent(base)+'&tvKey='+encodeURIComponent(process.env.CHAOS_TV_KEY||'local-test-tv-key'));await tv.locator('#chaos-tv-controls').waitFor();await tv.waitForTimeout(1000);
 const bundle=await tv.locator('script[src*="main.js"]').getAttribute('src');expect(bundle).toContain('chaosBuild=');
 const camera=()=>tv.locator('#chaos-tv-controls').evaluate(e=>e.cameraState);const first=await camera();expect(first.mode).toBe('group');expect(first.owned).toBe(true);
 const frames=await tv.evaluate(()=>new Promise(resolve=>{const gaps=[];let last=performance.now();function sample(now){gaps.push(now-last);last=now;if(gaps.length<120)requestAnimationFrame(sample);else resolve(gaps.slice(1).sort((a,b)=>a-b));}requestAnimationFrame(sample);}));
 await tv.screenshot({path:info.outputPath('tv-1080p.png')});await tv.setViewportSize({width:1280,height:720});await tv.waitForTimeout(700);const resized=await camera();expect(resized.mode).toBe('group');expect(resized.owned).toBe(true);expect(resized.x).toBe(first.x);expect(resized.y).toBe(first.y);
 await tv.screenshot({path:info.outputPath('tv-720p.png')});report(info,'sprite-diagnostics.json',await tv.evaluate(()=>window.__spriteReadErrors));report(info,'entity-diagnostics.json',await tv.evaluate(()=>window.__missingEntityStacks));expect(errors).toEqual([]);expect(network).toEqual([]);report(info,'tv.json',{status:'passed',cacheBustedBundle:true,camera:first,resized,frameSample:{medianMs:frames[59],p95Ms:frames[113],samples:frames.length,scope:'headless cloud rendering during shared planning, no hardware performance claim'},errors,network});await tv.close();
});
