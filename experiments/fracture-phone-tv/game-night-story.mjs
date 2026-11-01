/**
 * A small, durable game-night situation that turns confirmed actions into
 * story pressure. It is deliberately engine-agnostic: it never creates an
 * entity or claims a native action succeeded. The bridge owns the state and
 * the native engine still owns every physical outcome.
 */
import {randomUUID} from 'node:crypto';

export const GAME_NIGHT_STORY_ID='refuge-whispers-v1';

const clean=value=>String(value||'').replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,220);
const name=value=>clean(value).slice(0,40);
const terminal=new Set(['succeeded','failed','blocked']);

export function startGameNightStory(now=Date.now(),id=randomUUID()){
 return {version:1,id:GAME_NIGHT_STORY_ID,instanceId:id,status:'active',stage:'theft',startedAt:now,
  clues:0,heat:0,suspicion:0,discoveries:0,beats:[],seen:[],prompt:'Something precious is missing from The Refuge. Decide who to trust, and follow the trouble wherever it leads.'};
}

function beat(story,stage,text,prompt,now){
 story.stage=stage;story.prompt=prompt;story.beats=[...(story.beats||[]),{stage,text,at:now}].slice(-8);
 return {text,major:true,public:true,situation:story.prompt};
}

/** Apply one confirmed receipt. Returns a public story beat only when the
 * situation changes enough to deserve the TV timeline. */
export function advanceGameNightStory(story,{player,attempt,receipt,actor}={},now=Date.now()){
 if(!story||story.id!==GAME_NIGHT_STORY_ID||story.version!==1||story.status!=='active'||!receipt||!terminal.has(receipt.status)||!attempt)return null;
 if(receipt.id&&story.seen?.includes(receipt.id))return null;
 if(receipt.id)story.seen=[...(story.seen||[]),receipt.id].slice(-64);
 const verb=String(attempt.verb||'unknown'),status=receipt.status,actorName=name(player)||'Someone';
 const target=name(receipt.combat?.targetName||receipt.object?.name||attempt.target||'the trouble');
 const success=status==='succeeded';
 const combat=!!receipt.combat;
 if(combat&&receipt.combat.dead===true)story.heat+=1;
 if(success&&['talk','quest'].includes(verb))story.clues+=1;
 if(success&&['loot','steal','open'].includes(verb))story.suspicion+=1;
 if(success&&['creative','environment'].includes(verb)){
  const objectVerb=String(receipt.object?.verb||'');
  if(['ignite','break','fell'].includes(objectVerb))story.heat+=2;
  if(['inspect','take','drink','repair'].includes(objectVerb))story.discoveries+=1;
 }
 if(success&&['enter','exit'].includes(verb))story.discoveries+=1;

 // The first clue gives the party a lead without forcing a quest route.
 if(story.stage==='theft'&&story.clues>=1)
  return beat(story,'whispers',`${actorName} finds a witness whose story does not match the guard's. A muddy three-toed trail leads toward the woods.`,`The Refuge is whispering. Follow the trail, question the witnesses, or make your own trouble.`,now);
 // Mischief is allowed to become a consequence instead of a dead end.
 if(story.stage==='whispers'&&story.heat>=2)
  return beat(story,'alarm',`The commotion around ${target} puts The Refuge on edge. Doors slam, voices rise, and the trail may not stay cold.`,`The village is on alert. Calm the panic, exploit it, or find out what the noise has attracted.`,now);
 if(['whispers','alarm'].includes(story.stage)&&story.suspicion>=1)
  return beat(story,'accusations',`${actorName}'s actions give the villagers someone new to blame. The missing bell becomes an accusation instead of a rumor.`,`Everyone has a theory. Find proof, defend someone, or let the accusations turn to your advantage.`,now);
 if(['whispers','alarm','accusations'].includes(story.stage)&&story.discoveries>=2)
  return beat(story,'revelation',`The party uncovers enough fragments to see a pattern: the theft and the strange creature are connected.`,`The pattern is real. Decide whether to pursue it together or split the risk.`,now);
 if(story.stage==='revelation'&&combat&&success)
  return beat(story,'reckoning',`${actorName}'s fight changes the balance around The Refuge. Whatever is hiding nearby now knows the party is here.`,`The hidden threat has noticed you. Press the advantage, prepare the village, or turn the chaos toward a new plan.`,now);
 // Failed attempts still create texture, but do not advance the plot on their
 // own. A short prompt keeps the next choice open without pretending success.
 if(!success&&story.stage==='theft'&&story.beats.length===0)
  return {text:`${actorName} fails to settle the question, and the missing bell remains unexplained.`,major:false,public:true,situation:story.prompt};
 return null;
}

export function gameNightStoryView(story){
 if(!story||story.id!==GAME_NIGHT_STORY_ID||story.version!==1)return null;
 return {id:story.id,instanceId:story.instanceId,status:story.status,stage:story.stage,prompt:clean(story.prompt),
  clues:story.clues||0,heat:story.heat||0,suspicion:story.suspicion||0,discoveries:story.discoveries||0,
  beats:(story.beats||[]).slice(-4).map(b=>({stage:b.stage,text:clean(b.text),at:b.at}))};
}
