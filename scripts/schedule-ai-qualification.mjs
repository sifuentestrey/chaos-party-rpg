// One bounded free-provider qualification after the existing allowance permits it.
// Never creates/resets a quota ledger, retries inference, or enables game narration.
import {createConnection} from 'node:net';
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {qualificationPreflight,runQualification} from './ai-qualification.mjs';
export function nextUTCWindow(now){const d=new Date(now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1,0,0,10);}
export function scheduleGate(preflight){return !!preflight.allowance&&preflight.allowance.state==='ready'&&typeof preflight.count==='number';}
export function probeLocalServer(port){return new Promise((resolve,reject)=>{let done=false;const socket=createConnection({host:'127.0.0.1',port});const finish=(error,present)=>{if(done)return;done=true;socket.destroy();error?reject(error):resolve(present);};socket.once('connect',()=>finish(null,true));socket.once('error',error=>error.code==='ECONNREFUSED'?finish(null,false):finish(error));socket.setTimeout(800,()=>finish(Error('Local port check timed out.')));});}
export async function ensureServerStopped(probe=()=>probeLocalServer(Number(process.env.PORT)||4747)){try{if(await probe())throw Error('PORT_IN_USE');}catch{throw Error('Cannot confirm the local game server is stopped; no inference started.');}}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,Math.min(60000,ms)));
export async function scheduleQualification(){
 const dataDir=process.env.CHAOS_AI_BENCHMARK_DATA_DIR||process.env.CHAOS_DATA_DIR;
 if(!dataDir||process.env.CHAOS_AI_PROVIDER!=='groq-free')throw Error('Select the existing persistent counter and groq-free provider.');
 if(!process.env.GROQ_API_KEY)throw Error('The existing private provider connection is unavailable.');
 const output=path.resolve('artifacts/scheduled-ai'),lock=path.join(dataDir,'ai-qualification-schedule.lock');fs.mkdirSync(output,{recursive:true});
 if(output===path.resolve(dataDir)||output.startsWith(path.resolve(dataDir)+path.sep))throw Error('Qualification evidence must stay outside the persistent counter/campaign directory.');
 const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim(),sourceCommit=git(['rev-parse','HEAD']);
 if(git(['status','--porcelain']))throw Error('Commit the source before scheduling qualification.');
 const initial=qualificationPreflight({dataDir,requestBudget:6});if(!scheduleGate(initial))throw Error('The existing shared counter is invalid, future-dated or unavailable; no scheduling or provider contact.');
 const scheduledAt=initial.allowance.remaining>=9?Date.now()+(initial.allowance.minuteRemaining>0?0:60000):nextUTCWindow(Date.now());
 const fd=fs.openSync(lock,'wx',0o600);fs.writeSync(fd,JSON.stringify({pid:process.pid,sourceCommit,scheduledAt:new Date(scheduledAt).toISOString()}));fs.closeSync(fd);
 const state={sourceCommit,pid:process.pid,scheduledAt:new Date(scheduledAt).toISOString(),status:'scheduled',requestBudget:9,inferenceRun:false,qualified:false};
 const save=()=>fs.writeFileSync(path.join(output,'status.json'),JSON.stringify(state,null,2));save();console.log(JSON.stringify(state));
 try{
  while(Date.now()<scheduledAt)await sleep(scheduledAt-Date.now());
  if(git(['rev-parse','HEAD'])!==sourceCommit||git(['status','--porcelain']))throw Error('Source changed while waiting; no inference started.');
  await ensureServerStopped();
  const gate=qualificationPreflight({dataDir,requestBudget:6});if(!gate.allowed||gate.allowance.remaining<9)throw Error('The existing allowance cannot cover nine attempts; no inference started.');
  state.status='running';save();
  for(const [mode,budget] of [['interpretation',6],['narration',3]]){
   const report=await runQualification({mode,requestBudget:budget,live:true,dataDir,sourceCommit,sourceDirty:false,onProgress:report=>{fs.writeFileSync(path.join(output,mode+'.json'),JSON.stringify(report,null,2));if(report.inferenceRun){state.inferenceRun=true;save();}}});
   state[mode]={completed:report.summary.completed,passed:report.summary.passed,stopped:report.stopped||null};save();if(report.stopped)throw Error(report.stopped);
  }
  state.status=state.interpretation?.completed===6&&state.narration?.completed===3?'review-required':'blocked';state.message=state.status==='review-required'?'Evidence captured; inspect real accuracy, latency and every narration sentence before acceptance. Narration remains off.':'Qualification was incomplete. Narration remains off; inspect the saved evidence.';save();console.log(JSON.stringify(state));
 }catch(error){state.status='blocked';state.message=error.message;save();throw error;}
 finally{fs.unlinkSync(lock);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await scheduleQualification();
