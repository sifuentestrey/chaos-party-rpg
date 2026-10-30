/** Explicit registration of the pinned Fracture oak artwork and its trunk.
 * Whole 4x5 art signatures are required. Never clear a collision contributed
 * by another layer, a manual blocking region, a door or a checkpoint.
 */
export function discoverNativeTrees(map,solidTileIds){
 if(map?.width!==172||map?.height!==314||map?.tilesize!==16||!Array.isArray(solidTileIds))throw Error('Unsupported native scenery map');
 const solid=new Set(solidTileIds),blocked=new Set(map.blocking||[]),collision=new Set(map.collisions||[]);
 // Native layers, doors and manual blockers all remain authoritative. A tree
 // is interactive only if every required art and trunk collision cell matches.
 const layers=v=>Array.isArray(v)?v:[v],trees=[];
 // Preserve every existing painted layer: a candidate is eligible only if its
 // whole sprite is present and no independently solid overlay shares its cells.
 for(let y=0;y<map.height-4;y++)for(let x=0;x<map.width-3;x++){
  if(!layers(map.data[y*map.width+x]).includes(213))continue;
  let complete=true;for(let dy=0;dy<5;dy++)for(let dx=0;dx<4;dx++)if(!layers(map.data[(y+dy)*map.width+x+dx]).includes(213+dy*20+dx))complete=false;
  if(!complete)continue;
  // Other scenery under a canopy keeps its own layer and collision. Only
  // the four exclusively owned trunk cells may become walkable. Rejecting an
  // entire tree because a river passes behind its leaves hid valid map trees.
  const footprint=[];let safe=true;
  for(const dy of [3,4])for(const dx of [1,2]){
   const index=(y+dy)*map.width+x+dx,gid=213+dy*20+dx;
   if(blocked.has(index)||!collision.has(index)||layers(map.data[index]).some(id=>id!==gid&&solid.has(id)))safe=false;
   // A separate native tree may overlap the trunk. Do not remove its art or collision.
   if(layers(map.data[index]).some(id=>id!==gid&&Array.from({length:20},(_,n)=>213+Math.floor(n/4)*20+n%4).includes(id)))safe=false;
   if((map.doors||[]).some(d=>d.x===x+dx&&d.y===y+dy))safe=false;
   footprint.push({x:x+dx,y:y+dy});
  }
  if(safe)trees.push({id:`native-tree-${x}-${y}`,kind:'tree',tile:{x:x+1,y:y+4},nativeOrigin:{x,y},footprint});
 }
 return trees;
}

