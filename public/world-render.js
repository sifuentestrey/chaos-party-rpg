import {CAMPAIGN_TYPES} from './campaign.js';
import {currentLocation} from './world-items.js';
// Reuse the licensed Kenney atlas already shipped with the game.
const townTiles=typeof Image==='undefined'?null:new Image();
if(townTiles)townTiles.src=new URL('./assets/kenney/town.png',import.meta.url).href;
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
  // Layered, coordinate-derived silhouettes keep scenery stable across visits.
  for(let i=0;i<11;i++){
    const x=i*98-18,h=18+(i*17%35);
    if(ruins){fill(i%2?'#646171':'#555363',x,116-h,76,h);fill('#817b83',x+10,109-h,48,5);}
    else if(marsh){fill('#314c54',x,111-h,72,h);fill('#5b8279',x+9,102-h,42,4);}
    else{fill(i%2?'#243e37':'#29463a',x+8,107-h,10,h+51);fill(i%2?'#315747':'#385f4a',x-3,102-h,82,h+8);fill(i%2?'#4f7556':'#57815d',x+7,94-h,64,h);fill('#73906a',x+20,91-h,38,7);fill('#87a276',x+28,87-h,18,4);}
  }
  fill(palette.ground,35,136,890,376);
  // Low contrast grass/stone flecks add texture without creating new targets.
  for(let i=0;i<70;i++){const x=46+(i*137)%862,y=150+(i*83)%350;fill(ruins?(i%3?'#777482':'#918987'):marsh?(i%3?'#55746a':'#789078'):(i%3?'#52725a':'#638263'),x,y,i%4===0?7:3,2);}
  g.beginPath();g.moveTo(440,512);g.bezierCurveTo(ruins?530:370,430,ruins?360:585,320,480,136);g.lineTo(548,136);g.bezierCurveTo(640,318,ruins?450:440,422,520,512);g.closePath();g.fillStyle=ruins?'#77736c':marsh?'#8a8064':'#a48b68';g.fill();
  if(ruins){
    for(const [x,y,w,h] of [[91,160,72,68],[797,179,57,91]]){fill('#292a38',x-7,y-5,w+15,h+8);fill('#625d69',x,y,w,h);fill('#77717a',x+8,y+8,w-16,7);fill('#454451',x+12,y+20,w-24,h-20);fill('#817b7b',x-7,y-6,w+15,7);for(let row=0;row<3;row++)fill('#a29384',x+(row%2?5:-4),y+24+row*17,w/2,3);}
    fill('#242635',439,136,16,62);fill('#8b8276',435,133,90,8);fill('#514e5a',457,143,47,4);
    for(let i=0;i<9;i++){const x=65+i*99,y=485+(i%3)*8;fill('#686674',x,y,42,18);fill('#827b7e',x+4,y-4,34,4);fill('#4d4c5d',x+12,y+4,2,9);}
  }
  else if(marsh){for(let i=0;i<6;i++){const x=78+i*156;fill(i%2?'#64837c':'#587770',x,300+(i%3)*47,83,12);fill('#9aa17c',x+18,306+(i%3)*47,42,3);}}
  else{for(let i=0;i<7;i++){const x=52+i*143;fill('#2d493c',x,114+(i%2)*17,12,102);fill(palette.accent,x-31,115+(i%2)*17,74,46);fill('#568161',x-22,94+(i%2)*17,57,26);}}
  for(const [x,y] of location.decor){
    if(ruins){fill('#363542',x,y,34,28);fill(palette.accent,x+4,y-19,27,20);fill('#827b76',x-3,y-23,40,6);}
    else if(marsh){fill('#294750',x,y+5,38,12);fill(palette.accent,x+7,y-19,4,28);fill('#a9b88a',x+20,y-28,4,36);}
    else if(townTiles?.complete&&townTiles.naturalWidth){g.drawImage(townTiles,64,0,16,32,x-16,y-63,40,80);}
    else{fill('#243f3b',x+11,y-9,8,30);fill('#1d382f',x-12,y-18,54,25);fill(palette.accent,x-8,y-38,46,28);fill('#5d8264',x-1,y-45,32,12);fill('#77916d',x+7,y-42,18,5);}
  }
  if(location.id==='riverbank'||kind==='bridge'){
    const bridge=kind==='bridge',x=bridge?35:730,y=bridge?190:136,w=bridge?890:195,h=bridge?80:376;
    fill('#24475c',x,y,w,h);fill('#356b82',x+5,y+7,w-10,h-14);
    for(let i=0;i<16;i++)fill('#72a7ad',x+12+(i*53)%(w-32),y+13+(i*29)%(h-22),18,2);
    if(bridge){const q=room.world.expedition.regions[location.id]?.quest,span=room.world.expedition.items[q?.gateId],intact=span?.condition==='intact';
      for(let i=0;i<10;i++)if(intact||i<3||i>7){fill('#70513b',444,178+i*10,83,9);fill('#b89361',449,178+i*10,73,3);}
      fill('#4d392f',438,170,7,115);fill('#4d392f',526,170,7,115);
    }
  }
  if(kind==='village'||kind==='interior'){
    for(const x of [80,735]){fill('#443b3d',x,120,140,118);fill('#b9976e',x+8,132,124,100);fill('#763f42',x-12,110,164,24);fill('#a36352',x,101,140,12);fill('#3c3037',x+50,181,35,51);fill('#e4c583',x+17,153,23,24);fill('#654637',x+14,164,29,4);}
    if(kind==='village'&&townTiles?.complete&&townTiles.naturalWidth){g.drawImage(townTiles,0,64,64,64,70,105,160,160);g.drawImage(townTiles,64,64,64,64,725,105,160,160);}
    if(location.id==='castle-gate'){fill('#393746',360,105,248,106);fill('#929095',366,105,62,106);fill('#929095',542,105,62,106);fill('#929095',420,105,128,25);fill('#b6aaa0',365,102,64,9);fill('#b6aaa0',540,102,64,9);}
    if(kind==='interior'){fill('#6b4a38',35,137,890,376);for(let i=0;i<12;i++)fill('#88634a',35,146+i*30,890,2);fill('#382d32',80,160,140,72);fill('#d78d4f',114,187,66,31);fill('#edc878',133,193,22,22);}
  }
  if(kind==='road'){for(const x of [110,800]){fill('#4f4034',x,170,7,70);fill('#b69363',x-22,172,58,18);}}
  fill(ruins?'#c6ab78':'#d9c68f',455,485,50,8);
  g.font='bold 21px monospace';g.textAlign='center';g.fillStyle='#f3e7cb';g.fillText(location.name.toUpperCase(),480,52);
  g.font='13px monospace';g.fillStyle='#e2d4b7';g.fillText('PATHS: '+location.exits.map(id=>room.world.expedition.locations[id]?.name||id).join(' · ').toUpperCase(),480,78);
}

