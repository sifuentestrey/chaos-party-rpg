import test from 'node:test';import assert from 'node:assert/strict';
import {ROLES,validRole,roleName,objectSkillBonus,resolveObjectRoll,validBackground,backgroundCheckTypes,normalizeBackgroundPoints,backgroundCheckBonus} from './party-roles.mjs';
import {BACKGROUNDS} from './character-profile.mjs';
test('canonical class identifiers and only supported Chaos skill bonuses',()=>{
 assert.deepEqual(Object.keys(ROLES),['rogue','bard','wizard','knight','healer','wildcard']);
 assert.equal(roleName('knight'),'Knight');assert.equal(roleName('unknown'),'Unassigned');
 assert.equal(validRole('barbarian'),true);assert.equal(roleName('paladin'),'Paladin');assert.equal(objectSkillBonus('assassin','attack'),0);assert.equal(roleName('druid'),'Druid');assert.equal(roleName('warlock'),'Warlock');
 assert.equal(validRole('__proto__'),false);
 assert.equal(objectSkillBonus('rogue','steal'),3);
 assert.equal(objectSkillBonus('knight','break'),3);
 assert.equal(objectSkillBonus('bard','steal'),0);
 assert.equal(objectSkillBonus('wizard','craft'),0);
 assert.equal(objectSkillBonus('invalid','steal'),0);
});
test('original D20 class bonus, natural 1 failure and natural 20 success',()=>{
 const check=(role,roll,dc=13)=>resolveObjectRoll({role,perk:null,verb:'steal',dc,roll});
 assert.equal(check('rogue',10).success,true);
 assert.equal(check('bard',10).success,false);
 assert.equal(check('rogue',1,2).success,false);
 assert.equal(check('bard',20,40).success,true);
 assert.equal(check('rogue',9).bonus,3);
});
test('Lucky-ish rerolls only 1–3 once, including after advantage selection',()=>{
 const calls=[];const rng={int:(a,b)=>{calls.push([a,b]);return 15;}};
 const r=resolveObjectRoll({role:'rogue',perk:'lucky',verb:'steal',dc:14,roll:2,rolls:[1,2],rng});
 assert.deepEqual(calls,[[1,20]]);assert.equal(r.rerolled,2);assert.equal(r.roll,15);assert.equal(r.success,true);
 const other=resolveObjectRoll({role:'rogue',perk:'lucky',verb:'steal',dc:14,roll:4,rng});
 assert.equal(other.rerolled,null);assert.equal(calls.length,1);
});
test('no false bonus or reroll for invalid legacy identity; malformed checks reject',()=>{
 const x=resolveObjectRoll({role:'invalid',perk:'invented',verb:'break',dc:12,roll:10});
 assert.equal(x.bonus,0);assert.equal(x.success,false);
 assert.throws(()=>resolveObjectRoll({role:'rogue',verb:'steal',dc:12,roll:21}),/Invalid/);
});

test('Charming is an original +2 social-only perk, not a native combat or theft bonus',async()=>{
 const {validPerk,PERKS}=await import('./party-roles.mjs');
 assert.equal(validPerk('charming'),true);
 assert.equal(validPerk('__proto__'),false);
 assert.equal(PERKS.charming,'Suspiciously charming');
 const bard=resolveObjectRoll({role:'bard',perk:'charming',verb:'social',dc:16,roll:11});
 assert.equal(bard.bonus,3);assert.equal(bard.perkBonus,2);assert.equal(bard.success,true);
 const rogue=resolveObjectRoll({role:'rogue',perk:'charming',verb:'steal',dc:16,roll:13});
 assert.equal(rogue.bonus,3);assert.equal(rogue.perkBonus,0);assert.equal(rogue.success,true);
 assert.equal(resolveObjectRoll({role:'bard',perk:'charming',verb:'social',dc:2,roll:1}).success,false);
 assert.equal(resolveObjectRoll({role:'bard',perk:'charming',verb:'social',dc:30,roll:20}).success,true);
});
test('backgrounds expose a small supported catalog and enforce the two-point pool',()=>{
 assert.deepEqual(Object.keys(BACKGROUNDS),['farmhand','thief','scholar','soldier','wanderer','artisan']);
 assert.equal(validBackground('farmhand'),true);assert.equal(validBackground('__proto__'),false);
 assert.deepEqual(backgroundCheckTypes('thief'),['social','sneak']);
 assert.deepEqual(normalizeBackgroundPoints('thief',{social:1,sneak:1},{requireFull:true}),{social:1,sneak:1});
 assert.deepEqual(normalizeBackgroundPoints('farmhand',undefined),{strength:0});
 assert.throws(()=>normalizeBackgroundPoints('thief',{social:2,sneak:1}),/at most two|exactly two/);
 assert.throws(()=>normalizeBackgroundPoints('thief',{social:1,attack:1}),/check type/);
 assert.throws(()=>normalizeBackgroundPoints(null,{strength:2}),/supported background/);
});
test('background bonuses are authoritative D20 modifiers and old identities stay neutral',()=>{
 const farm=resolveObjectRoll({role:'barbarian',perk:null,background:'farmhand',backgroundPoints:{strength:2},ability:'strength',verb:'break',dc:15,roll:10});
 assert.equal(farm.classBonus,0);assert.equal(farm.backgroundBonus,5);assert.equal(farm.bonus,5);assert.equal(farm.success,true);
 const thief=resolveObjectRoll({role:null,perk:null,background:'thief',backgroundPoints:{social:1,sneak:1},ability:'social',verb:'social',dc:14,roll:11});
 assert.equal(thief.backgroundBonus,3);assert.equal(thief.success,true);
 assert.equal(backgroundCheckBonus('thief',{social:2,sneak:0},{verb:'steal'}),2);
 const old=resolveObjectRoll({role:null,perk:null,verb:'break',dc:11,roll:10});
 assert.equal(old.backgroundBonus,0);assert.equal(old.bonus,0);assert.equal(old.success,false);
});
