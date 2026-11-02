import {isStarter,STARTERS,BACKGROUNDS} from './character-profile.mjs';
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
export function validRole(role){return typeof role==='string'&&(Object.hasOwn(ROLES,role)||isStarter(role));}
export function roleName(role){return validRole(role)?(ROLES[role]?.name||STARTERS[role]?.name||'Unassigned'):'Unassigned';}
export function objectSkillBonus(role,verb){return validRole(role)&&ROLES[role]?.skills?.includes(verb)?3:0;}
export const validBackground=background=>typeof background==='string'&&Object.hasOwn(BACKGROUNDS,background);
export const backgroundCheckTypes=background=>validBackground(background)?[...BACKGROUNDS[background].checks]:[];
/** Normalize the two point pool without trusting phone-supplied keys or values. */
export function normalizeBackgroundPoints(background,points,{requireFull=false}={}){
 if(!validBackground(background)){if(points&&typeof points==='object'&&Object.keys(points).length)throw Error('Background points require a supported background.');return {};}
 if(points===undefined||points===null)points={};
 if(!points||typeof points!=='object'||Array.isArray(points))throw Error('Background points must be an object.');
 const checks=backgroundCheckTypes(background),out={};
 for(const key of Object.keys(points))if(!checks.includes(key))throw Error('Choose a check type granted by this background.');
 for(const key of checks){const value=points[key]??0;if(!Number.isInteger(value)||value<0||value>2)throw Error('Background points must be whole numbers from 0 to 2.');out[key]=value;}
 const total=Object.values(out).reduce((sum,value)=>sum+value,0);
 if(total>2||requireFull&&total!==2)throw Error(requireFull?'Assign exactly two background points.':'A background can use at most two points.');
 return out;
}
const backgroundAliases=Object.freeze({steal:'sneak'});
const normalizedCheck=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,'_');
export function backgroundCheckBonus(background,points,{ability,verb}={}){
 if(!validBackground(background))return 0;
 let normalized=normalizeBackgroundPoints(background,points);
 const checks=backgroundCheckTypes(background),candidates=[ability,verb].map(normalizedCheck).filter(Boolean);
 for(const candidate of candidates){const check=backgroundAliases[candidate]||candidate;if(checks.includes(check))return BACKGROUNDS[background].baseBonus+(normalized[check]||0);}
 return 0;
}
export const backgroundBonus=backgroundCheckBonus;
/** A native-authenticated actor receives these properties only from the local
 * bridge, not from a phone command. A legacy actor has no bonus or perk.
 */
export function resolveObjectRoll({role,perk,background,backgroundPoints,ability,verb,dc,roll,rolls,rng}){
 if(!Number.isInteger(roll)||roll<1||roll>20||!Number.isFinite(dc))throw Error('Invalid original D20 check');
 const initial=roll,classBonus=objectSkillBonus(role,verb),backgroundBonusValue=backgroundCheckBonus(background,backgroundPoints,{ability,verb}),bonus=classBonus+backgroundBonusValue;
 // Canonical Chaos charming is +2 on social checks. The experimental bridge
 // has one genuine social D20 check: NPC amends; it does not invent dialogue rolls.
 const perkBonus=perk==='charming'&&verb==='social'?2:0;
 let rerolled=null;
 if(perk==='lucky'&&roll<=3){
  if(!rng||typeof rng.int!=='function')throw Error('Original RNG required for Lucky-ish');
  rerolled=roll;roll=rng.int(1,20);
 }
 return {roll,initial,rerolled,bonus,classBonus,backgroundBonus:backgroundBonusValue,perkBonus,success:roll===20||(roll!==1&&roll+bonus+perkBonus>=dc)};
}
