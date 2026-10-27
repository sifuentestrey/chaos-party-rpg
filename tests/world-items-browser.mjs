// End-to-end proof: actual browser phone submissions, authority, restart and rejoin.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createGameServer} from '../server.mjs';
import {createHost} from './colyseus-helpers.mjs';
import {skipBrowserTimer} from './browser-timers.mjs';
const playwright=await import(pathToFileURL(process.env.CHAOS_PLAYWRIGHT_MODULE||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js'));
const {chromium}=playwright.default||playwright;
const output=path.resolve(process.env.CHAOS_QA_OUTPUT||'artifacts/world-items');fs.mkdirSync(output,{recursive:true});
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-world-browser-'));
let app=await createGameServer({port:0,host:'127.0.0.1',dataDir}),rpc;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const errors=[],rounds=[];let code;let base='http://127.0.0.1:'+app.port;
try{
 const context=await browser.newContext({viewport:{width:1280,height:720}}),host=await context.newPage();host.on('pageerror',e=>(errors.push(e.message),console.log('PAGE ERROR',e.message)));
 console.log('Opening host',base);await host.goto(base+'/host');console.log('Host loaded');await host.locator('[data-action=createRoom]').click();console.log('Created room');await host.waitForSelector('.room-code');code=(await host.locator('.room-code').innerText()).trim();
 const skip=()=>skipBrowserTimer(host,()=>app.rooms()[code]);
 const phones=[];
 async function join(name){const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.on('pageerror',e=>(errors.push(e.message),console.log('PAGE ERROR',e.message)));await p.goto(base+'/join?room='+code);await p.locator('#character-name').fill(name);await p.locator('[data-action=creatorTab][data-value=role]').click();await p.locator('[data-action=enter]').click();try{await p.waitForSelector('.player-card',{timeout:10000});}catch(e){console.log(await p.locator('body').innerText());throw e;}console.log('Joined',name);phones.push(p);return p;}
 const jinx=await join('Jinx');await host.locator('[data-action=startStory]').click();
 const live=()=>app.rooms()[code];
 const wait=async fn=>{const end=Date.now()+12000;while(!fn()){if(Date.now()>end)throw Error('Timed out waiting for game state');await new Promise(r=>setTimeout(r,40));}};
 async function action(p,text){
  console.log(text);await p.waitForSelector('#action-text');await p.locator('#action-text').fill(text);await p.locator('#action-form button').click();
  await wait(()=>live().phase==='react'&&live().turn.action===text);await host.waitForFunction(()=>document.body.textContent.includes('REACTION WINDOW'));
  await skip();
  await wait(()=>live().phase==='reveal'&&live().result?.action===text);const result=live().result;assert.equal(result.action,text);rounds.push({text,success:result.success,blocked:result.blocked});
  await host.waitForTimeout(100);
  await skip();await wait(()=>live().phase==='open');await p.waitForSelector('#action-text');return result;
 }
 await host.screenshot({path:path.join(output,'01-tavern.png')});
 await action(jinx,'Take item-1');await action(jinx,'Take item-2');
 for(let n=0;n<24;n++)if((await action(jinx,'Make a bureaucratic moon hat from item-1 and item-2')).success)break;
 const item=Object.values(live().world.expedition.items).find(i=>i.name==='bureaucratic moon hat');assert.ok(item);
 await action(jinx,'Equip '+item.id);await host.waitForTimeout(900);await host.screenshot({path:path.join(output,'02-created-worn.png')});
 const moss=await join('Moss');await action(moss,'Inspect '+item.id);await action(jinx,'Give '+item.id+' to Moss');await action(moss,'Equip '+item.id);
 await action(jinx,'Travel to clearing');await action(moss,'Drop '+item.id);await action(jinx,'Take '+item.id);await action(moss,'Inspect '+item.id);await action(jinx,'Equip '+item.id);
 await action(moss,'Travel to ruins');
 await action(jinx,'Take item-9');await action(moss,'Inspect '+item.id);await action(jinx,'Take item-10');
 for(let n=0;n<24;n++){await action(moss,'Inspect '+item.id);if((await action(jinx,'Make a purple moon wrench from item-9 and item-10')).success)break;}
 const tool=Object.values(live().world.expedition.items).find(i=>i.name==='purple moon wrench');assert.ok(tool);
 await action(moss,'Travel to clearing');
 for(let n=0;n<24;n++){if((await action(jinx,'Use '+tool.id+' on smooth stone')).success)break;await action(moss,'Inspect '+tool.id);}
 assert.equal(live().world.expedition.items['item-8'].condition,'broken');
 await action(moss,'Travel to ruins');await host.waitForTimeout(2600);await host.screenshot({path:path.join(output,'03-ruins.png')});
 await jinx.locator('.recovery code').evaluate(el=>el.textContent='••••••');await jinx.screenshot({path:path.join(output,'04-phone.png'),fullPage:true});
 const before=live().world.expedition.items[item.id],port=app.port;await app.close();await browser.close();
 app=await createGameServer({port,host:'127.0.0.1',dataDir});rpc=await createHost(app,{resumeCode:code});assert.deepEqual(live().world.expedition.items[item.id],before);assert.equal(live().world.expedition.current,'ruins');
 // A fresh browser reconnects using the saved character token, through the normal join protocol.
 const {joinPlayer}=await import('./colyseus-helpers.mjs');const token=app.store.rooms[code].players.find(p=>p.name==='Jinx').token;
 const rejoined=await joinPlayer(app,rpc.room.roomId,{token});assert.equal(rejoined.identity.room.world.expedition.items[item.id].equipped,true);
 assert.equal(rejoined.identity.playerId,before.ownerId);await rejoined.room.leave(true);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({errors,rounds,item:before,tool:live().world.expedition.items[tool.id],restart:true,rejoin:true,location:'ruins'},null,2));
 console.log('WORLD ITEMS BROWSER PASS: create, wear, transfer, drop/take, three locations, real server restart and identity rejoin.');
}finally{if(rpc?.room.connection?.isOpen)await rpc.room.leave(true);await app.close();await browser.close();fs.rmSync(dataDir,{recursive:true,force:true});}
