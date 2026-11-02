// @ts-nocheck
/** Chaos-owned native sprite wardrobe, shared by phone previews and TV.
 * Only original Fracture outfit pixels are recolored. Small accessory/ear
 * rectangles adapt the existing original-Chaos compositor, not its renderer.
 */
import {validateAppearance,normalizeAppearance,bodyScale,OUTFIT_SOURCES,HEADWEAR_SOURCES,DERIVED_HERITAGES} from './character-profile.mjs';
const skins=['#faa676','#f8d7ba','#d6a37a','#a87350','#744b37','#4b3028','#ffe7d1','#9b8960','#bd7956','#5e453d'];
const hairs=['#d5b030','#805233','#292331','#e8e3dc','#9e75c7','#e397b6','#a0442f','#faf2e5','#537ab4','#578754','#c84c41','#e6ba64'];
const cloths=[null,'#df8cae','#aa8bd4','#65b6a5','#679bd3','#d8b65f','#c65a66','#6e9566','#e8dfc5','#303443','#724a83','#e78b76','#9acda6','#9bc7e3','#ab7655','#bbc2d0'];
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const shade=(color,f)=>rgb(color).map(v=>Math.max(0,Math.min(255,Math.round(v*f))));
const originals=new Map(),variants=new Map();
// The native ogre body is larger than the standard Fracture body. Derived
// wardrobe and heritage layers use this scale so accessories keep the same
// proportions without introducing a second sprite set.
export const HERITAGE_LAYER_SCALES=Object.freeze({ogre:1.2});
const skinSet=new Set(['faa676','c78058','a06244','b57657','ea996b']);
const hairSet=new Set(['b49320','d5b030','dac273','e1bd3f','e6cd78']);
const garment={clotharmor:['d1d1d1','ececec','774e2d','92623a','966f4f'],leatherarmor:['774e2d','795335','966f4f','b4785b','896546','9f6448','db9e80','896446','92623a','9c6b54'],mailarmor:['6f6f6f','9c9c9c','b8b8b8','525252','505050','646464','979797','8b8b8b','717171'],platearmor:['9c9c9c','bebebe','ececec','6f6f6f','5c416c','664a77','525252'],redarmor:['f31818','f64f4f','b30a0a','fa9999','d82525','ff5e5e','ba1414','e00c0c'],goldenarmor:['e1cf36','d5b030','fff074','bc9b29','a68821','a98b23','eede59']};
export const hairVisible=headwear=>['bare','clotharmor','leatherarmor','robe','dress','mask','circlet'].includes(headwear);
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function hex(r,g,b){return [r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function recolorPixels(data,width,a){
 const sourceOutfit=OUTFIT_SOURCES[a.outfit]||a.outfit,heritage=DERIVED_HERITAGES[a.body],garmentSet=new Set(garment[sourceOutfit]||[]);
 for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const key=hex(data[i],data[i+1],data[i+2]),y=Math.floor(i/4/width)%32;let color=null;
  if(skinSet.has(key)&&(a.skin||heritage||['orc','ogre'].includes(a.body))){const base=heritage?shade(heritage.skin,.94+(a.skin%4)*.03):['orc','ogre'].includes(a.body)?shade(skins[a.skin],0.65).map((v,j)=>Math.round(v*0.5+[106,158,88][j]*0.5)):rgb(skins[a.skin]);const f=key==='c78058'||key==='a06244'?0.76:key==='b57657'?0.88:1;color=base.map(v=>Math.round(v*f));}
  else if(y<18&&hairVisible(a.headwear||sourceOutfit)&&hairSet.has(key)&&a.hair)color=shade(hairs[a.hair],(data[i]+data[i+1]+data[i+2])/3/161);
  else if(a.color&&garmentSet.has(key)&&(sourceOutfit!=='clotharmor'||y>=17))color=shade(cloths[a.color],0.55+(data[i]+data[i+1]+data[i+2])/3/310);
  if(color){data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];}
 }return data;
}
const shadeHex=(color,f)=>'#'+shade(color,f).map(v=>v.toString(16).padStart(2,'0')).join('');
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const rect=(x,y,w,h)=>({x,y,w,h,visible:w>0&&h>0});
function inside(bounds,x,y,w,h){const left=Math.max(bounds.left,x),top=Math.max(bounds.top,y),right=Math.min(bounds.right+1,x+w),bottom=Math.min(bounds.bottom+1,y+h);return rect(left,top,Math.max(0,right-left),Math.max(0,bottom-top));}
/**
 * Every derived pixel is constrained to one native 32px frame. The head
 * window leaves a small crown margin for horns and topknot layers while the
 * body window keeps tails, wings and costume hems inside the frame.
 */
