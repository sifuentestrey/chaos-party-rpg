import test from 'node:test';
import assert from 'node:assert/strict';
import {environmentObject} from './environment-rules.mjs';
import {advanceAuthoredFire} from './scenery-fire.mjs';
test('burning Chaos floor item ignites adjacent authored tree and eventually removes collision',()=>{
 const tree=environmentObject('woods:tree','tree',{x:2,y:1});tree.scene='woods';
 const state={scenery:{[tree.id]:tree},items:{torch:{id:'torch',location:'woods',condition:'burning',tile:{x:1,y:1}}}};
 const first=advanceAuthoredFire(state,'woods');
 assert.equal(first[0].after,'burning');
 assert.equal(state.scenery[tree.id].hp,11);
 for(let i=0;i<11;i++)advanceAuthoredFire(state,'woods');
 assert.equal(state.scenery[tree.id].condition,'broken');
 assert.equal(state.scenery[tree.id].blocking,false);
});
test('fire cannot cross zones or spread from carried inventory',()=>{
 const tree=environmentObject('woods:tree','tree',{x:2,y:1});tree.scene='woods';
 const state={scenery:{[tree.id]:tree},items:{torch:{location:'town',condition:'burning',tile:{x:1,y:1}},carried:{location:'woods',ownerId:'player',condition:'burning',tile:{x:1,y:1}}}};
 assert.deepEqual(advanceAuthoredFire(state,'woods'),[]);
 assert.equal(state.scenery[tree.id].condition,'intact');
});
test('rain extinguishes an authored burning tree without modifying native map',()=>{
 const tree=environmentObject('woods:tree','tree',{x:2,y:1},{condition:'burning'});tree.scene='woods';
 const state={scenery:{[tree.id]:tree},items:{}};
 assert.equal(advanceAuthoredFire(state,'woods',{rain:1})[0].after,'intact');
 assert.equal(state.scenery[tree.id].hp,12);
});
test('new authored ignition cannot leap through a second tree in the same tick',()=>{
 const first={...environmentObject('one','tree',{x:2,y:1}),scene:'woods'};
 const second={...environmentObject('two','tree',{x:3,y:1}),scene:'woods'};
 const state={scenery:{one:first,two:second},items:{torch:{id:'torch',location:'woods',condition:'burning',tile:{x:1,y:1},ignitedBy:'alice',ignitionOriginId:'torch'}}};
 advanceAuthoredFire(state,'woods');
 assert.equal(state.scenery.one.condition,'burning');
 assert.equal(state.scenery.one.ignitionOriginId,'torch');
 assert.equal(state.scenery.two.condition,'intact');
 advanceAuthoredFire(state,'woods');
 assert.equal(state.scenery.two.condition,'burning');
});
