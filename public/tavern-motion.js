import {OBJECTS} from './environment.js';
// Presentation only: authoritative targets and outcomes remain server-owned.
export const seats = [
  [430,285],[550,285],[190,225],[310,225],[430,225],[550,225],
  [670,225],[790,225],[190,285],[310,285],[670,285],[790,285],
  [190,345],[310,345],[430,345],[550,345],[670,345],[790,345],
  [190,405],[310,405],[430,405],[550,405],[670,405],[790,405]
];
export const landmarks={guard:[865,290],bartender:[480,145],chest:[665,145],rug:[480,378],goblin:[125,245],chandelier:[480,260],door:[480,495],room:[480,335]};
export function targetPosition(target,players,home){
  if(target?.kind==='self')return home;
  if(target?.id){const i=players.findIndex(p=>p.id===target.id);if(i>=0)return seats[i%seats.length];}
  return OBJECTS[target?.kind]?.position||landmarks[target?.kind]||home;
}
const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
export function actorPosition(home,target,age,resultAge,reduced=false){
  if(reduced)return [...home];
  // Approach on declaration; hold through reactions; strike and return on result.
  const dx=target[0]-home[0],dy=target[1]-home[1],length=Math.hypot(dx,dy);
  if(length<1)return [...home];
  const stop=Math.max(0,(length-52)/length);
  const approach=smooth(age/850);
  let reach=stop*approach;
  if(resultAge!==null){
    const strike=Math.sin(Math.min(1,Math.max(0,resultAge)/500)*Math.PI)*12/length;
    reach=(stop+strike)*(1-smooth((resultAge-1000)/850));
  }
  return [home[0]+dx*reach,home[1]+dy*reach];
}
export function recoil(age,reduced=false){return reduced||age<150||age>650?0:Math.sin((age-150)/500*Math.PI)*13;}
