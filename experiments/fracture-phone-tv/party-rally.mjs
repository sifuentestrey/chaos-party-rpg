/** Small, server-owned strict-majority vote for a bounded local party rally.
 * The vote approves an attempt; native Fracture remains authoritative for movement.
 * This is not original Chaos Party expedition travel or world-state migration.
 */
export function proposeRally(actors,proposer,now,id){
 if(!Array.isArray(actors)||actors.length<2)throw Error('At least two nearby active characters are needed.');
 if(actors.length>20)throw Error('A local rally supports at most 20 active characters.');
 if(!id||typeof id!=='string')throw Error('A unique rally ID is required.');
 const lead=actors.find(p=>p.token===proposer);
 if(!lead)throw Error('Your character is not eligible for this rally.');
 const valid=p=>p&&typeof p.token==='string'&&p.ready===true&&!p.dead&&
   typeof p.zone==='string'&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&
   p.x>0&&p.y>0&&p.x<1000&&p.y<1000;
 if(!actors.every(valid)||new Set(actors.map(p=>p.token)).size!==actors.length)throw Error('Every participant must have a distinct, ready character.');
 if(actors.some(p=>p.zone!==lead.zone))throw Error('The party must be in the same area.');
 if(actors.some(p=>Math.abs(p.x-lead.x)+Math.abs(p.y-lead.y)>12))throw Error('Move within twelve tiles of the group before proposing a rally.');
 return {id,proposer,zone:lead.zone,x:lead.x,y:lead.y,
   electorate:actors.map(p=>p.token),votes:{[proposer]:true},
   required:Math.floor(actors.length/2)+1,deadline:now+10000,status:'pending',resolvedAt:null};
}
/** Fixed native-map waypoints, not phone-supplied coordinates or teleports.
 * The vote approves an attempt; native Fracture remains authoritative.
 */
export const EXPEDITION_WAYPOINTS=Object.freeze({
 woods:Object.freeze({from:'The Refuge',to:'Glitch Woods',start:Object.freeze({x:41,y:195}),end:Object.freeze({x:34,y:188})}),
 refuge:Object.freeze({from:'Glitch Woods',to:'The Refuge',start:Object.freeze({x:34,y:188}),end:Object.freeze({x:41,y:195})})
});
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function proposeExpedition(actors,proposer,destination,now,id){
 const route=Object.hasOwn(EXPEDITION_WAYPOINTS,destination)?EXPEDITION_WAYPOINTS[destination]:null;
 if(!route)throw Error('Choose a known Fracture destination.');
 const vote=proposeRally(actors,proposer,now,id);
 if(vote.zone!==route.from)throw Error('The group must start in '+route.from+'.');
 if(actors.some(a=>distance(a,route.start)>24))throw Error('Gather near the mapped departure area before voting on travel.');
 return {...vote,kind:'expedition',destination,arrivalZone:route.to,
  departure:{...route.start},waypoint:{...route.end}};
}
export function expeditionEligible(rally,actor){
 return !!rally&&rally.kind==='expedition'&&!!actor&&actor.ready===true&&!actor.dead&&
  actor.zone===rally.zone&&Number.isInteger(actor.x)&&Number.isInteger(actor.y)&&
  distance(actor,rally.departure)<=24;
}
export function settleRally(rally,now){
 if(!rally||rally.status!=='pending')return rally?.status||null;
 const votes=Object.values(rally.votes),yes=votes.filter(Boolean).length;
 const remaining=rally.electorate.length-votes.length;
 if(yes>=rally.required)rally.status='approved';
 else if(yes+remaining<rally.required||now>=rally.deadline)rally.status='declined';
 if(rally.status!=='pending')rally.resolvedAt=now;
 return rally.status;
}
export function voteRally(rally,token,yes,now){
 if(!rally||rally.status!=='pending')throw Error('There is no open party rally.');
 if(now>=rally.deadline){settleRally(rally,now);throw Error('That vote has closed.');}
 if(!rally.electorate.includes(token))throw Error('You were not in this rally electorate.');
 if(typeof yes!=='boolean')throw Error('Choose yes or no.');
 if(Object.hasOwn(rally.votes,token))throw Error('Your vote is already locked.');
 rally.votes[token]=yes;
 return settleRally(rally,now);
}
export function rallyView(rally,token,now){
 if(!rally||(rally.status!=='pending'&&now-(rally.resolvedAt||0)>8000))return null;
 return {id:rally.id,x:rally.x,y:rally.y,zone:rally.zone,kind:rally.kind||'rally',
  destination:rally.kind==='expedition'?rally.arrivalZone:undefined,
  arrived:rally.kind==='expedition'?(rally.arrivals||[]).length:undefined,
  proposer:rally.proposer,required:rally.required,yes:Object.values(rally.votes).filter(Boolean).length,
  total:rally.electorate.length,deadline:rally.deadline,status:rally.status,
  eligible:token? rally.electorate.includes(token):undefined,
  voted:token?Object.hasOwn(rally.votes,token):undefined};
}
