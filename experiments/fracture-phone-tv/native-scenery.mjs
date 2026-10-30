/** Explicit registration of the pinned Fracture oak artwork and its trunk.
 * Whole 4x5 art signatures are required. Never clear a collision contributed
 * by another layer, a manual blocking region, a door or a checkpoint.
 */
export function discoverNativeTrees(map,solidTileIds){
 if(map?.width!==172||map?.height!==314||map?.tilesize!==16||!Array.isArray(solidTileIds))throw Error('Unsupported native scenery map');
 const solid=new Set(solidTileIds),blocked=new Set(map.blocking||[]),collision=new Set(map.collisions||[]);
 const layers=v=>Array.isArray(v)?v:[v],trees=[];
 for(let y=0;y<map.height-4;y++)for(let x=0;x<map.width-3;x++){
  if(!layers(map.data[y*map.width+x]).includes(213))continue;
  let complete=true;for(let dy=0;dy<5;dy++)for(let dx=0;dx<4;dx++)if(!layers(map.data[(y+dy)*map.width+x+dx]).includes(213+dy*20+dx))complete=false;
  if(!complete)continue;
  const footprint=[];let safe=true;
  for(const dy of [3,4])for(const dx of [1,2]){
   const index=(y+dy)*map.width+x+dx,gid=213+dy*20+dx;
   if(blocked.has(index)||!collision.has(index)||layers(map.data[index]).some(id=>id!==gid&&solid.has(id)))safe=false;
   if((map.doors||[]).some(d=>d.x===x+dx&&d.y===y+dy))safe=false;
   footprint.push({x:x+dx,y:y+dy});
  }
  if(safe)trees.push({id:`native-tree-${x}-${y}`,kind:'tree',tile:{x:x+1,y:y+4},nativeOrigin:{x,y},footprint});
 }
 return trees;
}
