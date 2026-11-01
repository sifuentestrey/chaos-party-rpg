import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {qualificationPreflight,runQualification} from '../scripts/ai-qualification.mjs';

const FIXED_NOW=Date.UTC(2026,9,27,12,0,0);
async function withDataDir(fn){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-ai-qualification-'));
  try{return await fn(dataDir);}finally{fs.rmSync(dataDir,{recursive:true,force:true});}
}
function writeLedger(dataDir,{day=new Date(FIXED_NOW).toISOString().slice(0,10),count=0,recent=[]}={}){
  fs.writeFileSync(path.join(dataDir,'ai-free-usage.json'),JSON.stringify({version:1,day,count,recent}));
}

test('live preflight requires a valid existing ledger and enough allowance before model metadata',async()=>{
  await withDataDir(dataDir=>{
    const missing=qualificationPreflight({dataDir,requestBudget:6,now:FIXED_NOW});
    assert.equal(missing.allowed,false);
    fs.writeFileSync(path.join(dataDir,'ai-free-usage.json'),'{bad');
    assert.equal(qualificationPreflight({dataDir,requestBudget:1,now:FIXED_NOW}).allowed,false,'malformed ledger is blocked');
    writeLedger(dataDir,{day:'2026-10-28'});
    assert.equal(qualificationPreflight({dataDir,requestBudget:1,now:FIXED_NOW}).allowed,false,'future-dated ledger is blocked');
    writeLedger(dataDir,{count:1000});
    assert.equal(qualificationPreflight({dataDir,requestBudget:1,now:FIXED_NOW}).allowed,false,'exhausted ledger is blocked');
    writeLedger(dataDir,{count:995});
    assert.equal(qualificationPreflight({dataDir,requestBudget:6,now:FIXED_NOW}).allowed,false,'daily allowance must cover the whole requested batch');
    writeLedger(dataDir,{count:0,recent:Array.from({length:30},(_,i)=>FIXED_NOW-1000-i*1000)});
    assert.equal(qualificationPreflight({dataDir,requestBudget:1,now:FIXED_NOW}).allowed,false,'minute allowance must be available');
  });
  let constructed=0,metadataCalls=0;
  await withDataDir(async dataDir=>{
    for(const count of [995,1000]){
    writeLedger(dataDir,{count});
    const report=await runQualification({live:true,mode:'interpretation',requestBudget:6,dataDir,env:{CHAOS_AI_PROVIDER:'groq-free'},now:()=>FIXED_NOW,
      aiFactory:()=>{constructed++;return {check:async()=>{metadataCalls++;return {available:true};},close(){}};}});
    assert.equal(report.preflight.allowed,false);
    assert.equal(report.results.length,0);
    assert.equal(constructed,0);
    assert.equal(metadataCalls,0);
    assert.equal(report.qualified,false);
    }
  });
});

test('default dry run applies all six explicit mock plans and checks canonical outcomes',async()=>{
  const report=await runQualification({mode:'interpretation',requestBudget:6,now:()=>FIXED_NOW,elapsedNow:()=>100});
  assert.equal(report.dryRun,true);
  assert.equal(report.evidence,'synthetic');
  assert.equal(report.inferenceRun,false);
  assert.equal(report.qualified,false);
  assert.equal(report.results.length,6);
  for(const row of report.results){
    assert.equal(row.passed,true,`${row.id}: ${JSON.stringify({checks:row.checks,stateChecks:row.stateChecks,error:row.error})}`);
    assert.equal(row.validated,true,row.id);
    assert.equal(row.applied,true,row.id);
    assert.equal(row.withinLiveBudget,true,row.id);
    assert.equal(row.stateChecksPassed,true,row.id);
    assert.ok(Object.values(row.checks).every(value=>value===true),row.id);
    assert.ok(Object.values(row.stateChecks).every(value=>value===true),row.id);
  }
});

