import test from 'node:test';
import assert from 'node:assert/strict';
import {registerScenery,strikeScenery,sceneryBlocks,visibleScenery} from './scenery-bridge.mjs';
test('authored tree takes damage, falls, and stops blocking without affecting another scene',()=>{
 const state={scenery:{}};
 const tree=registerScenery(state,{scene:'forest',id:'oak-1',kind:'tree',tile:{x:4,y:5}});
 assert.equal(tree.hp,12);
 assert.equal(sceneryBlocks(state,'forest',4,5),true);
 assert.equal(sceneryBlocks(state,'town',4,5),false);
 assert.equal(strikeScenery(state,{scene:'forest',id:'oak-1',damage:5}).object.hp,7);
 const fallen=strikeScenery(state,{scene:'forest',id:'oak-1',damage:7});
 assert.equal(fallen.object.condition,'broken');
 assert.equal(sceneryBlocks(state,'forest',4,5),false);
 assert.equal(registerScenery(state,{scene:'forest',id:'oak-1',kind:'tree',tile:{x:4,y:5}}).condition,'broken');
 assert.equal(visibleScenery(state,'forest').length,1);
});
test('scenery damage survives JSON save and reload and rejects unregistered native tiles',()=>{
 const state={scenery:{}};
 registerScenery(state,{scene:'woods',id:'tree-1',kind:'tree',tile:{x:2,y:2}});
 strikeScenery(state,{scene:'woods',id:'tree-1',damage:12});
 const restored=JSON.parse(JSON.stringify(state));
 assert.equal(sceneryBlocks(restored,'woods',2,2),false);
 assert.equal(registerScenery(restored,{scene:'woods',id:'tree-1',kind:'tree',tile:{x:2,y:2}}).condition,'broken');
 assert.equal(strikeScenery(restored,{scene:'woods',id:'native-tree',damage:3}).changed,false);
});
