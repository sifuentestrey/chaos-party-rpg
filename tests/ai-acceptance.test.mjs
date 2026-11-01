import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_CASES,prepareAICase,scoreInterpretation,summarizeAIResults} from '../scripts/ai-acceptance-cases.mjs';
import {validateAIPlan} from '../public/ai-plan.js';
test('a valid verb with the wrong target fails semantic qualification',()=>{
 const spec=AI_CASES[0],prepared=prepareAICase(spec);
 const raw={verb:'take',target:'bottle',summary:'Take the bottle'};assert.doesNotThrow(()=>validateAIPlan(raw,prepared.room,prepared.actor.id));assert.equal(scoreInterpretation(raw,prepared,spec).correct,false);
 assert.equal(scoreInterpretation({...raw,target:'rug'},prepared,spec).correct,true);
});
test('creative qualification checks actual ingredients and appearance, not only craft',()=>{
 const spec=AI_CASES.find(c=>c.id==='creative-wearable'),prepared=prepareAICase(spec),raw={verb:'craft',sources:['item-2','item-1'],itemType:'wearable',slot:'head',color:'#bd88cf'};
 assert.equal(scoreInterpretation(raw,prepared,spec).correct,true);
 for(const bad of [{...raw,sources:['item-1','item-3']},{...raw,slot:'hand'},{...raw,itemType:'tool'}])assert.equal(scoreInterpretation(bad,prepared,spec).correct,false);
});
test('fast wrong answers and slow correct answers never qualify a model',()=>{
 const rows=AI_CASES.map(c=>({id:c.id,inferenceRun:true,correct:true,withinLiveBudget:true,elapsedMs:1000}));assert.equal(summarizeAIResults(rows).qualificationPassed,true);
 rows[0]={...rows[0],correct:false,elapsedMs:300};assert.equal(summarizeAIResults(rows).qualificationPassed,false);
 rows[0]={...rows[0],correct:true,withinLiveBudget:false,elapsedMs:8000};assert.equal(summarizeAIResults(rows).qualificationPassed,false);assert.equal(summarizeAIResults([]).qualificationPassed,false);
});