export function frameLayerBounds({top=7,left=10,right=22}={}){
 const head={left:clamp(left-2,3,27),right:clamp(right+2,5,29),top:clamp(top-3,0,15),bottom:clamp(top+12,12,20)};
 const body={left:clamp(left-4,0,27),right:clamp(right+4,4,31),top:clamp(top+8,8,28),bottom:31};
 return {frame:{left:0,right:31,top:0,bottom:31},head,body};
}
/** Pure audit data used by tests and tooling for the full creator matrix. */
export function appearanceLayerAudit(value={},metrics={}){
 const bounds=frameLayerBounds(metrics),head=bounds.head,body=bounds.body;
 const hairVisibleHere=hairVisible(value.headwear||'bare');
 const layers={hair:inside(head,head.left,head.top,head.right-head.left+1,head.bottom-head.top+1),headwear:inside(head,head.left,head.top,head.right-head.left+1,Math.max(1,head.bottom-head.top)),costume:inside(body,body.left,body.top,body.right-body.left+1,body.bottom-body.top+1),accessory:inside(body,body.left,body.top,body.right-body.left+1,body.bottom-body.top+1),heritage:inside(bounds.frame,bounds.frame.left,bounds.frame.top,32,32),presentation:inside(body,body.left,body.top,body.right-body.left+1,body.bottom-body.top+1)};
 const features=[];
 if(value.hairStyle&&value.hairStyle!=='original'&&hairVisibleHere)features.push(layers.hair);
 if(value.headwear&&value.headwear!=='bare')features.push(layers.headwear);
 if(value.outfit&&['tunic','cloak','tabard'].includes(value.outfit))features.push(layers.costume);
 if(value.accessory&&value.accessory!=='none')features.push(layers.accessory);
 if(DERIVED_HERITAGES[value.body]||value.body==='fairy')features.push(layers.heritage);
 if(value.presentation==='feminine')features.push(layers.presentation);
 return {bounds,layers,features,layerScale:HERITAGE_LAYER_SCALES[value.body]||1,visible:features.every(f=>f.visible)};
}
function derivedCostume(ctx,a,cx,y,up,fill){
 const color=cloths[a.color]||'#9f79c7',shadow=shadeHex(color,.62);
 if(a.outfit==='cloak'){
  // A cloak is a pair of tapered side panels with a hem, rather than a
  // solid rectangle. It remains behind the native torso but reads on every
  // facing direction through the exposed shoulders and hem.
  ctx.save();ctx.globalCompositeOperation='destination-over';
  fill(cx-8,y+8,2,4,color);fill(cx+6,y+8,2,4,color);
  fill(cx-9,y+12,2,6,shadow);fill(cx+7,y+12,2,6,shadow);
  fill(cx-8,y+18,2,5,color);fill(cx+6,y+18,2,5,color);
  fill(cx-7,y+23,2,3,shadow);fill(cx+5,y+23,2,3,shadow);
  if(up)fill(cx-7,y+7,14,2,shadow);
  ctx.restore();
  // A short collar and clasp make the tapered panels read as a cloak rather
  // than a flat purple slab while staying on the native torso frame.
  fill(cx-5,y+8,10,2,shadow);fill(cx-1,y+8,2,2,'#e1c16a');
 }
 if(a.outfit==='tunic'){fill(cx-7,y+17,14,10,color);fill(cx-8,y+22,16,2,shadow);fill(cx-2,y+18,4,8,shadeHex(color,1.18));}
 if(a.outfit==='tabard'){fill(cx-6,y+17,12,11,color);fill(cx-2,y+17,4,11,shadeHex(color,1.2));fill(cx-7,y+26,14,2,shadow);}
}
function heritageLayer(ctx,a,cx,y,up,side,fill){
 const h=DERIVED_HERITAGES[a.body];if(!h)return;
 const accent=h.accent,shadow=shadeHex(accent,.68),skin=h.skin;
 if(a.body==='vampire'){
  if(a.accessory!=='cape'){ctx.save();ctx.globalCompositeOperation='destination-over';fill(cx-8,y+7,3,7,shadow);fill(cx+5,y+7,3,7,shadow);fill(cx-7,y+14,3,8,accent);fill(cx+4,y+14,3,8,accent);if(up)fill(cx-7,y+6,14,2,shadow);ctx.restore();}
  // The pale eye and fang marks stay on every facing frame so the derived
  // heritage remains identifiable even while a character faces away.
  fill(cx-5,y+6,2,2,accent);fill(cx+3,y+6,2,2,accent);fill(cx-3,y+10,2,2,'#f7f1e6');fill(cx+1,y+10,2,2,'#f7f1e6');
 }
 if(a.body==='werewolf'){
  // Ears stay above the hairline and the tail has a visible foreground tip;
  // the mirrored right-facing frame uses the same canonical left-facing data.
  fill(cx-7,y+1,3,4,skin);fill(cx-6,y,2,2,accent);fill(cx+4,y+1,3,4,skin);fill(cx+5,y,2,2,accent);
  ctx.save();ctx.globalCompositeOperation='destination-over';fill(cx+(side?-9:6),y+11,3,4,accent);fill(cx+(side?-11:8),y+14,3,4,shadow);ctx.restore();
  fill(cx+(side?-8:7),y+15,2,4,accent);fill(cx+(side?-10:9),y+18,2,2,shadow);
 }
 if(a.body==='skeleton'){fill(cx-5,y+5,3,3,'#39353b');fill(cx+2,y+5,3,3,'#39353b');fill(cx-5,y+10,10,2,shadeHex(h.skin,.78));fill(cx-3,y+11,6,1,'#39353b');}
 if(a.body==='demon'){
  // Horns are foreground features so every hairstyle and headwear leaves
  // them readable. Tail and wings deliberately include foreground pixels on
  // the front frame; they are not side/back-only details.
  fill(cx-6,y+1,3,4,accent);fill(cx-7,y-2,2,4,accent);fill(cx-6,y-5,2,3,shadow);
  fill(cx+3,y+1,3,4,accent);fill(cx+5,y-2,2,4,accent);fill(cx+5,y-5,2,3,shadow);
  ctx.save();ctx.globalCompositeOperation='destination-over';fill(cx+(side?-8:6),y+12,3,5,shadow);fill(cx+(side?-10:8),y+16,3,4,accent);ctx.restore();
  fill(cx+(side?-7:7),y+16,2,4,accent);fill(cx+(side?-9:9),y+19,2,2,shadow);
  for(const sign of [-1,1]){fill(cx+sign*8,y+8,2,3,shadow);fill(cx+sign*10,y+10,2,4,accent);fill(cx+sign*11,y+14,2,2,shadow);}
 }
}
/**
 * Feminine presentation is a cosmetic derived layer, not gear or a stat.
 * A compact sash and collar accent use the existing wardrobe palette and are
 * painted last so the opt-in presentation remains readable with every native
 * hairstyle, headwear, outfit and heritage in every facing direction.
 */
