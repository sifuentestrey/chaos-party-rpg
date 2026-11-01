// @ts-nocheck
/** Chaos-owned native sprite wardrobe, shared by phone previews and TV.
 * Only original Fracture outfit pixels are recolored. Small accessory/ear
 * rectangles adapt the existing original-Chaos compositor, not its renderer.
 */
import {validateAppearance,normalizeAppearance,bodyScale} from './character-profile.mjs';
const skins=['#faa676','#f8d7ba','#d6a37a','#a87350','#744b37','#4b3028','#ffe7d1','#9b8960','#bd7956','#5e453d'];
const hairs=['#d5b030','#805233','#292331','#e8e3dc','#9e75c7','#e397b6','#a0442f','#faf2e5','#537ab4','#578754','#c84c41','#e6ba64'];
const cloths=[null,'#df8cae','#aa8bd4','#65b6a5','#679bd3','#d8b65f','#c65a66','#6e9566','#e8dfc5','#303443','#724a83','#e78b76','#9acda6','#9bc7e3','#ab7655','#bbc2d0'];
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const shade=(color,f)=>rgb(color).map(v=>Math.max(0,Math.min(255,Math.round(v*f))));
const originals=new Map(),variants=new Map();
const skinSet=new Set(['faa676','c78058','a06244','b57657','ea996b']);
const hairSet=new Set(['b49320','d5b030','dac273','e1bd3f','e6cd78']);
const garment={clotharmor:['d1d1d1','ececec','774e2d','92623a','966f4f'],leatherarmor:['774e2d','795335','966f4f','b4785b','896546','9f6448','db9e80','896446','92623a','9c6b54'],mailarmor:['6f6f6f','9c9c9c','b8b8b8','525252','505050','646464','979797','8b8b8b','717171'],platearmor:['9c9c9c','bebebe','ececec','6f6f6f','5c416c','664a77','525252'],redarmor:['f31818','f64f4f','b30a0a','fa9999','d82525','ff5e5e','ba1414','e00c0c'],goldenarmor:['e1cf36','d5b030','fff074','bc9b29','a68821','a98b23','eede59']};
export const hairVisible=outfit=>['bare','clotharmor','leatherarmor','robe','dress'].includes(outfit);
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function hex(r,g,b){return [r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function recolorPixels(data,width,a){
 const garmentSet=new Set(garment[a.outfit]);
 for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const key=hex(data[i],data[i+1],data[i+2]),y=Math.floor(i/4/width)%32;let color=null;
  if(skinSet.has(key)&&(a.skin||['orc','ogre'].includes(a.body))){const base=['orc','ogre'].includes(a.body)?shade(skins[a.skin],0.65).map((v,j)=>Math.round(v*0.5+[106,158,88][j]*0.5)):rgb(skins[a.skin]);const f=key==='c78058'||key==='a06244'?0.76:key==='b57657'?0.88:1;color=base.map(v=>Math.round(v*f));}
  else if(y<18&&hairVisible(a.outfit)&&hairSet.has(key)&&a.hair)color=shade(hairs[a.hair],(data[i]+data[i+1]+data[i+2])/3/161);
  else if(a.color&&garmentSet.has(key)&&(a.outfit!=='clotharmor'||y>=17))color=shade(cloths[a.color],0.55+(data[i]+data[i+1]+data[i+2])/3/310);
  if(color){data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];}
 }return data;
}
function decorate(ctx,source,w,a){
 const fill=(x,y,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,ww,hh);};
 for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){
  const ox=col*32,oy=row*32;let top=32,left=32,right=0;
  for(let y=0;y<19;y++)for(let x=4;x<28;x++){const i=((oy+y)*w+ox+x)*4;if(source[i+3]&&source[i]+source[i+1]+source[i+2]>100)top=Math.min(top,y);}
  if(top===32)continue;
  for(let y=top;y<top+5;y++)for(let x=4;x<28;x++){const i=((oy+y)*w+ox+x)*4;if(source[i+3]){left=Math.min(left,x);right=Math.max(right,x);}}
  const cx=ox+Math.round((left+right)/2),y=oy+top,up=Math.floor(row/3)===1,side=Math.floor(row/3)===0;
  const skin=['orc','ogre'].includes(a.body)?'#80a768':skins[a.skin],color=cloths[a.color]||'#9f79c7';
  if(['elf','orc','ogre','fairy'].includes(a.body)){
   ctx.save();ctx.globalCompositeOperation='destination-over';
   for(const sign of side?[1]:[-1,1]){fill(cx+sign*6-(sign<0?2:0),y+5,3,2,'#373737');fill(cx+sign*7,y+4,2,2,skin);}ctx.restore();
  }
  if(a.accessory==='hat'){fill(cx-7,y,14,2,'#373737');fill(cx-4,y-4,9,5,color);fill(cx-4,y-1,9,1,'#e6bd63');}
  if(a.accessory==='crown'){fill(cx-5,y,11,2,'#edbb51');for(const x of [-5,0,4])fill(cx+x,y-3,2,4,'#f4d36e');fill(cx,y,2,1,'#c95779');}
  if(a.accessory==='flower'||a.flower!=='none'&&a.flower){fill(cx+(a.flower==='left'?-6:5),y+1,1,6,'#67945b');fill(cx+(a.flower==='left'?-8:3),y+1,5,3,'#e68bb0');fill(cx+(a.flower==='left'?-7:4),y,3,5,'#e68bb0');fill(cx+(a.flower==='left'?-6:5),y+2,1,1,'#ffe6a0');}
  if((a.accessory==='glasses'||a.eyewear==='glasses')&&!up){fill(cx-5,y+5,4,3,'#302d35');if(!side){fill(cx+1,y+5,4,3,'#302d35');fill(cx-1,y+6,2,1,'#302d35');}fill(cx-4,y+6,2,1,'#a5d7df');if(!side)fill(cx+2,y+6,2,1,'#a5d7df');}
 }
}
function loadOriginal(outfit,base){const key=base+outfit;if(!originals.has(key))originals.set(key,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{originals.delete(key);reject(Error('Character art could not load: '+outfit));};im.src=base+outfit+'.png';}));return originals.get(key);}
function recolored(im,a){const c=canvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);const pixels=g.getImageData(0,0,c.width,c.height);recolorPixels(pixels.data,c.width,a);g.putImageData(pixels,0,0);return c;}
function addHair(ctx,a){if(!hairVisible(a.headwear)||a.hairStyle==='original')return;const hair=hairs[a.hair],shadow=shade(hair,.68);ctx.fillStyle=hair;
 for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){const ox=col*32,oy=row*32,up=Math.floor(row/3)===1;const pixels=ctx.getImageData(ox,oy,32,32).data;let top=32;for(let y=0;y<17;y++)for(let x=8;x<24;x++){if(pixels[(y*32+x)*4+3])top=Math.min(top,y);}if(top===32)continue;ctx.fillStyle=hair;const x=ox+16,y=oy+top;
  if(a.hairStyle==='cropped'){/* Trim only hair pixels, preserve the native face. */for(let yy=top;yy<top+3;yy++)for(let xx=8;xx<24;xx++){const i=(yy*32+xx)*4;if(pixels[i+3]&&yy<top+2)ctx.clearRect(ox+xx,oy+yy,1,1);}}
  if(['bob','long'].includes(a.hairStyle)){const length=a.hairStyle==='long'?12:8;ctx.fillRect(x-6,y+3,2,length);ctx.fillRect(x+5,y+3,2,length);if(up)ctx.fillRect(x-4,y+6,9,length-3);}
  if(a.hairStyle==='ponytail'){ctx.fillStyle=hair;ctx.fillRect(x-8,y+4,3,5);ctx.fillRect(x-9,y+8,3,4);ctx.fillRect(x-8,y+11,2,3);ctx.fillStyle='#493b39';ctx.fillRect(x-9,y+9,1,3);ctx.fillStyle='#d9a76c';ctx.fillRect(x-8,y+4,3,2);}
  if(a.hairStyle==='bun'){ctx.fillRect(x-3,y-3,6,4);ctx.fillRect(x-2,y-4,4,1);}
 }
}
export async function appearanceSheet(value,base='/creation/assets/'){
 const valid=validateAppearance(value),a=normalizeAppearance(valid),key=base+JSON.stringify(valid);
 if(variants.has(key)){const v=variants.get(key);variants.delete(key);variants.set(key,v);return v;}
 const result=(async()=>{
  if(valid.version===1){const im=await loadOriginal(valid.outfit,base),c=recolored(im,valid),g=c.getContext('2d');decorate(g,imToPixels(im),c.width,valid);return c;}
  const special=['robe','dress'].includes(a.outfit),torso=special?'clotharmor':a.outfit;
  const names=[a.headwear==='bare'?'clotharmor':a.headwear,torso,a.legs,a.boots];
  const images=await Promise.all(names.map(n=>loadOriginal(n,base)));const sheets=images.map((im,i)=>recolored(im,{...a,outfit:names[i],color:[a.headColor,a.color,a.bottomColor,a.bootColor][i]}));
  const c=canvas(160,288),g=c.getContext('2d');
  // All six native sheets share the same 32px animation grid. Each piece owns
  // one band; hands/face remain on their native source sheet.
  for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){
   const x=col*32,y=row*32;for(const [i,start,height] of [[0,0,17],[1,17,8],[2,25,3],[3,28,4]])g.drawImage(sheets[i],x,y+start,32,height,x,y+start,32,height);
  }
  if(special){const garmentImage=await loadOriginal(a.outfit==='robe'?'wizard':'villagegirl',base),src=canvas(garmentImage.width,garmentImage.height),sg=src.getContext('2d');sg.drawImage(garmentImage,0,0);const size=a.outfit==='robe'?26:24;
   // Reuse native garment pixels, repeated on the existing animated body's
   // frame position. The original animated feet remain visible below the hem.
   const sample=sg.getImageData(0,a.outfit==='robe'?9*26:0,size,size).data;let minY=size,maxY=0;for(let yy=10;yy<size-2;yy++)for(let xx=5;xx<size-5;xx++)if(sample[(yy*size+xx)*4+3]){minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);}
   for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){const x=col*32,y=row*32;const garment=canvas(32,32),gg=garment.getContext('2d');const sourceRow=a.outfit==='robe'?[1,4,7,2,5,8,3,6,9][row]*26:0,sourceCol=a.outfit==='robe'?(col%4)*26:0;gg.save();gg.beginPath();gg.moveTo(12,19);gg.lineTo(20,19);gg.lineTo(a.outfit==='dress'?23:21,29);gg.lineTo(a.outfit==='dress'?9:11,29);gg.closePath();gg.clip();gg.drawImage(src,sourceCol+6,sourceRow+minY,size-12,Math.max(1,maxY-minY),9,19,14,10);gg.restore();const pixels=gg.getImageData(0,0,32,32);for(let i=0;i<pixels.data.length;i+=4){if(!pixels.data[i+3])continue;const shadeValue=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3/170;const rgbValue=shade(cloths[a.color]||'#8871ad',Math.max(.55,shadeValue));pixels.data[i]=rgbValue[0];pixels.data[i+1]=rgbValue[1];pixels.data[i+2]=rgbValue[2];}gg.putImageData(pixels,0,0);g.clearRect(x+10,y+20,12,9);g.drawImage(garment,x,y);}
  }
  const pixels=g.getImageData(0,0,c.width,c.height).data;addHair(g,a);decorate(g,pixels,c.width,a);
  if(a.body==='fairy'){g.save();g.globalCompositeOperation='destination-over';for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){const x=col*32+16,y=row*32+19;for(const sign of [-1,1]){const flap=col%2;for(let k=0;k<9;k++){const width=[2,4,6,7,7,6,5,3,1][k],xx=sign<0?x-6-width+flap:x+6-flap;g.fillStyle='#536779';g.fillRect(xx,y-8+k,width,1);if(width>2){g.fillStyle=k<4?'#cbe8e7':'#a7bfd9';g.fillRect(xx+1,y-8+k,width-2,1);}}for(let k=0;k<6;k++){const width=[3,5,5,4,3,1][k],xx=sign<0?x-5-width:x+5;g.fillStyle='#65748e';g.fillRect(xx,y+k,width,1);if(width>2){g.fillStyle='#d6c9e6';g.fillRect(xx+1,y+k,width-2,1);}}}}g.restore();}
  c.__body=a.body;return c;
 })();variants.set(key,result);if(variants.size>64)variants.delete(variants.keys().next().value);result.catch(()=>variants.delete(key));return result;
}
function imToPixels(im){const c=canvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;}
export function drawPreview(ctx,sheet,{animation='idle',direction='down',time=0,scale=4}={}){
 const dir=direction==='up'?1:direction==='down'?2:0,pose=animation==='attack'?0:animation==='walk'?1:2,length=pose===0?5:pose===1?4:2;
 const index=Math.floor(time/(pose===2?460:145))%length,row=dir*3+pose;
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.imageSmoothingEnabled=false;ctx.save();const [sx,sy]=bodyScale(sheet.__body),w=32*scale*sx,h=32*scale*sy,x=(ctx.canvas.width-w)/2,y=ctx.canvas.height/2+16*scale-h;
 if(direction==='left'){ctx.translate(ctx.canvas.width,0);ctx.scale(-1,1);}ctx.drawImage(sheet,index*32,row*32,32,32,x,y,w,h);ctx.restore();
}
