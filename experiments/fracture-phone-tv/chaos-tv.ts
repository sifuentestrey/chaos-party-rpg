/** Chaos-owned shared TV adapter. Ordinary Fracture is unchanged without chaosTV. */
import {nativeTrees} from './chaos-native-scenery';
import {reconcileNativeMap} from './chaos-native-map-state';
import {Types} from '../../shared/ts/gametypes';
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
  const appearances=new Map();let groundProps:any[]=[],followed:any=null;
  const shownObjects=new Set<string>();
  const originalEntities=game.renderer.drawEntities.bind(game.renderer);
  game.renderer.drawEntities=(dirty:any)=>{
    const ctx=game.renderer.context,scale=game.renderer.scale;
    for(const prop of groundProps){
      // Existing scenery is painted by Fracture itself, including moved and
      // restored layers. Never substitute an inventory sprite or a drawn prop.
      if(prop.nativeOrigin){
        if(prop.condition==='burning'&&prop.kind!=='fire'){
          const sheet=game.renderer.tileset,ratio=sheet?.width/320;
          const tile=prop.interactionTile||prop.tile;
          if(sheet?.complete&&ratio){const frame=Math.floor(Date.now()/140)%3;ctx.drawImage(sheet,frame*16*ratio,192*ratio,16*ratio,16*ratio,tile.x*16*scale,(tile.y*16-12)*scale,16*scale,16*scale);}
        }
        continue;
      }
      const key=prop.type==='container'?'item-flask':prop.material==='cloth'?'item-leatherarmor':prop.material==='stone'?'item-morningstar':'item-sword2';
      const sprite=game.sprites[key];if(!prop.tile||(!sprite?.isLoaded&&!['table','rug','tree'].includes(prop.visual)))continue;
      const x=prop.tile.x*16*scale,y=prop.tile.y*16*scale;ctx.save();ctx.globalAlpha=prop.condition==='broken'?0.45:1;
      if(prop.visual==='table'){
        ctx.fillStyle='#513827';ctx.fillRect(x+3*scale,y+10*scale,3*scale,6*scale);ctx.fillRect(x+11*scale,y+10*scale,3*scale,6*scale);
        ctx.fillStyle=prop.condition==='broken'?'#5b4a38':'#b88955';ctx.fillRect(x,y+3*scale,16*scale,8*scale);ctx.fillStyle='#dfb87a';ctx.fillRect(x+scale,y+4*scale,14*scale,scale);
       }else if(prop.visual==='tree'){
        // Canonical Fracture atlas coordinates; use the renderer's loaded scale.
        const sheet=game.renderer.tileset,ratio=sheet?.width/320;
        if(sheet?.complete&&ratio){
          ctx.globalAlpha=1;
          if(prop.condition==='broken')ctx.drawImage(sheet,208*ratio,224*ratio,32*ratio,16*ratio,x-(prop.nativeOrigin?0:8*scale),y,32*scale,16*scale);
          else if(!prop.nativeOrigin)ctx.drawImage(sheet,192*ratio,160*ratio,64*ratio,80*ratio,x-24*scale,y-64*scale,64*scale,80*scale);
        }
      }else if(prop.visual==='rug'){
        ctx.fillStyle=prop.color||'#bd88cf';ctx.fillRect(x,y+3*scale,16*scale,11*scale);ctx.strokeStyle='#dfc16e';ctx.lineWidth=scale;ctx.strokeRect(x+2*scale,y+5*scale,12*scale,7*scale);
      }else ctx.drawImage(sprite.image,0,0,sprite.width*sprite.scale,sprite.height*sprite.scale,x,y,16*scale,16*scale);
      if(prop.condition==='burning'){
        const sheet=game.renderer.tileset,ratio=sheet?.width/320;
        if(sheet?.complete&&ratio){const frame=Math.floor(Date.now()/140)%3;ctx.drawImage(sheet,frame*16*ratio,192*ratio,16*ratio,16*ratio,x,y-12*scale,16*scale,16*scale);}
      }ctx.restore();
      if(followed&&Math.abs(followed.x-prop.tile.x)+Math.abs(followed.y-prop.tile.y)<=4){const label=(prop.name||prop.kind)+(prop.hp!==undefined&&prop.hp<12?' · '+prop.hp+' HP':'');game.renderer.drawText(label,x+8*scale,y-3*scale,true,prop.color||'#efbd68',true);}
    }originalEntities(dirty);
  };
  const originalDraw=game.renderer.drawEntity.bind(game.renderer);
  game.renderer.drawEntity=(entity:any)=>{
    if(entity.id===game.playerId||observerIds.has(String(entity.id)))return;
    const appearance=appearances.get(String(entity.id));
    if(!appearance){originalDraw(entity);return;}
    const context=game.renderer.context;context.save();context.strokeStyle=colors[appearance.color];context.lineWidth=2;context.beginPath();context.ellipse((entity.x+8)*game.renderer.scale,(entity.y+14)*game.renderer.scale,8*game.renderer.scale,3*game.renderer.scale,0,0,Math.PI*2);context.stroke();context.filter=hues[appearance.color]||'none';originalDraw(entity);
    for(const item of appearance.wearables||[]){context.filter='none';context.fillStyle=item.color||'#bd88cf';const y=entity.y+(item.slot==='head'?-9:item.slot==='body'?9:12);context.fillRect((entity.x+3)*game.renderer.scale,y*game.renderer.scale,10*game.renderer.scale,3*game.renderer.scale);}
    context.restore();
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
    const nativeUpdates=new Map();
    for(const p of connected)for(const change of p.actor.chaos?.nativeUpdates||[])nativeUpdates.set(change.id,change);
    if(reconcileNativeMap(game.map,nativeTrees,Array.from(nativeUpdates.values()))){game.initAnimatedTiles();game.renderer.renderStaticCanvases();}
    for(const event of data.events){
      const object=event.object,key=event.id+':'+event.at;
      if(!object||shownObjects.has(key))continue;shownObjects.add(key);
      if(Date.now()-event.at>3000)continue;
      const actor=game.getEntityById(object.actorId);
      if(actor?.hit){const dx=object.tile.x-Math.round(actor.x/16),dy=object.tile.y-Math.round(actor.y/16);const direction=Math.abs(dx)>Math.abs(dy)?(dx<0?Types.Orientations.LEFT:Types.Orientations.RIGHT):(dy<0?Types.Orientations.UP:Types.Orientations.DOWN);actor.hit(direction);setTimeout(()=>{if(actor.currentAnimation?.name?.startsWith('atk'))actor.idle();},450);}
      if(Number.isFinite(object.before)&&object.before>object.after)game.infoManager.addDamageInfo(object.before-object.after,object.tile.x*16,object.tile.y*16-20,'inflicted');
    }
    if(shownObjects.size>200)shownObjects.clear();
    const props=new Map();for(const p of players)for(const item of [...(p.actor.chaos?.ground||[]),...(p.actor.chaos?.scenery||[])])props.set(item.id,item);groundProps=Array.from(props.values());
    for(const p of players){
      appearances.set(String(p.actor.id),{name:p.name,color:p.color,wearables:p.actor.chaos?.wearables||[]});
      for(const e of p.actor.nearby||[]){const entity=game.getEntityById(e.id);if(entity&&e.hp!==undefined){entity.hitPoints=e.hp;entity.maxHitPoints=e.maxHp;}}
    }
    for(const e of data.events){if(e.combat&&!shownCombat.has(e.id+':'+e.at)){shownCombat.add(e.id+':'+e.at);const mob=game.getEntityById(e.combat.target);if(mob)game.infoManager.addDamageInfo(Math.max(0,e.combat.before-e.combat.after),mob.x,mob.y-15,'inflicted');}}
    if(shownCombat.size>200)shownCombat.clear();
    if(!players.some((p:any)=>String(p.actor.id)===select.value))selected=String(players[0]?.actor.id||'');else selected=select.value;
    select.textContent='';for(const p of players){const option=document.createElement('option');option.value=String(p.actor.id);option.textContent=`${p.name}${p.role?' · '+p.role:''} · HP ${p.actor.hp}/${p.actor.maxHp}`;select.append(option);}select.value=selected;
    followed=players.find((p:any)=>String(p.actor.id)===selected)?.actor;
    game.client.connection.emit('chaos:watch',{key:config.key,actorId:selected||null},()=>{});
    log.textContent='';
    if(data.rally?.status==='pending'){const row=document.createElement('div');row.textContent=`Party ${data.rally.kind==='expedition'?'travel to '+data.rally.destination:'rally'} vote: ${data.rally.yes}/${data.rally.required} yes · ${Math.max(0,Math.ceil((data.rally.deadline-Date.now())/1000))}s`;log.append(row);}
    for(const d of (data.declarations||[]).slice(0,2)){const row=document.createElement('div');row.textContent=`${d.player} declares: ${d.text} · ${Math.max(0,Math.ceil((d.dueAt-Date.now())/1000))}s to help/hinder`;log.append(row);}
    if(data.adventure){const row=document.createElement('div');row.style.color='#efbd68';const next=data.adventure.steps.find((step:any)=>!step.done);row.textContent=data.adventure.status==='completed'?'The Refuge Trial — adventure complete!':'The Refuge Trial · '+(next?.label||'Explore together');log.append(row);}
    for(const e of data.events.slice(-2)){const row=document.createElement('div');row.textContent=`${e.player}: ${e.message}`;log.append(row);}
    if(!players.length&&connected.length)log.textContent='Party knocked out — respawn on your phones.';
    lobby.hidden=connected.length>0;lobby.style.display=connected.length?'none':'grid';if(!connected.length){lobby.textContent='';const title=document.createElement('h1');title.textContent='Chaos Party';lobby.append(title);const qr=document.createElement('div');qr.style.cssText='width:260px;margin:auto;background:white';qr.innerHTML=data.lobby.qr;lobby.append(qr);const message=document.createElement('p');message.textContent='Scan to join. Your phone is your character.';lobby.append(message);log.textContent='Waiting for phones to join the adventure…';}
  }catch{log.textContent='Room connection lost; reconnecting…';}};
  void poll();const timer=setInterval(poll,800);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
}
