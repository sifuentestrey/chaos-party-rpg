// @ts-nocheck
/** Own the spectator camera, never actor movement. Native play remains unowned. */
export function createSharedCamera(game){
 let frame=null,key='',owned=false;
 const camera=()=>game.camera;
 function hold(){const c=camera();c.chaosSharedOwned=false;game.zoningManager?.cancelForSharedCamera?.();c.setZoneViewport(c.fullGridW,c.fullGridH,true);c.chaosSharedOwned=true;owned=true;}
 function apply(next,force=false){
  const c=camera(),width=next.width??c.fullGridW,height=next.height??c.fullGridH;
  const nextKey=JSON.stringify([next.key,next.x,next.y,width,height,c.fullGridW,c.fullGridH]);
  frame={...next};
  if(owned&&key===nextKey&&!force)return false;
  c.chaosSharedOwned=false;
  try{if(game.map)c.setMapSize(game.map.width,game.map.height);game.zoningManager?.cancelForSharedCamera?.();c.setZoneViewport(width,height,true);c.setGridPosition(next.x,next.y);key=nextKey;}
  finally{c.chaosSharedOwned=true;owned=true;}
  return true;
 }
 function release(){camera().chaosSharedOwned=false;owned=false;key='';frame=null;}
 function resize(){if(owned&&frame){apply(frame,true);game.initAnimatedTiles?.();}}
 function snapshot(){const c=camera();return {owned:!!c.chaosSharedOwned,x:c.x,y:c.y,gridX:c.gridX,gridY:c.gridY,width:c.gridW,height:c.gridH,fixed:c.isViewportFixed(),scene:frame?.key||null};}
 return {hold,apply,release,resize,snapshot};
}
