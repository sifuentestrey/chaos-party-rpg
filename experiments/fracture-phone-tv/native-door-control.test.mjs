import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeDoorControl} from './native-door-control.mjs';
function fixture(){
 let now=1000;const world={players:{}};
 const make=(id,x,y)=>({characterId:id,name:id,x,y,chaosControlled:true,hasEnteredGame:true,isDead:false,getWorld:()=>world});
 const a=make('a',10,9),b=make('b',20,21);world.players={a,b};
 const control=createNativeDoorControl([{x:10,y:10,tx:20,ty:20},{x:20,y:20,tx:10,ty:10}],{clock:()=>now,ttlMs:15000});
 return {control,a,b,world,advance:n=>{now+=n}};
}
test('one existing map door can be held from either end; another actor cannot cross either side',()=>{
 const {control,a,b}=fixture();const entry=control.find(a,1);assert.ok(entry&&!entry.ambiguous);
 assert.equal(control.use(a,entry,'hold').success,true);
 assert.equal(control.isBlocked(b,10,10),true);
 assert.equal(control.isBlocked(b,20,20),true);
 assert.equal(control.isBlocked(a,10,10),false);
 assert.deepEqual(control.view(b),[{x:20,y:20,heldBy:'a'}]);
 assert.equal(control.use(b,control.find(b,1),'release').blocked,true);
 assert.equal(control.use(a,entry,'release').success,true);
 assert.equal(control.isBlocked(b,20,20),false);
});
test('forcing an occupied doorway needs a successful authoritative check',()=>{
 const {control,a,b}=fixture();control.use(a,control.find(a,1),'hold');
 assert.equal(control.use(b,control.find(b,1),'force',{success:false}).success,false);
 assert.equal(control.isBlocked(b,20,20),true);
 assert.equal(control.use(b,control.find(b,1),'force',{success:true}).success,true);
 assert.equal(control.isBlocked(b,20,20),false);
});
test('holds expire and release when holder moves, dies or disconnects',()=>{
 const {control,a,b,advance}=fixture();const entry=control.find(a,1);
 control.use(a,entry,'hold');a.x=50;assert.equal(control.isBlocked(b,20,20),false);
 a.x=10;control.use(a,entry,'hold');a.isDead=true;assert.equal(control.isBlocked(b,20,20),false);
 a.isDead=false;control.use(a,entry,'hold');a.hasEnteredGame=false;assert.equal(control.isBlocked(b,20,20),false);
 a.hasEnteredGame=true;control.use(a,entry,'hold');advance(15000);assert.equal(control.isBlocked(b,20,20),false);
});
test('invalid geometry and ambiguous door positions cannot be used as new props',()=>{
 const {a}=fixture();const control=createNativeDoorControl([{x:10,y:10,tx:20,ty:20},{x:11,y:9,tx:99,ty:99},{x:'10',y:10,tx:20,ty:20}]);
 assert.deepEqual(control.find(a,2),{ambiguous:true});
 assert.equal(control.use(a,control.find(a,2),'hold').blocked,true);
 assert.equal(control.isBlocked(a,99,99),false);
});

test('one-way map teleport destinations are not invented as interactive doorways',()=>{
 const world={players:{}},a={characterId:'a',name:'a',x:10,y:9,chaosControlled:true,hasEnteredGame:true,isDead:false,getWorld:()=>world},b={characterId:'b',name:'b',x:20,y:21,chaosControlled:true,hasEnteredGame:true,isDead:false,getWorld:()=>world};world.players={a,b};
 const control=createNativeDoorControl([{x:10,y:10,tx:20,ty:20}]);
 assert.equal(control.use(a,control.find(a,1),'hold').success,true);
 assert.equal(control.find(b,1),null);
 assert.equal(control.isBlocked(b,10,10),true);
 assert.equal(control.isBlocked(b,20,20),false);
});
