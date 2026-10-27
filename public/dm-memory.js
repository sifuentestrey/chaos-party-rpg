// Canonical memory only. Model prose is never promoted into game facts.
const clean=(value,max)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
export function recordDMMemory(room){
  const q=room.result;if(!q)return;
  const memory=room.dmMemory||={version:1,entries:[],people:{}};
  if(memory.entries.some(e=>e.id===q.id))return;
  const location=room.world.expedition?.current||'tavern';
  const entry={id:q.id,round:room.round,location,actorId:q.playerId,actor:clean(q.name,18),attempt:clean(q.action,180),
    targetId:q.target?.entityId||q.target?.id||q.target?.kind||'room',outcome:q.blocked?'blocked':q.success?'success':'failure',
    fact:clean(q.narration,600),changes:q.changes.slice(0,6).map(s=>clean(s,100))};
  memory.entries.push(entry);memory.entries=memory.entries.slice(-120);
  const id=entry.targetId,creature=room.world.expedition?.creatures?.[id];
  const name=({bartender:'Marnie',guard:'Captain Brick',goblin:'the goblin fiddler'})[id]||creature?.name;
  if(name){
    const previous=memory.people[id]||{id,name:clean(name,50),encounters:[]};
    previous.location=location;previous.round=room.round;
    previous.encounters.push(entry);previous.encounters=previous.encounters.slice(-4);
    memory.people[id]=previous;
    const keep=Object.values(memory.people).sort((a,b)=>b.round-a.round).slice(0,64);
    memory.people=Object.fromEntries(keep.map(p=>[p.id,p]));
  }
}
export function relevantDMMemory(room,{targetId,location,excludeId}={}){
  const memory=room.dmMemory;if(!memory)return [];
  const all=[...memory.entries,...Object.values(memory.people).flatMap(p=>p.encounters)];
  const unique=[...new Map(all.filter(e=>e.id!==excludeId).map(e=>[e.id,e])).values()];
  const score=e=>(targetId&&e.targetId===targetId?4:0)+(e.location===location?2:0);
  return unique.sort((a,b)=>score(b)-score(a)||b.round-a.round).slice(0,3);
}
export function redactDMMemory(room,id){
  if(!room.dmMemory)return;
  room.dmMemory.entries=room.dmMemory.entries.filter(e=>e.id!==id);
  for(const p of Object.values(room.dmMemory.people))p.encounters=p.encounters.filter(e=>e.id!==id);
}
