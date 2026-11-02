import test from 'node:test';import assert from 'node:assert/strict';import {DEFAULT_APPEARANCE,validateAppearance,randomAppearance,STARTERS,BODIES,OUTFITS,ACCESSORIES,HAIR_STYLES,FACIAL_HAIR,HEADWEAR,DERIVED_HERITAGES} from './character-profile.mjs';import {recolorPixels,appearanceLayerAudit,hairVisible} from './character-appearance.mjs';import {parseIntent,validIntent} from './action-contract.ts';
test('appearance accepts only the supported cosmetic choices, never paths, powers or stats',()=>{
 for(let n=0;n<50;n++){const appearance=randomAppearance();assert.deepEqual(validateAppearance(appearance),appearance);}
 for(const patch of [{outfit:'../config'},{body:'dragon'},{skin:-1},{hair:1.2},{color:16},{accessory:'weapon'},{damage:999},{version:3}])assert.throws(()=>validateAppearance({...DEFAULT_APPEARANCE,...patch}));
 assert.deepEqual(Object.keys(STARTERS),['knight','rogue','wizard','healer','barbarian','paladin','assassin','druid','warlock']);
});
test('derived heritages and wardrobe layers stay within the validated native sheet catalog',()=>{
 for(const body of Object.keys(DERIVED_HERITAGES))assert.equal(validateAppearance({...DEFAULT_APPEARANCE,body}).body,body);
 for(const key of ['tunic','cloak','tabard'])assert.equal(OUTFITS[key]!==undefined,true);
 for(const key of ['scarf','satchel','shoulderpad','ribbon'])assert.equal(ACCESSORIES[key]!==undefined,true);
 for(const key of ['curly','pixie','topknot','sidebraid'])assert.equal(HAIR_STYLES[key]!==undefined,true);
 for(const key of ['goatee','sideburns'])assert.equal(FACIAL_HAIR[key]!==undefined,true);
 for(const key of ['circlet','cowl','pointed','veil'])assert.equal(HEADWEAR[key]!==undefined,true);
 for(let n=0;n<40;n++)assert.doesNotThrow(()=>validateAppearance(randomAppearance(()=>n/40)));
});
test('all heritage, hairstyle, headwear and accessory combinations stay inside one native frame',()=>{
 const bodies=Object.keys(BODIES),hairstyles=Object.keys(HAIR_STYLES),headwear=Object.keys(HEADWEAR),accessories=Object.keys(ACCESSORIES);
 for(const body of bodies)for(const hairStyle of hairstyles)for(const head of headwear)for(const accessory of accessories){
  for(const direction of ['down','left','up','right']){const audit=appearanceLayerAudit({...DEFAULT_APPEARANCE,body,hairStyle,headwear:head,accessory,outfit:'cloak',direction},{top:7,left:10,right:22});
   for(const layer of Object.values(audit.layers))assert.ok(layer.x>=0&&layer.y>=0&&layer.x+layer.w<=32&&layer.y+layer.h<=32,`${body}/${hairStyle}/${head}/${accessory}/${direction} escaped its frame`);
   assert.equal(audit.visible,true,`${body}/${hairStyle}/${head}/${accessory}/${direction} produced an invisible derived layer`);
   if(hairStyle!=='original'&&hairVisible(head))assert.ok(audit.layers.hair.visible,`${body}/${hairStyle}/${head}/${direction} lost its hair layer`);
  }
 }
});
test('original palette preserves native pixels; selected skin and clothing never recolor the outline',()=>{
 const pixels=new Uint8ClampedArray(32*32*4);pixels.set([250,166,118,255],0);pixels.set([55,55,55,255],4);pixels.set([209,209,209,255],20*32*4);
 assert.deepEqual(recolorPixels(pixels.slice(),32,DEFAULT_APPEARANCE),pixels);
 const changed=recolorPixels(pixels.slice(),32,{...DEFAULT_APPEARANCE,skin:4,color:2});assert.notDeepEqual(changed.slice(0,4),pixels.slice(0,4));assert.deepEqual(changed.slice(4,8),pixels.slice(4,8));assert.notDeepEqual(changed.slice(20*32*4,20*32*4+4),pixels.slice(20*32*4,20*32*4+4));
 for(const body of Object.keys(DERIVED_HERITAGES)){const race=recolorPixels(pixels.slice(),32,{...DEFAULT_APPEARANCE,body});assert.notDeepEqual(race.slice(0,4),pixels.slice(0,4));}
});
test('ability intent families retain the requested skill and cannot carry fabricated effects',()=>{
 for(const [text,skill] of [['power strike','power_strike'],['phase shift','phase_shift'],['arcane shock','war_cry'],['mend Ash','mend'],['heal Ash','mend'],['frenzy','frenzy'],['use frenzy','frenzy'],['bulwark','bulwark'],['activate bulwark','bulwark'],['ambush','ambush'],['entangle','entangle'],['use entangle','entangle'],['curse','curse'],['activate curse','curse']]){const i=parseIntent(text);assert.equal(i.verb,'ability');assert.equal(i.skill,skill);assert.equal(validIntent(i),true);}
 assert.deepEqual(parseIntent('use ability on 123'),{verb:'ability',target:'123'});assert.equal(validIntent({verb:'ability',skill:'mend',damage:999}),false);assert.equal(validIntent({verb:'attack',target:'rat',skill:'mend'}),false);for(const field of ['dx','dy','steps','x','y'])assert.equal(validIntent({verb:'ability',[field]:1}),false);
});
