/** Disposable pinned-map verification: original small-rock atlas cells, no synthetic art. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createChaosWorld} from './chaos-world.mjs';
const root=process.env.FRACTURE_ROOT;
if(!process.env.CHAOS_BETA_TEST||!root)throw Error('Disposable pinned Fracture test root required');
const source=fs.readFileSync(path.join(root,'server/ts/chaos-native-scenery.ts'),'utf8');
const prefix='export const nativeTrees = ';
assert.ok(source.includes(prefix),'The pinned overlay must have generated a native object catalog');
const catalog=JSON.parse(source.slice(source.indexOf(prefix)+prefix.length).trim().replace(/;$/,''));
const rocks=catalog.filter(o=>o.portable===true&&o.kind==='rock'&&o.cells?.length===2&&
 o.cells.some(c=>c.gid===98)&&o.cells.some(c=>c.gid===99));
assert.ok(rocks.length>0,'The real pinned map must contain at least one fully verified existing 98/99 small rock');
const original=JSON.parse(fs.readFileSync(path.join(root,'client/maps/world_client.json'),'utf8'));
function worldFromMap(){
 const map=structuredClone(original),solid=new Set([...(map.collisions||[]),...(map.blocking||[])]);
 map.grid=Array.from({length:map.height},(_,y)=>Array.from({length:map.width},(_,x)=>solid.has(y*map.width+x)?1:0));
 return {id:'pinned-world',map,entities:{},players:{},
  zoneManager:{getZoneAt:()=>({id:'disposable-map-test'})},
  isValidPosition(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<map.width&&y<map.height&&map.grid[y][x]===0;}};
}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chaos-pinned-native-rock-'));
try{
 const file=path.join(dir,'objects.json'),world=worldFromMap();
 const rock=rocks.find(o=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>world.isValidPosition(o.tile.x+dx,o.tile.y+dy)));
 assert.ok(rock,'An existing verified small rock needs a real open adjacent tile');
 const contact=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:rock.tile.x+dx,y:rock.tile.y+dy}))
  .find(t=>world.isValidPosition(t.x,t.y));
 const p={id:1,characterId:'disposable-actor',name:'Test Actor',chaosControlled:true,hasEnteredGame:true,isDead:false,
  x:contact.x,y:contact.y,hitPoints:100,maxHitPoints:100,getWorld:()=>world};
 world.players[p.characterId]=p;
 const engine=createChaosWorld({file,nativeTrees:catalog,seed:1});
 const before=engine.snapshot(p);
 assert.ok(before.scenery.some(o=>o.id.endsWith(':'+rock.id)&&o.capabilities.portable));
 const sourceCells=rock.cells.map(c=>({x:c.x,y:c.y,gid:c.gid}));
 const picked=engine.execute(p,'take '+rock.id);
 assert.equal(picked.success,true,picked.text);
 assert.ok(engine.snapshot(p).bag.some(o=>o.id.endsWith(':'+rock.id)&&o.carried));
 assert.ok(sourceCells.every(c=>!([].concat(world.map.data[c.y*world.map.width+c.x]).includes(c.gid))),
  'All original native atlas rock cells disappear while held');
 assert.ok(engine.snapshot(p).nativeUpdates.some(o=>o.id===rock.id&&o.carriedBy===p.characterId),
  'TV map update must carry the original rock removal');
 const restarted=worldFromMap(),restored=createChaosWorld({file,nativeTrees:catalog});
 restored.prepareWorld(restarted);
 assert.ok(sourceCells.every(c=>!([].concat(restarted.map.data[c.y*restarted.map.width+c.x]).includes(c.gid))),
  'Original art remains absent after a separate native map reload while carried');
 console.log(JSON.stringify({status:'passed',rockId:rock.id,verifiedNativeSmallRocks:rocks.length,
  checks:['real pinned 98/99 atlas identity','authenticated pickup of existing native rock','no fabricated inventory item',
   'original atlas cells removed','TV map update includes carry state','saved carried state restores on fresh pinned map'],
  boundary:'Disposable pinned-map engine mechanics; not a real browser or physical Mac/phone/TV test'}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
