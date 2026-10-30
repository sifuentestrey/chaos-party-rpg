import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironmentJudgment} from './dm-environment-adjudication.mjs';
const obj={id:'fracture:world:oak-1',verifiedNative:true,scene:'fracture:world',tile:{x:10,y:10},condition:'intact',capabilities:{flammable:true,movable:false,concealment:false,breakable:true}};
const ctx={scene:'fracture:world',actor:{active:true,tile:{x:10,y:11}},objects:[obj],freeTiles:[{x:11,y:10}]};
const judgment=(action='ignite',targetId=obj.id)=>({action,targetId,ability:'wisdom',dc:12,description:'Dry wood could catch fire.'});
test('AI DM may recommend real existing flammable tree action but never commits success',()=>{
 const r=validateEnvironmentJudgment(judgment(),ctx);
 assert.equal(r.accepted,true);assert.equal(r.requiresAuthoritativeExecution,true);
 assert.equal(r.success,undefined);assert.equal(r.changed,undefined);
});
test('AI DM cannot invent bushes, move fixed trees or use non-native visual placeholders',()=>{
 assert.equal(validateEnvironmentJudgment(judgment('hide','invented-bush'),ctx).accepted,false);
 assert.equal(validateEnvironmentJudgment({...judgment('push'),destination:{x:11,y:10}},ctx).accepted,false);
 assert.equal(validateEnvironmentJudgment(judgment(),{...ctx,objects:[{...obj,verifiedNative:false}]}).accepted,false);
});
test('AI DM must honor real reach, active actor, verified destination and wet fire restrictions',()=>{
 assert.equal(validateEnvironmentJudgment(judgment(),{...ctx,actor:{active:true,tile:{x:100,y:100}}}).accepted,false);
 assert.equal(validateEnvironmentJudgment(judgment(),{...ctx,actor:{active:false,tile:{x:10,y:11}}}).accepted,false);
 assert.equal(validateEnvironmentJudgment(judgment(),{...ctx,objects:[{...obj,wet:true}]}).accepted,false);
 const rock={...obj,id:'native-rock',capabilities:{movable:true}};
 const move={...judgment('push','native-rock'),destination:{x:11,y:10}};
 assert.equal(validateEnvironmentJudgment(move,{...ctx,objects:[rock]}).accepted,false,'no fake native boulder executor');
 assert.equal(validateEnvironmentJudgment({...move,destination:{x:12,y:10}},{...ctx,objects:[rock]}).accepted,false);
 assert.equal(validateEnvironmentJudgment(move,{...ctx,objects:[rock],freeTiles:[]}).accepted,false);
});

test('AI DM suggestions cannot authorize pickup or other unimplemented native effects',()=>{
 const portable={...obj,id:'native-rock',capabilities:{portable:true}};
 assert.equal(validateEnvironmentJudgment(judgment('take','native-rock'),{...ctx,objects:[portable]}).accepted,false);
});
