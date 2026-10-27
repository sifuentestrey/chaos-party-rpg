import fs from 'node:fs';
import path from 'node:path';
// Additional request protection. Provider account must itself remain on its Free Plan.
// One game process owns the data directory, as it does for campaign saves.
export function createFreeAIBudget(dataDir,{now=Date.now}={}){
 if(!dataDir)throw Error('Hosted free-tier AI requires a persistent data directory.');
 const file=path.join(dataDir,'ai-free-usage.json');
 return {reserve(){
  const time=now(),day=new Date(time).toISOString().slice(0,10);
  let state={version:1,day,count:0,recent:[]};
  if(fs.existsSync(file)){
   state=JSON.parse(fs.readFileSync(file,'utf8'));
   if(state.version!==1||!/^\d{4}-\d{2}-\d{2}$/.test(state.day)||!Number.isInteger(state.count)||state.count<0||!Array.isArray(state.recent)||state.recent.some(n=>!Number.isFinite(n)))throw Error('AI usage ledger is invalid; no provider request was sent.');
   // Do not reset a future-dated ledger if the system clock moved backwards.
   if(day>state.day){state.day=day;state.count=0;}
  }
  state.recent=state.recent.filter(t=>t>time-60000);
  if(state.count>=100)throw Error('Free AI local daily allowance reached. Rules remain available.');
  if(state.recent.length>=4)throw Error('Free AI is cooling down. Rules remain available.');
  state.count++;state.recent.push(time);
  fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
  const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(state),{mode:0o600});fs.renameSync(temp,file);
 }};
}
