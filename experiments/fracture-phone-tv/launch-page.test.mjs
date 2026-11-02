import test from 'node:test';
import assert from 'node:assert/strict';
import {createLaunchPage} from './launch-page.mjs';

test('start page boots the local game, exposes a room code, opens the TV, and stops cleanly',async t=>{
 let nativeStarted=false,bridgeStarted=false,stopped=false;
 const page=createLaunchPage({port:0,bind:'127.0.0.1',startGame:async()=>{nativeStarted=true;bridgeStarted=true;return {roomCode:'ABCD23',tvUrl:'http://localhost:8000/?chaosTV=local',phoneUrl:'http://192.168.1.2:4748/join?code=ABCD23',stop:async()=>{stopped=true;}};}});
 await page.start();t.after(()=>page.close());
 const base=`http://127.0.0.1:${page.server.address().port}`;
 const landing=await(await fetch(base+'/')).text();assert.match(landing,/Start game/);assert.match(landing,/window\.open/);assert.match(landing,/\/start/);
 const started=await fetch(base+'/start',{method:'POST'});assert.equal(started.status,202);assert.equal((await started.json()).status,'starting');
 let state;for(let i=0;i<20;i++){state=await(await fetch(base+'/state')).json();if(state.status==='running')break;await new Promise(resolve=>setTimeout(resolve,5));}
 assert.equal(nativeStarted,true);assert.equal(bridgeStarted,true);assert.equal(state.status,'running');assert.equal(state.roomCode,'ABCD23');assert.match(state.tvUrl,/chaosTV=local/);assert.match(state.qr,/<svg/);
 const stoppedResponse=await fetch(base+'/stop',{method:'POST'});assert.equal(stoppedResponse.status,200);assert.equal((await stoppedResponse.json()).status,'idle');assert.equal(stopped,true);
});
