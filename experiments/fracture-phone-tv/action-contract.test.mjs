import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIntent,validIntent,shortestPath} from './action-contract.ts';
test('intent families separate cancellation, navigation and manipulation',()=>{
 for(const text of ['stop','please stop running!','quit attacking','hold still','I want to stop moving','cancel my action','stop attacking the rat','please hold position',"do not attack","don't keep moving"])assert.equal(parseIntent(text).verb,'cancel',text);
 for(const direction of ['north','south','east','west','left','right','up','down'])for(const verb of ['go','walk','step','run','move'])assert.equal(parseIntent(`${verb} ${direction}`).verb,'move');
 for(const phrase of ['move the tent','push the crate','drag rock','carry a tent'])assert.equal(parseIntent(phrase).verb,'manipulate',phrase);
 for(const phrase of ['walk to the guard','go to the rat','move to the tent'])assert.equal(parseIntent(phrase).verb,'go',phrase);
 assert.deepEqual(parseIntent('walk three steps west'),{verb:'move',dx:-1,dy:0,steps:3});
 assert.deepEqual(parseIntent('walk north 6'),{verb:'move',dx:0,dy:-1,steps:6});
 assert.deepEqual(parseIntent('walk to 20, 215'),{verb:'go',x:20,y:215});
});
test('untrusted intent plans cannot supply state, arbitrary movement or damage',()=>{
 for(const v of [null,[],{verb:'teleport',x:1,y:1},{verb:'attack',target:'rat',damage:999},{verb:'move',dx:100,dy:0,steps:1},{verb:'move',dx:1,dy:1,steps:1},{verb:'go',x:NaN,y:3},{verb:'go',x:-1,y:3}])assert.equal(validIntent(v),false,JSON.stringify(v));
 for(const v of ['attack the rat','stop','walk north 3','look around','move the tent'])assert.ok(validIntent(parseIntent(v)),v);
});
test('shortest valid cardinal routing avoids walls and identifies unreachable goals',()=>{
 const open=(x,y)=>x>=0&&y>=0&&x<5&&y<5&&!(x===2&&y<4);
 const path=shortestPath([1,1],(x,y)=>x===3&&y===1,open);
 assert.equal(path.length,8);let previous=[1,1];for(const tile of path){assert.ok(open(...tile));assert.equal(Math.abs(tile[0]-previous[0])+Math.abs(tile[1]-previous[1]),1);previous=tile;}
 assert.equal(shortestPath([0,0],(x,y)=>x===6&&y===6,open),null);
});
test('headless enemy cooldowns reuse native declared and inherited values',async()=>{const {extractNativeAttackRates}=await import('./action-contract.ts');const rates=extractNativeAttackRates('this.setAttackRate(800);',`export const Mobs = {\n  Rat: class Rat { super(id, Types.Entities.RAT); }\n  Skeleton: class Skeleton { super(id, Types.Entities.SKELETON); this.setAttackRate(1300); }\n  Goblin: class Goblin { super(id, Types.Entities.GOBLIN); this.setAttackRate(700); }\n}`);assert.equal(rates.rat,800);assert.equal(rates.skeleton,1300);assert.equal(rates.goblin,700);});
