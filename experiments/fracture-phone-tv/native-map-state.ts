/** Chaos-owned reconciliation of verified existing map layers. No new art. */
const originals = new WeakMap<object, any>();
export function reconcileNativeMap(map:any, catalog:any[], updates:any[]):boolean {
  let cache=originals.get(map);
  if(!cache){cache={data:new Map(),grid:new Map(),signature:'',affected:[]};originals.set(map,cache);}
  const states=new Map(updates.map(o=>[o.id,o]));
  const changed=catalog.map(def=>({def,state:states.get(def.id)})).filter(({def,state}:any)=>state&&
    (state.condition==='broken'||!!state.carriedBy||state.tile.x!==def.tile.x||state.tile.y!==def.tile.y||def.fireSource&&state.condition!=='burning'));
  const signature=JSON.stringify(changed.map(({def,state}:any)=>[def.id,state.tile,state.condition==='broken',state.carriedBy||null,def.fireSource&&state.condition]));
  if(signature===cache.signature)return false;
  const indices=new Set<number>(cache.affected);
  for(const {def,state} of changed as any[]){
    const dx=state.tile.x-def.tile.x,dy=state.tile.y-def.tile.y;
    for(const cell of [...def.cells,...(def.footprint||[])]){
      indices.add(cell.y*map.width+cell.x);indices.add((cell.y+dy)*map.width+cell.x+dx);
    }
  }
  indices.forEach(index=>{
    const x=index%map.width,y=Math.floor(index/map.width);
    if(!cache.data.has(index)&&map.data)cache.data.set(index,Array.isArray(map.data[index])?map.data[index].slice():map.data[index]);
    if(!cache.grid.has(index)&&map.grid?.[y])cache.grid.set(index,map.grid[y][x]);
    if(map.data)map.data[index]=Array.isArray(cache.data.get(index))?cache.data.get(index).slice():cache.data.get(index);
    if(map.grid?.[y])map.grid[y][x]=cache.grid.get(index);
  });
  // Remove every changed source before adding any destination. This preserves
  // other native layers even when a prop has moved onto a cleared footprint.
  for(const {def,state} of changed as any[]){
    if(map.data)for(const cell of def.cells){
      const index=cell.y*map.width+cell.x,value=map.data[index];
      const rest=(Array.isArray(value)?value:[value]).filter(id=>id!==cell.gid);
      map.data[index]=rest.length?rest:0;
      if(state.condition==='broken'&&def.replacementGid)map.data[index]=[def.replacementGid,...rest];
    }
    if(state.condition==='broken'||state.carriedBy||state.tile.x!==def.tile.x||state.tile.y!==def.tile.y)
      for(const cell of def.clearFootprint||def.footprint||[])if(map.grid?.[cell.y])map.grid[cell.y][cell.x]=0;
  }
  for(const {def,state} of changed as any[]){
    if(state.condition==='broken'||state.carriedBy||def.fireSource&&state.condition!=='burning')continue;
    const dx=state.tile.x-def.tile.x,dy=state.tile.y-def.tile.y;
    if(map.data)for(const cell of def.cells){
      const index=(cell.y+dy)*map.width+cell.x+dx,value=map.data[index];
      map.data[index]=[...(Array.isArray(value)?value:value?[value]:[]),cell.gid];
    }
    for(const cell of def.footprint||[])if(map.grid?.[cell.y+dy])map.grid[cell.y+dy][cell.x+dx]=1;
  }
  cache.signature=signature;cache.affected=Array.from(indices);return true;
}

export function nativeCells(object:any, physical=false):any[] {
  const source=physical&&object.footprint?.length?object.footprint:object.cells?.length?object.cells:[object.tile];
  const dx=object.tile.x-(object.nativeTile||object.tile).x,dy=object.tile.y-(object.nativeTile||object.tile).y;
  return source.map((t:any)=>({x:t.x+dx,y:t.y+dy}));
}
export function nativeContact(actor:any, object:any):any {
  if(object.interactionTile)return object.interactionTile;
  return nativeCells(object,true).sort((a,b)=>Math.abs(actor.x-a.x)+Math.abs(actor.y-a.y)-Math.abs(actor.x-b.x)-Math.abs(actor.y-b.y))[0];
}
