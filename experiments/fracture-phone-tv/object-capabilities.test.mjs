import test from 'node:test';
import assert from 'node:assert/strict';
import {objectCapabilities,objectBlocksTile} from './object-capabilities.mjs';
const base={id:'table',name:'table',location:'zone',tile:{x:2,y:3},material:'wood',condition:'intact',portable:true,blocks:true,hp:4};
test('physical capabilities derive from properties rather than object names',()=>{
 const a=objectCapabilities(base);
 assert.equal(a.movable,true);assert.equal(a.flammable,true);assert.equal(a.breakable,true);assert.equal(a.blocking,true);
 assert.equal(objectCapabilities({...base,name:'crate'}).flammable,true);
 assert.equal(objectCapabilities({...base,material:'stone'}).flammable,false);
});
test('destroyed objects stop blocking and become repairable',()=>{
 assert.equal(objectBlocksTile({a:base},'zone',2,3),true);
 const broken={...base,condition:'broken',hp:0};
 assert.equal(objectBlocksTile({a:broken},'zone',2,3),false);
 assert.equal(objectCapabilities(broken).repairable,true);
 assert.equal(objectCapabilities(broken).breakable,false);
});
test('carried, distant and disassembled objects cannot create floor collisions',()=>{
 assert.equal(objectBlocksTile({a:{...base,ownerId:'player'}},'zone',2,3),false);
 assert.equal(objectBlocksTile({a:base},'other-zone',2,3),false);
 assert.equal(objectBlocksTile({a:{...base,condition:'disassembled'}},'zone',2,3),false);
 assert.equal(objectCapabilities({...base,tile:null}).blocking,false);
});
test('fire and extinguish capabilities follow condition',()=>{
 assert.equal(objectCapabilities({...base,condition:'burning'}).extinguishable,true);
 assert.equal(objectCapabilities({...base,condition:'broken'}).flammable,false);
 assert.equal(objectCapabilities({...base,material:'glass'}).flammable,false);
});
