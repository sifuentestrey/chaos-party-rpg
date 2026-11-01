import test from 'node:test';import assert from 'node:assert/strict';import {DEFAULT_APPEARANCE,validateAppearance,randomAppearance,STARTERS} from './character-profile.mjs';import {recolorPixels} from './character-appearance.mjs';import {parseIntent,validIntent} from './action-contract.ts';
test('appearance accepts only the supported cosmetic choices, never paths, powers or stats',()=>{
 for(let n=0;n<50;n++){const appearance=randomAppearance();assert.deepEqual(validateAppearance(appearance),appearance);}
 for(const patch of [{outfit:'../config'},{body:'dragon'},{skin:-1},{hair:1.2},{color:16},{accessory:'weapon'},{damage:999},{version:3}])assert.throws(()=>validateAppearance({...DEFAULT_APPEARANCE,...patch}));
 assert.equal(Object.keys(STARTERS).length,4);
});
test('original palette preserves native pixels; selected skin and clothing never recolor the outline',()=>{
 const pixels=new Uint8ClampedArray(32*32*4);pixels.set([250,166,118,255],0);pixels.set([55,55,55,255],4);pixels.set([209,209,209,255],20*32*4);
 assert.deepEqual(recolorPixels(pixels.slice(),32,DEFAULT_APPEARANCE),pixels);
 const changed=recolorPixels(pixels.slice(),32,{...DEFAULT_APPEARANCE,skin:4,color:2});assert.notDeepEqual(changed.slice(0,4),pixels.slice(0,4));assert.deepEqual(changed.slice(4,8),pixels.slice(4,8));assert.notDeepEqual(changed.slice(20*32*4,20*32*4+4),pixels.slice(20*32*4,20*32*4+4));
});
test('ability intent families retain the requested skill and cannot carry fabricated effects',()=>{
 for(const [text,skill] of [['power strike','power_strike'],['phase shift','phase_shift'],['arcane shock','war_cry'],['mend Ash','mend'],['heal Ash','mend']]){const i=parseIntent(text);assert.equal(i.verb,'ability');assert.equal(i.skill,skill);assert.equal(validIntent(i),true);}
 assert.deepEqual(parseIntent('use ability on 123'),{verb:'ability',target:'123'});assert.equal(validIntent({verb:'ability',skill:'mend',damage:999}),false);assert.equal(validIntent({verb:'attack',target:'rat',skill:'mend'}),false);for(const field of ['dx','dy','steps','x','y'])assert.equal(validIntent({verb:'ability',[field]:1}),false);
});
