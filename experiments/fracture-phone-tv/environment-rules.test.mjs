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
