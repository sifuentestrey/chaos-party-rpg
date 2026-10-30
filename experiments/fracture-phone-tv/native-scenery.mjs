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
  // Reject solid rocks, shrubs, walls and other authored solids anywhere
  // under the oak sprite, not only in the four trunk cells. Their collision
  // and original art must remain owned by Fracture.
  for(let dy=0;dy<5&&complete;dy++)for(let dx=0;dx<4;dx++){
   const gid=213+dy*20+dx;
   if(layers(map.data[(y+dy)*map.width+x+dx]).some(id=>id!==gid&&solid.has(id)))complete=false;
  }
  if(!complete)continue;
  const footprint=[];let safe=true;
  for(const dy of [3,4])for(const dx of [1,2]){
   const index=(y+dy)*map.width+x+dx,gid=213+dy*20+dx;
   if(blocked.has(index)||!collision.has(index)||layers(map.data[index]).some(id=>id!==gid&&solid.has(id)))safe=false;
   // A separate native tree may overlap the trunk. Do not remove its art or collision.
   if(layers(map.data[index]).some(id=>id!==gid&&id>=213&&id<=296))safe=false;
   if((map.doors||[]).some(d=>d.x===x+dx&&d.y===y+dy))safe=false;
   footprint.push({x:x+dx,y:y+dy});
  }
  if(safe)trees.push({id:`native-tree-${x}-${y}`,kind:'tree',tile:{x:x+1,y:y+4},nativeOrigin:{x,y},footprint});
 }
 return trees;
}
