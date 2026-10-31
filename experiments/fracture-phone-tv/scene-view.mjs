// @ts-nocheck
/** Shared scene coordinates describe existing map space; never restrict movement. */
export function sceneAt(actor,width=32,height=18){
 const x=Math.max(0,Math.min(172-width,Math.floor(actor.x/width)*width)),y=Math.max(0,Math.min(314-height,Math.floor(actor.y/height)*height));
 return {id:`${actor.zone}:${x},${y}:${width},${height}`,zone:actor.zone,x,y,width,height};
}
export function chooseScene(actors,current,width=32,height=18){
 const live=actors.filter(a=>a.ready&&!a.dead&&Number.isFinite(a.x)&&Number.isFinite(a.y));if(!live.length)return null;
 const groups=new Map();for(const a of live){const s=sceneAt(a,width,height);if(!groups.has(s.id))groups.set(s.id,{...s,actors:[]});groups.get(s.id).actors.push(a);}
 const ranked=[...groups.values()].sort((a,b)=>b.actors.length-a.actors.length||a.id.localeCompare(b.id));
 let selected=ranked[0];if(current&&groups.has(current.id)&&selected.actors.length<=live.length/2)selected=groups.get(current.id);
 const center={x:selected.x+width/2,y:selected.y+height/2};selected.anchor=selected.actors.slice().sort((a,b)=>(Math.abs(a.x-center.x)+Math.abs(a.y-center.y))-(Math.abs(b.x-center.x)+Math.abs(b.y-center.y))||String(a.id).localeCompare(String(b.id)))[0];
 return selected;
}
