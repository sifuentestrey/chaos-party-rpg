import test from 'node:test';
import assert from 'node:assert/strict';
import {ENVIRONMENT_KINDS,environmentObject,environmentStep,environmentDamage} from './environment-rules.mjs';
test('all requested environment categories have reusable capability definitions',()=>{
 for(const kind of ['tree','bush','grass','building','wall','roof','door','furniture','river','lake','pond','terrain','rock','cliff','npc'])assert.ok(ENVIRONMENT_KINDS[kind],kind);
});
test('fire advances one adjacent vegetation tile per tick without instant chain reaction',()=>{
 const a=environmentObject('a','tree',{x:0,y:0},{condition:'burning'});
 a.condition='burning';
 const b=environmentObject('b','bush',{x:1,y:0});
 const c=environmentObject('c','grass',{x:2,y:0});
 const first=environmentStep({a,b,c});
 assert.equal(first.objects.b.condition,'burning');
 assert.equal(first.objects.c.condition,'intact');
 assert.equal(environmentStep(first.objects).objects.c.condition,'burning');
});
test('rain and adjacent water extinguish fire and wet vegetation',()=>{
 const a=environmentObject('a','tree',{x:0,y:0});a.condition='burning';
 const pond=environmentObject('pond','pond',{x:1,y:0});
 assert.equal(environmentStep({a,pond}).objects.a.condition,'intact');
 const dry=environmentObject('dry','grass',{x:5,y:5});dry.condition='burning';
 assert.equal(environmentStep({dry},{rain:1}).objects.dry.condition,'intact');
});
test('damage destroys wall without changing unrelated objects or input',()=>{
 const wall=environmentObject('wall','wall',{x:1,y:1});
 const tree=environmentObject('tree','tree',{x:2,y:2});
 const original={wall,tree};const result=environmentDamage(original,'wall',20);
 assert.equal(result.objects.wall.condition,'broken');
 assert.equal(result.objects.wall.blocking,false);
 assert.equal(result.objects.tree,tree);
 assert.equal(original.wall.hp,20);
});
test('lightning ignites combustible roof but not stone or water',()=>{
 const roof=environmentObject('roof','roof',{x:0,y:0});
 const wall=environmentObject('wall','wall',{x:0,y:0});
 const water=environmentObject('water','river',{x:0,y:0});
 const result=environmentStep({roof,wall,water},{lightningTile:{x:0,y:0}});
 assert.equal(result.objects.roof.condition,'burning');
 assert.equal(result.objects.wall.condition,'intact');
 assert.equal(result.objects.water.condition,'intact');
});


test('fire-destroyed blocking tree releases collision just like physical destruction',()=>{
 const tree=environmentObject('tree','tree',{x:1,y:1},{hp:1,condition:'burning'});
 const next=environmentStep({tree}).objects.tree;
 assert.equal(next.condition,'broken');
 assert.equal(next.blocking,false);
 assert.equal(next.hp,0);
 assert.equal(tree.condition,'burning','input is not mutated');
});

test('authoritative scenery identity and collision tile cannot be overwritten by state options',()=>{
 const tree=environmentObject('woods:tree','tree',{x:2,y:3},{
  id:'town:fake',kind:'river',tile:{x:999,y:999},hp:7,condition:'burning'
 });
 assert.equal(tree.id,'woods:tree');
 assert.equal(tree.kind,'tree');
 assert.deepEqual(tree.tile,{x:2,y:3});
 assert.equal(tree.hp,7);
 assert.equal(tree.condition,'burning');
});
test('reject invalid authored scenery durability and fire state before persistence',()=>{
 for(const overrides of [{hp:NaN},{hp:Infinity},{hp:-1},{wet:-1},{wet:4},{wet:0.5},{condition:'teleported'}]){
  assert.throws(()=>environmentObject('woods:tree','tree',{x:2,y:3},overrides),/Invalid environmental object state/);
 }
});

test('water, rocks, cliffs and nonflammable scenery never burn or acquire damage during weather ticks',()=>{
 const objects={
  river:environmentObject('river','river',{x:0,y:0}),
  rock:environmentObject('rock','rock',{x:1,y:0}),
  cliff:environmentObject('cliff','cliff',{x:2,y:0}),
  tree:environmentObject('tree','tree',{x:3,y:0},{condition:'burning'})
 };
 const result=environmentStep(objects,{lightningTile:{x:1,y:0}});
 for(const kind of ['rock','cliff','river']){
  assert.equal(result.objects[kind].condition,'intact');
  assert.equal(result.objects[kind].hp,objects[kind].hp);
 }
 assert.equal(result.objects.tree.hp,11,'nearby wood still burns');
});
