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
  const location=room.world.expedition.locations[currentLocation(room)],kind=location.kind,
    ruins=['ruins','cavern','village'].includes(kind),marsh=kind==='marsh',
    palette=CAMPAIGN_TYPES[kind]||CAMPAIGN_TYPES.clearing;
  const fill=(color,x,y,w,h)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
  fill(marsh?'#263e4a':ruins?'#292a3a':'#253d4c',0,0,960,540);
  fill(ruins?'#4b4959':marsh?'#45636a':'#416052',0,85,960,53);
  for(let i=0;i<11;i++){
    const x=i*98-18,h=18+(i*17%35);
    if(ruins){fill(i%2?'#646171':'#555363',x,116-h,76,h);fill('#817b83',x+10,109-h,48,5);}
    else if(marsh){fill('#314c54',x,111-h,72,h);fill('#5b8279',x+9,102-h,42,4);}
    else{fill(i%2?'#314f43':'#385748',x,109-h,84,h);fill('#59765c',x+12,103-h,52,5);}
  }
  fill(palette.ground,35,136,890,376);
  g.beginPath();g.moveTo(440,512);g.bezierCurveTo(ruins?530:370,430,ruins?360:585,320,480,136);g.lineTo(548,136);g.bezierCurveTo(640,318,ruins?450:440,422,520,512);g.closePath();g.fillStyle=ruins?'#77736c':marsh?'#8a8064':'#a48b68';g.fill();
  if(ruins){fill('#363542',91,160,72,68);fill('#716c6b',84,154,86,12);fill('#363542',797,179,57,91);fill('#716c6b',790,172,70,12);fill('#242635',439,136,16,62);fill('#8b8276',435,133,90,8);fill('#514e5a',457,143,47,4);}
  else if(marsh){for(let i=0;i<6;i++){const x=78+i*156;fill(i%2?'#64837c':'#587770',x,300+(i%3)*47,83,12);fill('#9aa17c',x+18,306+(i%3)*47,42,3);}}
  else{for(let i=0;i<7;i++){const x=52+i*143;fill('#2d493c',x,114+(i%2)*17,12,102);fill(palette.accent,x-31,115+(i%2)*17,74,46);fill('#568161',x-22,94+(i%2)*17,57,26);}}
  for(const [x,y] of location.decor){
    if(ruins){fill('#363542',x,y,34,28);fill(palette.accent,x+4,y-19,27,20);fill('#827b76',x-3,y-23,40,6);}
    else if(marsh){fill('#294750',x,y+5,38,12);fill(palette.accent,x+7,y-19,4,28);fill('#a9b88a',x+20,y-28,4,36);}
    else{fill('#243f3b',x+11,y-9,8,30);fill(palette.accent,x-8,y-38,46,28);fill('#5d8264',x-1,y-45,32,12);}
  }
  fill(ruins?'#c6ab78':'#d9c68f',455,485,50,8);
  g.font='bold 21px monospace';g.textAlign='center';g.fillStyle='#f3e7cb';g.fillText(location.name.toUpperCase(),480,52);
  g.font='13px monospace';g.fillStyle='#e2d4b7';g.fillText('PATHS: '+location.exits.join(' · ').toUpperCase(),480,78);
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
