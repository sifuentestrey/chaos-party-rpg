/** Intent/capability rules for verified, already-painted native map objects. */
import {parseEntityAttempt} from '../../public/entity-rules.js';
import {nativeCells,nativeContact} from './native-map-state.ts';
const normal=s=>String(s||'').trim().toLowerCase().replace(/^(?:the|a|an)\s+/,'');
const directions={north:[0,-1],up:[0,-1],south:[0,1],down:[0,1],east:[1,0],right:[1,0],west:[-1,0],left:[-1,0]};
export function nativeObjectAttempt(text){
 const clean=String(text||'').trim().replace(/^(?:please |I (?:want to |try to |attempt to )?)+/i,'').replace(/[.!?]+$/,'');
 const match=/^(push|pull|move|drag|shift|roll|lift|take|pick up|grab|drop|put down|attack|hit|strike|chop(?: down)?|cut down|fell|break|kick|smash|hack|uproot|inspect|examine|look at|repair|mend|drink from|drink|splash)\s+(.+)$/i.exec(clean);
 let attempt=match?{verb:/^(push|pull|move|drag|shift|roll|lift)$/.test(match[1].toLowerCase())?'move':/^(take|pick up|grab)$/.test(match[1].toLowerCase())?'take':/^(drop|put down)$/.test(match[1].toLowerCase())?'drop':/^(inspect|examine|look at)$/.test(match[1].toLowerCase())?'inspect':/^(repair|mend)$/.test(match[1].toLowerCase())?'repair':/^drink/.test(match[1].toLowerCase())?'drink':match[1]==='splash'?'splash':'break',target:match[2]}:parseEntityAttempt(clean);
 if(!attempt||!['move','take','drop','break','inspect','repair','ignite','extinguish','drink','splash'].includes(attempt.verb))return null;
 const direction=attempt.target.match(/\s+(north|south|east|west|up|down|left|right)$/i);
 return {...attempt,target:normal(direction?attempt.target.slice(0,-direction[0].length):attempt.target),...(direction?{direction:direction[1].toLowerCase()}:{}),pull:/^(pull|drag)\b/i.test(clean)};
}
export function findNativeObject(attempt,objects,actor){
 if(!attempt)return null;
 const matches=objects.filter(o=>(o.nativeOrigin||o.cells?.length)&&[o.id,o.id.slice(o.scene.length+1),o.kind,o.name,...(o.aliases||[])].some(ref=>normal(ref)===attempt.target));
 matches.sort((a,b)=>distance(actor,nativeContact(actor,a))-distance(actor,nativeContact(actor,b)));
 if(matches.length>1&&distance(actor,nativeContact(actor,matches[0]))===distance(actor,nativeContact(actor,matches[1])))return {ambiguous:true};
 return matches[0]||null;
}
export const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function nativeCapabilities(o){return {
 movable:!!o.movable&&!o.carriedBy&&o.condition!=='broken',
 portable:!!o.portable&&!o.carriedBy&&o.condition==='intact',droppable:!!o.portable&&!!o.carriedBy&&o.condition==='intact',
 breakable:!o.carriedBy&&!o.protected&&!o.fireSource&&o.condition!=='broken',
 flammable:!o.carriedBy&&!!o.flammable&&o.condition==='intact',
 extinguishable:o.condition==='burning',repairable:!!o.repairable&&o.condition==='broken',
 waterSource:!!o.waterSource,drinkable:!!o.waterSource,
};}
/** Validate the complete swept footprint, not just a prop's anchor. */
export function nativeDestination(p,o,attempt,{valid,sameZone,occupied,objects,doors=[],onBlocked=()=>{}}){
 const own=nativeCells(o),contact=nativeContact(p,o);
 let vector=directions[attempt.direction];
 if(!vector){const dx=contact.x-p.x,dy=contact.y-p.y;vector=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1];if(attempt.pull)vector=vector.map(n=>-n);}
 const [dx,dy]=vector;
 const other=objects.filter(q=>q.id!==o.id&&q.condition!=='broken'&&(q.footprint?.length||q.movable)).flatMap(q=>nativeCells(q));
 for(const t of own){
  const next={x:t.x+dx,y:t.y+dy},inOwn=own.some(q=>q.x===next.x&&q.y===next.y);
  const reason=!sameZone(next)?'another area':!inOwn&&!valid(next)?'solid terrain':occupied(next)?'a character':other.some(q=>q.x===next.x&&q.y===next.y)?'another map object':doors.some(q=>q.x===next.x&&q.y===next.y||q.tx===next.x&&q.ty===next.y)?'an entrance':null;
  if(reason){onBlocked(reason,next);return null;}
 }
 return {x:o.tile.x+dx,y:o.tile.y+dy};
}
