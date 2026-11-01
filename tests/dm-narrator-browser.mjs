// Real host + two phone browsers with synthetic replies. No real inference/credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createGameServer} from '../server.mjs';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
const mod=await import(pathToFileURL(process.env.CHAOS_PLAYWRIGHT_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js'));
const {chromium}=mod.default||mod,dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-narrator-browser-'));
const output=path.resolve('artifacts/dm-narrator');fs.mkdirSync(output,{recursive:true});const errors=[],calls=[];
const ai=createLocalGameMaster({env:{CHAOS_AI_NARRATION:'on'},fetcher:async(url,options)=>{
  if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'qwen3:1.7b'}]}));
  const p=JSON.parse(options.body),c=JSON.parse(p.messages[1].content);calls.push(c);
  if(!c.outcome)return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({verb:'social',target:'bartender',summary:'Try to convince Marnie of the claimed relationship.'})}}]}));
  await new Promise(r=>setTimeout(r,450));
  return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({turnId:c.turnId,outcome:c.outcome.status,text:c.outcome.status==='success'?'The family resemblance is debatable. The confidence is unmistakable.':'Jinx delivers the family revelation. Marnie looks deeply unconvinced.',dialogue:[{speakerId:'bartender',line:'A moving story. The drinks still cost money.'},{speakerId:'guard',line:'Family arguments remain subject to the fire code.'}]})}}]}));
}});
const app=await createGameServer({port:0,host:'127.0.0.1',dataDir:dir,ai}),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const base='http://127.0.0.1:'+app.port,host=await browser.newPage({viewport:{width:1280,height:720}});host.on('pageerror',e=>errors.push(e.message));
  await host.goto(base+'/host');await host.locator('[data-action=createRoom]').click();await host.waitForSelector('.room-code');const code=(await host.locator('.room-code').innerText()).trim();
  const phones=[];
  for(const name of ['Jinx','Moss']){
    const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
    await p.goto(base+'/join?room='+code);await p.locator('#character-name').fill(name);await p.locator('[data-action=creatorTab][data-value=role]').click();
    await p.locator('[data-action=enter]').click();await p.waitForSelector('.player-card');phones.push(p);
  }
  await host.locator('[data-action=startStory]').click();const [jinx,moss]=phones;
  await jinx.locator('#action-text').fill('Tell Marnie I am her long-lost son, demand free drinks and threaten to burn the tavern');await jinx.locator('#action-form button').click();
  await moss.waitForSelector('[data-action=react]');
  const reaction=moss.locator('[data-action=react][data-kind=intervene]');
  if(await reaction.count())await reaction.click();else await moss.locator('[data-action=react]').first().click();
  const live=()=>app.rooms()[code];
  for(let n=0;n<40&&live().turn.ai?.status==='thinking';n++)await host.waitForTimeout(30);
  await host.locator('[data-action=settings]').click();await host.locator('[data-host=resolve]').click();
  await host.waitForSelector('.dice-result');assert.equal(live().phase,'reveal');assert.equal(live().result.story.status,'thinking');
  const world=structuredClone(live().world);await host.waitForSelector('.dm-story');await jinx.waitForSelector('.dm-story');await moss.waitForSelector('.dm-story');
  assert.deepEqual(live().world,world);assert.equal(live().result.reactions.length,1);assert.equal(calls.filter(c=>c.outcome).length,1);
  const box=await host.locator('.story-card').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=720);
  const overflow=await host.locator('.story-card').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight}));assert.ok(overflow.scroll<=overflow.client+2,JSON.stringify(overflow));
  await host.screenshot({path:path.join(output,'host.png')});
  for(const p of phones){await p.locator('.recovery code').evaluate(el=>el.textContent='••••••');}
  await jinx.screenshot({path:path.join(output,'phone.png'),fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({synthetic:true,realInference:false,errors,hostViewport:[1280,720],phoneViewport:[390,844],story:live().result.story,reactions:live().result.reactions.length,overflow},null,2));
  console.log('PASS: host and two phone browsers show post-roll narration, NPC dialogue and preserved reactions/world. Synthetic model responses only.');
}finally{await app.close();await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
