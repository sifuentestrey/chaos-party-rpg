import {currentLocation} from './world-items.js';
export function drawItemGlyph(g,item,x,y,scale=2){
  const {color,accent=color,shape}=item.appearance;
  g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);
  g.fillStyle='#221f2f';g.fillRect(-6,-5,12,9);
  g.fillStyle=item.condition==='broken'?'#706876':color;
  if(shape==='band'){g.fillRect(-5,-2,10,4);g.fillRect(-5,-5,2,4);g.fillRect(3,-5,2,4);}
  else if(shape==='cup'){g.fillRect(-4,-4,8,7);g.fillStyle='#221f2f';g.fillRect(-2,-4,4,2);}
  else if(shape==='rod'){g.fillRect(-1,-5,3,9);g.fillRect(-4,-5,9,3);}
  else {g.fillRect(-4,-2,7,5);g.fillRect(-1,-5,5,4);}
  g.fillStyle=accent;g.fillRect(-2,0,4,2);
  if(item.condition==='broken'){g.fillStyle='#241f30';g.fillRect(0,-4,2,7);}
  g.restore();
}
export function drawGeneratedLocation(g,room){
  const location=room.world.expedition.locations[currentLocation(room)],ruins=location.kind==='ruins';
  g.fillStyle=ruins?'#454451':'#314c43';g.fillRect(0,0,960,540);
  g.fillStyle=ruins?'#575663':'#466756';g.fillRect(45,112,870,400);
  for(let y=115;y<510;y+=24)for(let x=50;x<910;x+=32){g.fillStyle=ruins?'#62616d':'#52745b';g.fillRect(x+((y%7)*3),y,ruins?27:3,ruins?19:6);}
  g.fillStyle=ruins?'#777586':'#617c68';g.fillRect(451,112,58,399);
  for(const [x,y,n] of location.decor){g.fillStyle=ruins?'#2c2c39':'#243f3b';g.fillRect(x,y,30,24);g.fillStyle=ruins?'#91909c':n===0?'#638368':'#486e56';g.fillRect(x+3,y-25,24,40);g.fillRect(x-6,y-16,42,12);}
  g.fillStyle='#d9c68f';g.fillRect(455,485,50,8);
  g.font='bold 21px monospace';g.textAlign='center';g.fillStyle='#f3e7cb';g.fillText(location.name.toUpperCase(),480,52);
  g.font='13px monospace';g.fillText('PATHS: '+location.exits.join(' · ').toUpperCase(),480,78);
}
