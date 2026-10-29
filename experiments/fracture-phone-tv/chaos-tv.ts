/** Chaos-owned shared TV adapter. Ordinary Fracture is unchanged without chaosTV. */
import {getZoneAtPosition,INTERIOR_ZONES} from '../../shared/ts/zones';
function pairing(): any {
  const p=new URLSearchParams(location.search),raw=p.get('chaosTV'),key=p.get('tvKey');
  if(!raw||!key)return null;
  try{const base=new URL(raw);if(base.protocol!=='http:'||base.hostname!==location.hostname||base.port!=='4748')return null;return {base,key};}catch{return null;}
}
export function bootChaosTV(app:any):void {
  if(!pairing())return;
  const timer=setInterval(()=>{if(app.ready&&app.canStartGame()){
    clearInterval(timer);
    let tag=sessionStorage.getItem('chaos-tv-account');if(!tag){tag=Math.random().toString(36).slice(2,8);sessionStorage.setItem('chaos-tv-account',tag);}let pass=sessionStorage.getItem('chaos-tv-password');if(!pass){pass=tag+Math.random().toString(36).slice(2);sessionStorage.setItem('chaos-tv-password',pass);}
    // A disposable spectator account, never a family's saved player account.
    app.proceedToGame('Guest_TV_'+tag,pass);
  }},200);
}
export function startChaosTV(game:any):void {
  const config=pairing();if(!config||game.__chaosTV)return;game.__chaosTV=true;
  document.documentElement.classList.add('chaos-tv');
  const style=document.createElement('style');style.textContent=`html.chaos-tv #intro,html.chaos-tv #instructions,html.chaos-tv #status,html.chaos-tv #statusbar,html.chaos-tv #skill-bar,html.chaos-tv #minimap-container,html.chaos-tv #ai-retired-note,html.chaos-tv #hire-button,html.chaos-tv #credits-link,html.chaos-tv #chatbox,html.chaos-tv #notifications,html.chaos-tv #achievements,html.chaos-tv #population,html.chaos-tv #credits,html.chaos-tv #about{display:none!important}body{overflow:hidden}#chaos-tv-controls{position:fixed;right:12px;top:10px;z-index:20000;background:#15202ce8;color:white;padding:8px;border-radius:8px;font:14px system-ui}#chaos-tv-log{position:fixed;left:12px;bottom:12px;max-width:400px;max-height:120px;overflow:hidden;z-index:20000;background:#15202cd9;color:#fff4da;border-radius:8px;padding:8px;font:14px system-ui;pointer-events:none}`;document.head.append(style);
  const controls=document.createElement('div');controls.id='chaos-tv-controls';
  const select=document.createElement('select');select.setAttribute('aria-label','Follow player');controls.append(select);
  const fullscreen=document.createElement('button');fullscreen.textContent='Full screen';fullscreen.onclick=()=>{void document.documentElement.requestFullscreen?.();};controls.append(fullscreen);document.body.append(controls);
  const lobby=document.createElement('div');Object.assign(lobby.style,{position:'fixed',inset:'0',background:'#121922',color:'#f4eddc',zIndex:'19000',display:'grid',placeContent:'center',textAlign:'center',font:'24px system-ui'});document.body.append(lobby);
  const log=document.createElement('div');log.id='chaos-tv-log';document.body.append(log);
  // Spectator does not issue HURT for party actors; their server driver owns cadence.
  let cameraKey='';let observerIds=new Set<string>();
  game.client.connection.on('chaos:camera',(p:any)=>{
    observerIds=new Set((p.observers||[]).map(String));
    const nextKey=`${p.id}:${p.x},${p.y}:${window.innerWidth},${window.innerHeight}`;if(nextKey===cameraKey)return;cameraKey=nextKey;
    game.player.disengage();game.player.stop();
    game.makeCharacterTeleportTo(game.player,p.x,p.y);game.player.idle();
    const zone=Object.values(INTERIOR_ZONES).find((z:any)=>z.areas.some((a:any)=>p.x>=a.x&&p.x<a.x+a.w&&p.y>=a.y&&p.y<a.y+a.h))||getZoneAtPosition(p.x,p.y);
    if(zone?.viewport){const v=zone.viewport;game.camera.setZoneViewport(v.width,v.height,true);game.camera.setGridPosition(v.cameraX,v.cameraY);}else{game.camera.setZoneViewport(game.camera.fullGridW,game.camera.fullGridH,false);game.camera.setPosition(Math.floor((p.x-game.camera.gridW/2)*16),Math.floor((p.y-game.camera.gridH/2)*16));}
    game.renderer.renderStaticCanvases();
    // Hide the disposable observer sprite while preserving native entity/camera lifecycle.
    // Observer sprite is omitted by the renderer wrapper below.
  });
  const colors:any={Amber:'#efbd68',Blue:'#78bcff',Green:'#83dc9b',Rose:'#ef99bc'};
  const hues:any={Amber:'none',Blue:'hue-rotate(150deg)',Green:'hue-rotate(70deg)',Rose:'hue-rotate(290deg)'};
  const appearances=new Map();
  const originalDraw=game.renderer.drawEntity.bind(game.renderer);
  game.renderer.drawEntity=(entity:any)=>{
    if(entity.id===game.playerId||observerIds.has(String(entity.id)))return;
    const appearance=appearances.get(String(entity.id));
    if(!appearance){originalDraw(entity);return;}
    const context=game.renderer.context;context.save();context.strokeStyle=colors[appearance.color];context.lineWidth=2;context.beginPath();context.ellipse((entity.x+8)*game.renderer.scale,(entity.y+14)*game.renderer.scale,8*game.renderer.scale,3*game.renderer.scale,0,0,Math.PI*2);context.stroke();context.filter=hues[appearance.color]||'none';originalDraw(entity);context.restore();
  };
  const originalName=game.renderer.drawEntityName.bind(game.renderer);
  game.renderer.drawEntityName=(entity:any)=>{if(entity.id===game.playerId||observerIds.has(String(entity.id)))return;const appearance=appearances.get(String(entity.id));if(!appearance)return originalName(entity);const context=game.renderer.context;context.save();context.filter='none';game.renderer.drawText(appearance.name,(entity.x+8)*game.renderer.scale,(entity.y+entity.nameOffsetY)*game.renderer.scale,true,colors[appearance.color]);context.restore();};
  document.addEventListener('click',e=>{if(!controls.contains(e.target as Node)){e.stopImmediatePropagation();e.preventDefault();}},true);
  document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.stopImmediatePropagation();e.preventDefault();}},true);
  const shownCombat=new Set();
  let selected='';
  const poll=async()=>{try{
    const u=new URL('/tv-state',config.base);u.searchParams.set('key',config.key);
    const r=await fetch(u.toString());if(!r.ok){log.textContent='TV pairing expired. Reopen the TV from the current host page.';return;}const data=await r.json();
    const connected=data.players.filter((p:any)=>p.actor?.ready);
    const players=connected.filter((p:any)=>!p.actor.dead);
    // Roster changes may leave stale IDs in the browser's renderer state.
    // Never recolor a new native entity using a departed player's appearance.
    const present=new Set(players.map((p:any)=>String(p.actor.id)));
    // Native Fracture compiles this client to ES5; Map.forEach avoids TS2802.
    appearances.forEach((_appearance:any,id:string)=>{if(!present.has(id))appearances.delete(id);});
    for(const p of players){
      appearances.set(String(p.actor.id),{name:p.name,color:p.color});
      for(const e of p.actor.nearby||[]){const entity=game.getEntityById(e.id);if(entity&&e.hp!==undefined){entity.hitPoints=e.hp;entity.maxHitPoints=e.maxHp;}}
    }
    for(const e of data.events){if(e.combat&&!shownCombat.has(e.id+':'+e.at)){shownCombat.add(e.id+':'+e.at);const mob=game.getEntityById(e.combat.target);if(mob)game.infoManager.addDamageInfo(Math.max(0,e.combat.before-e.combat.after),mob.x,mob.y-15,'inflicted');}}
    if(shownCombat.size>200)shownCombat.clear();
    if(!players.some((p:any)=>String(p.actor.id)===select.value))selected=String(players[0]?.actor.id||'');else selected=select.value;
    select.textContent='';for(const p of players){const option=document.createElement('option');option.value=String(p.actor.id);option.textContent=`${p.name} · HP ${p.actor.hp}/${p.actor.maxHp}`;select.append(option);}select.value=selected;
    game.client.connection.emit('chaos:watch',{key:config.key,actorId:selected||null},()=>{});
    log.textContent='';for(const e of data.events.slice(-3)){const row=document.createElement('div');row.textContent=`${e.player}: ${e.message}`;log.append(row);}
    if(!players.length&&connected.length)log.textContent='Party knocked out — respawn on your phones.';
    lobby.hidden=connected.length>0;lobby.style.display=connected.length?'none':'grid';if(!connected.length){lobby.textContent='';const title=document.createElement('h1');title.textContent='Chaos Party';lobby.append(title);const qr=document.createElement('div');qr.style.cssText='width:260px;margin:auto;background:white';qr.innerHTML=data.lobby.qr;lobby.append(qr);const message=document.createElement('p');message.textContent='Scan to join. Your phone is your character.';lobby.append(message);log.textContent='Waiting for phones to join the adventure…';}
  }catch{log.textContent='Room connection lost; reconnecting…';}};
  void poll();const timer=setInterval(poll,800);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
}
