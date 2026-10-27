// Default execution is synthetic. Live requests require an existing shared ledger.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createFreeAIBudget} from '../src/free-ai-budget.mjs';
import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {applyAIPlan,validateAIPlan} from '../public/ai-plan.js';
import {advance} from '../public/core.js';
import {narrationContext,validateNarration} from '../src/dm-narrator.mjs';
import {DM_NARRATION_CASES,prepareDMNarrationCase} from './dm-narration-cases.mjs';
import {QUALIFICATION_CASES,prepareQualificationCase,qualificationState,scoreQualificationPlan,checkQualificationState} from './ai-qualification-cases.mjs';

const caps={interpretation:6,narration:3},all=checks=>Object.values(checks).every(value=>value===true);
const reviewQuestions=['Does every sentence follow the canonical outcome, including blocked attempts?','Are rewards, ownership, injuries, relationships and reactions faithful to supplied facts?','Is memory used without inventing events, and is dialogue brief and suitable for family play?'];
function resolvedEvidence(row,prepared,now){
  const {room}=prepared;advance(room,Math.max(now(),room.turn.deadline+1));
  row.stateChecks=checkQualificationState(prepared);row.stateChecksPassed=all(row.stateChecks);row.after=qualificationState(room);
  row.resolution={success:room.result.success,blocked:room.result.blocked,action:room.result.action,narration:room.result.narration,changes:room.result.changes,roll:room.result.roll};
}
export function qualificationPreflight({dataDir,requestBudget,mode='interpretation',now=Date.now()}={}){
  const denied=reason=>({allowed:false,reason});
  if(!Object.hasOwn(caps,mode)||!Number.isInteger(requestBudget)||requestBudget<1||requestBudget>caps[mode])return denied('An explicit request budget of 1–'+(caps[mode]||6)+' is required.');
  if(!dataDir)return denied('Select the existing shared persistent ledger directory.');
  const ledger=path.resolve(dataDir,'ai-free-usage.json');
  try{
    if(!fs.statSync(ledger).isFile())return denied('The existing shared ledger is required; no new ledger is created.');
    const state=JSON.parse(fs.readFileSync(ledger,'utf8')),today=new Date(now).toISOString().slice(0,10);
    if(state.day>today)return denied('The shared ledger is future-dated; no provider contact is allowed.');
    const allowance=createFreeAIBudget(dataDir,{now:()=>now}).status();
    if(allowance.state!=='ready')return denied('The shared ledger is invalid; no provider contact is allowed.');
    const result={allowed:allowance.remaining>=requestBudget&&allowance.minuteRemaining>0,ledger,day:state.day,count:state.count,allowance};
    return {...result,reason:result.allowed?'Existing shared allowance is sufficient.':'The shared daily or minute allowance cannot cover this batch.'};
  }catch{return denied('The existing shared ledger is missing or invalid; no provider contact is allowed.');}
}
async function responseText(response){
  const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw Error('Qualification response exceeded 65536 bytes.');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
  finally{void reader.cancel().catch(()=>{});}
}
export async function runQualification({mode='interpretation',requestBudget,live=false,dataDir,env=process.env,aiFactory,fetcher,now=Date.now,elapsedNow=()=>performance.now(),wait=ms=>new Promise(r=>setTimeout(r,ms)),onProgress=()=>{},sourceCommit=null,sourceDirty=null}={}){
  if(!Object.hasOwn(caps,mode))throw Error('Unknown qualification mode.');
  if(!live&&requestBudget===undefined)requestBudget=caps[mode];
  const preflight=qualificationPreflight({dataDir,requestBudget,mode,now:now()}),injected=!!(aiFactory||fetcher);
  const report={version:1,createdAt:new Date(now()).toISOString(),sourceCommit,sourceDirty,mode,dryRun:!live,evidence:live&&!injected?'live-provider':'synthetic',inferenceRun:false,qualified:false,
    productionBudgetMs:5500,preflight,requestBudget,hardwareIsTargetMac:false,results:[],manualReviewRequired:mode==='narration'};
  const finish=()=>{
    report.inferenceRun=report.results.some(r=>r.inferenceRun);
    const complete=report.results.length===caps[mode]&&(report.evidence!=='live-provider'||report.results.every(r=>r.inferenceRun));
    report.summary={completed:report.results.length,completeCaseSet:complete,passed:report.results.filter(r=>r.passed).length,
      boundedBatchPassed:mode==='interpretation'&&report.evidence==='live-provider'&&complete&&report.results.every(r=>r.passed),
      semanticReviewRequired:mode==='narration',qualified:false};
    onProgress(report);return report;
  };
  if(live&&!preflight.allowed){report.stopped=preflight.reason;return finish();}
  if(!Number.isInteger(requestBudget)||requestBudget<1||requestBudget>caps[mode])throw Error('Invalid bounded request budget.');
  if(live&&env.CHAOS_AI_PROVIDER!=='groq-free'){report.stopped='Live qualification requires the explicitly selected existing groq-free provider.';return finish();}
  const evidence=[];
  const recordingFetch=async(url,options)=>{
    const row=url.endsWith('/chat/completions')?{request:JSON.parse(options.body)}:null;
    if(row)evidence.push(row); // Never store authorization headers or credentials.
    const response=await (fetcher||fetch)(url,options);
    if(row&&response.ok){row.rawResponse=await responseText(response);row.status=response.status;return new Response(row.rawResponse,{status:response.status,headers:response.headers});}
    if(row)row.status=response.status;return response;
  };
  const ai=live||aiFactory?(aiFactory||createLocalGameMaster)({env:{...env,CHAOS_AI_ACTION_CONTRACT:'on',CHAOS_AI_NARRATION:mode==='narration'?'on':'off'},dataDir,maxInferenceMs:5500,fetcher:recordingFetch}):null;
  try{
    if(ai){const status=await ai.check();if(!status.available){report.stopped='The selected model is unavailable.';return finish();}report.model=status.model;}
    const cases=mode==='interpretation'?QUALIFICATION_CASES.map(c=>c.id):DM_NARRATION_CASES;
    for(const id of cases.slice(0,requestBudget)){
      if(live){const gate=qualificationPreflight({dataDir,requestBudget:requestBudget-report.results.length,mode,now:now()});if(!gate.allowed){report.stopped=gate.reason;break;}}
      const startedAt=now(),began=elapsedNow(),evidenceStart=evidence.length;
      const row={id,inferenceRun:false,passed:false,validated:false,applied:false};
      let prepared;
      try{
        if(mode==='interpretation'){
          prepared=prepareQualificationCase(id,startedAt);const {room,actor}=prepared,turn=room.turn;
          row.attempt=prepared.text;row.expected=prepared.expectedPlan;row.before=prepared.before;row.nativeLocked=!!turn.worldLocked;row.deadline=turn.deadline;
          const budget=Math.min(5500,turn.deadline-now()-1000);
          row.budgetMs=budget;
          if(budget<=0)throw Error('No interpretation time remained.');
          const answer=ai?await ai.interpret(structuredClone(room),actor.id,budget,prepared):{plan:prepared.expectedPlan,model:'synthetic-fixture'};
          row.elapsedMs=Math.round(elapsedNow()-began);row.withinLiveBudget=row.elapsedMs<=budget&&now()<turn.deadline-800;
          row.actual=answer.plan;row.model=answer.model;row.usage=answer.usage;row.checks=scoreQualificationPlan(answer.plan,prepared);
          row.checks.noPrematureMutation=JSON.stringify(qualificationState(room))===JSON.stringify(prepared.before);
          validateAIPlan(answer.plan,room,actor.id);row.validated=true;
          row.applied=applyAIPlan(room,turn.id,answer.plan,answer.model,now()); // Actual completion time; never deadline - 1000.
          resolvedEvidence(row,prepared,now);
          row.passed=all(row.checks)&&row.validated&&row.applied&&row.withinLiveBudget&&row.stateChecksPassed;
        }else{
          const room=prepareDMNarrationCase(id),context=narrationContext(room),before=qualificationState(room);
          row.context=context;row.before=before;row.manualReview={decision:'pending',notes:'',questions:reviewQuestions};
          room.phase='reveal';room.deadline=startedAt+6500;
          const budget=Math.min(5500,room.deadline-now()-250);if(budget<=0)throw Error('No narration time remained.');
          row.budgetMs=budget;
          const answer=ai?await ai.narrate(structuredClone(room),budget):{story:{text:'Synthetic narrator fixture only; no model was qualified.',dialogue:[]},model:'synthetic-fixture'};
          row.elapsedMs=Math.round(elapsedNow()-began);row.withinLiveBudget=row.elapsedMs<=budget&&now()<room.deadline;
          row.story=validateNarration({turnId:context.turnId,outcome:context.outcome.status,text:answer.story.text,dialogue:answer.story.dialogue.map(({speakerId,line})=>({speakerId,line}))},context);
          row.model=answer.model;row.usage=answer.usage;row.validated=true;row.structureValid=true;
          row.after=qualificationState(room);row.stateChecksPassed=JSON.stringify(row.after)===JSON.stringify(before);
          // Structural validity and latency cannot automatically pass narrative meaning.
        }
      }catch(e){row.error=e.message;row.elapsedMs=Math.round(elapsedNow()-began);row.withinLiveBudget=Number.isFinite(row.budgetMs)&&row.elapsedMs<=row.budgetMs&&now()<(mode==='interpretation'?row.deadline-800:startedAt+6500);}
      if(prepared&&!row.resolution)resolvedEvidence(row,prepared,now);
      row.providerEvidence=evidence.slice(evidenceStart);row.inferenceRun=report.evidence==='live-provider'&&row.providerEvidence.length>0;
      report.results.push(row);report.inferenceRun||=row.inferenceRun;onProgress(report);
      if(live&&ai.status?.().state==='rate-limited'){report.stopped='Provider rate limit reached; no retry or further case was sent.';break;}
      if(live&&report.results.length<Math.min(requestBudget,caps[mode]))await wait(26000);
    }
    return finish();
  }finally{ai?.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const args=process.argv.slice(2);let live=false,dryRun=false,mode='interpretation',budget,outputFile;
  for(let i=0;i<args.length;i++){
    if(args[i]==='--live')live=true;
    else if(args[i]==='--dry-run')dryRun=true;
    else if(args[i]==='--narration')mode='narration';
    else if(args[i]==='--budget'){if(!/^\d+$/.test(args[i+1]||''))throw Error('Supply an integer request budget.');budget=Number(args[++i]);}
    else if(args[i]==='--output'){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Supply an evidence file path.');outputFile=args[++i];}
    else throw Error('Unknown qualification argument: '+args[i]);
  }
  if(live&&dryRun)throw Error('Select either live or dry-run execution.');
  const dataDir=process.env.CHAOS_AI_BENCHMARK_DATA_DIR||process.env.CHAOS_DATA_DIR;
  const output=path.resolve(outputFile||`artifacts/ai-qualification-${mode}-${live?'live':'dry-run'}.json`);
  if(dataDir&&(output===path.resolve(dataDir)||output.startsWith(path.resolve(dataDir)+path.sep)))throw Error('Qualification evidence must be outside the shared ledger/campaign directory.');
  const save=report=>{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));};
  let sourceCommit=null,sourceDirty=null;
  try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();sourceDirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();}catch{}
  const report=await runQualification({live,mode,dataDir,requestBudget:budget,onProgress:save,sourceCommit,sourceDirty});
  console.log(JSON.stringify({output,preflight:report.preflight,summary:report.summary,inferenceRun:report.inferenceRun,qualified:false}));
  if(live&&(!report.inferenceRun||report.results.some(r=>r.error)||mode==='interpretation'&&!report.summary.boundedBatchPassed))process.exitCode=1;
  else if(live&&mode==='narration')process.exitCode=2; // Evidence captured; semantic review is still pending.
}
