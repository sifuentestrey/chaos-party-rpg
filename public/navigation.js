import AStar from './vendor/rot-astar.js';
import {OBJECTS,objectState} from './environment.js';
const cell=20;
export function approachPath(home,target,world){
  const toCell=([x,y])=>[Math.round(x/cell),Math.round(y/cell)];
  const start=toCell(home);
  const pass=(x,y)=>{
    if(x<3||x>44||y<9||y>24)return false;
    if(x===start[0]&&y===start[1])return true;
    for(const [id,o] of Object.entries(OBJECTS)){
      if(!['table','barrel','sideboard','hearth'].includes(o.family))continue;
      const s=objectState(world,id);if(['broken','taken'].includes(s.condition))continue;
      const [ox,oy]=o.position,dx=x*cell-ox-s.offset[0],dy=y*cell-oy-s.offset[1];
      if(Math.abs(dx)<(o.family==='table'?51:27)&&dy>-28&&dy<38)return false;
    }
    return true;
  };
  const candidates=[];
  for(let y=9;y<=24;y++)for(let x=3;x<=44;x++)if(pass(x,y)){
    const distance=Math.hypot(x*cell-target[0],y*cell-target[1]);
    if(distance<100)candidates.push({x,y,distance:Math.abs(distance-49)});
  }
  candidates.sort((a,b)=>a.distance-b.distance||Math.hypot(a.x-start[0],a.y-start[1])-Math.hypot(b.x-start[0],b.y-start[1]));
  for(const end of candidates){const points=[];new AStar(end.x,end.y,pass,{topology:4}).compute(...start,(x,y)=>points.push([x*cell,y*cell]));if(points.length){points[0]=home;return points;}}
  return [home];
}
export function pointOnPath(path,progress){
  if(path.length===1)return path[0];
  const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));
  let remaining=lengths.reduce((a,b)=>a+b,0)*Math.max(0,Math.min(1,progress));
  for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]){const f=lengths[i]?remaining/lengths[i]:0;return path[i].map((n,j)=>n+(path[i+1][j]-n)*f);}remaining-=lengths[i];}
  return path.at(-1);
}
