// @ts-nocheck
/** Chaos-owned native sprite wardrobe, shared by phone previews and TV.
 * Only original Fracture outfit pixels are recolored. Small accessory/ear
 * rectangles adapt the existing original-Chaos compositor, not its renderer.
 */
import {validateAppearance} from './character-profile.mjs';
const skins=['#faa676','#f8d7ba','#d6a37a','#a87350','#744b37','#4b3028'];
const hairs=['#d5b030','#805233','#292331','#e8e3dc','#9e75c7','#e397b6'];
const cloths=[null,'#df8cae','#aa8bd4','#65b6a5','#679bd3','#d8b65f','#c65a66','#6e9566'];
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const shade=(color,f)=>rgb(color).map(v=>Math.max(0,Math.min(255,Math.round(v*f))));
const originals=new Map(),variants=new Map();
const skinSet=new Set(['faa676','c78058','a06244','b57657','ea996b']);
const hairSet=new Set(['b49320','d5b030','dac273','e1bd3f','e6cd78']);
const garment={clotharmor:['d1d1d1','ececec','774e2d','92623a','966f4f'],leatherarmor:['774e2d','795335','966f4f','b4785b','896546','9f6448','db9e80','896446','92623a','9c6b54'],mailarmor:['6f6f6f','9c9c9c','b8b8b8','525252','505050','646464','979797','8b8b8b','717171'],platearmor:['9c9c9c','bebebe','ececec','6f6f6f','5c416c','664a77','525252'],redarmor:['f31818','f64f4f','b30a0a','fa9999','d82525','ff5e5e','ba1414','e00c0c'],goldenarmor:['e1cf36','d5b030','fff074','bc9b29','a68821','a98b23','eede59']};
export const hairVisible=outfit=>['clotharmor','leatherarmor'].includes(outfit);
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function hex(r,g,b){return [r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function recolorPixels(data,width,a){
 const garmentSet=new Set(garment[a.outfit]);
 for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const key=hex(data[i],data[i+1],data[i+2]),y=Math.floor(i/4/width)%32;let color=null;
  if(skinSet.has(key)&&(a.skin||a.body==='orc')){const base=a.body==='orc'?shade(skins[a.skin],0.65).map((v,j)=>Math.round(v*0.5+[106,158,88][j]*0.5)):rgb(skins[a.skin]);const f=key==='c78058'||key==='a06244'?0.76:key==='b57657'?0.88:1;color=base.map(v=>Math.round(v*f));}
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
  const skin=a.body==='orc'?'#80a768':skins[a.skin],color=cloths[a.color]||'#9f79c7';
  if(a.body!=='human'){
   ctx.save();ctx.globalCompositeOperation='destination-over';
   for(const sign of side?[1]:[-1,1]){fill(cx+sign*6-(sign<0?2:0),y+5,3,2,'#373737');fill(cx+sign*7,y+4,2,2,skin);}ctx.restore();
  }
  if(a.accessory==='hat'){fill(cx-7,y,14,2,'#373737');fill(cx-4,y-4,9,5,color);fill(cx-4,y-1,9,1,'#e6bd63');}
  if(a.accessory==='crown'){fill(cx-5,y,11,2,'#edbb51');for(const x of [-5,0,4])fill(cx+x,y-3,2,4,'#f4d36e');fill(cx,y,2,1,'#c95779');}
  if(a.accessory==='flower'){fill(cx+5,y+1,1,6,'#67945b');fill(cx+3,y+1,5,3,'#e68bb0');fill(cx+4,y,3,5,'#e68bb0');fill(cx+5,y+2,1,1,'#ffe6a0');}
  if(a.accessory==='glasses'&&!up){fill(cx-5,y+5,4,3,'#302d35');if(!side){fill(cx+1,y+5,4,3,'#302d35');fill(cx-1,y+6,2,1,'#302d35');}fill(cx-4,y+6,2,1,'#a5d7df');if(!side)fill(cx+2,y+6,2,1,'#a5d7df');}
 }
}
export async function appearanceSheet(value,base='/creation/assets/'){
 const a=validateAppearance(value),key=base+JSON.stringify(a);
 if(variants.has(key)){const v=variants.get(key);variants.delete(key);variants.set(key,v);return v;}
 const originalKey=base+a.outfit;
 if(!originals.has(originalKey))originals.set(originalKey,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{originals.delete(originalKey);reject(Error('Character art could not load.'));};im.src=base+a.outfit+'.png';}));
 const result=Promise.resolve(originals.get(originalKey)).then(im=>{const c=canvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);const pixels=g.getImageData(0,0,c.width,c.height),original=new Uint8ClampedArray(pixels.data);recolorPixels(pixels.data,c.width,a);g.putImageData(pixels,0,0);decorate(g,original,c.width,a);return c;});
 variants.set(key,result);if(variants.size>64)variants.delete(variants.keys().next().value);
 result.catch(()=>variants.delete(key));return result;
}
export function drawPreview(ctx,sheet,{animation='idle',direction='down',time=0,scale=4}={}){
 const dir=direction==='up'?1:direction==='down'?2:0,pose=animation==='attack'?0:animation==='walk'?1:2,length=pose===0?5:pose===1?4:2;
 const index=Math.floor(time/(pose===2?460:145))%length,row=dir*3+pose;
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.imageSmoothingEnabled=false;ctx.save();const x=(ctx.canvas.width-32*scale)/2,y=(ctx.canvas.height-32*scale)/2;
 if(direction==='left'){ctx.translate(ctx.canvas.width,0);ctx.scale(-1,1);}ctx.drawImage(sheet,index*32,row*32,32,32,x,y,32*scale,32*scale);ctx.restore();
}
