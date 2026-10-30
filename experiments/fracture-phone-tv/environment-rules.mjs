/** Deterministic, engine-independent environment rules.
 * Native Fracture map/HP changes require a separate authoritative adapter.
 * No arbitrary native tiles are mutated by this module.
 */
export const ENVIRONMENT_KINDS=Object.freeze({
 tree:{material:'wood',hp:12,flammable:true,blocking:true},
 bush:{material:'fiber',hp:4,flammable:true,blocking:false},
 grass:{material:'fiber',hp:2,flammable:true,blocking:false},
 building:{material:'wood',hp:30,flammable:true,blocking:true},
 wall:{material:'stone',hp:20,flammable:false,blocking:true},
 roof:{material:'wood',hp:14,flammable:true,blocking:true},
 door:{material:'wood',hp:8,flammable:true,blocking:true},
 furniture:{material:'wood',hp:6,flammable:true,blocking:true},
 river:{material:'water',hp:null,flammable:false,blocking:false},
 lake:{material:'water',hp:null,flammable:false,blocking:false},
 pond:{material:'water',hp:null,flammable:false,blocking:false},
 terrain:{material:'earth',hp:30,flammable:false,blocking:true},
 rock:{material:'stone',hp:16,flammable:false,blocking:true},
 cliff:{material:'stone',hp:60,flammable:false,blocking:true},
 npc:{material:'flesh',hp:10,flammable:false,blocking:true}
});
const adjacent=(a,b)=>a&&b&&Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1;
export function environmentObject(id,kind,tile,overrides={}){
 const base=ENVIRONMENT_KINDS[kind];
 if(!base||!id||!Number.isInteger(tile?.x)||!Number.isInteger(tile?.y))throw Error('Invalid environmental object');
 // Caller-supplied options may tune condition/HP, but never rewrite the
 // validated authoritative identity or tile after registration.
 const object={...base,condition:'intact',wet:0,...overrides,id,kind,tile:{x:tile.x,y:tile.y}};
 if(!['intact','burning','broken'].includes(object.condition)||
    !Number.isInteger(object.wet)||object.wet<0||object.wet>3||
    (object.hp!==null&&(!Number.isFinite(object.hp)||object.hp<0)))throw Error('Invalid environmental object state');
 return object;
}
export function environmentStep(objects,{rain=0,wind={x:0,y:0},lightningTile=null,canSpread=()=>true}={}){
 if(!Number.isFinite(rain)||rain<0||rain>1||![wind.x,wind.y].every(Number.isFinite))throw Error('Invalid weather');
 const previous=Object.values(objects||{});
 const next=Object.fromEntries(previous.map(o=>[o.id,{...o,tile:{...o.tile}}]));
 const changes=[];
 for(const original of previous){
  const item=next[original.id];
  if(!item||item.condition==='broken')continue;
  if(item.kind==='river'||item.kind==='lake'||item.kind==='pond')continue;
  const nearWater=previous.some(o=>['river','lake','pond'].includes(o.kind)&&adjacent(o.tile,item.tile));
  const wet=Math.min(3,Math.max(0,(item.wet||0)+(rain>0?1:nearWater?1:-1)));
  item.wet=wet;
  const lightning=lightningTile&&item.tile.x===lightningTile.x&&item.tile.y===lightningTile.y;
  const source=previous.find(o=>o.id!==item.id&&o.condition==='burning'&&adjacent(o.tile,item.tile)&&canSpread(o,item)&&
   (wind.x===0&&wind.y===0||(item.tile.x-o.tile.x)*wind.x+(item.tile.y-o.tile.y)*wind.y>=0));
  if(item.condition==='burning'){
   if(rain>=0.5||nearWater){item.condition='intact';changes.push({id:item.id,type:'extinguished'});}
   else {item.hp=Math.max(0,item.hp-1);if(item.hp===0){item.condition='broken';item.blocking=false;changes.push({id:item.id,type:'destroyed'});}}
  }else if(item.flammable&&wet===0&&(lightning||source)){
   item.condition='burning';changes.push({id:item.id,type:'ignited',cause:lightning?'lightning':'spread'});
  }
 }
 return {objects:next,changes};
}
export function environmentDamage(objects,id,amount){
 if(!Number.isFinite(amount)||amount<=0)throw Error('Invalid damage');
 const item=objects[id];if(!item||!Number.isFinite(item.hp)||item.condition==='broken')return {objects,changed:false};
 const hp=Math.max(0,item.hp-amount),broken=hp===0;
 return {objects:{...objects,[id]:{...item,hp,condition:broken?'broken':item.condition,blocking:broken?false:item.blocking}},changed:true};
}
