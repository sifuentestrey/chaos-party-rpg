/** AI DM environmental adjudication boundary.
 * The DM may judge plausible use of a VERIFIED world object, but cannot
 * fabricate art, collision, objects, locations or successful state changes.
 * Deterministic, side-effect-free; authoritative world executor owns commits.
 */
const ACTIONS=new Set(['push','pull','take','hide','ignite','extinguish','break','repair','move','climb']);
const ABILITIES=new Set(['strength','dexterity','wisdom','none']);
const CAPABILITY={push:'movable',pull:'movable',move:'movable',take:'portable',hide:'concealment',ignite:'flammable',extinguish:'flammable',break:'breakable',repair:'repairable',climb:'climbable'};
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export function validateEnvironmentJudgment(judgment,context={}){
 if(!judgment||typeof judgment!=='object'||Array.isArray(judgment))return {accepted:false,reason:'Invalid DM judgment'};
 const {action,targetId,ability,dc,description}=judgment;
 if(!ACTIONS.has(action)||!ABILITIES.has(ability)||!integer(dc,0,30))return {accepted:false,reason:'Invalid action or difficulty'};
 if(typeof targetId!=='string'||!targetId||typeof description!=='string'||description.length>240)return {accepted:false,reason:'Invalid target or explanation'};
 const objects=Array.isArray(context.objects)?context.objects:[];
 const object=objects.find(o=>o.id===targetId&&o.verifiedNative===true);
 if(!object)return {accepted:false,reason:'Target is not a verified existing native object'};
 if(object.condition==='broken'&&action!=='repair')return {accepted:false,reason:'Object is already destroyed'};
 if(object.scene!==context.scene||!object.tile||!context.actor?.tile)return {accepted:false,reason:'Object is not in the actor world'};
 const dist=Math.abs(object.tile.x-context.actor.tile.x)+Math.abs(object.tile.y-context.actor.tile.y);
 if(dist>Math.min(2,Math.max(0,context.maxReach??1)))return {accepted:false,reason:'Object is out of reach'};
 const capability=CAPABILITY[action];
 if(object.capabilities?.[capability]!==true)return {accepted:false,reason:'Existing native object does not support that action'};
 if(['push','pull','move'].includes(action)){
  const destination=judgment.destination;
  if(!destination||!integer(destination.x,0,100000)||!integer(destination.y,0,100000))return {accepted:false,reason:'Movement needs a real destination'};
  if(!Array.isArray(context.freeTiles)||!context.freeTiles.some(t=>t.x===destination.x&&t.y===destination.y))return {accepted:false,reason:'Destination is not verified clear'};
  if(Math.abs(destination.x-object.tile.x)+Math.abs(destination.y-object.tile.y)!==1)return {accepted:false,reason:'Object can only move one adjacent tile'};
 }
 if(action==='take'&&object.mass==='heavy')return {accepted:false,reason:'Object is too heavy to pick up'};
 if(action==='ignite'&&object.wet===true)return {accepted:false,reason:'Object is too wet to ignite'};
 if(context.actor?.active!==true)return {accepted:false,reason:'Actor is not active'};
 return {accepted:true,action,targetId,ability,dc,description,destination:judgment.destination??null,
  // A DM recommendation is never an executed outcome. The server still rolls,
  // changes persistent world state and reconciles the real native renderer.
  requiresAuthoritativeExecution:true};
}
export const environmentJudgmentSchema=Object.freeze({
 action:[...ACTIONS],ability:[...ABILITIES],targetId:'existing verified native object ID',
 dc:'integer 0..30',description:'short rationale, not a claim of success',
 destination:'required only for push/pull/move; one verified free adjacent tile'
});
