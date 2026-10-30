import test from 'node:test';
import assert from 'node:assert/strict';
import {worldFingerprint} from './world-change.mjs';

const actor={zone:'Town',chaos:{ground:[{id:'table',condition:'intact',hp:4,tile:{x:4,y:3}}],npcs:[],story:[],camp:null,bag:[{id:'private'}]}};
test('ground damage, fire, movement and scene transitions change the world fingerprint',()=>{
 const original=worldFingerprint(actor);
 for(const next of [
  {...actor,chaos:{...actor.chaos,ground:[{...actor.chaos.ground[0],condition:'burning'}]}},
  {...actor,chaos:{...actor.chaos,ground:[{...actor.chaos.ground[0],hp:2}]}},
  {...actor,chaos:{...actor.chaos,ground:[{...actor.chaos.ground[0],tile:{x:5,y:3}}]}},
  {...actor,zone:'Forest'},
  {...actor,chaos:{...actor.chaos,npcs:[{id:'guard',trust:-1}]}},
  {...actor,chaos:{...actor.chaos,story:[{id:'witness',verb:'ignite'}]}}
 ])assert.notEqual(worldFingerprint(next),original);
});
test('private gear and combat stats do not broadcast unrelated world notifications',()=>{
 const original=worldFingerprint(actor);
 assert.equal(worldFingerprint({...actor,hp:12,chaos:{...actor.chaos,bag:[{id:'secret-new-item'}]}}),original);
 assert.equal(worldFingerprint({...actor,chaos:{...actor.chaos,wearables:[{id:'sword'}]}}),original);
});
test('no native world snapshot means no fabricated world-change signal',()=>{
 assert.equal(worldFingerprint(null),null);
 assert.equal(worldFingerprint({zone:'Town'}),null);
});
