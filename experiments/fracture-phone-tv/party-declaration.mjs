/** Opt-in, server-owned reaction window for original Chaos world checks.
 * Ordinary Fracture actions stay immediate. The declaration is NOT an engine
 * success or a global party lock; it becomes real only after native execution.
 */
import {creativeAttempt} from './chaos-world.mjs';
export const REACTION_MS=10000;
const d20WorldVerbs=new Set(['craft','attach','steal','appeal','break','move','ignite','extinguish','repair']);
export function stagedAction(text){
 const match=String(text||'').trim().match(/^(?:declare|announce|prepare)(?:\s+(?:that\s+)?(?:i\s+will\s+)?)?\s*[:\-]?\s+(.+)$/i);
 if(!match)return null;
 const action=match[1].trim(),parsed=creativeAttempt(action);
 if(/^(?:move|walk|run|go)\s+(?:left|right|up|down|north|south|east|west)(?:\s|$)/i.test(action)||!parsed||!d20WorldVerbs.has(parsed.verb))return {error:'Declare a supported Chaos D20 world action, such as craft, steal, push, break, repair or apologize. Ordinary movement and combat stay immediate.'};
 if(action.length>160)return {error:'Keep the announced action under 160 characters.'};
 return {text:action,intent:{verb:'creative',target:action}};
}
export function isReaction(text){
 const action=creativeAttempt(text);return ['assist','hinder'].includes(action?.verb)&&!['me','myself','yourself'].includes(String(action.recipient||'').toLowerCase());
}
export function publicDeclarations(pending,now=Date.now()){
 return [...pending.values()].filter(p=>p.dueAt>now).map(p=>({id:p.id,player:p.name,text:p.text,dueAt:p.dueAt})).slice(0,20);
}
