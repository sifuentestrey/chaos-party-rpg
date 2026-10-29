import {seats,targetPosition} from './tavern-motion.js';
// Engine-owned presentation recipes. No command here can change saved game facts.
const recipes={attack:['melee','hit'],use:['impact','hit'],break:['impact','slash'],harvest:['impact','slash'],ignite:['fire','fire'],extinguish:['smoke','fire'],treat:['hearts','heal'],rest:['hearts','heal'],drink:['hearts','heal'],pacify:['hearts','success'],repair:['spell','magic'],craft:['spell','magic'],attach:['spell','magic'],steal:['steal','coin'],take:['steal','coin'],give:['steal','coin'],equip:['spell','success'],unequip:['smoke','success'],separate:['smoke','slash'],open:['inspect','success'],close:['inspect','success'],unlock:['spell','success'],talk:['inspect','success']};
const ownPosition=(room,id)=>seats[Math.max(0,room.players.findIndex(p=>p.id===id))%seats.length];
export function worldEntityPosition(room,entity){return entity?.ownerId?(room.world.expedition.creatures?.[entity.ownerId]?.position||ownPosition(room,entity.ownerId)):entity?.position||ownPosition(room,entity?.id);}
export function createWorldScene(room,actor,plan,outcome,target){
 const state=room.world.expedition,events=[],effects=[];
 if(plan.previousOwnerId&&state.creatures[plan.previousOwnerId]?.hp>0&&!outcome.blocked)events.push({type:'witness',entityId:plan.previousOwnerId,at:0});
 if(outcome.blocked)return {events,effects};
 const id=plan.targetId||plan.recipientId||plan.itemId||plan.sourceIds?.[0];
 const entity=state.creatures?.[id]||state.items[id]||room.players.find(p=>p.id===id);
 const self=['craft','attach','equip','unequip','rest','drink','separate'].includes(plan.verb);
 const position=[...(self||!outcome.success?ownPosition(room,actor.id):plan.previousOwnerId?worldEntityPosition(room,state.creatures[plan.previousOwnerId]):entity?worldEntityPosition(room,entity):target?.position||ownPosition(room,actor.id))];
 const [verb,clip]=outcome.success?(recipes[plan.verb]||['inspect','success']):['smoke',null];
 const effect={verb,actorId:actor.id,target:self?'self':'world',entityId:self?actor.id:entity?.id||null,position,at:0};
 effects.push(effect);events.push({type:'animation',...effect});
 if(clip)events.push({type:'sound',clip,at:200});
 if(outcome.success&&['attack','use','break','harvest'].includes(plan.verb)&&entity)events.push({type:'reaction',entityId:entity.id,position,at:150,duration:500});
 if(outcome.success&&plan.verb==='talk')events.push({type:'speech',entityId:entity?.id||null,text:outcome.text.slice(0,480),at:300});
 if(outcome.change)events.push({type:'consequence',text:outcome.change.slice(0,300),at:0});
 return {events,effects};
}
export function effectPosition(effect,result,players,from){
 if(effect.target==='self')return from;
 if(Array.isArray(effect.position)&&effect.position.length===2&&effect.position.every(Number.isFinite))return effect.position;
 const playerIndex=players.findIndex(p=>p.id===effect.targetId);
 if(playerIndex>=0)return seats[playerIndex%seats.length];
 return targetPosition(effect.target===result.target?.kind?result.target:{kind:effect.target},players,from);
}
export function sceneReactionAge(result,id,elapsed){
 const event=result?.sceneEvents?.find(e=>e.type==='reaction'&&e.entityId===id&&elapsed>=e.at&&elapsed<e.at+e.duration);
 return event?elapsed-event.at+150:null;
}
