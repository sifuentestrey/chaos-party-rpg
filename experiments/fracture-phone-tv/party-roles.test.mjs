import test from 'node:test';import assert from 'node:assert/strict';
import {ROLES,validRole,roleName,objectSkillBonus,resolveObjectRoll} from './party-roles.mjs';
test('canonical class identifiers and only supported Chaos skill bonuses',()=>{
 assert.deepEqual(Object.keys(ROLES),['rogue','bard','wizard','knight','healer','wildcard']);
 assert.equal(roleName('knight'),'Knight');assert.equal(roleName('unknown'),'Unassigned');
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
