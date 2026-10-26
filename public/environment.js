import {WoodDoor,Damage,Entity} from './vendor/dungeonz.js';
// Stable IDs shared by the renderer, rules and saves. Families work on future maps.
export const OBJECTS={};
const add=(id,name,family,x,y,aliases,extra={})=>OBJECTS[id]={name,family,position:[x,y],aliases,material:['window','bottle'].includes(family)?'glass':family==='hearth'?'stone':'wood',...extra};
add('rug','the tavern rug','rug',480,378,['rug','carpet','runner'],{material:'cloth',portable:true});
for(const [i,[x,y]] of [[245,335],[715,335],[245,445],[715,445]].entries()){
  const direction=['upper left','upper right','lower left','lower right'][i];
  add(i?'table'+(i+1):'table',`the ${direction} table`,'table',x,y,[`${direction} table`,`table ${i+1}`,...(i===0?['table']:[])]);
}
for(const [i,[x,y]] of [[846,165],[885,180],[95,170],[92,403],[868,401],[173,182],[768,185]].entries())add(i?'barrel'+(i+1):'barrel',`ale barrel ${i+1}`,'barrel',x,y,[`barrel ${i+1}`,...(i===0?['barrel','keg','cask']:[])]);
add('door','the tavern door','door',480,500,['door','gate']);
add('chest','the locked chest','chest',670,145,['chest','treasure','crown','box']);
add('chandelier','the chandelier','chandelier',480,260,['chandelier','hanging light'],{material:'metal',lit:true});
add('hearth','the fireplace','hearth',92,330,['fireplace','hearth'],{lit:true});
add('sign','the tavern sign','sign',480,88,['sign'],{portable:true});
add('counter','the bar counter','counter',480,160,['counter','bar']);
add('floor','the floorboards','floor',480,400,['floor','floorboards'],{material:'wood'});
add('wall','the back wall','wall',600,110,['wall','back wall'],{material:'stone'});
add('beam','the oak beam','beam',307,135,['beam','beams'],{material:'wood'});
add('bunting','the hanging bunting','bunting',480,112,['bunting','banner','banners'],{material:'cloth',portable:true});
for(const [i,x] of [105,851].entries())add(i?'window2':'window',`the ${i?'right':'left'} window`,'window',x,105,[`${i?'right':'left'} window`,`window ${i+1}`,...(i===0?['window']:[])]);
for(const [i,x] of [194,770].entries())add(i?'shelf2':'shelf',`the ${i?'right':'left'} shelf`,'shelf',x,90,[`${i?'right':'left'} shelf`,`shelf ${i+1}`,...(i===0?['shelf','shelves']:[])]);
for(const [i,x] of [171,789].entries())add(i?'sideboard2':'sideboard',`the ${i?'right':'left'} sideboard`,'sideboard',x,195,[`${i?'right':'left'} sideboard`,...(i===0?['sideboard']:[])]);
for(const [i,x] of [160,780].entries())add(i?'bottle2':'bottle',`the ${i?'right':'left'} bottle`,'bottle',x,174,[`${i?'right':'left'} bottle`,`bottle ${i+1}`,...(i===0?['bottle','mug']:[])],{portable:true});
for(const [i,x] of [220,684].entries())add(i?'candle2':'candle',`the ${i?'right':'left'} candle`,'candle',x,315,[`${i?'right':'left'} candle`,`candle ${i+1}`,...(i===0?['candle']:[])],{portable:true,lit:true});
for(const [i,[x,y]] of [[70,99],[289,99],[674,99],[889,99],[56,343],[909,343]].entries())add('lamp'+i,`wall lantern ${i+1}`,'lamp',x,y,[`lantern ${i+1}`,...(i===0?['lamp','lantern','torch']:[])],{material:'metal',lit:true});
for(const [i,[x,y]] of [[194,360],[296,360],[664,360],[766,360],[194,470],[296,470],[664,470],[766,470]].entries())add('chair'+i,`chair ${i+1}`,'chair',x,y,[`chair ${i+1}`,...(i===0?['chair','stool','barstool']:[])],{portable:true});
export function environmentTarget(text){
  const matches=Object.entries(OBJECTS).flatMap(([kind,o])=>o.aliases.filter(a=>new RegExp('\\b'+a+'\\b','i').test(text)).map(a=>({kind,name:o.name,length:a.length})));
  matches.sort((a,b)=>b.length-a.length);if(!matches.length)return null;
  const {kind,name}=matches[0];return {kind,name};
}
export function objectState(world,id){const o=OBJECTS[id];if(!o)return null;const legacy=world?.props?.[id];return {condition:legacy===false?'taken':legacy==='broken'?'broken':'intact',lit:!!o.lit,open:false,offset:[0,0],...world?.objects?.[id]};}
export function environmentVerb(text,intent){
  for(const [verb,pattern] of Object.entries({extinguish:/\b(extinguish|douse|quench|put out|blow out)\b/i,repair:/\b(repair|fix|mend|restore)\b/i,ignite:/\b(ignite|light|burn|fireball|set.*on fire)\b/i,close:/\b(close|shut|lock)\b/i,open:/\b(unlock|pick.*lock|open)\b/i,push:/\b(push|shove|drag|move|pull|flip)\b/i,climb:/\b(sit|stand on|climb|jump on|dance on)\b/i,pour:/\b(pour|spill|empty|drink)\b/i,hide:/\b(hide|duck|crawl under)\b/i}))if(pattern.test(text)&&!(verb==='push'&&intent==='steal'))return verb;
  return ({attack:'break',break:'break',steal:'take'})[intent]||intent;
}
export function environmentCheck(world,target,intent,text){
  const o=OBJECTS[target?.kind];if(!o)return null;
  if(intent==='flee')return null;
  if(target.kind==='chest'&&intent==='steal')return {verb:'take',automatic:false,dc:13,ability:'Sleight of hand',advantage:0};
  const state=objectState(world,target.kind),verb=environmentVerb(text,intent);
  const impossible=(verb==='take'&&!o.portable)||(state.condition==='taken'&&verb!=='inspect')||(state.condition==='broken'&&!['inspect','repair','flee'].includes(verb))||(verb==='ignite'&&['stone','metal','glass'].includes(o.material)&&!o.lit);
  return {verb,automatic:impossible||['inspect','extinguish','close','pour','hide'].includes(verb)||(verb==='open'&&o.family==='door'),dc:verb==='take'?o.portable?11:18:verb==='open'?13:({glass:8,cloth:9,wood:11,metal:16,stone:18})[o.material],ability:['take','open'].includes(verb)?'Sleight of hand':['break','push','climb'].includes(verb)?'Athletics':verb==='repair'?'Craft':verb==='ignite'?'Arcana':'Interaction',advantage:state.condition==='burning'&&verb==='break'?1:0};
}
export function interactEnvironment(world,target,intent,success,actor,context={}){
  const o=OBJECTS[target.kind];if(!o)return null;
  if(intent==='flee')return null;
  if(intent==='heal'&&!/\b(drink|pour|spill|empty)\b/i.test(context.text||''))return null;
  if(target.kind==='chest'&&['steal','inspect'].includes(intent)&&!context.text?.match(/\b(close|repair|extinguish|burn|light)\b/i))return null;
  if(target.kind==='rug'&&intent==='steal')return null;
  const id=target.kind,s=objectState(world,id),verb=environmentVerb(context.text||'',intent),who=typeof actor==='string'?actor:actor.name;
  const out={text:'',change:null,verb,success,chaos:0,damage:0,cover:false};
  const say=t=>{out.text=`${who} ${t}`;return out;};
  const change=(key,value,label)=>{s[key]=value;(world.objects||={})[id]=s;out.change=label;};
  const blocked=t=>{out.success=false;out.blocked=true;return say(t);};
  if(verb==='inspect'){out.success=true;return say(`examines ${o.name}: ${s.condition}${s.lit?', lit':''}${s.open?', open':''}. ${o.portable?'It can be carried.':'It is part of the tavern furniture.'}`);}
  if(s.condition==='taken')return blocked(`reaches for ${o.name}, but it is already gone.`);
  if(s.condition==='broken'&&verb!=='repair')return blocked(`finds ${o.name} already broken. The debris is still there.`);
  if(verb==='take'){
    if(!o.portable)return blocked(`cannot carry ${o.name} intact. Try moving or breaking it.`);
    if(!success)return say(`gets a grip on ${o.name}, but Marnie spots the attempt.`);
    change('condition','taken',`${id.toUpperCase()} TAKEN`);if(typeof actor==='object')actor.inventory.push(o.name);out.chaos=1;return say(`takes ${o.name}. Its place in the room is now empty.`);
  }
  if(verb==='open'||verb==='close'){
    if(!['door','chest','window','barrel'].includes(o.family))return blocked(`cannot ${verb} ${o.name}. Try another approach.`);
    if(!success)return say(`tries the lock on ${o.name}. It holds.`);
    if(o.family==='door'&&verb==='open'){
      // Real upstream method; authoritative state adapter replaces wall-clock timers.
      const door=Object.create(WoodDoor.prototype);Object.assign(door,{activeState:true,blocking:true,row:0,col:0,reactivationRate:null,board:{emitToNearbyPlayers(){}}});door.interaction({energy:1,modEnergy(){}});s.open=!door.blocking;
    }else s.open=verb==='open';
    change('open',s.open,`${id.toUpperCase()} ${s.open?'OPEN':'CLOSED'}`);return say(`${s.open?'opens':'closes'} ${o.name}.`);
  }
  if(verb==='extinguish'){
    if(!s.lit&&s.condition!=='burning')return blocked(`finds no flame on ${o.name}.`);
    s.lit=false;if(s.condition==='burning')s.condition='intact';change('lit',false,`${id.toUpperCase()} EXTINGUISHED`);out.success=true;out.chaos=-1;return say(`puts out ${o.name}. The flame and its light disappear.`);
  }
  if(verb==='ignite'){
    if(['stone','metal','glass'].includes(o.material)&&!o.lit)return blocked(`cannot set ${o.material} on fire.`);
    if(!success)return say(`tries to light ${o.name}. The spark fizzles.`);
    if(o.lit)change('lit',true,`${id.toUpperCase()} LIT`);else {change('condition','burning',`${id.toUpperCase()} BURNING`);out.chaos=2;}return say(`${o.lit?'lights':'sets fire to'} ${o.name}.`);
  }
  if(verb==='break'){
    if(!success){out.damage=1;return say(`strikes ${o.name}. It shudders but holds together.`);}
    const entity={hitPoints:3,board:{emitToNearbyPlayers(){}},onAllHitPointsLost(){this.broken=true;}};Entity.prototype.onDamage.call(entity,new Damage({amount:3}));
    if(entity.broken){change('condition','broken',`${id.toUpperCase()} BROKEN`);s.lit=false;(world.props||={})[id]='broken';}
    if(o.family==='barrel')s.spilled=true;out.chaos=2;return say(`breaks ${o.name}. ${o.family==='barrel'?'Ale spills across the floor.':o.material==='glass'?'Glass scatters into a visible hazard.':'Debris remains where it stood.'}`);
  }
  if(verb==='push'){
    if(['hearth','counter','shelf','window','lamp','floor','wall','beam'].includes(o.family))return blocked(`finds ${o.name} fixed to the building. It will not slide.`);
    if(!success)return say(`pushes ${o.name}, but cannot shift it.`);
    change('offset',[Math.min(54,s.offset[0]+27),0],`${id.toUpperCase()} MOVED`);out.chaos=1;return say(`shoves ${o.name} aside. The space it occupied is clear.`);
  }
  if(verb==='repair'){
    if(!success)return say(`tries to repair ${o.name}. It needs another attempt.`);
    change('condition','intact',`${id.toUpperCase()} REPAIRED`);if(world.props)delete world.props[id];s.spilled=false;s.offset=[0,0];return say(`repairs ${o.name}. It can be used again.`);
  }
  if(verb==='pour'){
    if(!['bottle','barrel'].includes(o.family))return blocked(`finds nothing to pour from ${o.name}.`);
    if(s.spilled)return blocked(`finds ${o.name} already empty.`);
    change('spilled',true,`${id.toUpperCase()} SPILLED`);out.success=true;out.chaos=1;return say(`empties ${o.name}. Ale pools on the floor; footing nearby is slippery.`);
  }
  if(verb==='hide'||verb==='climb'){
    if(!['table','chair','barrel','counter','sideboard'].includes(o.family))return blocked(`cannot find a safe foothold or cover on ${o.name}.`);
    out.cover=verb==='hide';out.success=out.cover||success;if(out.cover)out.chaos=-1;return say(`${out.cover?'takes cover behind':success?'climbs onto':'fails to climb onto'} ${o.name}. ${out.cover?'The next guard sweep will miss them.':''}`);
  }
  return blocked(`cannot do that with ${o.name} yet. Try inspect, move, take, break, light, extinguish, open, or repair.`);
}
export function advanceEnvironment(world){
  const changes=[];
  for(const [id,state] of Object.entries(world.objects||{}))if(state.condition==='burning'){
    state.heat=(state.heat||0)+1;
    if(state.heat>=3){state.condition='broken';state.lit=false;(world.props||={})[id]='broken';changes.push(`${OBJECTS[id]?.name||id} BURNED THROUGH`);}
  }
  return changes;
}