function presentationLayer(ctx,a,cx,y,up,side,fill){
 if(a.presentation!=='feminine')return;
 const accent=DERIVED_HERITAGES[a.body]?.accent||cloths[a.color]||'#df8cae';
 const highlight=shadeHex(accent,1.2),shadow=shadeHex(accent,.7);
 fill(cx-6,y+16,12,2,accent);fill(cx-1,y+16,2,2,highlight);
 fill(cx-4,y+13,8,1,shadow);fill(cx-1,y+13,2,1,highlight);
 // Keep one small head accent in the native head window so the choice remains
 // legible even when a cloak or armor hides the torso from a side/back view.
 fill(cx-3,y+5,6,1,accent);fill(cx-1,y+6,2,1,highlight);
}
function decorate(ctx,source,w,a){
 const frameFill=(bounds,ox,oy,x,y,ww,hh,c)=>{const frame=bounds.frame||bounds,left=Math.max(ox+frame.left,x),top=Math.max(oy+frame.top,y),right=Math.min(ox+frame.right+1,x+ww),bottom=Math.min(oy+frame.bottom+1,y+hh);if(right<=left||bottom<=top)return;ctx.fillStyle=c;ctx.fillRect(left,top,right-left,bottom-top);};
 for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){
  const ox=col*32,oy=row*32;let top=32,left=32,right=0;
  for(let y=0;y<19;y++)for(let x=4;x<28;x++){const i=((oy+y)*w+ox+x)*4;if(source[i+3]&&source[i]+source[i+1]+source[i+2]>100)top=Math.min(top,y);}
  if(top===32)continue;
  for(let y=top;y<top+5;y++)for(let x=4;x<28;x++){const i=((oy+y)*w+ox+x)*4;if(source[i+3]){left=Math.min(left,x);right=Math.max(right,x);}}
  const cx=ox+Math.round((left+right)/2),y=oy+top,up=Math.floor(row/3)===1,side=Math.floor(row/3)===0,bounds=frameLayerBounds({top,left,right}),frame={left:ox+bounds.frame.left,top:oy+bounds.frame.top,right:ox+bounds.frame.right,bottom:oy+bounds.frame.bottom};
  const layerScale=HERITAGE_LAYER_SCALES[a.body]||1;
  const fill=(x,yy,ww,hh,c)=>frameFill(bounds,ox,oy,Math.round(cx+(x-cx)*layerScale),Math.round(y+(yy-y)*layerScale),Math.max(1,Math.round(ww*layerScale)),Math.max(1,Math.round(hh*layerScale)),c);
  ctx.save();ctx.beginPath();ctx.rect(frame.left,frame.top,32,32);ctx.clip();
  const skin=DERIVED_HERITAGES[a.body]?.skin||(['orc','ogre'].includes(a.body)?'#80a768':skins[a.skin]),color=cloths[a.color]||'#9f79c7',headColor=cloths[a.headColor]||color;
  derivedCostume(ctx,a,cx,y,up,fill);
  if(a.accessory==='cape'){
   ctx.save();ctx.globalCompositeOperation='destination-over';
   const capeShade=shade(cloths[a.color]||'#8871ad',.72).map(v=>v.toString(16).padStart(2,'0')).join('');
   fill(cx-8,y+5,3,12,'#'+capeShade);fill(cx+6,y+5,3,12,'#'+capeShade);
   if(up)fill(cx-7,y+4,14,3,'#'+capeShade);
   ctx.restore();
  }
  if(['elf','orc','ogre','fairy'].includes(a.body)){
   ctx.save();ctx.globalCompositeOperation='destination-over';
   for(const sign of side?[1]:[-1,1]){fill(cx+sign*6-(sign<0?2:0),y+5,3,2,'#373737');fill(cx+sign*7,y+4,2,2,skin);}ctx.restore();
  }
  if(a.headwear==='hood'){
   fill(cx-8,y-1,16,3,headColor);fill(cx-7,y+1,14,3,headColor);
   fill(cx-9,y+3,2,7,headColor);fill(cx+7,y+3,2,7,headColor);
   fill(cx-6,y+2,12,1,shade(headColor,.72).map(v=>v.toString(16).padStart(2,'0')).join('').replace(/^/,'#'));
  }
  if(a.headwear==='mask'&&!up){
   const mask=shade(headColor,.8).map(v=>v.toString(16).padStart(2,'0')).join('');
   fill(cx-6,y+7,12,3,'#'+mask);fill(cx-7,y+8,1,1,'#'+mask);fill(cx+6,y+8,1,1,'#'+mask);
  }
  if(a.headwear==='circlet'){fill(cx-7,y+1,14,2,'#d9b34f');fill(cx-1,y-1,3,3,'#f3d879');}
  if(a.headwear==='cowl'){fill(cx-8,y-1,16,3,headColor);fill(cx-9,y+2,2,8,headColor);fill(cx+7,y+2,2,8,headColor);fill(cx-6,y+3,12,2,shadeHex(headColor,.72));}
  if(a.headwear==='pointed'){fill(cx-2,y-6,4,6,headColor);fill(cx-5,y-3,10,3,headColor);fill(cx-8,y,16,2,shadeHex(headColor,.72));}
  if(a.headwear==='veil'&&!up){fill(cx-7,y+1,14,2,headColor);fill(cx-8,y+3,2,8,shadeHex(headColor,.72));fill(cx+7,y+3,2,8,shadeHex(headColor,.72));}
  if(a.accessory==='hat'){fill(cx-7,y,14,2,'#373737');fill(cx-4,y-4,9,5,color);fill(cx-4,y-1,9,1,'#e6bd63');}
  if(a.accessory==='crown'){fill(cx-5,y,11,2,'#edbb51');for(const x of [-5,0,4])fill(cx+x,y-3,2,4,'#f4d36e');fill(cx,y,2,1,'#c95779');}
  if(a.accessory==='scarf'){fill(cx-7,y+11,14,3,color);fill(cx+5,y+13,3,6,shadeHex(color,.72));}
  if(a.accessory==='satchel'){fill(cx+(side?-10:7),y+13,4,7,shadeHex(color,.72));fill(cx+(side?-9:8),y+11,2,3,'#d9b36f');}
  if(a.accessory==='shoulderpad'){fill(cx-10,y+9,5,4,headColor);fill(cx+5,y+9,5,4,headColor);}
  if(a.accessory==='ribbon'){fill(cx-7,y+2,14,1,'#d85b83');fill(cx-1,y+2,2,5,'#e78b9f');}
  if(a.accessory==='flower'||a.flower!=='none'&&a.flower){fill(cx+(a.flower==='left'?-6:5),y+1,1,6,'#67945b');fill(cx+(a.flower==='left'?-8:3),y+1,5,3,'#e68bb0');fill(cx+(a.flower==='left'?-7:4),y,3,5,'#e68bb0');fill(cx+(a.flower==='left'?-6:5),y+2,1,1,'#ffe6a0');}
  if((a.accessory==='glasses'||a.eyewear==='glasses')&&!up){fill(cx-5,y+5,4,3,'#302d35');if(!side){fill(cx+1,y+5,4,3,'#302d35');fill(cx-1,y+6,2,1,'#302d35');}fill(cx-4,y+6,2,1,'#a5d7df');if(!side)fill(cx+2,y+6,2,1,'#a5d7df');}
  if(a.facialHair&&a.facialHair!=='none'&&hairVisible(a.headwear)&&!up){
   const beard=hairs[a.hair]||hairs[0];
   if(a.facialHair==='stubble')fill(cx-3,y+8,6,1,shade(beard,.72).map(v=>v.toString(16).padStart(2,'0')).join('').replace(/^/,'#'));
   if(a.facialHair==='mustache'){fill(cx-3,y+7,3,2,beard);fill(cx+1,y+7,3,2,beard);}
   if(a.facialHair==='beard'){fill(cx-4,y+7,8,3,beard);fill(cx-3,y+10,6,2,beard);}
   if(a.facialHair==='goatee'){fill(cx-2,y+7,4,2,beard);fill(cx-1,y+9,2,3,beard);}
   if(a.facialHair==='sideburns'){fill(cx-6,y+6,2,5,beard);fill(cx+4,y+6,2,5,beard);}
  }
  heritageLayer(ctx,a,cx,y,up,side,fill);
  presentationLayer(ctx,a,cx,y,up,side,fill);
  ctx.restore();
 }
}
function loadOriginal(outfit,base){const key=base+outfit;if(!originals.has(key))originals.set(key,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{originals.delete(key);reject(Error('Character art could not load: '+outfit));};im.src=base+outfit+'.png';}));return originals.get(key);}
function recolored(im,a){const c=canvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);const pixels=g.getImageData(0,0,c.width,c.height);recolorPixels(pixels.data,c.width,a);g.putImageData(pixels,0,0);return c;}
function addHair(ctx,a){if(!hairVisible(a.headwear)||a.hairStyle==='original')return;const hair=hairs[a.hair],shadow=shadeHex(hair,.68);
 for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){
  const ox=col*32,oy=row*32,up=Math.floor(row/3)===1,pixels=ctx.getImageData(ox,oy,32,32).data;let top=32,left=32,right=0;
  for(let yy=0;yy<17;yy++)for(let xx=4;xx<28;xx++)if(pixels[(yy*32+xx)*4+3]){top=Math.min(top,yy);left=Math.min(left,xx);right=Math.max(right,xx);}
  if(top===32)continue;
  const bounds=frameLayerBounds({top,left,right}).head,head={left:ox+bounds.left,top:oy+bounds.top,right:ox+bounds.right,bottom:oy+bounds.bottom};
  const paint=(x,y,w,h,color=hair)=>{const l=Math.max(head.left,x),t=Math.max(head.top,y),r=Math.min(head.right+1,x+w),b=Math.min(head.bottom+1,y+h);if(r<=l||b<=t)return;ctx.fillStyle=color;ctx.fillRect(l,t,r-l,b-t);};
  // Every hairstyle is a compact head-layer. No clearRect is used: the
  // native face remains intact and the bounded overlay cannot erase it.
  const x=ox+Math.round((left+right)/2),y=oy+top;
  if(a.hairStyle==='cropped')paint(x-6,y,12,3);
  if(['bob','long'].includes(a.hairStyle)){const length=Math.min(a.hairStyle==='long'?7:5,Math.max(1,head.bottom-(y+2)));paint(x-6,y+2,2,length);paint(x+5,y+2,2,length);if(up)paint(x-4,y+4,8,Math.max(1,length-1));}
  if(a.hairStyle==='ponytail'){paint(x-7,y+3,3,5);paint(x-8,y+7,3,4);paint(x-7,y+10,2,2,shadow);}
  if(a.hairStyle==='bun'){paint(x-3,y-2,6,3);paint(x-2,y-3,4,1);}
  if(a.hairStyle==='braids'){paint(x-6,y+3,2,6);paint(x-7,y+8,2,3,shadow);paint(x+5,y+3,2,6);paint(x+6,y+8,2,3,shadow);}
  if(a.hairStyle==='mohawk'){paint(x-2,y-3,4,7);paint(x-4,y,8,2,shadow);}
  if(a.hairStyle==='sidecut'){paint(x+1,y,6,3);}
  if(a.hairStyle==='curly'){for(const [dx,dy] of [[-5,1],[-2,-1],[1,-1],[4,1],[-4,4],[0,3],[4,4]])paint(x+dx,y+dy,2,2);}
  if(a.hairStyle==='pixie'){paint(x-5,y-1,10,3);paint(x-3,y+2,6,2,shadow);}
  if(a.hairStyle==='topknot'){paint(x-2,y-3,4,3);paint(x-1,y-5,2,2);paint(x-6,y+2,12,2);}
  if(a.hairStyle==='sidebraid'){paint(x-6,y+3,2,6);paint(x-7,y+8,2,4);paint(x-6,y+12,2,1,shadow);}
 }
}
export async function appearanceSheet(value,base='/creation/assets/'){
 const valid=validateAppearance(value),a=normalizeAppearance(valid),key=base+JSON.stringify(valid);
 if(variants.has(key)){const v=variants.get(key);variants.delete(key);variants.set(key,v);return v;}
 const result=(async()=>{
  if(valid.version===1){const im=await loadOriginal(valid.outfit,base),c=recolored(im,valid),g=c.getContext('2d');decorate(g,imToPixels(im),c.width,valid);return c;}
  const special=['robe','dress'].includes(a.outfit),torso=special?'clotharmor':(OUTFIT_SOURCES[a.outfit]||a.outfit);
  // Derived wardrobe pieces stay on the existing cloth frame; all armor
  // headwear continues to use the native Fracture armor sheet.
  const headSource=HEADWEAR_SOURCES[a.headwear]||a.headwear;
  const names=[headSource,torso,a.legs,a.boots];
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
  if(a.body==='fairy'){g.save();g.globalCompositeOperation='destination-over';for(let row=0;row<9;row++)for(let col=0;col<(row%3===0?5:row%3===1?4:2);col++){g.save();g.beginPath();g.rect(col*32,row*32,32,32);g.clip();const x=col*32+16,y=row*32+19;for(const sign of [-1,1]){const flap=col%2;for(let k=0;k<9;k++){const width=[2,4,6,7,7,6,5,3,1][k],xx=sign<0?x-6-width+flap:x+6-flap;g.fillStyle='#536779';g.fillRect(xx,y-8+k,width,1);if(width>2){g.fillStyle=k<4?'#cbe8e7':'#a7bfd9';g.fillRect(xx+1,y-8+k,width-2,1);}}for(let k=0;k<6;k++){const width=[3,5,5,4,3,1][k],xx=sign<0?x-5-width:x+5;g.fillStyle='#65748e';g.fillRect(xx,y+k,width,1);if(width>2){g.fillStyle='#d6c9e6';g.fillRect(xx+1,y+k,width-2,1);}}}g.restore();}g.restore();}
  c.__body=a.body;return c;
 })();variants.set(key,result);if(variants.size>64)variants.delete(variants.keys().next().value);result.catch(()=>variants.delete(key));return result;
}
function imToPixels(im){const c=canvas(im.width,im.height),g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;}
export function drawPreview(ctx,sheet,{animation='idle',direction='down',time=0,scale=4}={}){
 const dir=direction==='up'?1:direction==='down'?2:0,pose=animation==='attack'?0:animation==='walk'?1:2,length=pose===0?5:pose===1?4:2;
 const index=Math.floor(time/(pose===2?460:145))%length,row=dir*3+pose;const [sx,sy]=bodyScale(sheet.__body),fit=Math.max(1,Math.min(scale,Math.floor((ctx.canvas.width-24)/(32*sx)),Math.floor((ctx.canvas.height-24)/(32*sy)))),w=32*fit*sx,h=32*fit*sy;
 ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.imageSmoothingEnabled=false;ctx.save();const x=(ctx.canvas.width-w)/2,y=(ctx.canvas.height-h)/2;
 if(direction==='left'){ctx.translate(ctx.canvas.width,0);ctx.scale(-1,1);}ctx.drawImage(sheet,index*32,row*32,32,32,x,y,w,h);ctx.restore();
}
