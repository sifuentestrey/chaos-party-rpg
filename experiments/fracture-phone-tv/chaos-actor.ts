/** Chaos-owned authoritative actor driver; enabled only by a private local host key. */
import * as fs from 'node:fs';
import {Types} from '../../shared/ts/gametypes';
import {Messages} from './message';
import {Formulas} from './formulas';
import {Utils} from './utils';
import {Chest} from './chest';
import {MessageRouter} from './player/message-router';
import {validIntent, shortestPath, extractNativeAttackRates} from './chaos-action-contract';
const router = new MessageRouter(Messages,Formulas,Utils,Chest);
const geometry=JSON.parse(fs.readFileSync('client/maps/world_client.json','utf8'));
const nativeRates=extractNativeAttackRates(fs.readFileSync('client/ts/entity/character/character.ts','utf8'),fs.readFileSync('client/ts/entity/character/mob/mobs.ts','utf8'));
const plateaus=new Set(geometry.plateau);
const plateau=(x:number,y:number)=>plateaus.has(y*geometry.width+x);
const distance=(a:any,b:any)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function installChaosActor(player:any, connection:any): void {
  const key=process.env.CHAOS_ACTOR_KEY;
  if(!key)return;
  const socket=connection._connection, world=player.getWorld();
  if(socket.handshake.auth?.chaosTVKey&&socket.handshake.auth.chaosTVKey!==process.env.CHAOS_TV_KEY){connection.close('TV pairing expired; reopen the current host link');return;}
  const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(connection.clientIp);
  let active:any=null, ticking=false, lastHit=0, watchId:any=null;
  const spectator=!!process.env.CHAOS_TV_KEY&&socket.handshake.auth?.chaosTVKey===process.env.CHAOS_TV_KEY;
  player.chaosSpectator=spectator;
  player.chaosControlled=local&&socket.handshake.auth?.chaosActorKey===key;
  const listen=connection.listenCallback;
  connection.listenCallback=(message:any[])=>{
    if(player.chaosSpectator&&![Types.Messages.WHO,Types.Messages.ZONE,...(!player.hasEnteredGame?[Types.Messages.HELLO]:[])].includes(message?.[0]))return;
    return listen?.(message);
  };
  const enemyHits=new Map(); const seen=new Set<string>();
  const label=(e:any)=>String(e.name||Types.getKindAsString(e.kind)||e.type);
  const nearby=()=>Object.values(world.entities).filter((e:any)=>e.id!==player.id&&!e.chaosSpectator&&!e.isDead&&distance(player,e)<=18) as any[];
  const state=()=>({id:player.id,name:player.name,zone:world.zoneManager.getZoneAt(player.x,player.y)?.name||'Unknown area',x:player.x,y:player.y,hp:player.hitPoints,maxHp:player.maxHitPoints,level:player.level,gold:player.gold,inventory:player.getInventory().getSlots().map((s:any,i:number)=>s?{slot:i,name:Types.getKindAsString(s.kind),count:s.count}:null).filter(Boolean),weapon:Types.getKindAsString(player.weapon),armor:Types.getKindAsString(player.armor),dead:player.isDead,ready:player.hasEnteredGame,nearby:nearby().map(e=>({id:e.id,name:label(e),type:e.type,x:e.x,y:e.y,hp:e.hitPoints,maxHp:e.maxHitPoints}))});
  const receipt=(id:string,status:string,message:string,detail:any={})=>socket.emit('chaos:receipt',{id,status,message,...detail,actor:state()});
  const finish=(status:string,message:string,detail:any={})=>{if(active){const id=active.id;active=null;receipt(id,status,message,detail);}};
  const authorized=(body:any)=>{const ok=local&&typeof body?.key==='string'&&body.key===key&&player.hasEnteredGame;if(ok){player.resetTimeout();if(!spectator)player.chaosControlled=true;}return ok;};
  socket.on('chaos:watch',(body:any,ack:any)=>{
    if(typeof ack!=='function')return;
    if(!process.env.CHAOS_TV_KEY||body?.key!==process.env.CHAOS_TV_KEY||!player.hasEnteredGame)return ack({error:'Unauthorized TV'});
    player.resetTimeout();
    if(!body.actorId){watchId=null;return ack({ok:true,lobby:true});}
    const target=world.getEntityById(body.actorId);
    if(!target?.chaosControlled)return ack({error:'No party actor selected'});
    watchId=target.id; player.chaosSpectator=true; player.spawnProtectionUntil=Number.MAX_SAFE_INTEGER; ack({ok:true});
  });
  const move=async(x:number,y:number)=>{
    await router.route(player,[Types.Messages.MOVE,x,y]);
    const moved=player.x===x&&player.y===y;
    if(moved){await router.route(player,[Types.Messages.ZONE]);const checkpoint=geometry.checkpoints.find((c:any)=>x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h);if(checkpoint)await router.route(player,[Types.Messages.CHECK,checkpoint.id]);}
    return moved;
  };
  const cancel=()=>{player.clearTarget();player.broadcast(new Messages.Move(player),false);};
  socket.on('chaos:save',(body:any,ack:any)=>{if(typeof ack!=='function')return;if(!authorized(body))return ack({error:'Unauthorized'});try{player.saveToStorage(world.getStorageService());ack({ok:true});}catch{ack({error:'Save failed'});}});
  socket.on('chaos:state',(body:any,ack:any)=>{if(typeof ack==='function')ack(authorized(body)?{ok:true,actor:state()}:{error:'Unauthorized'});});
  socket.on('chaos:action',async(body:any,ack:any)=>{
    if(typeof ack!=='function')return;
    if(!authorized(body))return ack({error:'Unauthorized actor connection'});
    if(String(body.actorId)!==String(player.id)||!Number.isFinite(body.issuedAt)||body.issuedAt>Date.now()+1000||Date.now()-body.issuedAt>1500)return ack({error:'Stale action; submit again from your current character.'});
    if(typeof body.id!=='string'||body.id.length>80||!validIntent(body.intent))return ack({error:'Invalid action contract'});
    if(seen.has(body.id))return ack({error:'Duplicate action'});
    seen.add(body.id);if(seen.size>256)seen.delete(seen.values().next().value);
    const intent=body.intent,id=body.id;
    if(intent.verb==='cancel') {finish('cancelled','Your previous action was cancelled.');cancel();receipt(id,'cancelled','Holding still. Your attacks and path are cancelled.');return ack({ok:true});}
    if(intent.verb==='respawn'){
      if(!player.isDead){receipt(id,'blocked','Your character is already standing.');return ack({ok:true});}
      finish('cancelled','Respawning.');await router.route(player,[Types.Messages.HELLO]);receipt(id,player.isDead?'failed':'succeeded',player.isDead?'Could not respawn.':'Back on your feet at a safe checkpoint.');return ack({ok:true});
    }
    if(player.isDead)return ack({error:'Your character is knocked out. Use respawn.'});
    if(active)return ack({error:'Finish your action or stop it first.'});
    if(intent.verb==='equip'){
      const slots=player.getInventory().getSlots();const index=slots.findIndex((s:any)=>s&&Types.getKindAsString(s.kind)?.includes(intent.target));
      if(index<0){receipt(id,'blocked','That equipment is not in your inventory.');return ack({ok:true});}
      const kind=slots[index].kind;await router.route(player,[Types.Messages.INVENTORY_EQUIP,index]);
      const equipped=player.weapon===kind||player.armor===kind;receipt(id,equipped?'succeeded':'blocked',equipped?'Equipment changed.':'That item cannot be equipped.');return ack({ok:true});
    }
    if(intent.verb==='look') {receipt(id,'succeeded',nearby().length?nearby().slice(0,12).map(e=>`${label(e)} (${e.x},${e.y})`).join('; '):'No characters or items nearby. Explore with movement commands.');return ack({ok:true});}
    if(intent.verb==='unknown'){receipt(id,'blocked','I cannot do that with the available mechanics. Try walking, talking, fighting, opening or collecting something nearby.');return ack({ok:true});}
    let target:any=null;
    if(intent.target){
      const phrase=intent.target.toLowerCase();
      const candidates=nearby().filter(e=>{const name=label(e).toLowerCase();return name===phrase || name.includes(phrase) || (phrase==='item'&&Types.isItem(e.kind)) || (phrase==='enemy'&&Types.isMob(e.kind)) || (phrase==='guard'&&Types.isNpc(e.kind)&&name.includes('guard'));});
      candidates.sort((a,b)=>distance(player,a)-distance(player,b)); target=candidates[0];
      if(intent.verb==='manipulate'){receipt(id,'blocked',target?`${label(target)} cannot be moved by the available mechanics.`:`I don't see an interactable ${intent.target} nearby. Scenery cannot be moved.`);return ack({ok:true});}
      if(!target){receipt(id,'blocked',`I don't see ${intent.target} nearby. Use look around.`);return ack({ok:true});}
      const allowed=intent.verb==='attack'?Types.isMob(target.kind):['talk','quest'].includes(intent.verb)?Types.isNpc(target.kind):intent.verb==='open'?target instanceof Chest:intent.verb==='loot'?Types.isItem(target.kind):true;
      if(!allowed){receipt(id,'blocked',`${label(target)} does not support that action.`);return ack({ok:true});}
    }
    let door:any=null;
    if(intent.verb==='exit'||intent.verb==='enter'){
      door=geometry.doors.filter((d:any)=>distance(player,d)<=18).sort((a:any,b:any)=>distance(player,a)-distance(player,b))[0];
      if(!door){receipt(id,'blocked','No door nearby. Walk closer to a visible entrance.');return ack({ok:true});}
    }
    cancel();active={id,intent,target,door,started:Date.now(),deadline:Date.now()+60000};
    receipt(id,'started',target?`${intent.verb}: approaching ${label(target)}.`:'Walking.');ack({ok:true});
  });
  const timer=setInterval(async()=>{
    if(ticking||!player.hasEnteredGame||!socket.connected)return;
    ticking=true;
    try {
      if(spectator)player.spawnProtectionUntil=Number.MAX_SAFE_INTEGER;
      if(spectator&&!watchId)return;
      if(watchId){
        const watched=world.getEntityById(watchId);
        if(watched?.chaosControlled){
          player.spawnProtectionUntil=Number.MAX_SAFE_INTEGER;
          player.setPosition(watched.x,watched.y);player.zoneCallback?.();world.pushRelevantEntityListTo(player);
          socket.emit('chaos:camera',{x:watched.x,y:watched.y,id:watched.id,observers:(Object.values(world.players) as any[]).filter(p=>p.chaosSpectator).map(p=>p.id)});
        }return;
      }
      if(player.isDead){finish('failed','Your character was knocked out.');return;}
      // Native Fracture clients report mob attack cadence. Replace that responsibility
      // only for this authenticated headless actor; damage still passes native range/stun checks.
      for(const mob of Object.values(world.mobs) as any[]){
        if(String(mob.target)===String(player.id)&&!mob.isDead&&distance(player,mob)<=1&&Date.now()-(enemyHits.get(mob.id)||0)>=(nativeRates[Types.getKindAsString(mob.kind)]||nativeRates.default)){enemyHits.set(mob.id,Date.now());await router.route(player,[Types.Messages.HURT,mob.id]);}
      }
      if(player.isDead){cancel();finish('failed','Your character was knocked out.');return;}
      const action=active;if(!action)return;
      if(Date.now()>action.deadline){cancel();finish('failed','Action timed out. Try a closer destination.');return;}
      const {intent,target}=action;
      if(target && (world.getEntityById(target.id)!==target || target.isDead)) {cancel();finish('blocked','The target is no longer available.');return;}
      const occupiedTiles=new Set(nearby().filter(e=>!Types.isItem(e.kind)&&e.type!=='player').map(e=>`${e.x},${e.y}`));
      const occupied=(x:number,y:number)=>occupiedTiles.has(`${x},${y}`);
      const walkable=(x:number,y:number)=>world.isValidPosition(x,y)&&plateau(x,y)===plateau(player.x,player.y)&&!occupied(x,y);
      if(!action.destination && !target){action.destination=action.door?[action.door.x,action.door.y]:intent.verb==='move'?[player.x+intent.dx*intent.steps,player.y+intent.dy*intent.steps]:[intent.x,intent.y];}
      const goal=(x:number,y:number)=>target?(intent.verb==='loot'?x===target.x&&y===target.y:Math.abs(x-target.x)+Math.abs(y-target.y)===1):x===action.destination[0]&&y===action.destination[1];
      if(!goal(player.x,player.y)){
        const targetPosition=target?`${target.x},${target.y}`:'';
        if(!action.path?.length||action.targetPosition!==targetPosition||!walkable(...action.path[0] as [number,number])){action.path=shortestPath([player.x,player.y],goal,walkable);action.targetPosition=targetPosition;}
        const path=action.path;
        if(!path?.length){finish('blocked','No walkable path to that destination.');return;}
        const [x,y]=path.shift();
        if(!await move(x,y)){finish('blocked','The engine rejected that movement.');return;}
        const doorway=geometry.doors.find((d:any)=>d.x===player.x&&d.y===player.y);
        if(doorway&&world.isValidPosition(doorway.tx,doorway.ty)){
          await router.route(player,[Types.Messages.TELEPORT,doorway.tx,doorway.ty]);player.zoneCallback?.();player.checkZoneChange(player.x,player.y);
          socket.emit('chaos:position',state());finish('succeeded','Travelled through the door into another area.');return;
        }
        socket.emit('chaos:position',state()); return;
      }
      const door=action.door||geometry.doors.find((d:any)=>d.x===player.x&&d.y===player.y);
      if(door){
        if(!world.isValidPosition(door.tx,door.ty)){finish('blocked','The door exit is blocked.');return;}
        // Only actual map-authored door destinations reach the native transition.
        await router.route(player,[Types.Messages.TELEPORT,door.tx,door.ty]);player.zoneCallback?.();player.checkZoneChange(player.x,player.y);
        socket.emit('chaos:position',state());finish('succeeded','Travelled through the door into another area.');return;
      }
      if(!target||intent.verb==='go'){finish('succeeded','Reached your destination.');return;}
      if(intent.verb==='attack'){
        if(Date.now()-lastHit<800)return;lastHit=Date.now();
        await router.route(player,[Types.Messages.ATTACK,target.id]);
        if(active!==action)return;
        const before=target.hitPoints;
        await router.route(player,[Types.Messages.HIT,target.id]);
        // Mob.destroy resets HP/position immediately after death; audit before/after
        // plus isDead is authoritative, never infer a kill from just disappearance.
        const dead=target.isDead,after=dead?0:target.hitPoints;
        receipt(action.id,'started',`${label(target)} HP ${before} → ${after}${dead?' — defeated!':''}`,{combat:{target:target.id,before,after,dead}});
        if(dead){cancel();finish('succeeded',`${label(target)} defeated. Check nearby loot.`);}
        return;
      }
      if(intent.verb==='quest'){
        await router.route(player,[Types.Messages.REQUEST_QUEST,target.kind]);finish('succeeded',`Asked ${label(target)} for an adventure. Check your quest.`);return;
      }
      if(intent.verb==='talk'){
        await router.route(player,[Types.Messages.NPCTALK,target.kind]);
        finish('succeeded',`Spoke to ${label(target)}. See their response.`);return;
      }
      if(intent.verb==='open'){
        await router.route(player,[Types.Messages.OPEN,target.id]);
        finish(world.getEntityById(target.id)?'blocked':'succeeded',world.getEntityById(target.id)?'The chest could not be opened.':'Chest opened. Look for its contents.');return;
      }
      if(intent.verb==='loot'){
        await router.route(player,[Types.Messages.LOOT,target.id]);
        finish(world.getEntityById(target.id)?'blocked':'succeeded',world.getEntityById(target.id)?'Item was not collected. Your inventory may be full.':`${label(target)} collected.`);
      }
    }catch(error){cancel();finish('failed','The engine could not complete that action.');console.error('[Chaos actor]',error);}
    finally{ticking=false;}
  },220);
  socket.on('disconnect',()=>{clearInterval(timer);cancel();active=null;});
}
