/** Small, server-owned strict-majority vote for a bounded local party rally.
 * The vote approves an attempt; native Fracture remains authoritative for movement.
 * This is not original Chaos Party expedition travel or world-state migration.
 */
export function proposeRally(actors,proposer,now,id){
 if(!Array.isArray(actors)||actors.length<2||actors.length>20)throw Error('At least two nearby active characters are needed.');
 if(!id||typeof id!=='string')throw Error('A unique rally ID is required.');
 const lead=actors.find(p=>p.token===proposer);
 if(!lead)throw Error('Your character is not eligible for this rally.');
 const valid=p=>p&&typeof p.token==='string'&&p.ready===true&&!p.dead&&
   typeof p.zone==='string'&&Number.isInteger(p.x)&&Number.isInteger(p.y);
 if(!actors.every(valid)||new Set(actors.map(p=>p.token)).size!==actors.length)throw Error('Every participant must have a distinct, ready character.');
 if(actors.some(p=>p.zone!==lead.zone))throw Error('The party must be in the same area.');
 if(actors.some(p=>Math.abs(p.x-lead.x)+Math.abs(p.y-lead.y)>12))throw Error('Move within twelve tiles of the group before proposing a rally.');
 return {id,proposer,zone:lead.zone,x:lead.x,y:lead.y,
   electorate:actors.map(p=>p.token),votes:{[proposer]:true},
   required:Math.floor(actors.length/2)+1,deadline:now+10000,status:'pending',resolvedAt:null};
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
 return {id:rally.id,x:rally.x,y:rally.y,zone:rally.zone,
  proposer:rally.proposer,required:rally.required,yes:Object.values(rally.votes).filter(Boolean).length,
  total:rally.electorate.length,deadline:rally.deadline,status:rally.status,
  eligible:token? rally.electorate.includes(token):undefined,
  voted:token?Object.hasOwn(rally.votes,token):undefined};
}
