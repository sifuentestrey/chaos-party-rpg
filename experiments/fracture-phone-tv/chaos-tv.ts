/** Chaos-owned shared TV adapter. Ordinary Fracture is unchanged without chaosTV. */
import {appearanceSheet,drawPreview} from './character-appearance.mjs';
import {createSharedCamera} from './shared-camera.mjs';
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
  const style=document.createElement('style');style.textContent=`html.chaos-tv #intro,html.chaos-tv #instructions,html.chaos-tv #status,html.chaos-tv #statusbar,html.chaos-tv #skill-bar,html.chaos-tv #minimap-container,html.chaos-tv #ai-retired-note,html.chaos-tv #hire-button,html.chaos-tv #credits-link,html.chaos-tv #chatbox,html.chaos-tv #notifications,html.chaos-tv #achievements,html.chaos-tv #population,html.chaos-tv #credits,html.chaos-tv #about{display:none!important}body{overflow:hidden}
#chaos-tv-controls{position:fixed;right:12px;top:10px;z-index:20000;background:#12201ee8!important;color:#e8ddc7!important;padding:8px 12px!important;border:1px solid #bda66a45;border-radius:10px!important;font:14px system-ui}#chaos-tv-controls button,#chaos-tv-controls select{font:13px system-ui;border:1px solid #8a8c6c66;border-radius:6px;padding:6px 9px;background:#263730;color:#eee3ca}#chaos-tv-controls details{margin-bottom:5px}#chaos-tv-connection{display:block;margin-top:5px;color:#d3c7a8;font-size:12px;max-width:280px}
#chaos-story-timeline{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);width:min(760px,78vw);display:grid;gap:5px;z-index:19998;pointer-events:none;filter:drop-shadow(0 5px 12px #0008)}#chaos-story-timeline[hidden]{display:none!important}.chaos-story-event{display:flex;align-items:center;gap:10px;min-height:38px;padding:7px 16px;color:#f4ead3;background:linear-gradient(90deg,#172721ee,#1c302be8,#172721ee);border-top:1px solid #c7ad6b70;border-bottom:1px solid #6e805c80;border-left:3px solid #d9bd7d;border-radius:4px;font:18px/1.35 Georgia,serif;letter-spacing:.1px;opacity:1;transform:translateY(0)}.chaos-story-mark{color:#e4bf70;font:18px Georgia,serif;flex:0 0 auto}.chaos-story-copy{overflow:hidden;text-overflow:ellipsis}.chaos-story-event.is-entering{animation:chaos-story-in .22s ease-out both}.chaos-story-event.is-leaving{animation:chaos-story-out 1s ease both}@keyframes chaos-story-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes chaos-story-out{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-4px)}}
#chaos-pacing-screen{top:14px!important;width:max-content!important;max-width:calc(100% - 350px)!important;padding:10px 24px!important;border-radius:30px!important;background:#13221ee8!important;border:1px solid #af9c6247;font:16px/1.5 system-ui!important;letter-spacing:.2px;box-shadow:0 4px 18px #0003}#chaos-pacing-screen[data-phase=recap]{top:14px!important;bottom:auto!important;max-width:calc(100% - 350px)!important;width:max-content!important;border-radius:30px!important;padding:10px 24px!important;font:16px/1.5 system-ui!important;border-left:1px solid #af9c6247;max-height:160px!important}#chaos-pacing-screen[data-phase=action]{color:#f2d38b!important;border-color:#d1ad68aa}
@media(max-width:900px){#chaos-pacing-screen{max-width:calc(100% - 240px)!important;font-size:13px!important;padding:8px 14px!important}.chaos-story-event{font-size:15px}.chaos-story-copy{white-space:nowrap}}
`;document.head.append(style);
  const controls=document.createElement('div');controls.id='chaos-tv-controls';
  const owner=createSharedCamera(game);game.__chaosSceneCamera=owner;
  Object.defineProperty(controls,'cameraState',{get:()=>({...owner.snapshot(),mode:mode.value})});
  const settings=document.createElement('details');settings.id='chaos-camera-options';const summary=document.createElement('summary');summary.textContent='Camera options';settings.append(summary);controls.append(settings);
  const select=document.createElement('select');select.setAttribute('aria-label','Follow player');settings.append(select);const mode=document.createElement('select');mode.setAttribute('aria-label','Camera mode');mode.innerHTML='<option value="group">Shared scene</option><option value="follow">Follow player</option>';settings.insertBefore(mode,select);select.hidden=true;select.disabled=true;const offscreen=document.createElement('div');offscreen.id='chaos-offscreen';offscreen.style.cssText='position:fixed;top:58px;right:12px;z-index:19001;color:white;background:#15202cdd;padding:6px;border-radius:6px;font:14px system-ui;max-width:280px';document.body.append(offscreen);let sharedView:any=null;mode.onchange=()=>{const shared=mode.value==='group';select.hidden=shared;select.disabled=shared;if(shared)owner.hold();else owner.release();cameraKey='';lastWatch='';};select.onchange=()=>{if(mode.value==='follow'){cameraKey='';lastWatch='';}};
  const fullscreen=document.createElement('button');fullscreen.textContent='Full screen';fullscreen.onclick=()=>{void document.documentElement.requestFullscreen?.();};controls.append(fullscreen);document.body.append(controls);
  const lobby=document.createElement('div');Object.assign(lobby.style,{position:'fixed',inset:'0',background:'#121922ed',color:'#f4eddc',zIndex:'19000',display:'grid',placeContent:'center',textAlign:'center',font:'24px system-ui'});document.body.append(lobby);
  const pacingPanel=document.createElement('div');pacingPanel.id='chaos-pacing-screen';pacingPanel.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%);max-width:760px;width:calc(100% - 260px);padding:12px 20px;border-radius:12px;background:#132231df;color:#f4eddc;text-align:center;font:18px system-ui;z-index:18999;pointer-events:none;white-space:pre-line;max-height:160px;overflow:hidden';pacingPanel.hidden=true;document.body.append(pacingPanel);
  const connection=document.createElement('span');connection.id='chaos-tv-connection';controls.append(connection);
  const storyTimeline=document.createElement('div');storyTimeline.id='chaos-story-timeline';storyTimeline.setAttribute('aria-live','polite');storyTimeline.hidden=true;document.body.append(storyTimeline);
  const timelineRows=new Map<string,HTMLElement>();
  const renderTimeline=(entries:any[],serverNow:number)=>{
    const now=Date.now(),offset=Number.isFinite(serverNow)?serverNow-now:0,active=new Set((entries||[]).map(e=>String(e?.id)));
    timelineRows.forEach((row,id)=>{if(active.has(id)){row.classList.remove('is-leaving');return;}if(!row.classList.contains('is-leaving'))row.classList.add('is-leaving');setTimeout(()=>{if(row.classList.contains('is-leaving')){row.remove();timelineRows.delete(id);storyTimeline.hidden=timelineRows.size===0;}},1000);});
    for(const entry of entries||[]){if(!entry?.id||!entry.text)continue;const id=String(entry.id);let row=timelineRows.get(id);if(!row){row=document.createElement('div');row.className='chaos-story-event is-entering';row.dataset.id=id;const mark=document.createElement('span');mark.className='chaos-story-mark';mark.textContent='✦';const copy=document.createElement('span');copy.className='chaos-story-copy';row.append(mark,copy);storyTimeline.append(row);timelineRows.set(id,row);requestAnimationFrame(()=>row?.classList.remove('is-entering'));}const copy=row.querySelector('.chaos-story-copy');if(copy)copy.textContent=String(entry.text);row.classList.remove('is-leaving');const remaining=Number(entry.expiresAt)-(Date.now()+offset);if(remaining<=0)row.classList.add('is-leaving');}
    storyTimeline.hidden=timelineRows.size===0;
  };
  // Spectator does not issue HURT for party actors; their server driver owns cadence.
  let cameraKey='';let observerIds=new Set<string>();
  game.client.connection.on('chaos:camera',(p:any)=>{
    if(mode.value==='group'&&sharedView&&String(p.id)!==String(sharedView.anchor.id))return;
    observerIds=new Set((p.observers||[]).map(String));
    const zone=Object.values(INTERIOR_ZONES).find((z:any)=>z.areas.some((a:any)=>p.x>=a.x&&p.x<a.x+a.w&&p.y>=a.y&&p.y<a.y+a.h))||getZoneAtPosition(p.x,p.y);
    const view=mode.value==='group'?sharedView:null;
    const nextKey=(zone?.viewport?'interior:'+zone.id:view?.id||`follow:${p.id}:${p.x},${p.y}`)+':'+window.innerWidth+','+window.innerHeight;
    if(nextKey===cameraKey)return;cameraKey=nextKey;controls.dataset.scene=nextKey;controls.dataset.cameraUpdates=String(Number(controls.dataset.cameraUpdates||0)+1);
    game.player.disengage();game.player.stop();
    // Native entity packets provide movement. Relocate only the invisible observer.
    game.player.setGridPosition?.(p.x,p.y);
    if(mode.value==='group'){if(!view)return;const v=zone?.viewport;owner.apply(v?{key:view.id+':'+zone.id,x:v.cameraX,y:v.cameraY,width:v.width,height:v.height}:{key:view.id,x:view.x,y:view.y});}
    else{owner.release();if(zone?.viewport){const v=zone.viewport;game.camera.setZoneViewport(v.width,v.height,true);game.camera.setGridPosition(v.cameraX,v.cameraY);}else{game.camera.setZoneViewport(game.camera.fullGridW,game.camera.fullGridH,false);game.camera.setPosition(Math.floor((p.x-game.camera.gridW/2)*16),Math.floor((p.y-game.camera.gridH/2)*16));}}
    game.initAnimatedTiles();game.renderer.renderStaticCanvases();
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
  let selected='',displayActorId='',lastWatch='',lastWatchAt=0;
  const poll=async()=>{try{
    const u=new URL('/tv-state',config.base);u.searchParams.set('key',config.key);
    if(displayActorId)u.searchParams.set('actorId',displayActorId);
    const r=await fetch(u.toString());if(!r.ok){connection.textContent='TV pairing expired. Reopen the TV from the current host page.';return;}const data=await r.json();connection.textContent='';
    const pacing=data.pacing,phase=pacing?.phase,seconds=Math.max(0,Math.ceil(((pacing?.travel?.status==='pending'?pacing.travel.deadline:pacing?.deadline)||0)-Date.now())/1000);
    game.__chaosPaused=!!pacing?.enabled&&['planning','preparation','recap'].includes(phase);
    pacingPanel.hidden=!pacing?.enabled;pacingPanel.dataset.phase=phase||'live';controls.dataset.pacing=phase||'live';
    const nextObjective=data.adventure?.steps.find((step:any)=>!step.done)?.label||'Explore and experiment together';
    pacingPanel.textContent=pacing?.travel?.status==='pending'?'Travel '+pacing.travel.name+'? · '+pacing.travel.yes+'/'+pacing.travel.required+' yes · '+Math.ceil(seconds)+'s':phase==='planning'?'CHOOSE TOGETHER · '+Math.ceil(seconds)+'s · '+pacing.ready+'/'+pacing.total+' ready\n'+nextObjective:phase==='preparation'?'The party gathers its resolve…':phase==='action'?'ACTION · '+Math.ceil(seconds)+'s':phase==='recap'?'RECAP · The story settles':phase==='travel'?'TRAVELLING TOGETHER · '+(pacing.travel?.arrived||0)+'/'+(pacing.travel?.total||0)+' arrived':(pacing?.area?.zone||'Explore together')+' · '+nextObjective;

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
      const actor=game.entities[object.actorId];
      if(actor?.hit){const dx=object.tile.x-Math.round(actor.x/16),dy=object.tile.y-Math.round(actor.y/16);const direction=Math.abs(dx)>Math.abs(dy)?(dx<0?Types.Orientations.LEFT:Types.Orientations.RIGHT):(dy<0?Types.Orientations.UP:Types.Orientations.DOWN);actor.hit(direction);setTimeout(()=>{if(actor.currentAnimation?.name?.startsWith('atk'))actor.idle();},450);}
      if(Number.isFinite(object.before)&&object.before>object.after)game.infoManager.addDamageInfo(object.before-object.after,object.tile.x*16,object.tile.y*16-20,'inflicted');
    }
    for(const e of data.events){const a=e.abilityEffect,key='ability:'+e.id+':'+e.at;if(!a||shownObjects.has(key))continue;shownObjects.add(key);if(Date.now()-e.at>3000)continue;
      if(a.id==='mend'){const target=game.entities[a.targetId];if(target)game.infoManager.addDamageInfo(a.after-a.before,target.x,target.y-15,'healed');}
      else game.client.receiveSkillEffect([Types.Messages.SKILL_EFFECT,a.actorId,a.id,a.x,a.y,a.orientation]);
    }
    if(shownObjects.size>200)shownObjects.clear();
    const props=new Map();for(const p of players)for(const item of [...(p.actor.chaos?.ground||[]),...(p.actor.chaos?.scenery||[])])props.set(item.id,item);groundProps=Array.from(props.values());
    for(const p of players){
      appearances.set(String(p.actor.id),{name:p.name,color:p.color,profile:p.appearance,phaseUntil:p.actor.ability?.phaseUntil||0});
      for(const e of p.actor.nearby||[]){const entity=game.entities[e.id];if(entity&&e.hp!==undefined){entity.hitPoints=e.hp;entity.maxHitPoints=e.maxHp;}}
    }
    for(const e of data.events){if(e.combat&&!shownCombat.has(e.id+':'+e.at)){shownCombat.add(e.id+':'+e.at);const mob=game.entities[e.combat.target];if(mob)game.infoManager.addDamageInfo(Math.max(0,e.combat.before-e.combat.after),mob.x,mob.y-15,'inflicted');}}
    if(shownCombat.size>200)shownCombat.clear();
    if(!players.some((p:any)=>String(p.actor.id)===select.value))selected=String(players[0]?.actor.id||'');else selected=select.value;
    select.textContent='';for(const p of players){const option=document.createElement('option');option.value=String(p.actor.id);option.textContent=`${p.name}${p.role?' · '+(STARTERS[p.role]?.name||p.role):''} · HP ${p.actor.hp}/${p.actor.maxHp}`;select.append(option);}select.value=selected;
    if(mode.value==='group'){sharedView=data.pacing?.enabled&&data.scene?{...data.scene,anchor:players.find((p:any)=>p.actor.zone===data.scene.zone&&p.actor.x>=data.scene.x&&p.actor.x<data.scene.x+data.scene.width&&p.actor.y>=data.scene.y&&p.actor.y<data.scene.y+data.scene.height)?.actor||players[0]?.actor}:chooseScene(players.map((p:any)=>p.actor),data.scene||sharedView);if(sharedView?.anchor){selected=String(sharedView.anchor.id);select.value=selected;}}
    const outside=sharedView&&mode.value==='group'?players.filter((p:any)=>p.actor.zone!==sharedView.zone||p.actor.x<sharedView.x||p.actor.x>=sharedView.x+game.camera.fullGridW||p.actor.y<sharedView.y||p.actor.y>=sharedView.y+game.camera.fullGridH):[];offscreen.textContent=outside.length?'Off screen: '+outside.map((p:any)=>p.name+' '+(p.actor.y<sharedView.y?'↑':p.actor.y>=sharedView.y+game.camera.fullGridH?'↓':p.actor.x<sharedView.x?'←':'→')).join(' · '):'';offscreen.hidden=!outside.length;
    followed=players.find((p:any)=>String(p.actor.id)===selected)?.actor;
    displayActorId=selected;
    const watchKey=selected+':'+(mode.value==='group'?sharedView?.id:'follow');if(watchKey!==lastWatch||Date.now()-lastWatchAt>=15000){lastWatch=watchKey;lastWatchAt=Date.now();game.client.connection.emit('chaos:watch',{key:config.key,actorId:selected||null},()=>{});}
    renderTimeline(data.timeline||[],Number(data.serverNow));
    if(!players.length&&connected.length)connection.textContent='Party knocked out — respawn on your phones.';
    lobby.hidden=data.phase!=='creation'&&connected.length>0;lobby.style.display=lobby.hidden?'none':'grid';
    if(!lobby.hidden){const key=JSON.stringify([data.phase,data.players.map((p:any)=>[p.name,p.role,p.appearance])]);if(key!==rosterKey){rosterKey=key;lobby.textContent='';
      const title=document.createElement('h1');title.textContent=data.phase==='creation'?'Create your adventurers':'Gathering the party';lobby.append(title);
      const content=document.createElement('div');content.style.cssText='display:flex;gap:30px;align-items:center;max-width:1100px';lobby.append(content);
      const join=document.createElement('div');join.style.cssText='width:220px;flex-shrink:0;font-size:18px';const qr=document.createElement('div');qr.style.background='white';qr.innerHTML=data.lobby.qr;join.append(qr);const instruction=document.createElement('p');instruction.textContent=data.phase==='creation'?'Scan, create on your phone, then tap Ready.':'Reconnect using your saved phone.';join.append(instruction);content.append(join);
      const grid=document.createElement('div');grid.id='chaos-ready-grid';grid.style.cssText='display:grid;grid-template-columns:repeat(5,120px);gap:8px;max-height:540px;overflow:auto';content.append(grid);
      for(const p of data.players){const card=document.createElement('div');card.style.cssText='background:#202c39;border-radius:10px;padding:6px;font-size:14px';const c:any=document.createElement('canvas');c.width=96;c.height=96;c.style.cssText='position:static;display:block;margin:auto;image-rendering:pixelated;width:96px;height:96px';c.__wardrobe=outfit(p.appearance||DEFAULT_APPEARANCE);card.append(c);const name=document.createElement('div');name.textContent=p.name;name.style.color=colors[p.color];card.append(name);const label=document.createElement('small');label.textContent=(STARTERS[p.role]?.name||p.role||'Adventurer')+' · Ready';card.append(label);grid.append(card);}
      const message=document.createElement('p');message.textContent=data.phase==='creation'?'The host begins when the party is ready.':'Your characters are entering the world…';lobby.append(message);
    }}

  }catch{connection.textContent='Room connection lost; reconnecting…';}};
  void poll();const timer=setInterval(poll,800);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
}
