import {WoodDoor} from './engine.js';
import {avatarCanvas} from '../../public/render.js';
import {DEFAULT_AVATAR} from '../../public/core.js';
const [map,tiles]=await Promise.all(['map/tutorial.json','map/tilesets/statics.json'].map(p=>fetch(p).then(r=>r.json())));
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
const [ground,statics]=await Promise.all(['ground','statics'].map(n=>load(`map/tilesets/${n}.png`)));
const canvas=document.querySelector('canvas'),g=canvas.getContext('2d'),status=document.querySelector('#status');
const layers=Object.fromEntries(map.layers.map(l=>[l.name,l]));
const types=new Map(tiles.tiles.map(t=>[t.id+824,t.type]));
const actor={row:13,col:37,energy:10,modEnergy(n){this.energy+=n;}};
const doors=new Map();let message='Approach the wooden doors. Press E to open them.';
const board={addStatic(){},removeStatic(){},emitToNearbyPlayers(){},getTile(row,col){return {containsAnyDestroyables:()=>actor.row===row&&actor.col===col};}};
for(let i=0;i<layers.Statics.data.length;i++)if(types.get(layers.Statics.data[i])==='WoodDoor'){
  const d=new WoodDoor({row:Math.floor(i/map.width),col:i%map.width,board});
  d.getBoardTile=()=>board.getTile(d.row,d.col);doors.set(i,d);
}
let facing=[0,1],movingUntil=0;
function step(dr,dc){
  facing=[dr,dc];const row=actor.row+dr,col=actor.col+dc,index=row*map.width+col;
  if(row<0||col<0||row>=map.height||col>=map.width)return;
  const door=doors.get(index),tile=layers.Statics.data[index];
  if(door?door.isLowBlocked():tile!==0){message=door?'Wooden door blocks the way. E opens it.':'The existing map blocks that path.';return;}
  if(!layers.Ground.data[index])return;
  actor.row=row;actor.col=col;movingUntil=performance.now()+160;message='Exploring the original Dungeonz tutorial map.';
}
function interact(){
  const adjacent=[...doors.values()].filter(d=>Math.abs(d.row-actor.row)+Math.abs(d.col-actor.col)===1);
  if(!adjacent.length){message='No wooden door within reach.';return;}
  const door=adjacent[0];door.interaction(actor);message=door.blocking?'Not enough energy to open the door.':'Door opened by the upstream interaction code. It closes after five seconds, once clear.';
}
const moves={ArrowUp:[-1,0],w:[-1,0],ArrowDown:[1,0],s:[1,0],ArrowLeft:[0,-1],a:[0,-1],ArrowRight:[0,1],d:[0,1]};
window.addEventListener('keydown',e=>{if(moves[e.key]){e.preventDefault();step(...moves[e.key]);}if(e.key==='e')interact();});
function tile(image,id,columns,x,y){g.drawImage(image,(id%columns)*16,Math.floor(id/columns)*16,16,16,x,y,32,32);}
function draw(t){
  g.imageSmoothingEnabled=false;g.fillStyle='#12131b';g.fillRect(0,0,960,528);
  const left=actor.col-15,top=actor.row-8;
  for(let y=0;y<17;y++)for(let x=0;x<30;x++){
    const row=top+y,col=left+x;if(row<0||col<0||row>=map.height||col>=map.width)continue;
    const index=row*map.width+col,a=layers.Ground.data[index],b=layers.Statics.data[index];
    if(a)tile(ground,a-1,21,x*32,y*32);
    if(b&&!doors.get(index)?.blocking&&doors.has(index))continue;
    if(b)tile(statics,b-824,64,x*32,y*32);
  }
  g.drawImage(avatarCanvas(DEFAULT_AVATAR,t<movingUntil?'walk':'idle',t),480-20,256-48,40,56);
  status.textContent=`${message}  Energy ${actor.energy}/10 · ${actor.col},${actor.row}`;
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
// Read-only browser test hook; no campaign or production state is involved.
window.worldProof={snapshot:()=>({row:actor.row,col:actor.col,energy:actor.energy,doors:[...doors.values()].map(d=>({row:d.row,col:d.col,blocking:d.blocking}))})};
