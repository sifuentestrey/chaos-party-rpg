// Explicit side-by-side evaluation, never an automatic gameplay fallback.
import fs from 'node:fs';
import path from 'node:path';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {prepareAICase,scoreInterpretation} from './ai-acceptance-cases.mjs';
import {validateAIPlan,applyAIPlan} from '../public/ai-plan.js';
import {advance} from '../public/core.js';
const allCases=[
 {id:'puppet',setup:'craft',text:'Assemble my cloth strip and wood splinter into a white finger puppet worn on my hand',expected:{verb:'craft',sources:['item-1','item-2'],itemType:'wearable',slot:'hand',color:'#e4dcc8'}},
 {id:'bedtime-story',setup:'creature',text:'The wolf looks angry. I improvise a silly bedtime story until it relaxes',expected:{verb:'pacify',target:'beast-clearing'}},
 {id:'peace-offering',setup:'craft',recipient:true,text:'I offer Moss my wood splinter as a peace offering, retaining my cloth strip',expected:{verb:'give',item:'item-2',target:'Moss'}},
 {id:'patch-up',setup:'creature',text:'Patch up the wayfarer’s sore arm with the strip of fabric in my pocket',expected:{verb:'treat',target:'person-clearing'}},
 {id:'remote-chest',setup:'creature',text:'From this clearing, lift the tavern’s locked chest straight into my pockets without traveling',expected:{verb:'unsupported'}}
];
const wanted=process.env.CHAOS_CONTRACT_CASES?.split(',');
const cases=wanted?allCases.filter(c=>wanted.includes(c.id)):allCases;
const models=process.env.CHAOS_CONTRACT_MODELS?.split(',')||['openai/gpt-oss-20b','openai/gpt-oss-120b'];
const output=process.env.CHAOS_CONTRACT_OUTPUT,dataDir=process.env.CHAOS_AI_BENCHMARK_DATA_DIR;
if(!output||!dataDir)throw Error('Explicit report and disposable shared ledger paths required');
const report={cases,rows:[],summary:[],note:'Five fresh cases per explicitly selected model; native locks and outcome resolution recorded. Not a general reliability guarantee.'};
const save=()=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));};
let first=true,stop=false;
for(const model of models){
 const ai=createLocalGameMaster({env:{...process.env,CHAOS_AI_PROVIDER:'groq-free',CHAOS_AI_ACTION_CONTRACT:'on',CHAOS_AI_MODEL:model},dataDir,maxInferenceMs:5500});
 try{
  if(!(await ai.check()).available)throw Error('Model unavailable: '+model);
  for(const spec of cases){
   if(!first)await new Promise(r=>setTimeout(r,26000));first=false;
   const prepared=prepareAICase({...spec,id:spec.recipient?'ownership-transfer':spec.id}),{room,actor}=prepared,start=performance.now();
   const row={id:spec.id,model,attempt:prepared.text};
   try{
    const answer=await ai.interpret(room,actor.id,5500);row.elapsedMs=Math.round(performance.now()-start);row.actual=answer.plan;row.usage=answer.usage;
    Object.assign(row,scoreInterpretation(answer.plan,prepared,spec));validateAIPlan(answer.plan,room,actor.id);row.validated=true;
    const deadline=room.turn.deadline;row.nativeLocked=!!room.turn.worldLocked;row.applied=applyAIPlan(room,room.turn.id,answer.plan,model,deadline-1000);advance(room,deadline+1);
    row.resolution={success:room.result?.success,blocked:room.result?.blocked,text:room.result?.narration};
   }catch(e){row.elapsedMs=Math.round(performance.now()-start);row.correct=false;row.error=e.message;if(/quota|429/.test(e.message))stop=true;}
   report.rows.push(row);console.log(JSON.stringify(row));save();if(stop)break;
  }
 }finally{ai.close();}
 const rows=report.rows.filter(r=>r.model===model),times=rows.map(r=>r.elapsedMs).sort((a,b)=>a-b);
 report.summary.push({model,attempted:rows.length,passed:rows.filter(r=>r.correct&&r.validated&&r.elapsedMs<5500).length,p50Ms:times[Math.ceil(times.length*.5)-1],p95Ms:times[Math.ceil(times.length*.95)-1]});save();if(stop)break;
}
console.log(JSON.stringify(report.summary));