test('synthetic valid-schema wrong plan and late answer do not pass semantic or latency checks',async()=>{
  const makeFactory=interpret=>()=>({check:async()=>({available:true,model:'synthetic-fixture'}),interpret,close(){}});
  const wrong=await runQualification({mode:'interpretation',requestBudget:1,now:()=>FIXED_NOW,elapsedNow:()=>100,
    aiFactory:makeFactory(async(_room,_actor,_budget,prepared)=>({plan:{...prepared.expectedPlan,color:'#7ea7d4'},model:'synthetic-fixture'}))});
  assert.equal(wrong.results[0].validated,true,'the deliberately wrong color remains schema valid');
  assert.equal(wrong.results[0].applied,true);
  assert.equal(wrong.results[0].checks.color,false);
  assert.equal(wrong.results[0].stateChecksPassed,false,'canonical appearance must match the requested color');
  assert.equal(wrong.results[0].passed,false);

  let clock=FIXED_NOW;
  const late=await runQualification({mode:'interpretation',requestBudget:1,now:()=>clock,elapsedNow:()=>clock-FIXED_NOW,
    aiFactory:makeFactory(async(_room,_actor,_budget,prepared)=>{clock+=6000;return {plan:prepared.expectedPlan,model:'synthetic-fixture'};})});
  assert.equal(late.results[0].withinLiveBudget,false);
  assert.equal(late.results[0].passed,false);
  assert.equal(late.qualified,false);
  clock=FIXED_NOW;
  const expired=await runQualification({requestBudget:1,now:()=>clock,elapsedNow:()=>clock-FIXED_NOW,
    aiFactory:makeFactory(async(_room,_actor,_budget,prepared)=>{clock+=8000;return {plan:prepared.expectedPlan,model:'synthetic-fixture'};})});
  assert.equal(expired.results[0].applied,false,'the actual animation deadline prevents applying an expired reply');
  assert.equal(expired.results[0].resolution.blocked,true);
  assert.equal(expired.results[0].passed,false);
});

test('injected provider protocol records raw model evidence without credentials and charges only its test ledger',async()=>{
  await withDataDir(async dataDir=>{
    writeLedger(dataDir);const calls=[];
    const raw={domain:'world',verb:'craft',target:'',item:'',sources:['item-1','item-2'],name:'Cloud Mitten',itemType:'wearable',slot:'hand',color:'#e4dcc8',summary:'Original synthetic model summary'};
    const report=await runQualification({live:true,requestBudget:1,dataDir,now:()=>FIXED_NOW,env:{CHAOS_AI_PROVIDER:'groq-free',GROQ_API_KEY:'qualification-fixture-secret'},
      fetcher:async(url,options)=>{calls.push(url);return new Response(JSON.stringify(url.endsWith('/models')?{data:[{id:'openai/gpt-oss-120b'}]}:{choices:[{message:{content:JSON.stringify(raw)}}]}));}});
    assert.equal(calls.length,2);assert.equal(report.results[0].passed,true);
    assert.match(report.results[0].providerEvidence[0].rawResponse,/Original synthetic model summary/);
    assert.equal(JSON.stringify(report).includes('qualification-fixture-secret'),false);
    assert.equal(JSON.stringify(report).includes('qualification-synthetic-actor'),false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir,'ai-free-usage.json'))).count,1);
    assert.equal(report.evidence,'synthetic');assert.equal(report.inferenceRun,false);assert.equal(report.qualified,false);
  });
});

test('narration stays manual review only even with valid synthetic structure',async()=>{
  const report=await runQualification({mode:'narration',requestBudget:3,now:()=>FIXED_NOW,elapsedNow:()=>100});
  assert.equal(report.results.length,3);
  assert.equal(report.manualReviewRequired,true);
  assert.equal(report.summary.semanticReviewRequired,true);
  assert.equal(report.summary.boundedBatchPassed,false);
  assert.equal(report.qualified,false);
  for(const row of report.results){
    assert.equal(row.structureValid,true,row.id);
    assert.equal(row.validated,true,row.id);
    assert.equal(row.manualReview.decision,'pending');
    assert.equal(row.passed,false);
  }
});

test('a simulated provider rate limit stops the batch without retries or later requests',async()=>{
  await withDataDir(async dataDir=>{
    writeLedger(dataDir);let calls=0;
    const report=await runQualification({live:true,requestBudget:6,dataDir,now:()=>FIXED_NOW,wait:async()=>{},env:{CHAOS_AI_PROVIDER:'groq-free',GROQ_API_KEY:'synthetic-key-only'},
      fetcher:async url=>{calls++;return url.endsWith('/models')?new Response(JSON.stringify({data:[{id:'openai/gpt-oss-120b'}]})):new Response('{}',{status:429});}});
    assert.equal(calls,2);assert.equal(report.results.length,1);assert.match(report.stopped,/rate limit/i);
    assert.equal(report.summary.completeCaseSet,false);assert.equal(report.qualified,false);
    assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir,'ai-free-usage.json'))).count,1);
  });
});
test('a rejected provider credential stops after one attempt instead of spending later cases',async()=>{await withDataDir(async dataDir=>{writeLedger(dataDir);let completions=0;const report=await runQualification({live:true,requestBudget:6,dataDir,now:()=>FIXED_NOW,wait:async()=>{},env:{CHAOS_AI_PROVIDER:'groq-free',GROQ_API_KEY:'synthetic-key-only'},fetcher:async url=>{if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'openai/gpt-oss-120b'}]}));completions++;return new Response('{}',{status:401});}});assert.equal(completions,1);assert.equal(report.results.length,1);assert.match(report.stopped,/no retry/);assert.equal(JSON.parse(fs.readFileSync(path.join(dataDir,'ai-free-usage.json'))).count,1);});});
