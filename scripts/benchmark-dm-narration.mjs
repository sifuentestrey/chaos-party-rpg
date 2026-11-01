// Live service only. Automated validation checks structure; humans judge story truth/quality.
import fs from 'node:fs';
import path from 'node:path';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {DM_NARRATION_CASES,prepareDMNarrationCase} from './dm-narration-cases.mjs';
import {narrationContext} from '../src/dm-narrator.mjs';
const ai=createLocalGameMaster({env:{...process.env,CHAOS_AI_NARRATION:'on'},dataDir:process.env.CHAOS_AI_BENCHMARK_DATA_DIR||'work/ai-qualification-data'});
const output=process.env.CHAOS_DM_BENCHMARK_OUTPUT||'artifacts/dm-narration-benchmark.json',results=[];

try{
  const status=await ai.check();
  if(!status.available){results.push({inferenceRun:false,status});process.exitCode=1;}
  else for(const id of DM_NARRATION_CASES){
    const room=prepareDMNarrationCase(id),context=narrationContext(room),began=performance.now();
    // The standalone test evaluates completed outcomes without a live reveal timer.
    try{const answer=await ai.narrate(room,5500);results.push({id,inferenceRun:true,elapsedMs:Math.round(performance.now()-began),model:answer.model,usage:answer.usage,context,story:answer.story,structureValid:true});}
    catch(e){results.push({id,inferenceRun:true,elapsedMs:Math.round(performance.now()-began),context,error:e.message,structureValid:false});}
    console.log(JSON.stringify(results.at(-1)));
    if(status.hosted&&id!=='remember-wayfarer-after-reload')await new Promise(r=>setTimeout(r,16000));
  }
  const times=results.filter(r=>r.structureValid).map(r=>r.elapsedMs).sort((a,b)=>a-b),percentile=p=>times.length?times[Math.min(times.length-1,Math.ceil(times.length*p)-1)]:null;
  const usage=results.filter(r=>Number.isFinite(r.usage?.promptTokens)&&Number.isFinite(r.usage?.completionTokens));
  const summary={cases:results.filter(r=>r.inferenceRun).length,structurallyValid:times.length,p50Ms:percentile(.5),p95Ms:percentile(.95),
    promptTokens:usage.reduce((n,r)=>n+r.usage.promptTokens,0),completionTokens:usage.reduce((n,r)=>n+r.usage.completionTokens,0),usageReportedFor:usage.length};
  const report={inferenceRun:results.some(r=>r.inferenceRun),hardwareIsTargetMac:false,host:{platform:process.platform,arch:process.arch},productionBudgetMs:5500,summary,semanticReviewRequired:true,qualified:false,
    review:['Does the story match success, failure or blocked outcome?', 'Does it honor the actual reaction and avoid executing a threat?',
      'Does it invent ownership, kinship, damage, coins or rewards?', 'Does the returning NPC remember only supplied canonical events?',
      'Is the dialogue funny, brief and appropriate for family play?'],results};
  fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));
  console.log(JSON.stringify({summary,semanticReviewRequired:true,qualified:false}));
  if(results.some(r=>r.structureValid===false))process.exitCode=1;
}finally{ai.close();}
