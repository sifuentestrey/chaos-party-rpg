import test from 'node:test';
import assert from 'node:assert/strict';
import {skipBrowserTimer} from './browser-timers.mjs';

test('browser timer skip does not open host controls after a timer already ended',async()=>{
  await skipBrowserTimer({locator(){throw Error('No host action should occur.');}},()=>({phase:'open'}));
});

test('browser timer skip reopens a stale disabled dialog before clicking an active timer',async()=>{
  let opened=0,closed=0,skipped=0;
  const host={waitForTimeout:async()=>{},locator(selector){
    if(selector==='[data-action=settings]')return {click:async()=>{opened++;}};
    if(selector==='[data-host=resolve]')return {isEnabled:async()=>opened>1,click:async()=>{skipped++;}};
    if(selector==='dialog[open] [data-close]')return {click:async()=>{closed++;}};
    throw Error('Unexpected control: '+selector);
  }};
  await skipBrowserTimer(host,()=>({phase:'reveal'}));
  assert.deepEqual({opened,closed,skipped},{opened:2,closed:1,skipped:1});
});

test('browser timer skip closes its dialog if the phase ends while it opens',async()=>{
  let phase='react',closed=0;
  const host={waitForTimeout:async()=>{},locator(selector){
    if(selector==='[data-action=settings]')return {click:async()=>{phase='open';}};
    if(selector==='[data-host=resolve]')return {isEnabled:async()=>{throw Error('Ended timer cannot be skipped.');}};
    if(selector==='dialog[open] [data-close]')return {click:async()=>{closed++;}};
    throw Error('Unexpected control: '+selector);
  }};
  await skipBrowserTimer(host,()=>({phase}));
  assert.equal(closed,1);
});
