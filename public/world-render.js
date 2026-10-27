import {CAMPAIGN_TYPES} from './campaign.js';
import {currentLocation} from './world-items.js';
export function drawItemGlyph(g,item,x,y,scale=2){
  const {color,accent=color,shape}=item.appearance;
  g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);
  g.fillStyle='#221f2f';g.fillRect(-6,-5,12,9);
  g.fillStyle=item.condition==='broken'?'#706876':color;
  if(shape==='chest'){g.fillRect(-6,-4,12,8);g.fillStyle='#302737';g.fillRect(-6,-1,12,1);if(item.open)g.fillRect(-5,-3,10,4);if(item.locked){g.fillStyle='#dfc16e';g.fillRect(-1,-1,2,3);}}
  else if(shape==='spring'){g.fillRect(-6,-1,12,5);g.fillStyle='#7dc7cf';g.fillRect(-4,-2,8,4);}
  else if(shape==='gate'){g.fillRect(-6,-5,2,10);g.fillRect(4,-5,2,10);if(!item.open)g.fillRect(-4,-2,8,3);}
  else if(shape==='band'){g.fillRect(-5,-2,10,4);g.fillRect(-5,-5,2,4);g.fillRect(3,-5,2,4);}
  else if(shape==='cup'){g.fillRect(-4,-4,8,7);g.fillStyle='#221f2f';g.fillRect(-2,-4,4,2);}
  else if(shape==='rod'){g.fillRect(-1,-5,3,9);g.fillRect(-4,-5,9,3);}
  else {g.fillRect(-4,-2,7,5);g.fillRect(-1,-5,5,4);}
  g.fillStyle=accent;g.fillRect(-2,0,4,2);
  if(item.condition==='broken'){g.fillStyle='#241f30';g.fillRect(0,-4,2,7);}
  if(item.liquid?.amount){g.fillStyle='#8ad6de';g.fillRect(-3,1,6,Math.min(3,item.liquid.amount));}
  if(item.condition==='burning'){g.fillStyle='#ed9558';g.fillRect(-3,-10,5,7);g.fillStyle='#f5d382';g.fillRect(-1,-8,2,5);}
  g.restore();
}
export function drawGeneratedLocation(g,room){
  const location=room.world.expedition.locations[currentLocation(room)],ruins=['ruins','cavern','village'].includes(location.kind),palette=CAMPAIGN_TYPES[location.kind]||CAMPAIGN_TYPES.clearing;
  g.fillStyle=ruins?'#454451':'#314c43';g.fillRect(0,0,960,540);
  g.fillStyle=palette.ground;g.fillRect(45,112,870,400);
  for(let y=115;y<510;y+=24)for(let x=50;x<910;x+=32){g.fillStyle=ruins?'#62616d':'#52745b';g.fillRect(x+((y%7)*3),y,ruins?27:3,ruins?19:6);}
  g.fillStyle=ruins?'#777586':'#617c68';g.fillRect(451,112,58,399);
  for(const [x,y,n] of location.decor){g.fillStyle=ruins?'#2c2c39':'#243f3b';g.fillRect(x,y,30,24);g.fillStyle=palette.accent;if(location.kind==='forest'||location.kind==='clearing'){g.fillRect(x+11,y-10,8,30);g.fillStyle=palette.accent;g.fillRect(x-8,y-38,46,28);g.fillRect(x-1,y-45,32,12);}else if(location.kind==='marsh'){g.fillStyle='#679f9c';g.fillRect(x-5,y,40,12);g.fillStyle='#a9b88a';g.fillRect(x+5,y-15,3,22);g.fillRect(x+19,y-21,3,28);}else if(location.kind==='village'){g.fillRect(x-3,y-20,36,35);g.fillStyle='#58434a';g.fillRect(x-7,y-29,44,10);g.fillRect(x+9,y-4,10,19);}else{g.fillRect(x+3,y-25,24,40);g.fillStyle='#504d5d';g.fillRect(x+7,y-15,3,23);}}
  g.fillStyle='#d9c68f';g.fillRect(455,485,50,8);
  g.font='bold 21px monospace';g.textAlign='center';g.fillStyle='#f3e7cb';g.fillText(location.name.toUpperCase(),480,52);
  g.font='13px monospace';g.fillText('PATHS: '+location.exits.join(' · ').toUpperCase(),480,78);
}

export function drawBeast(g,c,x,y,hit=false){
 g.save();g.translate(Math.round(x),Math.round(y));g.scale(3,3);
 if(c.hp<=0)g.scale(1,.4);
 g.fillStyle='#20242b';g.fillRect(-10,-11,21,10);
 g.fillStyle=hit?'#eed5bc':c.attitude==='friendly'?'#8eaa83':'#9b897c';
 if(c.species==='crow'){g.fillRect(-6,-10,12,8);g.fillRect(4,-14,5,6);g.fillRect(-12,-7,6,3);g.fillStyle='#d6bb78';g.fillRect(9,-11,4,2);}
 else {g.fillRect(-9,-10,17,7);g.fillRect(5,-14,7,9);g.fillRect(-8,-3,3,4);g.fillRect(5,-3,3,4);g.fillRect(-13,-12,5,3);if(c.species==='boar'){g.fillRect(-5,-13,11,4);g.fillStyle='#e3d6b8';g.fillRect(10,-6,3,2);}}
 g.fillStyle='#171d22';g.fillRect(8,-12,2,2);g.restore();
}
