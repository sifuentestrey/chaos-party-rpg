/** AI DM environmental adjudication boundary.
 * The DM may judge plausible use of a VERIFIED world object, but cannot
 * fabricate art, collision, objects, locations or successful state changes.
 * Deterministic, side-effect-free; authoritative world executor owns commits.
 */
const ACTIONS=new Set(['push','pull','take','hide','ignite','extinguish','break','repair','move','climb','inspect','drink','move_north','move_south','move_east','move_west']);
const ABILITIES=new Set(['strength','dexterity','wisdom','none']);
const CAPABILITY={push:'movable',pull:'movable',move:'movable',take:'portable',hide:'concealment',ignite:'flammable',extinguish:'extinguishable',break:'breakable',repair:'repairable',climb:'climbable',drink:'drinkable'};
const NATIVE_ABILITIES={move:'strength',break:'strength',ignite:'wisdom',repair:'dexterity',extinguish:'none',inspect:'none',drink:'none'};
const DIRECTIONAL=/^move_(north|south|east|west)$/;
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
 // The optional DM may *suggest* a visible distant native object for a
 // server-driven walk. Actual execution always rechecks arm's reach.
 const maxReach=context.allowApproach===true&&object.nativeAdapter===true?Math.min(18,Math.max(0,context.maxReach??1)):
  Math.min(2,Math.max(0,context.maxReach??1));
 if(dist>maxReach)return {accepted:false,reason:'Object is out of reach'};
 const direction=DIRECTIONAL.exec(action)?.[1]||null;
 const resolvedAction=direction?'move':action;
 const capability=CAPABILITY[resolvedAction];
 if(capability&&object.capabilities?.[capability]!==true)return {accepted:false,reason:'Existing native object does not support that action'};
 // Legacy tree-only adapter is deliberately narrow. Expanded actions require
 // an actual native object adapter and the authoritative executor on the server.
 const native=context.authoritativeNativeExecutor===true&&object.nativeAdapter===true;
 if(!native){
  if(!['break','ignite'].includes(action))return {accepted:false,reason:'No authoritative native execution adapter for this environmental action'};
  if(action==='break'&&(ability!=='strength'||dc!==14))return {accepted:false,reason:'Native tree felling uses the original strength-style D20 DC 14'};
 }else{
  if(!Object.hasOwn(NATIVE_ABILITIES,resolvedAction)||resolvedAction==='move'&&!direction)
   return {accepted:false,reason:'No authoritative native execution adapter for this environmental action'};
  const expectedDc=['break','move'].includes(resolvedAction)?object.dc??14:resolvedAction==='ignite'?10:resolvedAction==='repair'?12:0;
  if(ability!==NATIVE_ABILITIES[resolvedAction]||dc!==expectedDc)
   return {accepted:false,reason:'The native action must use its engine-owned ability and difficulty'};
  if(resolvedAction==='repair'&&object.condition!=='broken')return {accepted:false,reason:'Only a broken native object can be repaired'};
  if(resolvedAction==='extinguish'&&object.condition!=='burning')return {accepted:false,reason:'The native object is not burning'};
 }
 if(action==='ignite'&&object.wet===true)return {accepted:false,reason:'Object is too wet to ignite'};
 if(context.actor?.active!==true)return {accepted:false,reason:'Actor is not active'};
 return {accepted:true,action:resolvedAction,targetId,ability,dc,description,direction,destination:judgment.destination??null,
  // A DM recommendation is never an executed outcome. The server still rolls,
  // changes persistent world state and reconciles the real native renderer.
  requiresAuthoritativeExecution:true};
}
export const environmentJudgmentSchema=Object.freeze({
 action:[...ACTIONS],ability:[...ABILITIES],targetId:'existing verified native object ID',
 dc:'integer 0..30',description:'short rationale, not a claim of success',
 direction:'move_north/move_south/move_east/move_west for native objects; the engine verifies the entire destination footprint'
});
