/** Chaos-owned shared TV adapter. Ordinary Fracture is unchanged without chaosTV. */
import {appearanceSheet,drawPreview} from './character-appearance.mjs';
import {chooseScene} from './scene-view.mjs';
import {STARTERS,DEFAULT_APPEARANCE,bodyScale} from './character-profile.mjs';
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
  const select=document.createElement('select');select.setAttribute('aria-label','Follow player');controls.append(select);const mode=document.createElement('select');mode.setAttribute('aria-label','Camera mode');mode.innerHTML='<option value="group">Shared scene</option><option value="follow">Follow player</option>';controls.prepend(mode);const offscreen=document.createElement('div');offscreen.id='chaos-offscreen';offscreen.style.cssText='position:fixed;top:58px;right:12px;z-index:19001;color:white;background:#15202cdd;padding:6px;border-radius:6px;font:14px system-ui;max-width:280px';document.body.append(offscreen);let sharedView:any=null;mode.onchange=()=>{cameraKey='';lastWatch='';};select.onchange=()=>{mode.value='follow';cameraKey='';lastWatch='';};
  const fullscreen=document.createElement('button');fullscreen.textContent='Full screen';fullscreen.onclick=()=>{void document.documentElement.requestFullscreen?.();};controls.append(fullscreen);document.body.append(controls);
  const lobby=document.createElement('div');Object.assign(lobby.style,{position:'fixed',inset:'0',background:'#121922ed',color:'#f4eddc',zIndex:'19000',display:'grid',placeContent:'center',textAlign:'center',font:'24px system-ui'});document.body.append(lobby);
  const log=document.createElement('div');log.id='chaos-tv-log';document.body.append(log);
  // Spectator does not issue HURT for party actors; their server driver owns cadence.
  let cameraKey='';let observerIds=new Set<string>();
  game.client.connection.on('chaos:camera',(p:any)=>{
    observerIds=new Set((p.observers||[]).map(String));
    const zone=Object.values(INTERIOR_ZONES).find((z:any)=>z.areas.some((a:any)=>p.x>=a.x&&p.x<a.x+a.w&&p.y>=a.y&&p.y<a.y+a.h))||getZoneAtPosition(p.x,p.y);
    const view=mode.value==='group'?sharedView:null;
    const nextKey=(zone?.viewport?'interior:'+zone.id:view?.id||`follow:${p.id}:${p.x},${p.y}`)+':'+window.innerWidth+','+window.innerHeight;
    if(nextKey===cameraKey)return;cameraKey=nextKey;controls.dataset.scene=nextKey;controls.dataset.cameraUpdates=String(Number(controls.dataset.cameraUpdates||0)+1);
    game.player.disengage();game.player.stop();
    // Native entity packets provide movement. Relocate only the invisible observer.
    game.player.setGridPosition?.(p.x,p.y);
    if(zone?.viewport){const v=zone.viewport;game.camera.setZoneViewport(v.width,v.height,true);game.camera.setGridPosition(v.cameraX,v.cameraY);}
    else{game.camera.setZoneViewport(game.camera.fullGridW,game.camera.fullGridH,false);game.camera.setPosition(view?view.x*16:Math.floor((p.x-game.camera.gridW/2)*16),view?view.y*16:Math.floor((p.y-game.camera.gridH/2)*16));}
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
  const wardrobe=new Map();
  function outfit(profile:any,factor=1):any {
    const key=JSON.stringify(profile)+':'+factor;if(wardrobe.has(key))return wardrobe.get(key);
    const entry:any={sheet:null};wardrobe.set(key,entry);if(wardrobe.size>64)wardrobe.delete(wardrobe.keys().next().value);
    void appearanceSheet(profile,'img/1/').then((sheet:any)=>{if(factor===1)entry.sheet=sheet;else{const c=document.createElement('canvas');c.width=sheet.width*factor;c.height=sheet.height*factor;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(sheet,0,0,c.width,c.height);entry.sheet=c;}}).catch(()=>{entry.failed=true;});return entry;
  }
  let rosterKey='';
  const previewTimer=setInterval(()=>{if(lobby.hidden)return;lobby.querySelectorAll('canvas').forEach((c:any)=>{if(c.__wardrobe?.sheet)drawPreview(c.getContext('2d'),c.__wardrobe.sheet,{time:Date.now(),scale:3});});},250);
  window.addEventListener('beforeunload',()=>clearInterval(previewTimer),{once:true});
  const originalDraw=game.renderer.drawEntity.bind(game.renderer);
  game.renderer.drawEntity=(entity:any)=>{
    if(entity.id===game.playerId||observerIds.has(String(entity.id)))return;
    const appearance=appearances.get(String(entity.id));
    if(!appearance){originalDraw(entity);return;}
    const context=game.renderer.context;context.save();context.imageSmoothingEnabled=false;context.strokeStyle=colors[appearance.color];context.lineWidth=2;context.beginPath();context.ellipse((entity.x+8)*game.renderer.scale,(entity.y+14)*game.renderer.scale,8*game.renderer.scale,3*game.renderer.scale,0,0,Math.PI*2);context.stroke();
    entity.isPhased=(appearance.phaseUntil||0)>Date.now();
    const originalSprite=entity.sprite;
    const cosmetic=appearance.profile&&originalSprite?.id&&originalSprite.width===32&&originalSprite.height===32?outfit(appearance.profile,originalSprite.image.width/160):null;
    context.filter=appearance.profile?'none':hues[appearance.color]||'none';
    try{if(appearance.profile){const [sx,sy]=bodyScale(appearance.profile.body),ax=(entity.x+8)*game.renderer.scale,ay=(entity.y+16)*game.renderer.scale;context.translate(ax,ay);context.scale(sx,sy);context.translate(-ax,-ay);}if(cosmetic?.sheet)entity.sprite={...originalSprite,image:cosmetic.sheet};originalDraw(entity);}finally{entity.sprite=originalSprite;context.restore();}

  };
  const originalName=game.renderer.drawEntityName.bind(game.renderer);
  game.renderer.drawEntityName=(entity:any)=>{if(entity.id===game.playerId||observerIds.has(String(entity.id)))return;const appearance=appearances.get(String(entity.id));if(!appearance)return originalName(entity);const context=game.renderer.context;context.save();context.filter='none';game.renderer.drawText(appearance.name,(entity.x+8)*game.renderer.scale,(entity.y+entity.nameOffsetY)*game.renderer.scale,true,colors[appearance.color]);context.restore();};
  document.addEventListener('click',e=>{if(!controls.contains(e.target as Node)){e.stopImmediatePropagation();e.preventDefault();}},true);
  document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.stopImmediatePropagation();e.preventDefault();}},true);
  const shownCombat=new Set();
  let selected='',lastWatch='',lastWatchAt=0;
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
    for(const e of data.events){const a=e.abilityEffect,key='ability:'+e.id+':'+e.at;if(!a||shownObjects.has(key))continue;shownObjects.add(key);if(Date.now()-e.at>3000)continue;
      if(a.id==='mend'){const target=game.getEntityById(a.targetId);if(target)game.infoManager.addDamageInfo(a.after-a.before,target.x,target.y-15,'healed');}
      else game.client.receiveSkillEffect([Types.Messages.SKILL_EFFECT,a.actorId,a.id,a.x,a.y,a.orientation]);
    }
    if(shownObjects.size>200)shownObjects.clear();
    const props=new Map();for(const p of players)for(const item of [...(p.actor.chaos?.ground||[]),...(p.actor.chaos?.scenery||[])])props.set(item.id,item);groundProps=Array.from(props.values());
    for(const p of players){
      appearances.set(String(p.actor.id),{name:p.name,color:p.color,profile:p.appearance,phaseUntil:p.actor.ability?.phaseUntil||0});
      for(const e of p.actor.nearby||[]){const entity=game.getEntityById(e.id);if(entity&&e.hp!==undefined){entity.hitPoints=e.hp;entity.maxHitPoints=e.maxHp;}}
    }
    for(const e of data.events){if(e.combat&&!shownCombat.has(e.id+':'+e.at)){shownCombat.add(e.id+':'+e.at);const mob=game.getEntityById(e.combat.target);if(mob)game.infoManager.addDamageInfo(Math.max(0,e.combat.before-e.combat.after),mob.x,mob.y-15,'inflicted');}}
    if(shownCombat.size>200)shownCombat.clear();
    if(!players.some((p:any)=>String(p.actor.id)===select.value))selected=String(players[0]?.actor.id||'');else selected=select.value;
    select.textContent='';for(const p of players){const option=document.createElement('option');option.value=String(p.actor.id);option.textContent=`${p.name}${p.role?' · '+(STARTERS[p.role]?.name||p.role):''} · HP ${p.actor.hp}/${p.actor.maxHp}`;select.append(option);}select.value=selected;
    if(mode.value==='group'){sharedView=chooseScene(players.map((p:any)=>p.actor),data.scene||sharedView);if(sharedView){selected=String(sharedView.anchor.id);select.value=selected;}}
    const outside=sharedView&&mode.value==='group'?players.filter((p:any)=>p.actor.zone!==sharedView.zone||p.actor.x<sharedView.x||p.actor.x>=sharedView.x+game.camera.fullGridW||p.actor.y<sharedView.y||p.actor.y>=sharedView.y+game.camera.fullGridH):[];offscreen.textContent=outside.length?'Off screen: '+outside.map((p:any)=>p.name+' '+(p.actor.y<sharedView.y?'↑':p.actor.y>=sharedView.y+game.camera.fullGridH?'↓':p.actor.x<sharedView.x?'←':'→')).join(' · '):'';offscreen.hidden=!outside.length;
    followed=players.find((p:any)=>String(p.actor.id)===selected)?.actor;
    const watchKey=selected+':'+(mode.value==='group'?sharedView?.id:'follow');if(watchKey!==lastWatch||Date.now()-lastWatchAt>=15000){lastWatch=watchKey;lastWatchAt=Date.now();game.client.connection.emit('chaos:watch',{key:config.key,actorId:selected||null},()=>{});}
    log.textContent='';
    if(data.rally?.status==='pending'){const row=document.createElement('div');row.textContent=`Party ${data.rally.kind==='expedition'?'travel to '+data.rally.destination:'rally'} vote: ${data.rally.yes}/${data.rally.required} yes · ${Math.max(0,Math.ceil((data.rally.deadline-Date.now())/1000))}s`;log.append(row);}
    for(const d of (data.declarations||[]).slice(0,2)){const row=document.createElement('div');row.textContent=`${d.player} declares: ${d.text} · ${Math.max(0,Math.ceil((d.dueAt-Date.now())/1000))}s to help/hinder`;log.append(row);}
    if(data.adventure){const row=document.createElement('div');row.style.color='#efbd68';const next=data.adventure.steps.find((step:any)=>!step.done);row.textContent=data.adventure.status==='completed'?'The Refuge Trial — adventure complete!':'The Refuge Trial · '+(next?.label||'Explore together');log.append(row);}
    for(const e of data.events.slice(-2)){const row=document.createElement('div');row.textContent=`${e.player}: ${e.message}`;log.append(row);}
    if(!players.length&&connected.length)log.textContent='Party knocked out — respawn on your phones.';
    lobby.hidden=data.phase!=='creation'&&connected.length>0;lobby.style.display=lobby.hidden?'none':'grid';
    if(!lobby.hidden){const key=JSON.stringify([data.phase,data.players.map((p:any)=>[p.name,p.role,p.appearance])]);if(key!==rosterKey){rosterKey=key;lobby.textContent='';
      const title=document.createElement('h1');title.textContent=data.phase==='creation'?'Create your adventurers':'Gathering the party';lobby.append(title);
      const content=document.createElement('div');content.style.cssText='display:flex;gap:30px;align-items:center;max-width:1100px';lobby.append(content);
      const join=document.createElement('div');join.style.cssText='width:220px;flex-shrink:0;font-size:18px';const qr=document.createElement('div');qr.style.background='white';qr.innerHTML=data.lobby.qr;join.append(qr);const instruction=document.createElement('p');instruction.textContent=data.phase==='creation'?'Scan, create on your phone, then tap Ready.':'Reconnect using your saved phone.';join.append(instruction);content.append(join);
      const grid=document.createElement('div');grid.id='chaos-ready-grid';grid.style.cssText='display:grid;grid-template-columns:repeat(5,120px);gap:8px;max-height:540px;overflow:auto';content.append(grid);
      for(const p of data.players){const card=document.createElement('div');card.style.cssText='background:#202c39;border-radius:10px;padding:6px;font-size:14px';const c:any=document.createElement('canvas');c.width=96;c.height=96;c.style.cssText='position:static;display:block;margin:auto;image-rendering:pixelated;width:96px;height:96px';c.__wardrobe=outfit(p.appearance||DEFAULT_APPEARANCE);card.append(c);const name=document.createElement('div');name.textContent=p.name;name.style.color=colors[p.color];card.append(name);const label=document.createElement('small');label.textContent=(STARTERS[p.role]?.name||p.role||'Adventurer')+' · Ready';card.append(label);grid.append(card);}
      const message=document.createElement('p');message.textContent=data.phase==='creation'?'The host begins when the party is ready.':'Your characters are entering the world…';lobby.append(message);
    }log.textContent='';}

  }catch{log.textContent='Room connection lost; reconnecting…';}};
  void poll();const timer=setInterval(poll,800);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
}
