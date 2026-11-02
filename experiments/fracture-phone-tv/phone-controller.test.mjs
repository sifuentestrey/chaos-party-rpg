import test from 'node:test';
import assert from 'node:assert/strict';
import {dmModeLabel} from './phone-controller.mjs';

test('phone labels the optional Dungeon Master mode explicitly',()=>{
 assert.equal(dmModeLabel({enabled:true,mode:'live-groq',state:'connected'}),'Optional AI · live Groq');
 assert.equal(dmModeLabel({enabled:true,mode:'live-groq',state:'busy'}),'Optional AI · live Groq · thinking…');
 assert.equal(dmModeLabel({enabled:true,mode:'checking',state:'checking'}),'Optional AI · checking connection…');
 assert.equal(dmModeLabel({enabled:false,mode:'offline-fallback',state:'missing_key'}),'Optional AI · offline fallback');
});
