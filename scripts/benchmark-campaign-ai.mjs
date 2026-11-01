// Real endpoint only. Simulated protocol tests are explicitly separate.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {validateAIPlan} from '../public/ai-plan.js';
import {AI_CASES,prepareAICase,scoreInterpretation,summarizeAIResults} from './ai-acceptance-cases.mjs';
const timeout=Number(process.env.CHAOS_AI_BENCHMARK_TIMEOUT_MS||15000);
if(!Number.isInteger(timeout)||timeout<1000||timeout>120000)throw Error('Benchmark timeout must be 1000–120000 ms. Live gameplay remains capped at 5500 ms.');
const ai=createLocalGameMaster({maxInferenceMs:timeout,dataDir:process.env.CHAOS_AI_BENCHMARK_DATA_DIR||'work/ai-qualification-data'}),output=process.env.CHAOS_AI_BENCHMARK_OUTPUT||'artifacts/campaign-ai-benchmark.json',results=[];
try{
 const status=await ai.check();
 if(!status.available)results.push({inferenceRun:false,status});
 else for(const spec of AI_CASES){
  const prepared=prepareAICase(spec),began=performance.now();
  try{
   const answer=await ai.interpret(prepared.room,prepared.actor.id,timeout);validateAIPlan(answer.plan,prepared.room,prepared.actor.id);
   const elapsedMs=Math.round(performance.now()-began);
   results.push({id:spec.id,attempt:prepared.text,expected:spec.expected,actual:answer.plan,...scoreInterpretation(answer.plan,prepared,spec),elapsedMs,withinLiveBudget:elapsedMs<5500,usage:answer.usage,model:answer.model,inferenceRun:true});
  }catch(e){results.push({id:spec.id,expected:spec.expected,error:e.message,elapsedMs:Math.round(performance.now()-began),correct:false,withinLiveBudget:false,inferenceRun:true});}
  console.log(JSON.stringify(results.at(-1)));
  if(status.hosted&&spec!==AI_CASES.at(-1))await new Promise(resolve=>setTimeout(resolve,16000));
 }
 const summary=summarizeAIResults(results),report={host:{platform:process.platform,arch:process.arch,logicalCPUs:os.cpus().length,totalMemoryBytes:os.totalmem()},productionBudgetMs:5500,diagnosticTimeoutMs:timeout,hardwareIsTargetMac:false,summary,results};
 fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(summary));
 if(!summary.qualificationPassed)process.exitCode=1;
}finally{ai.close();}
