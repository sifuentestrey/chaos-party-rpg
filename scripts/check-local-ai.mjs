import {createLocalGameMaster} from '../src/local-game-master.mjs';
import {createRoom,addPlayer,startGame,submit} from '../public/core.js';
import {validateAIPlan} from '../public/ai-plan.js';
const ai=createLocalGameMaster();
try{
  const status=await ai.check();console.log(status.message);
  if(!status.available){console.log('No real-model inference was run. The game can still use its existing rules.');process.exitCode=1;}
  else {
    const room=createRoom(),actor=addPlayer(room,{token:'local-ai-readiness-only',name:'Readiness Rogue'});startGame(room);
    submit(room,actor.id,{requestId:'ai-readiness',text:'Make that carpet mine'});
    const at=performance.now(),answer=await ai.interpret(room,actor.id,5500),plan=validateAIPlan(answer.plan,room,actor.id);
    console.log(JSON.stringify({model:answer.model,elapsedMs:Math.round(performance.now()-at),interpretation:plan.summary,verb:plan.verb,target:plan.target.kind,correct:plan.verb==='take'&&plan.target.kind==='rug'}));
    if(plan.verb!=='take'||plan.target.kind!=='rug')process.exitCode=1;
  }
}catch(e){console.error('Local model check failed:',e.message);process.exitCode=1;}finally{ai.close();}
