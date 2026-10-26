import {OBJECTS,objectState} from './environment.js';
// Rendering is a view of authoritative object state, never a second simulation.
export function drawEnvironment(g,room,t,tiles){
  const second=t/1000,layers=[];
  const tile=(id,x,y,size=32)=>{if(tiles.complete&&tiles.naturalWidth)g.drawImage(tiles,(id%12)*16,Math.floor(id/12)*16,16,16,Math.round(x),Math.round(y),size,size);};
  const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h);};
  const ellipse=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
  const fire=(x,y,width=28)=>{for(let n=0;n<5;n++){const h=9+Math.sin(second*7+n*2)*5;rect(x-width/2+n*width/5,y-h,4,h,n%2?'#f7d17b':'#df804d');}};
  const glow=(x,y,size=110)=>{const grad=g.createRadialGradient(x,y,2,x,y,size);grad.addColorStop(0,'#ffc47b28');grad.addColorStop(1,'#ffc47b00');g.fillStyle=grad;g.fillRect(x-size,y-size,size*2,size*2);};
  for(const [id,o] of Object.entries(OBJECTS)){
    const s=objectState(room?.world,id),[px,py]=o.position,x=px+s.offset[0],y=py+s.offset[1];
    const draw=()=>{
      if(s.spilled)ellipse(x,y+14,36,11,'#c3934d88');
      if(s.condition==='taken')return;
      if(s.condition==='broken'){
        if(o.family==='window'){rect(x-25,y-55,50,50,'#151c33');rect(x-8,y-50,3,15,'#abc8d2');}
        if(o.family==='wall')rect(x-35,y-57,70,55,'#151b2b');
        if(o.family==='floor'){rect(x-44,y-7,88,3,'#33262d');rect(x-7,y-5,3,23,'#33262d');}
        for(let n=0;n<7;n++)rect(x-28+n*8,y+6+(n%3)*5,o.material==='glass'?5:20,o.material==='glass'?3:5,o.material==='glass'?'#b5d8df':'#9b7152');
        return;
      }
      switch(o.family){
        case 'rug':
          rect(x-143,y-78,286,177,'#21192555');rect(x-135,y-88,270,175,'#382936');rect(x-129,y-83,258,165,'#5f3e56');
          g.strokeStyle='#b17b60';g.lineWidth=3;g.strokeRect(x-123,y-77,246,153);g.strokeStyle='#89606a';g.lineWidth=1;g.strokeRect(x-114,y-68,228,135);
          for(let n=0;n<7;n++){rect(x-100+n*34,y-78,5,3,'#d09a68');rect(x-100+n*34,y+74,5,3,'#d09a68');}
          g.fillStyle='#c38b65';g.beginPath();g.moveTo(x,y-54);g.lineTo(x+17,y);g.lineTo(x,y+53);g.lineTo(x-17,y);g.closePath();g.fill();rect(x-5,y-5,10,10,'#5f3e56');break;
        case 'table':
          ellipse(x,y+31,46,9,'#00000033');rect(x-36,y-9,72,46,'#36262a');rect(x-40,y-16,80,40,'#ae7850');rect(x-36,y-16,72,5,'#bf8759');rect(x-36,y+3,72,2,'#85563d');tile(113,x-27,y-27,27);tile(114,x+7,y-25,27);rect(x+2,y+6,12,3,'#dec19b');break;
        case 'chair':tile(73,x-16,y-22,32);break;
        case 'barrel':tile(82,x-22,y-44,44);if(s.open)ellipse(x,y-38,15,5,'#29212b');break;
        case 'sideboard':rect(x-31,y-20,62,20,'#3d2a2b');rect(x-34,y-24,68,7,'#ad7951');break;
        case 'bottle':tile(s.spilled?114:113,x-12,y-24,24);break;
        case 'candle':rect(x-2,y-10,5,17,'#37262b');rect(x-2,y-14,5,12,'#f3d497');if(s.lit){glow(x,y-15,50);fire(x,y-14,5);}break;
        case 'counter':for(let xx=x-174;xx<x+184;xx+=32){tile(63,xx,y-28);rect(xx,y-30,32,6,'#bc885a');}break;
        case 'chest':tile(89,x-20,y-32,40);if(s.open||room?.quest?.crown)rect(x-13,y-22,27,9,'#211925');break;
        case 'door':rect(x-45,y+10,90,30,'#35252e');rect(x-39,y+14,78,26,'#cda374');rect(x-31,y+18,62,22,s.open?'#151b2b':'#9c7355');if(s.open){rect(x-30,y+19,10,21,'#614536');glow(x,y+20,70);}break;
        case 'hearth':
          rect(x-38,y-70,76,87,'#28222a');rect(x-42,y-78,84,12,'#62515a');rect(x-38,y-66,12,76,'#62515a');rect(x+26,y-66,12,76,'#62515a');rect(x-26,y-58,52,62,'#1f1922');rect(x-30,y-1,60,7,'#624333');if(s.lit){fire(x,y-2,42);glow(x,y-8,145);}break;
        case 'window':
          rect(x-29,y-65,58,64,'#211c30');rect(x-24,y-60,48,52,s.open?'#131a31':'#333c5a');rect(x+7,y-54,8,8,'#b8c9b8');rect(x-2,y-60,5,52,'#4f3840');if(!s.open)rect(x-24,y-35,48,5,'#4f3840');rect(x-32,y-5,64,6,'#b18156');break;
        case 'shelf':rect(x-70,y-52,140,52,'#34242b');rect(x-74,y-7,148,7,'#9d7150');for(let n=0;n<5;n++)tile(113+n%4,x-70+n*27,y-41,28);break;
        case 'sign':rect(x-130,y-54,260,53,'#261d29');g.strokeStyle='#a87c50';g.lineWidth=3;g.strokeRect(x-129,y-53,258,51);g.font='bold 16px monospace';g.textAlign='center';g.fillStyle='#e0bd80';g.fillText('THE TIPSY WYVERN',x,y-31);g.font='10px monospace';g.fillStyle='#a48e7a';g.fillText('EST. BEFORE GOOD JUDGMENT',x,y-14);break;
        case 'lamp':if(s.lit)glow(x,y);rect(x-7,y-15,14,24,'#3d2a2b');rect(x-5,y-11,10,15,s.lit?'#d99855':'#5a4a42');if(s.lit)rect(x-2,y-9,4,12,'#ffe3a3');break;
        case 'chandelier':
          rect(x-1,88,3,100,'#382b30');g.strokeStyle='#46343b';g.lineWidth=4;g.beginPath();g.ellipse(x,202,58,12,0,0,Math.PI*2);g.stroke();
          for(const dx of [-48,-24,24,48]){rect(x+dx,190,5,13,'#e0c190');if(s.lit)fire(x+dx+2,190,5);}break;
        case 'bunting':g.strokeStyle='#30232b';g.lineWidth=2;g.beginPath();g.moveTo(x-150,y-5);g.quadraticCurveTo(x,y+10,x+150,y-5);g.stroke();for(let n=0;n<11;n++){const xx=x-145+n*29,yy=y-6+Math.sin(n/10*Math.PI)*5;g.fillStyle=n%2?'#98704e':'#6c5961';g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+12,yy+2);g.lineTo(xx+5,yy+16);g.fill();}break;
        case 'beam':rect(x-5,y-113,10,114,'#30232a');rect(x-3,y-113,3,110,'#916044');break;
      }
      if(s.condition==='burning'){glow(x,y-15,90);fire(x,y,54);}
      if(room?.phase==='react'&&room.turn?.target?.kind===id){ellipse(x,Math.min(496,y+9),32+Math.sin(second*5)*2,9,'#f2cc7744');}
    };
    // Ground rugs and hanging fixtures precede actors. Furniture uses depth sorting.
    if(['rug','door','window','shelf','sign','lamp','chandelier','hearth','counter','chest'].includes(o.family))draw();else layers.push({y,draw});
  }
  return layers;
}