export function drawBeast(g,c,x,y,hit=false){
 g.save();g.translate(Math.round(x),Math.round(y));g.scale(3,3);
 if(c.hp<=0)g.scale(1,.4);
 g.fillStyle='#20242b';g.beginPath();g.ellipse(0,1,11,3,0,0,Math.PI*2);g.fill();
 g.fillStyle=hit?'#eed5bc':c.attitude==='friendly'?'#8eaa83':'#9b897c';
 if(c.species==='crow'){
   g.fillRect(-6,-12,11,8);g.fillRect(2,-15,6,7);g.fillRect(-11,-11,5,3);g.fillRect(-3,-17,4,5);g.fillRect(-5,-9,8,4);g.fillStyle='#d6bb78';g.fillRect(7,-12,5,2);g.fillStyle='#171d22';g.fillRect(5,-13,2,2);g.fillStyle='#c59b62';g.fillRect(-3,-4,2,4);g.fillRect(2,-4,2,4);
 } else {
   g.fillRect(-9,-12,16,8);g.fillRect(4,-16,8,10);g.fillRect(7,-19,3,5);g.fillRect(11,-18,3,4);g.fillRect(-7,-5,3,5);g.fillRect(4,-5,3,5);g.fillRect(-11,-13,4,3);g.fillStyle='#171d22';g.fillRect(8,-13,2,2);
   if(c.species==='boar'){g.fillStyle='#ccb49a';g.fillRect(9,-8,3,3);g.fillRect(5,-8,3,3);g.fillStyle='#e3d6b8';g.fillRect(12,-7,2,2);g.fillRect(4,-7,2,2);}
   else {g.fillStyle='#8f695f';g.fillRect(-12,-11,4,3);g.fillRect(-9,-7,4,2);g.fillRect(-6,-4,3,3);g.fillRect(4,-4,3,3);}
 }
 g.restore();
}