// These are atlas stamps ALREADY placed in the pinned map, not spawn recipes.
// Require the complete stamp, retain each exact layer ID, and only release
// collision attributable exclusively to the removed part of that stamp.
const STAMPS=[
 {key:'tent',kind:'tent',name:'tent',first:141,w:2,h:3,material:'cloth',movable:true,repairable:true,dc:10},
 {key:'boulder',kind:'rock',name:'boulder',first:18,w:3,h:4,material:'stone',movable:true,dc:18},
 {key:'stone',kind:'rock',name:'small rock',aliases:['stone','rock'],first:98,w:2,h:1,material:'stone',movable:true,dc:10},
 {key:'pebble',kind:'rock',name:'small rock',aliases:['stone','rock'],first:218,w:1,h:1,material:'stone',movable:true,dc:10},
 {key:'round-rock',kind:'rock',name:'rock',aliases:['stone','boulder'],first:258,w:2,h:2,material:'stone',movable:true,dc:14},
 {key:'logs',kind:'woodpile',name:'log pile',aliases:['logs','woodpile'],first:25,w:1,h:1,material:'wood',movable:true,dc:8},
 {key:'house',kind:'roof',name:'house roof',aliases:['house','building','roof','cottage'],first:45,w:7,h:8,material:'wood',removeRows:5,repairable:true,dc:16},
 // Transparent corner tiles are inconsistently included in the map's red-roof
 // stamps. Require their shared roof/facade signature; remove only matching
 // roof layers, never neighboring well/fire art from the same atlas rectangle.
 {key:'red-house',kind:'roof',name:'house roof',aliases:['house','building','roof','cottage'],first:203,marker:207,w:9,h:9,material:'wood',removeRows:5,repairable:true,dc:16,
  requiredRows:[[4,5],[2,3,4,5,6],[2,3,4,5,6],[1,2,3,4,5,6,7],[1,2,3,4,5,6,7],[1,2,3,4,5,6,7],[1,2,3,4,5,6,7],[1,2,6,7],[1,2,6,7]],
  includeRows:[[3,4,5],[2,3,4,5,6],[1,2,3,4,5,6,7],[1,2,3,4,5,6,7,8],[1,2,3,4,5,6,7,8],[1,2,3,4,5,6,7,8],[1,2,3,4,5,6,7,8],[1,2,6,7,8],[1,2,6,7,8]]},
 {key:'cactus',kind:'bush',name:'cactus',aliases:['bush','plant','shrub'],first:332,w:2,h:3,material:'fiber',dc:10},
 {key:'bush',kind:'bush',name:'bush',aliases:['plant','shrub'],first:312,w:1,h:1,material:'fiber',dc:8},
 {key:'well',kind:'well',name:'well',first:301,w:3,h:4,material:'stone',waterSource:true,protected:true},
 {key:'dead-tree',kind:'tree',name:'dead tree',aliases:['tree'],first:637,w:4,h:4,material:'wood',dc:12},
 {key:'fire',kind:'fire',name:'campfire',aliases:['fire'],first:241,w:1,h:1,material:'wood',fireSource:true,dc:8}
];
export function discoverNativeObjects(map,solidTileIds){
 const solid=new Set(solidTileIds),collision=new Set(map.collisions||[]),manual=new Set(map.blocking||[]);
 const layers=v=>Array.isArray(v)?v:[v];
 const trees=discoverNativeTrees(map,solidTileIds).map(t=>({...t,name:'tree',material:'wood',dc:14,
  cells:Array.from({length:20},(_,n)=>({x:t.nativeOrigin.x+n%4,y:t.nativeOrigin.y+Math.floor(n/4),gid:213+Math.floor(n/4)*20+n%4})),
  clearFootprint:t.footprint}));
 const objects=[...trees];
 for(const def of STAMPS)for(let y=0;y<=map.height-def.h;y++)for(let x=0;x<=map.width-def.w;x++){
  const marker=def.marker||def.first,mx=(marker-def.first)%20,my=Math.floor((marker-def.first)/20);
  if(!layers(map.data[(y+my)*map.width+x+mx]).includes(marker))continue;
  const cells=[],footprint=[],clearFootprint=[];let safe=true;
  for(let dy=0;dy<def.h;dy++)for(let dx=0;dx<def.w;dx++){
   const index=(y+dy)*map.width+x+dx,gid=def.first+dy*20+dx,at=layers(map.data[index]);
   if(!at.includes(gid)){if(!def.requiredRows||def.requiredRows[dy]?.includes(dx))safe=false;continue;}
   if(def.includeRows&&!def.includeRows[dy]?.includes(dx))continue;
   const removed=!def.protected&&(def.removeRows===undefined||dy<def.removeRows);
   const independent=at.some(id=>id!==gid&&solid.has(id))||manual.has(index)||(map.doors||[]).some(d=>d.x===x+dx&&d.y===y+dy);
   if(removed&&independent&&def.movable)safe=false;
   if(solid.has(gid)&&collision.has(index)){
    footprint.push({x:x+dx,y:y+dy});if(removed&&!independent)clearFootprint.push({x:x+dx,y:y+dy});
   }
   if(removed||def.protected)cells.push({x:x+dx,y:y+dy,gid});
  }
  if(!safe)continue;
  const {key,first,w,h,removeRows,marker:markerId,requiredRows,includeRows,...properties}=def;
  objects.push({...properties,id:`native-${key}-${x}-${y}`,tile:{x:x+Math.floor((w-1)/2),y:y+h-1},nativeOrigin:{x,y},cells,footprint,clearFootprint});
 }
 // Ground patches reference ONLY existing open tiles. Never turn a cliff,
 // road, doorway, or collision beneath a structure into destructible grass.
 const grass=new Set([155,156,175,176]),water=new Set([425,426,427,428,429,430,431,446,447,448,449,450,451,466,467,468,469,470,471]);
 for(const [key,ids,size,kind,properties] of [
  ['grass',grass,4,'grass',{name:'grass',material:'fiber',dc:6,replacementGid:592}],
  ['water',water,8,'river',{name:'water',aliases:['river','river water'],material:'water',protected:true,waterSource:true}]
 ]){
  const patches=new Map();
  for(let index=0;index<map.data.length;index++){
   const at=layers(map.data[index]),gid=at.find(id=>ids.has(id));if(!gid||key==='grass'&&(collision.has(index)||manual.has(index)||at.some(id=>!ids.has(id))))continue;
   const x=index%map.width,y=Math.floor(index/map.width);
   if((map.doors||[]).some(d=>d.x===x&&d.y===y||d.tx===x&&d.ty===y))continue;
   const patch=`${Math.floor(x/size)*size}-${Math.floor(y/size)*size}`;
   if(!patches.has(patch))patches.set(patch,[]);patches.get(patch).push({x,y,gid});
  }
  for(const [keyId,cells] of patches){const tile={x:cells[0].x,y:cells[0].y};objects.push({id:`native-${key}-${keyId}`,kind,...properties,tile,nativeOrigin:tile,cells,footprint:[],clearFootprint:[]});}
 }
 return objects;
}
