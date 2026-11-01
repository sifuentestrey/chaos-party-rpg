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

test('AI cannot set an easier native tree check or swap its strength ability',()=>{
 const breakAction={...judgment('break'),ability:'strength',dc:14};
 assert.equal(validateEnvironmentJudgment(breakAction,ctx).accepted,true);
 assert.equal(validateEnvironmentJudgment({...breakAction,dc:1},ctx).accepted,false);
 assert.equal(validateEnvironmentJudgment({...breakAction,ability:'wisdom'},ctx).accepted,false);
});

test('typed AI can propose movement of a real native object but cannot lower its D20 DC or invent an adapter',()=>{
 const tent={id:'fracture:world:native-tent',verifiedNative:true,nativeAdapter:true,scene:'fracture:world',
  tile:{x:10,y:10},condition:'intact',dc:10,capabilities:{movable:true,breakable:true,flammable:true,repairable:false}};
 const context={...ctx,authoritativeNativeExecutor:true,objects:[tent]};
 const move={action:'move_east',targetId:tent.id,ability:'strength',dc:10,description:'Shift the existing canvas tent east.'};
 const approved=validateEnvironmentJudgment(move,context);
 assert.equal(approved.accepted,true);assert.equal(approved.action,'move');assert.equal(approved.direction,'east');
 assert.equal(approved.requiresAuthoritativeExecution,true);
 assert.equal(approved.success,undefined);
 assert.equal(validateEnvironmentJudgment({...move,dc:1},context).accepted,false);
 assert.equal(validateEnvironmentJudgment({...move,ability:'wisdom'},context).accepted,false);
 assert.equal(validateEnvironmentJudgment({...move,action:'move'},context).accepted,false,'direction is required');
 assert.equal(validateEnvironmentJudgment(move,{...context,objects:[{...tent,nativeAdapter:false}]}).accepted,false);
 assert.equal(validateEnvironmentJudgment(move,{...context,objects:[{...tent,verifiedNative:false}]}).accepted,false);
 assert.equal(validateEnvironmentJudgment(move,{...context,actor:{active:true,tile:{x:50,y:50}}}).accepted,false);
 const walking={...context,actor:{active:true,tile:{x:10,y:14}},maxReach:18,allowApproach:true};
 assert.equal(validateEnvironmentJudgment(move,walking).accepted,true,'a grounded proposal can start native pathing');
 assert.equal(validateEnvironmentJudgment(move,{...walking,allowApproach:false}).accepted,false,'execution remains adjacent only');
});
test('typed AI respects real native material, condition and capability before any roll',()=>{
 const roof={id:'fracture:world:roof',verifiedNative:true,nativeAdapter:true,scene:'fracture:world',
  tile:{x:10,y:10},condition:'broken',dc:16,capabilities:{repairable:true,breakable:false,movable:false,flammable:false}};
 const context={...ctx,authoritativeNativeExecutor:true,objects:[roof]};
 const repair={action:'repair',targetId:roof.id,ability:'dexterity',dc:12,description:'Repair the original roof.'};
 assert.equal(validateEnvironmentJudgment(repair,context).accepted,true);
 assert.equal(validateEnvironmentJudgment({...repair,dc:0},context).accepted,false);
 assert.equal(validateEnvironmentJudgment({...repair,action:'ignite',ability:'wisdom',dc:10},context).accepted,false);
 assert.equal(validateEnvironmentJudgment({...repair,action:'move_north',ability:'strength',dc:16},context).accepted,false);
 const burning={...roof,condition:'burning',capabilities:{...roof.capabilities,extinguishable:true}};
 assert.equal(validateEnvironmentJudgment({action:'extinguish',targetId:roof.id,ability:'none',dc:0,description:'Douse the existing roof.'},{...context,objects:[burning]}).accepted,true);
});
