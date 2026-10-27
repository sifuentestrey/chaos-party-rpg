import {itemPlan,ensureItems} from './world-items.js';
export const WORLD_VERBS=['craft','attach','give','equip','unequip','take','drop','separate','inspect','use','travel','explore','talk','pacify','attack','harvest','treat','fill','drink','open','close','unlock','move','ignite','extinguish','repair','put','rest','unsupported'];
export const APPEARANCE_COLORS=['#d87878','#7ea7d4','#83b48a','#dfc16e','#bd88cf','#e4dcc8','#484552','#b88955','#7dc7cf'];
export const WORLD_PLAN_SCHEMA={type:'object',properties:{domain:{type:'string',enum:['world']},verb:{type:'string',enum:WORLD_VERBS},target:{type:'string'},item:{type:'string'},sources:{type:'array',items:{type:'string'},maxItems:4},name:{type:'string',maxLength:48},itemType:{type:'string',enum:['wearable','tool','container','fragment']},slot:{type:'string',enum:['head','body','hand']},color:{type:'string',enum:APPEARANCE_COLORS},summary:{type:'string',maxLength:160}},required:['domain','verb','target','item','sources','name','itemType','slot','color','summary'],additionalProperties:false};
// A clearly vocal attempt must never silently spend a medical item.
export const voicePacification=text=>/\b(soothe|calm|befriend|pacify|win .+ over)\b/i.test(text)&&/\b(voice|song|sing|rap|music|lullaby|joke)\b/i.test(text)&&!/\b(heal|bandage|bind|treat|wound|injury|pain)\b/i.test(text);
export function validateWorldPlan(raw,room,actorId){
 if(voicePacification(room.turn?.action||'')&&!['pacify','unsupported'].includes(raw.verb))throw Error('A vocal pacification cannot become a different mechanical action');
 const allowed=Object.keys(WORLD_PLAN_SCHEMA.properties);
 if(Object.keys(raw).some(k=>!allowed.includes(k))||!WORLD_VERBS.includes(raw.verb)||typeof raw.summary!=='string'||raw.summary.length>160)throw Error('Invalid world interpretation');
 for(const key of ['target','item','name'])if(raw[key]!==undefined&&(typeof raw[key]!=='string'||raw[key].length>100))throw Error('Invalid entity reference');
 if(raw.sources!==undefined&&(!Array.isArray(raw.sources)||raw.sources.length>4||raw.sources.some(x=>typeof x!=='string'||x.length>100)))throw Error('Invalid component references');
 const actor=room.players.find(p=>p.id===actorId);if(!actor)throw Error('Unknown actor');
 const s=ensureItems(room),entity=id=>s.items[id]||s.creatures[id]||room.players.find(p=>p.id===id);
 const reference=id=>{if(!entity(id))throw Error('Unknown world entity');return id;};
 let text;
 switch(raw.verb){
 case 'unsupported':text='Make unsupported creation';break;
 case 'craft':if(!raw.name||raw.name.length>48||/[<>\r\n]/.test(raw.name)||raw.sources?.length<2)throw Error('Invalid creation');text=`Make ${raw.name} from ${raw.sources.map(reference).join(' and ')}`;break;
 case 'attach':text=`Attach ${reference(raw.item)} to ${reference(raw.target)}`;break;
 case 'give':text=`Give ${reference(raw.item)} to ${reference(raw.target)}`;break;
 case 'use':text=`Use ${reference(raw.item)} on ${reference(raw.target)}`;break;
 case 'put':text=`Put ${reference(raw.item)} into ${reference(raw.target)}`;break;
 case 'fill':text=`Fill ${reference(raw.item)} from ${reference(raw.target)}`;break;
 case 'harvest':if(!raw.name)throw Error('Name the actual part');text=`Cut ${raw.name} from ${reference(raw.target)}`;break;
 case 'talk':text=`Talk to ${reference(raw.target)}`;break;
 case 'pacify':text=`Befriend ${reference(raw.target)}`;break;
 case 'treat':text=`Bandage ${reference(raw.target)}${raw.item?' with '+reference(raw.item):''}`;break;
 case 'attack':text=`Attack ${reference(raw.target)}${raw.item?' with '+reference(raw.item):''}`;break;
 case 'travel':if(!s.locations[s.current].exits.includes(raw.target))throw Error('Unknown or disconnected destination');text='Travel to '+raw.target;break;
 case 'explore':text='Explore';break;
 case 'rest':text='Rest';break;
 default:text=raw.verb+' '+reference(raw.target);
 }
 const plan=itemPlan(room,actor,text);if(raw.verb==='unsupported')return {intent:'world',rulesText:text,target:{kind:'world',name:'the surroundings',position:[480,335]},worldAction:true,verb:raw.verb,summary:raw.summary};
 if(!plan||plan.error)throw Error(plan?.error||'Unsupported world primitive');
 if(actor.hp<=0&&plan.verb!=='rest')throw Error('Knocked out adventurers must recover');
 let blueprint;
 if(raw.verb==='craft'){
  if(!['wearable','tool','container','fragment'].includes(raw.itemType)||!['head','body','hand'].includes(raw.slot)||!APPEARANCE_COLORS.includes(raw.color))throw Error('Unsupported appearance');
  blueprint={creationType:raw.itemType,creationSlot:raw.slot,creationColor:raw.color};
 }
 const target=entity(plan.targetId||plan.itemId||plan.sourceIds?.[0]);
 return {intent:plan.verb==='rest'?'heal':'world',rulesText:text,target:{kind:'world',entityId:target?.id,name:target?.name||plan.destination||'the surroundings',position:target?.position||[480,335]},worldAction:true,blueprint,verb:raw.verb,summary:raw.summary.replace(/[\u0000-\u001f\u007f]/g,' ').trim()};
}
