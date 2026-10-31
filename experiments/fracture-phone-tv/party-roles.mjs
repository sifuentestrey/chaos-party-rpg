/** Original Chaos Party role identifiers and Lucky-ish rule, projected only onto
 * original Chaos object D20 checks. Native Fracture combat/HP/gear are untouched.
 * Source: canonical public/core.js ROLES/PERKS and resolve() skill/luck logic.
 */
export const ROLES=Object.freeze({
 rogue:{name:'Rogue',skills:['steal','sneak']},
 bard:{name:'Bard',skills:['social','dance']},
 wizard:{name:'Wizard',skills:['magic','inspect']},
 knight:{name:'Knight',skills:['attack','break']},
 healer:{name:'Healer',skills:['heal','social']},
 wildcard:{name:'Wildcard',skills:['weird']}
});
export const PERKS=Object.freeze({lucky:'Lucky-ish',charming:'Suspiciously charming'});
export const validPerk=perk=>typeof perk==='string'&&Object.hasOwn(PERKS,perk);
export function validRole(role){return typeof role==='string'&&Object.hasOwn(ROLES,role);}
export function roleName(role){return validRole(role)?ROLES[role].name:'Unassigned';}
export function objectSkillBonus(role,verb){return validRole(role)&&ROLES[role].skills.includes(verb)?3:0;}
/** A native-authenticated actor receives these properties only from the local
 * bridge, not from a phone command. A legacy actor has no bonus or perk.
 */
export function resolveObjectRoll({role,perk,verb,dc,roll,rolls,rng}){
 if(!Number.isInteger(roll)||roll<1||roll>20||!Number.isFinite(dc))throw Error('Invalid original D20 check');
 const initial=roll,bonus=objectSkillBonus(role,verb);
 // Canonical Chaos charming is +2 on social checks. The experimental bridge
 // has one genuine social D20 check: NPC amends; it does not invent dialogue rolls.
 const perkBonus=perk==='charming'&&verb==='social'?2:0;
 let rerolled=null;
 if(perk==='lucky'&&roll<=3){
  if(!rng||typeof rng.int!=='function')throw Error('Original RNG required for Lucky-ish');
  rerolled=roll;roll=rng.int(1,20);
 }
 return {roll,initial,rerolled,bonus,perkBonus,success:roll===20||(roll!==1&&roll+bonus+perkBonus>=dc)};
}
