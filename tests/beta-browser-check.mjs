// Real local server + browser controllers. No production campaigns are opened.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createGameServer} from '../server.mjs';
import {skipBrowserTimer} from './browser-timers.mjs';
const modulePath=process.env.CHAOS_PLAYWRIGHT_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js';
const playwright=await import(pathToFileURL(modulePath));const {chromium}=playwright.default||playwright;
const output=path.resolve(process.env.CHAOS_QA_OUTPUT||'artifacts/beta');fs.mkdirSync(output,{recursive:true});
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-beta-browser-'));
const app=await createGameServer({port:0,host:'127.0.0.1',dataDir});
const browser=await chromium.launch({executablePath:process.env.CHAOS_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],rounds=[];
try{
  const base=`http://127.0.0.1:${app.port}`;
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:output,size:{width:1280,height:720}}});
  const host=await context.newPage();host.on('pageerror',e=>errors.push(e.message));
  await host.goto(base+'/host');await host.locator('#reaction-length').selectOption('8000');await host.locator('[data-action=createRoom]').click();await host.waitForSelector('.room-code');
  const code=(await host.locator('.room-code').innerText()).trim(),phones=[];
  for(const [i,name] of ['Jinx','Moss'].entries()){
    const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/join?room='+code);
    await p.locator('#character-name').fill(name);await p.locator('[data-action=creatorTab][data-value=style]').click();await p.locator(`[data-action=avatar][data-key=outfit][data-value="${i+1}"]`).click();
    await p.locator('[data-action=creatorTab][data-value=role]').click();await p.locator('[data-action=role][data-value=knight]').click();await p.locator('[data-action=enter]').click();await p.waitForSelector('.player-card');phones.push(p);
  }
  await host.locator('[data-action=startStory]').click();await host.screenshot({path:path.join(output,'01-tavern.png')});
  let turn=0;
  const skip=()=>skipBrowserTimer(host,()=>app.rooms()[code]);
  const waitForState=async predicate=>{
    const end=Date.now()+15000;
    while(!predicate()){
      if(Date.now()>end)throw Error('The browser action did not reach its expected server phase.');
      await new Promise(resolve=>setTimeout(resolve,25));
    }
  };
  const action=async(text,fast=false)=>{
    const p=phones[turn%2],other=phones[(turn+1)%2],room=app.rooms()[code];
    if(room.players[turn%2].hp<=2)text='Rest and heal';
    await p.waitForSelector('#action-text',{timeout:20000});await p.locator('#action-text').fill(text);await p.locator('#action-form button').click();
    await waitForState(()=>app.rooms()[code].phase==='react'&&app.rooms()[code].turn.action===text);
    await other.waitForSelector('[data-action=react]');await other.locator('[data-action=react][data-kind=assist]').click();
    if(turn===1){await host.waitForTimeout(950);await host.screenshot({path:path.join(output,'02-approach.png')});}
    if(fast)await skip();
    try{await host.waitForSelector('.dice-result',{timeout:15000});}
    catch(error){const state=app.rooms()[code];console.error(JSON.stringify({requested:text,phase:state.phase,paused:state.paused,lastAction:state.result?.action,errors}));throw error;}
    await host.waitForTimeout(1100);
    const result=app.rooms()[code].result;rounds.push({action:text,success:result.success,automatic:result.automatic,changes:result.changes});
    if(turn<6)await host.screenshot({path:path.join(output,`result-${turn}.png`)});
    if(fast)await skip();
    // The next actor is the other controller; this actor may still have a fairness cooldown.
    if(!app.rooms()[code].quest.escaped)await other.waitForSelector('#action-text',{timeout:20000});turn++;console.log(JSON.stringify(rounds.at(-1)));return result;
  };
  // Six rounds at real reaction/reveal pace: approximately ninety seconds.
  const normalStarted=Date.now();
  for(const text of ['Extinguish the fireplace','Smash the upper left table','Spill the barrel','Open the tavern door','Steal the tavern rug','Hide behind the upper right table'])await action(text);
  const normalPaceElapsedMs=Date.now()-normalStarted;
  const live=()=>app.rooms()[code];let r=live();assert.equal(r.world.objects.hearth.lit,false);assert.equal(r.world.objects.barrel.spilled,true);assert.equal(r.world.objects.door.open,true);
  // Continue actual controller submissions with host-controlled timer skips.
  for(let i=0;i<8&&live().world.props.rug!==false;i++)await action('Steal the tavern rug',true);
  assert.equal(live().world.props.rug,false);
  for(let i=0;i<12&&live().world.props.table!=='broken';i++)await action('Smash the upper left table',true);
  assert.equal(live().world.props.table,'broken');
  await host.screenshot({path:path.join(output,'05-reactive-room.png')});
  for(let i=0;i<3;i++)await action('Inspect the chest behind the bar',true);
  for(let i=0;i<16&&!live().quest.crown;i++){const result=await action('Steal the crown from the chest',true);assert.equal(result.automatic,false);}
  assert.equal(live().quest.crown,true);
  for(let i=0;i<16&&!live().quest.escaped;i++)await action('Flee through the door with the crown',true);
  r=live();assert.equal(r.quest.escaped,true);
  await host.waitForTimeout(3200);
  for(const [index,phone] of phones.entries()){
    const player=r.players[index];
    await phone.getByText(`You have ${player.score} XP and ${player.gold} coins.`,{exact:false}).waitFor();
    assert.equal((await phone.locator('.controller-status').innerText()).includes('You earned'),false);
  }
  await host.screenshot({path:path.join(output,'03-victory.png')});await phones[0].screenshot({path:path.join(output,'04-controller.png'),fullPage:true,mask:[phones[0].locator('.recovery')]});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({errors,normalPaceRounds:6,normalPaceElapsedMs,rounds,quest:r.quest,objects:r.world.objects,players:r.players.map(p=>({name:p.name,avatar:p.avatar,inventory:p.inventory}))},null,2));
  await context.close();console.log('BETA BROWSER PASS: live host, two browser controllers, reactive objects, complete heist.');
}finally{await app.close();await browser.close();fs.rmSync(dataDir,{recursive:true,force:true});}
