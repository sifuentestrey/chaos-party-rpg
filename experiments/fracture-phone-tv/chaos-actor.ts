/** Chaos-owned authoritative actor driver; enabled only by a private local host key. */
import * as fs from 'node:fs';
import {createPartyPacing,createSimulationClock} from './party-pacing';
import {gameNow,setChaosClock} from './chaos-clock';
const simulationClock=createSimulationClock({file:process.env.CHAOS_ACTOR_KEY?'server/data/chaos-party/pacing-clock.json':undefined});
if(process.env.CHAOS_ACTOR_KEY)setChaosClock(simulationClock);
import {nativeTrees} from './chaos-native-scenery';
import {handleSkillUse} from './player/skill.handler';
import {pathToFileURL} from 'node:url';
const geometry=JSON.parse(fs.readFileSync('client/maps/world_client.json','utf8'));
let chaosObjects:any=null;
const chaosReady=process.env.CHAOS_WORLD_MODULE?import(pathToFileURL(process.env.CHAOS_WORLD_MODULE).href).then(m=>chaosObjects=m.createChaosWorld({file:'server/data/chaos-party/objects.json',kindName:Types.getKindAsString,nativeTrees,nativeDoors:geometry.doors,useNativeSkill:handleSkillUse,clock:()=>simulationClock.now(),displayClock:Date.now})):Promise.resolve(null);
import {sceneAt} from './scene-view';
import {Types} from '../../shared/ts/gametypes';
import {Messages} from './message';
import {Formulas} from './formulas';
import {Utils} from './utils';
import {Chest} from './chest';
import {MessageRouter} from './player/message-router';
import {validIntent, shortestPath, extractNativeAttackRates,resolveVisibleTarget,describeVisibleScene,formationTiles} from './chaos-action-contract';
const router = new MessageRouter(Messages,Formulas,Utils,Chest);
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
  let active:any=null, ticking=false, lastHit=0, watchId:any=null, watchKey='';
  const spectator=!!process.env.CHAOS_TV_KEY&&socket.handshake.auth?.chaosTVKey===process.env.CHAOS_TV_KEY;
  player.chaosSpectator=spectator;
  player.chaosControlled=local&&socket.handshake.auth?.chaosActorKey===key;
  if(player.chaosControlled)player.chaosPrepareWorld=async()=>{await chaosReady;chaosObjects?.prepareWorld(world);};
  player.chaosPartyId=player.chaosControlled&&typeof socket.handshake.auth?.chaosPartyId==='string'?socket.handshake.auth.chaosPartyId:null;
  // The bridge authenticates each native actor and supplies a saved class.
  // Never accept a role or perk from a phone action or unauthenticated socket.
  player.chaosRole=player.chaosControlled&&['rogue','bard','wizard','knight','healer','wildcard','barbarian','paladin','assassin','druid','warlock'].includes(socket.handshake.auth?.chaosRole)?socket.handshake.auth.chaosRole:null;
  player.chaosPerk=player.chaosControlled&&['lucky','charming'].includes(socket.handshake.auth?.chaosPerk)?socket.handshake.auth.chaosPerk:null;
  if(player.chaosControlled&&typeof socket.handshake.auth.chaosName==='string'&&/^[\p{L}\p{N} _-]{2,18}$/u.test(socket.handshake.auth.chaosName))player.chaosName=socket.handshake.auth.chaosName;
  const listen=connection.listenCallback;
  connection.listenCallback=(message:any[])=>{
    if(player.chaosSpectator&&![Types.Messages.WHO,Types.Messages.ZONE,...(!player.hasEnteredGame?[Types.Messages.HELLO]:[])].includes(message?.[0]))return;
    return listen?.(message);
  };
  if(player.chaosControlled){world.chaosClock=simulationClock;setChaosClock(simulationClock);}
  if(player.chaosControlled&&!world.chaosPacing){
    const sceneFor=(a:any)=>{const z=world.zoneManager.getZoneAt(a.x,a.y);return z?.viewport?{id:z.id,zone:z.name,x:z.viewport.cameraX,y:z.viewport.cameraY,width:z.viewport.width,height:z.viewport.height}:sceneAt(a);};
    world.chaosPacing=createPartyPacing({world,clock:simulationClock,sceneAt:sceneFor,onChange:()=>{const phaseKey=world.chaosPacing.roundId+':'+world.chaosPacing.phase,full=world.chaosPacingPhaseKey!==phaseKey;world.chaosPacingPhaseKey=phaseKey;for(const p of Object.values(world.players) as any[])if(p.chaosControlled&&p.hasEnteredGame)p.connection?._connection?.emit('chaos:pacing-state',{pacing:world.chaosPacing.snapshot(p),...(full?{actor:p.chaosState?.()}: {})});}});
    world.chaosPacing.allowMessage=(p:any,message:any[])=>{
      const pacing=world.chaosPacing,verb=message[0];
      const read=[Types.Messages.WHO,Types.Messages.ZONE,Types.Messages.HELLO];
      if(pacing.paused&&!read.includes(verb))return false;
      if(pacing.owns(p)&&[Types.Messages.MOVE,Types.Messages.LOOTMOVE].includes(verb)&&!pacing.walkable(p,message[1],message[2]))return false;
      if(pacing.owns(p)&&[Types.Messages.HIT,Types.Messages.HURT].includes(verb)){
        const mob=world.getEntityById(message[1]);
        if(mob&&distance(p,mob)<=1&&pacing.noticeThreat(p,mob))return false;
      }
      return true;
    };
    const pacingTimer=setInterval(()=>world.chaosPacing.tick(),50);pacingTimer.unref?.();
  }
  const pacing=world.chaosPacing;
  if(player.chaosControlled&&socket.handshake.auth?.chaosHybrid)player.chaosStartPacing=()=>{if(!pacing.enabled)pacing.enable(player.chaosPartyId);};
  const enemyHits=new Map(); const seen=new Set<string>();
  const label=(e:any)=>String(e.chaosName||e.name||Types.getKindAsString(e.kind)||e.type);
  const nearby=()=>Object.values(world.entities).filter((e:any)=>e.id!==player.id&&!e.chaosSpectator&&!e.isDead&&distance(player,e)<=18) as any[];
  if(player.chaosControlled)player.chaosSpawnTiles=(area:any)=>{
    const bounds=area||{x:player.x-5,y:player.y-5,width:11,height:11};
    const occupied=new Set((Object.values(world.entities) as any[]).filter(e=>!e.isDead&&e.type!=='player'&&e.type!=='item').map(e=>e.x+','+e.y));
    const clear=(x:number,y:number)=>world.isValidPosition(x,y)&&plateau(x,y)===plateau(player.x,player.y)&&!occupied.has(x+','+y)&&!chaosObjects?.isBlocked(player,x,y)&&(!area||world.zoneManager.getZoneAt(x,y)?.name===area.zone);
    return new Set(formationTiles([player.x,player.y],bounds,clear,bounds.width*bounds.height).map(p=>p.join(',')));
  };
  const objectSnapshot=()=>{try{return chaosObjects?.snapshot(player);}catch{return {bag:[],ground:[],wearables:[],error:'Object storage is unavailable. Ask the host to check disk space and permissions.'};}};
  const blockedStep=(x:number,y:number)=>{
    if(pacing?.owns(player)&&!pacing.walkable(player,x,y))return 'The party is staying in this area. You pause at the edge of the journey.';
    const body=nearby().find(e=>e.type!=='item'&&e.type!=='player'&&e.x===x&&e.y===y);
    if(body)return `${label(body)} stands in your way.`;
    if(plateau(x,y)!==plateau(player.x,player.y))return 'The change in ground is too steep to cross here.';
    return 'There is no clear footing that way.';
  };
  const entrances=()=>geometry.doors.filter((d:any)=>distance(player,d)<=18).map((d:any)=>({id:'door-'+d.x+'-'+d.y,name:world.zoneManager.getZoneAt(d.tx,d.ty)?.name||'building',x:d.x,y:d.y,distance:distance(player,d)})).sort((a:any,b:any)=>a.distance-b.distance);
  const positionState=()=>({id:player.id,x:player.x,y:player.y,zone:world.zoneManager.getZoneAt(player.x,player.y)?.name||'Unknown area',hp:player.hitPoints,maxHp:player.maxHitPoints,dead:player.isDead,ready:player.hasEnteredGame,entrances:entrances(),scene:sceneAt({x:player.x,y:player.y,zone:world.zoneManager.getZoneAt(player.x,player.y)?.name||'Unknown area'})});
  const state=()=>({pacing:pacing?.snapshot(player),scene:sceneAt({x:player.x,y:player.y,zone:world.zoneManager.getZoneAt(player.x,player.y)?.name||'Unknown area'}),entrances:entrances(),ability:chaosObjects?.abilityState(player),id:player.id,name:player.chaosName||player.name,role:player.chaosRole||null,chaos:objectSnapshot(),zone:world.zoneManager.getZoneAt(player.x,player.y)?.name||'Unknown area',x:player.x,y:player.y,hp:player.hitPoints,maxHp:player.maxHitPoints,level:player.level,gold:player.gold,inventory:player.getInventory().getSlots().map((s:any,i:number)=>s?{slot:i,name:Types.getKindAsString(s.kind),count:s.count}:null).filter(Boolean),weapon:Types.getKindAsString(player.weapon),armor:Types.getKindAsString(player.armor),dead:player.isDead,ready:player.hasEnteredGame,nearby:nearby().map(e=>({id:e.id,name:label(e),type:e.type,x:e.x,y:e.y,stunnedUntil:e.stunUntil||0,hp:e.hitPoints,maxHp:e.maxHitPoints}))});
  const receipt=(id:string,status:string,message:string,detail:any={})=>{pacing?.record(player,{id,status,message});socket.emit('chaos:receipt',{id,status,message,...detail,actor:state()});};
  player.chaosState=state;player.chaosReceipt=receipt;
  // Only the action that produced an asynchronous result may finish itself.
  // STOP, disconnect, and replacement actions invalidate all older continuations.
  const finish=(status:string,message:string,detail:any={},expected=active)=>{
    if(!active||active!==expected)return;
    const id=active.id;active=null;receipt(id,status,message,detail);
  };
  const authorized=(body:any)=>{const ok=local&&typeof body?.key==='string'&&body.key===key&&player.hasEnteredGame;if(ok){player.resetTimeout();if(!spectator)player.chaosControlled=true;}return ok;};
  socket.on('chaos:watch',(body:any,ack:any)=>{
    if(typeof ack!=='function')return;
    if(!process.env.CHAOS_TV_KEY||body?.key!==process.env.CHAOS_TV_KEY||!player.hasEnteredGame)return ack({error:'Unauthorized TV'});
    player.resetTimeout();
    if(!body.actorId){watchId=null;return ack({ok:true,lobby:true});}
    const target=world.getEntityById(body.actorId);
    if(!target?.chaosControlled)return ack({error:'No party actor selected'});
    watchKey='';watchId=target.id; player.chaosSpectator=true; player.spawnProtectionUntil=Number.MAX_SAFE_INTEGER; ack({ok:true});
  });
  const move=async(x:number,y:number)=>{
    if(chaosObjects?.isBlocked(player,x,y)||pacing?.enabled&&!pacing.walkable(player,x,y))return false;
    await router.route(player,[Types.Messages.MOVE,x,y]);
    const moved=player.x===x&&player.y===y;
    if(moved){await router.route(player,[Types.Messages.ZONE]);const checkpoint=geometry.checkpoints.find((c:any)=>x>=c.x&&x<c.x+c.w&&y>=c.y&&y<c.y+c.h);if(checkpoint)await router.route(player,[Types.Messages.CHECK,checkpoint.id]);}
    return moved;
  };
  const cancel=()=>{player.clearTarget();player.broadcast(new Messages.Move(player),false);};
  socket.on('chaos:save',(body:any,ack:any)=>{if(typeof ack!=='function')return;if(!authorized(body))return ack({error:'Unauthorized'});try{player.saveToStorage(world.getStorageService());ack({ok:true});}catch{ack({error:'Save failed'});}});
  socket.on('chaos:state',(body:any,ack:any)=>{if(typeof ack==='function')ack(authorized(body)?{ok:true,actor:state()}:{error:'Unauthorized'});});
  const executeAction=async(body:any,ack:any,planned=false)=>{
    if(typeof ack!=='function')return;
    if(!authorized(body))return ack({error:'Unauthorized actor connection'});
    if(String(body.actorId)!==String(player.id)||!Number.isFinite(body.issuedAt)||body.issuedAt>Date.now()+1000||Date.now()-body.issuedAt>1500)return ack({error:'Stale action; submit again from your current character.'});
    if(typeof body.id!=='string'||body.id.length>80||!validIntent(body.intent))return ack({error:'Invalid action contract'});
    if(!planned&&seen.has(body.id))return ack({error:'Duplicate action'});
    seen.add(body.id);if(seen.size>256)seen.delete(seen.values().next().value);
    const intent=body.intent,id=body.id;
    if(intent.verb==='cancel') {if(pacing?.owns(player))pacing.cancel(player);finish('cancelled','Your previous action was cancelled.');cancel();receipt(id,'cancelled','Holding still. Your attacks and path are cancelled.');return ack({ok:true});}
    if(!planned&&pacing?.owns(player)&&intent.verb!=='look'){
      try{pacing.admitAction(body.context);}catch(error){return ack({error:error.message});}
    }
    if(!planned&&pacing?.owns(player)&&pacing.phase==='planning'&&['enter','exit'].includes(intent.verb)){
      try{proposeDoorTravel(intent,id);receipt(id,'queued','Vote to travel through the existing doorway. No arrival is claimed yet.');return ack({ok:true});}catch(error){return ack({error:error.message});}
    }
    if(!planned&&pacing?.owns(player)&&['preparation','action','recap'].includes(pacing.phase)&&intent.verb!=='look')return ack({error:'Watch this moment play out; STOP is always available.'});
    if(!planned&&pacing?.owns(player)&&pacing.paused&&intent.verb!=='look'){
      try{pacing.queue(player,{id,intent,text:body.text});receipt(id,'queued','Chosen for the shared planning window. Tap Ready when you are happy with it.');return ack({ok:true});}
      catch(error){return ack({error:error.message});}
    }
    if(intent.verb==='respawn'){
      if(!player.isDead){receipt(id,'blocked','Your character is already standing.');return ack({ok:true});}
      finish('cancelled','Respawning.');await router.route(player,[Types.Messages.HELLO]);receipt(id,player.isDead?'failed':'succeeded',player.isDead?'Could not respawn.':'Back on your feet at a safe checkpoint.');return ack({ok:true});
    }
    if(player.isDead)return ack({error:'Your character is knocked out. Use respawn.'});
    if(!planned&&intent.verb==='ability'&&player.chaosRole==='wizard'&&pacing?.owns(player)&&pacing.phase==='exploration'){
      const mob=nearby().find(e=>Types.isMob(e.kind)&&distance(player,e)<=3);
      if(mob&&pacing.noticeThreat(player,mob)){pacing.queue(player,{id,intent,text:body.text});receipt(id,'queued','Choose your opening action, then tap Ready.');return ack({ok:true});}
    }
    if(intent.verb==='ability'){
      try{if(!chaosObjects?.useAbility)return ack({error:'Class abilities are unavailable on this host.'});
        const result=chaosObjects.useAbility(player,intent.target||'',intent.skill);
        receipt(id,result.blocked?'blocked':result.success?'succeeded':'failed',result.text,{abilityEffect:result.abilityEffect});return ack({ok:true});
      }catch{receipt(id,'failed','The ability could not be safely completed. Check the host storage.');return ack({ok:true});}
    }
    if(intent.verb==='use_item'){
      const inventory=player.getInventory(),slots=inventory.getSlots();const index=slots.findIndex((s:any)=>s&&Types.getKindAsString(s.kind)?.includes(intent.target));
      if(index<0)return ack({error:'That item is not in your pack.'});
      if(!inventory.isSlotConsumable(index))return ack({error:'That item cannot be eaten or drunk.'});
      const count=slots[index].count,hp=player.hitPoints;await router.route(player,[Types.Messages.INVENTORY_USE,index]);
      const used=(inventory.getSlot(index)?.count||0)<count;receipt(id,used?'succeeded':'blocked',used?`Used ${intent.target}. HP ${hp} → ${player.hitPoints}.`:'You are already at full health. The item was kept.');return ack({ok:true});
    }
    if(active&&!(intent.verb==='attack'&&pacing?.owns(player)&&pacing.phase==='exploration'&&!pacing.snapshot(player).outside))return ack({error:'Finish your action or stop it first.'});
     if(intent.verb==='environment'){
      // The model supplies only a proposal. Recheck the live native world,
      // active actor, zone, reach, collision and D20 at the mutation boundary.
      try{
        if(!chaosObjects?.adjudicateEnvironment)return ack({error:'Native scenery execution is not installed.'});
        // A structured DM proposal has the same grounded auto-approach as a
        // direct object command. Never roll while still out of reach.
        const j=intent.judgment;
        const actionText=j.action.startsWith('move_')?'push '+j.targetId+' '+j.action.slice(5):j.action+' '+j.targetId;
        const destination=chaosObjects.approach(player,actionText);
        if(destination){
          cancel();active={id,intent,target:null,destination:[destination.x,destination.y],nearDestination:true,deadline:gameNow(player)+60000};
          receipt(id,'started','Walking toward the verified native object.');
          return ack({ok:true});
        }
        const result=chaosObjects.adjudicateEnvironment(player,intent.judgment);
        receipt(id,result.blocked?'blocked':result.success?'succeeded':'failed',result.text,{
          roll:result.roll,dc:result.dc,bonus:result.bonus,rerolled:result.rerolled,
          event:result.event,object:result.object
        });
        return ack({ok:true});
      }catch{
        receipt(id,'failed','The native object action could not be saved. No world change is claimed.');
        return ack({ok:true});
      }
     }
    if(intent.verb==='creative'){
      try{if(!chaosObjects)return ack({error:'Object rules are not installed on this host.'});const destination=chaosObjects.approach(player,intent.target);if(destination){cancel();active={id,intent,target:null,destination:[destination.x,destination.y],nearDestination:true,deadline:gameNow(player)+60000};receipt(id,'started','Walking to the object.');return ack({ok:true});}const result=chaosObjects.execute(player,intent.target);receipt(id,result.blocked?'blocked':result.success?'succeeded':'failed',result.text,{roll:result.roll,rolls:result.rolls,assistedBy:result.assistedBy,hinderedBy:result.hinderedBy,bonus:result.bonus,rerolled:result.rerolled,dc:result.dc,event:result.event,object:result.object});return ack({ok:true});}catch{receipt(id,'failed','Object action could not be saved; no success is claimed.');return ack({ok:true});}
    }
    if(intent.verb==='equip'){
      const slots=player.getInventory().getSlots();const index=slots.findIndex((s:any)=>s&&Types.getKindAsString(s.kind)?.includes(intent.target));
      if(index<0){receipt(id,'blocked','That equipment is not in your inventory.');return ack({ok:true});}
      const kind=slots[index].kind;await router.route(player,[Types.Messages.INVENTORY_EQUIP,index]);
      const equipped=player.weapon===kind||player.armor===kind;receipt(id,equipped?'succeeded':'blocked',equipped?'Equipment changed.':'That item cannot be equipped.');return ack({ok:true});
    }
    if(intent.verb==='look') {const props=objectSnapshot();receipt(id,'succeeded',describeVisibleScene(player,nearby(),props.scenery||[],label));return ack({ok:true});}
    if(intent.verb==='unknown'){receipt(id,'blocked','You look for a way to do that, but cannot see how to attempt it here.');return ack({ok:true});}
    let target:any=null;
    if(intent.target&&!['enter','exit'].includes(intent.verb)){
      const phrase=intent.target.toLowerCase();
      const alias=objectSnapshot()?.npcs?.find((n:any)=>n.id===intent.target);
      const visible=nearby();
      const exact=visible.find(e=>String(e.id)===phrase || (alias&&String(e.id)===String(alias.nativeId)));
      target=exact||resolveVisibleTarget(visible,player,intent,label);
      if(intent.verb==='manipulate'){receipt(id,'blocked',target?`${label(target)} cannot be moved by the available mechanics.`:`I don't see an interactable ${intent.target} nearby. Scenery cannot be moved.`);return ack({ok:true});}
      if(!target){receipt(id,'blocked',`You cannot spot ${intent.target} from here.`);return ack({ok:true});}
      const allowed=intent.verb==='attack'?Types.isMob(target.kind):['talk','quest'].includes(intent.verb)?Types.isNpc(target.kind):intent.verb==='open'?target instanceof Chest:intent.verb==='loot'?Types.isItem(target.kind):true;
      if(!allowed){receipt(id,'blocked',`${label(target)} does not support that action.`);return ack({ok:true});}
    }
    let door:any=null;if(['enter','exit'].includes(intent.verb)){try{door=chooseDoor(intent);}catch(error){receipt(id,'blocked',error.message);return ack({ok:true});}}
    if(!planned&&intent.verb==='attack'&&pacing?.owns(player)&&pacing.noticeThreat(player,target)){
      pacing.queue(player,{id,intent,text:body.text});receipt(id,'queued','The encounter is paused. Choose an action and tap Ready.');return ack({ok:true});
    }
    if(pacing?.owns(player)&&['enter','exit'].includes(intent.verb)&&!(planned&&pacing.canTravel(player,body.travelId))){
      try{proposeDoorTravel(intent,id);receipt(id,'queued','Party travel proposed. The vote approves walking, not an arrival.');return ack({ok:true});}
      catch(error){receipt(id,'blocked',error.message);return ack({ok:true});}
    }
    if(!planned&&pacing?.owns(player)&&intent.verb==='go'&&Number.isInteger(intent.x)&&Number.isInteger(intent.y)&&!pacing.walkable(player,intent.x,intent.y)){
      try{const a=pacing.area;proposeSceneTravel(intent.x<a.x?'west':intent.x>=a.x+a.width?'east':intent.y<a.y?'north':'south');receipt(id,'blocked','Travel beyond this area needs the party vote.');return ack({ok:true});}catch(error){return ack({error:error.message});}
    }
    cancel();active={id,intent,text:body.text||intent.verb,target,door,started:gameNow(player),deadline:gameNow(player)+60000};
    receipt(id,'started',target?`${intent.verb}: approaching ${label(target)}.`:'Walking.');ack({ok:true});
  };
  socket.on('chaos:action',(body:any,ack:any)=>void executeAction(body,ack));
  function chooseDoor(intent:any){
      const ref=String(intent.target||'').toLowerCase().replace(/^(?:the |a |an )/,'');
      const generic=!ref||/^(?:door|doorway|entrance|building|house|tavern|outside|inside)$/.test(ref);
      const choices=entrances().filter((d:any)=>generic||d.id===ref||d.name.toLowerCase().includes(ref));
      if(choices.length>1&&choices[0].distance===choices[1].distance)throw Error('Several entrances are equally near. Choose '+choices.slice(0,3).map((d:any)=>d.id+' ('+d.name+')').join(' or ')+'.');
      const door=choices[0]&&geometry.doors.find((d:any)=>d.x===choices[0].x&&d.y===choices[0].y);
      if(!door)throw Error('There is no mapped entrance nearby. Some building artwork has no enterable interior; approach a building with a real doorway.');return door;
  }
  function proposeDoorTravel(intent:any,requestId?:string){
    if(!['exploration','planning'].includes(pacing.phase))throw Error('Choose party travel during planning or exploration; it requires a group vote.');
    const door=chooseDoor(intent),targetArea=sceneForDoor(door);
    const path=shortestPath([player.x,player.y],(x:number,y:number)=>x===door.x&&y===door.y,(x:number,y:number)=>world.isValidPosition(x,y)&&!chaosObjects?.isBlocked(player,x,y));
    if(!path)throw Error('There is no clear native path to that doorway.');
    return pacing.proposeTravel(player,{id:'door-'+door.x+'-'+door.y,name:targetArea.zone,area:targetArea,intent,request:requestId?{id:requestId,actorId:player.id}:null,corridor:path.map(([x,y])=>({x,y}))});
  }
  const sceneForDoor=(d:any)=>{const z=world.zoneManager.getZoneAt(d.tx,d.ty);return z?.viewport?{id:z.id,zone:z.name,x:z.viewport.cameraX,y:z.viewport.cameraY,width:z.viewport.width,height:z.viewport.height}:sceneAt({x:d.tx,y:d.ty,zone:z?.name||'Unknown area'});};
  player.chaosPendingAction=()=>active?{id:active.id,intent:active.intent,targetId:active.target?.id,text:active.text||active.intent.verb}:null;
  player.chaosStopAction=(message:string)=>{finish('cancelled',message);cancel();};
  player.chaosExecutePlan=(d:any)=>void executeAction({key,id:d.id,intent:d.intent,text:d.text,travelId:d.travelId,actorId:player.id,issuedAt:Date.now()},(result:any)=>{if(result?.error)receipt(d.id,'blocked',result.error);},true);
  const landings=new Map();
  player.chaosTravelArrived=(t:any)=>{const spot=landings.get(t.id);return !spot||(player.x===spot[0]&&player.y===spot[1]);};
  player.chaosExecuteTravel=(t:any)=>{
    let intent=t.target.intent;
    if(intent.verb==='go'&&Number.isInteger(intent.x)){
      world.chaosTravelLandings||=new Map();let formation=world.chaosTravelLandings.get(t.id);
      if(!formation){
        const occupied=new Set((Object.values(world.entities) as any[]).filter(e=>!e.isDead&&e.type!=='player'&&e.type!=='item').map(e=>e.x+','+e.y));
        const clear=(x:number,y:number)=>world.isValidPosition(x,y)&&!occupied.has(x+','+y)&&plateau(x,y)===plateau(intent.x,intent.y)&&!chaosObjects?.isBlocked(player,x,y)&&world.zoneManager.getZoneAt(x,y)?.name===t.target.area.zone;
        formation={tiles:formationTiles([intent.x,intent.y],t.target.area,clear,20),claims:new Map()};world.chaosTravelLandings.set(t.id,formation);
        if(world.chaosTravelLandings.size>8)world.chaosTravelLandings.delete(world.chaosTravelLandings.keys().next().value);
      }
      const identity=String(player.characterId||player.id);let spot=formation.claims.get(identity);
      if(!spot){spot=formation.tiles[formation.claims.size];if(spot)formation.claims.set(identity,spot);}
      if(!spot){receipt(t.id+'-'+player.id,'blocked','There is no clear place for you to stand at the destination.');return;}
      landings.set(t.id,spot);if(landings.size>8)landings.delete(landings.keys().next().value);intent={...intent,x:spot[0],y:spot[1]};
    }
    player.chaosExecutePlan({id:t.id+'-'+player.id,intent,text:'Travel with the party',travelId:t.id});
  };
  socket.on('chaos:pacing',(body:any,ack:any)=>{
    if(typeof ack!=='function')return;if(!authorized(body)||!player.chaosControlled)return ack({error:'Unauthorized pacing control'});
    try{
      if(['ready','vote','extend','prepare','commit'].includes(body.command)&&body.instanceId!==pacing?.instanceId)throw Error('The adventure restarted. Refresh your controller before choosing again.');
      if(body.command==='enable')pacing.enable(player.chaosPartyId,{regroup:true});
      else if(!pacing?.owns(player))return ack({error:'This character is not in a Hybrid adventure'});
      else if(body.command==='ready')pacing.ready(player,body.ready,body.roundId);
      else if(body.command==='extend')pacing.extend(body.roundId);
      else if(body.command==='attention'){if(!pacing.beginPlanning('The host gathers the party'))throw Error('Finish the current moment first');}
      else if(body.command==='prepare')return ack({ok:true,roundId:pacing.roundId,plans:pacing.phase==='preparation'?pacing.prepare():[]});
      else if(body.command==='commit'){if(!Array.isArray(body.plans)||body.plans.some((d:any)=>!validIntent(d.intent)))throw Error('Invalid prepared actions');if(!pacing.commit(body.roundId,body.plans))throw Error('That preparation has closed');}
      else if(body.command==='vote')pacing.voteTravel(player,body.voteId,body.yes);
      else if(body.command==='travel')proposeSceneTravel(body.direction);
      else if(body.command==='rejoin'){
        let fallback=null;const a=pacing.area;
        if(world.zoneManager.getZoneAt(player.x,player.y)?.name===a.zone){
          const path=shortestPath([player.x,player.y],(x:number,y:number)=>x>=a.x&&x<a.x+a.width&&y>=a.y&&y<a.y+a.height,(x:number,y:number)=>world.isValidPosition(x,y)&&!chaosObjects?.isBlocked(player,x,y));
          if(path?.length){const end=path[path.length-1];fallback={id:'rejoin-'+player.id+'-'+Date.now(),source:sceneAt({x:player.x,y:player.y,zone:a.zone}),target:{area:a,intent:{verb:'go',x:end[0],y:end[1]},corridor:path.map(([x,y])=>({x,y}))}};}
        }
        if(!fallback&&world.zoneManager.getZoneAt(player.x,player.y)?.name!==a.zone){
          const canWalk=(x:number,y:number)=>world.isValidPosition(x,y)&&!chaosObjects?.isBlocked(player,x,y);
          const doors=geometry.doors.slice().sort((d:any,e:any)=>distance(player,d)-distance(player,e));
          for(const d of doors){
            const first=shortestPath([player.x,player.y],(x:number,y:number)=>x===d.x&&y===d.y,(x:number,y:number)=>canWalk(x,y)&&plateau(x,y)===plateau(player.x,player.y));if(!first)continue;
            const last=shortestPath([d.tx,d.ty],(x:number,y:number)=>x>=a.x&&x<a.x+a.width&&y>=a.y&&y<a.y+a.height&&world.zoneManager.getZoneAt(x,y)?.name===a.zone,(x:number,y:number)=>canWalk(x,y)&&plateau(x,y)===plateau(d.tx,d.ty));if(!last)continue;
            const id='rejoin-'+player.id+'-'+Date.now(),intermediate=sceneForDoor(d),source=sceneAt({x:player.x,y:player.y,zone:world.zoneManager.getZoneAt(player.x,player.y)?.name||'Unknown area'});
            fallback=[{id:id+'-door',source,target:{area:intermediate,intent:{verb:'enter',target:'door-'+d.x+'-'+d.y},corridor:first.map(([x,y])=>({x,y}))}}];
            if(last.length){const end=last[last.length-1];fallback.push({id:id+'-walk',source:intermediate,target:{area:a,intent:{verb:'go',x:end[0],y:end[1]},corridor:last.map(([x,y])=>({x,y}))}});}break;
          }
        }
        pacing.rejoin(player,fallback);
      }
      else if(body.command!=='state')throw Error('Unknown pacing control');
      ack({ok:true,pacing:pacing.snapshot(player)});
    }catch(error){ack({error:error.message});}
  });
  function proposeSceneTravel(direction:string){
    const vector:any={north:[0,-1],south:[0,1],west:[-1,0],east:[1,0]},v=vector[direction],a=pacing.area;
    if(!v||!a)throw Error('Choose a mapped adjacent scene');
    const bodies=new Set((Object.values(world.entities) as any[]).filter(e=>!e.isDead&&e.type!=='player'&&e.type!=='item').map(e=>e.x+','+e.y));
    const clearFloor=(x:number,y:number)=>world.isValidPosition(x,y)&&!bodies.has(x+','+y)&&!chaosObjects?.isBlocked(player,x,y);
    const inSource=(x:number,y:number)=>x>=a.x&&x<a.x+a.width&&y>=a.y&&y<a.y+a.height&&world.zoneManager.getZoneAt(x,y)?.name===a.zone;
    const goals=[];for(let sy=a.y;sy<a.y+a.height;sy++)for(let sx=a.x;sx<a.x+a.width;sx++){
      const x=sx+v[0],y=sy+v[1];if(!inSource(sx,sy)||inSource(x,y))continue;
      if(clearFloor(x,y)&&plateau(x,y)===plateau(player.x,player.y))goals.push([x,y]);
    }
    goals.sort((x,y)=>Math.abs(player.x-x[0])+Math.abs(player.y-x[1])-Math.abs(player.x-y[0])-Math.abs(player.y-y[1]));
    const areas=new Map();
    for(const edge of goals){
      const aim={x:Math.max(1,Math.min(geometry.width-2,edge[0]+v[0]*4)),y:Math.max(1,Math.min(geometry.height-2,edge[1]+v[1]*4))};
      const z=world.zoneManager.getZoneAt(aim.x,aim.y),next=sceneAt({...aim,zone:z?.name||a.zone});
      if(next.id!==a.id&&!areas.has(next.id))areas.set(next.id,next);
    }
    // Search for a reachable part of each neighboring scene, rather than
    // restarting BFS for every candidate landing tile. At most two bounded
    // searches per distinct area; occupied native entities stay authoritative.
    for(const next of areas.values()){
      const permitted=(x:number,y:number)=>clearFloor(x,y)&&plateau(x,y)===plateau(player.x,player.y)&&((x>=a.x&&x<a.x+a.width&&y>=a.y&&y<a.y+a.height)||(x>=next.x&&x<next.x+next.width&&y>=next.y&&y<next.y+next.height));
      for(const inset of [6,1]){
        const goal=(x:number,y:number)=>x>=next.x&&x<next.x+next.width&&y>=next.y&&y<next.y+next.height&&world.zoneManager.getZoneAt(x,y)?.name===next.zone&&(v[0]>0?x-next.x:v[0]<0?next.x+next.width-1-x:v[1]>0?y-next.y:next.y+next.height-1-y)>=inset;
        const path=shortestPath([player.x,player.y],goal,permitted,a.width*a.height+next.width*next.height+1);if(!path?.length)continue;
        const end=path[path.length-1];return pacing.proposeTravel(player,{id:direction+'-'+next.id,name:direction+' into '+next.zone,area:next,intent:{verb:'go',x:end[0],y:end[1]},corridor:path.map(([x,y])=>({x,y}))});
      }
    }
    throw Error('No clear native crossing exists at that edge');
  }
  const timer=setInterval(async()=>{
    if(ticking||!player.hasEnteredGame||!socket.connected)return;
    ticking=true;
    let action:any=null;
    try {
      if(spectator)player.spawnProtectionUntil=Number.MAX_SAFE_INTEGER;
      if(spectator&&!watchId)return;
      if(watchId){
        const watched=world.getEntityById(watchId);
        if(watched?.chaosControlled){
          const next=watched.id+':'+watched.x+','+watched.y;if(next===watchKey)return;watchKey=next;
          player.spawnProtectionUntil=Number.MAX_SAFE_INTEGER;
          player.setPosition(watched.x,watched.y);player.zoneCallback?.();world.pushRelevantEntityListTo(player);
          socket.emit('chaos:camera',{x:watched.x,y:watched.y,id:watched.id,observers:(Object.values(world.players) as any[]).filter(p=>p.chaosSpectator).map(p=>p.id)});
        }return;
      }
      if(player.chaosControlled&&socket.handshake.auth?.chaosHybrid&&!pacing.enabled){try{pacing.enable(player.chaosPartyId);}catch{}}
      if(pacing?.owns(player)&&pacing.paused)return;
      if(player.isDead){finish('failed','Your character was knocked out.');return;}
      // Native Fracture clients report mob attack cadence. Replace that responsibility
      // only for this authenticated headless actor; damage still passes native range/stun checks.
      for(const mob of Object.values(world.mobs) as any[]){
        if(String(mob.target)===String(player.id)&&!mob.isDead&&distance(player,mob)<=1&&gameNow(player)-(enemyHits.get(mob.id)||0)>=(nativeRates[Types.getKindAsString(mob.kind)]||nativeRates.default)){if(pacing?.owns(player)&&pacing.noticeThreat(player,mob))return;enemyHits.set(mob.id,gameNow(player));await router.route(player,[Types.Messages.HURT,mob.id]);}
      }
      if(player.isDead){cancel();finish('failed','Your character was knocked out.');return;}
      action=active;if(!action)return;
      if(gameNow(player)>action.deadline){cancel();finish('failed','Action timed out. Try a closer destination.');return;}
      const {intent,target}=action;
      if(target && (world.getEntityById(target.id)!==target || target.isDead)) {cancel();finish('blocked','The target is no longer available.');return;}
      const occupiedTiles=new Set(nearby().filter(e=>!Types.isItem(e.kind)&&e.type!=='player').map(e=>`${e.x},${e.y}`));
      const occupied=(x:number,y:number)=>!player.isPhased?.()&&occupiedTiles.has(`${x},${y}`);
      const walkable=(x:number,y:number)=>(!pacing?.owns(player)||pacing.walkable(player,x,y))&&world.isValidPosition(x,y)&&plateau(x,y)===plateau(player.x,player.y)&&!occupied(x,y)&&!chaosObjects?.isBlocked(player,x,y);
      if(!action.destination && !target){action.destination=action.door?[action.door.x,action.door.y]:intent.verb==='move'?[player.x+intent.dx*intent.steps,player.y+intent.dy*intent.steps]:[intent.x,intent.y];}
      const goal=(x:number,y:number)=>target?(intent.verb==='loot'?x===target.x&&y===target.y:Math.abs(x-target.x)+Math.abs(y-target.y)===1):action.nearDestination?Math.abs(x-action.destination[0])+Math.abs(y-action.destination[1])<=1:x===action.destination[0]&&y===action.destination[1];
      if(!goal(player.x,player.y)){
        if(pacing?.owns(player)&&pacing.phase==='exploration'&&intent.verb==='move'&&!pacing.walkable(player,player.x+intent.dx,player.y+intent.dy)){
          try{proposeSceneTravel(intent.dx<0?'west':intent.dx>0?'east':intent.dy<0?'north':'south');cancel();finish('blocked','The party must approve travel beyond this area.');}
          catch(error){cancel();finish('blocked',error.message);}return;
        }
        const targetPosition=target?`${target.x},${target.y}`:'';
        if(intent.verb==='move'){
          // Directional controls must NEVER route around an obstacle merely
          // to reach a coordinate. Three steps left means three straight tiles.
          const x=player.x+intent.dx,y=player.y+intent.dy;
          if(!walkable(x,y)){
            const steps=action.stepsMoved||0;
            finish(steps?'succeeded':'blocked',steps
              ?`Walked ${steps} tile${steps===1?'':'s'} before an obstacle stopped you.`
              :blockedStep(x,y),{},action);
            return;
          }
          action.path=[[x,y]];
        }else if(!action.path?.length||action.targetPosition!==targetPosition||!walkable(...action.path[0] as [number,number])){
          action.path=shortestPath([player.x,player.y],goal,walkable);
          action.targetPosition=targetPosition;
        }
        const path=action.path;
        if(!path?.length){finish('blocked','You cannot find a clear path to reach that place.');return;}
        const [x,y]=path.shift();
        const moved=await move(x,y);
        if(active!==action)return; // STOP may arrive while native MOVE/checkpoint is in flight.
        if(!moved){finish('blocked','The engine rejected that movement.',{},action);return;}
        if(intent.verb==='move')action.stepsMoved=(action.stepsMoved||0)+1;
        const doorway=geometry.doors.find((d:any)=>d.x===player.x&&d.y===player.y);
        if(doorway&&(chaosObjects?.isBlocked(player,doorway.x,doorway.y)||chaosObjects?.isBlocked(player,doorway.tx,doorway.ty))){finish('blocked','A held doorway prevents passage.',{},action);return;}
        if(doorway&&world.isValidPosition(doorway.tx,doorway.ty)){
          await router.route(player,[Types.Messages.TELEPORT,doorway.tx,doorway.ty]);
          if(active!==action)return;
          player.zoneCallback?.();player.checkZoneChange(player.x,player.y);
          socket.emit('chaos:position',state());finish('succeeded','Travelled through the door into another area.',{},action);return;
        }
        socket.emit('chaos:position',positionState()); return;
      }
      const door=action.door||geometry.doors.find((d:any)=>d.x===player.x&&d.y===player.y);
      if(door&&!['environment','creative'].includes(intent.verb)){
        if(chaosObjects?.isBlocked(player,door.x,door.y)||chaosObjects?.isBlocked(player,door.tx,door.ty)){finish('blocked','A held doorway prevents passage.');return;}
        if(!world.isValidPosition(door.tx,door.ty)){finish('blocked','The door exit is blocked.');return;}
        // Only actual map-authored door destinations reach the native transition.
        await router.route(player,[Types.Messages.TELEPORT,door.tx,door.ty]);
        if(active!==action)return;
        player.zoneCallback?.();player.checkZoneChange(player.x,player.y);
        socket.emit('chaos:position',state());finish('succeeded','Travelled through the door into another area.',{},action);return;
      }
     if(intent.verb==='environment'){
       try{
         const result=chaosObjects.adjudicateEnvironment(player,intent.judgment);
         finish(result.blocked?'blocked':result.success?'succeeded':'failed',result.text,
           {roll:result.roll,dc:result.dc,bonus:result.bonus,rerolled:result.rerolled,event:result.event,object:result.object},action);
       }catch{finish('failed','The native object action could not be saved. No world change is claimed.',{},action);}
       return;
     }
     if(intent.verb==='creative'){const result=chaosObjects.execute(player,intent.target);finish(result.blocked?'blocked':result.success?'succeeded':'failed',result.text,{roll:result.roll,rolls:result.rolls,assistedBy:result.assistedBy,hinderedBy:result.hinderedBy,bonus:result.bonus,rerolled:result.rerolled,dc:result.dc,event:result.event,object:result.object},action);return;}
      if(!target||intent.verb==='go'){finish('succeeded',intent.verb==='move'?`Walked ${action.stepsMoved||intent.steps} tile${(action.stepsMoved||intent.steps)===1?'':'s'}.`:'Reached your destination.',{},action);return;}
      if(intent.verb==='attack'){
        if(gameNow(player)-lastHit<800)return;lastHit=gameNow(player);
        await router.route(player,[Types.Messages.ATTACK,target.id]);
        if(active!==action)return;
        const before=target.hitPoints;
        // Fracture may reset a defeated mob's coordinates during destruction.
        // Capture the pre-HIT tile, then record only a native-confirmed death.
        const combatTile={x:target.x,y:target.y};
        await router.route(player,[Types.Messages.HIT,target.id]);
        if(active!==action)return; // Never report damage or finish a newly started action.
        // Mob.destroy resets HP/position immediately after death; audit before/after
        // plus isDead is authoritative, never infer a kill from just disappearance.
        const dead=target.isDead,after=dead?0:target.hitPoints;
        receipt(action.id,'started',`${label(target)} HP ${before} → ${after}${dead?' — defeated!':''}`,{combat:{target:target.id,before,after,dead}});
        if(dead){
          try{chaosObjects?.recordNativeDefeat(player,target,{before,after,tile:combatTile});}
          catch(error){console.error('[Chaos Party] Native defeat memory could not be saved:',error instanceof Error?error.message:'unknown error');}
          cancel();finish('succeeded',`${label(target)} defeated. Check nearby loot.`);
        }
        return;
      }
      const speakMemory=(response:string)=>{
        player.send(new Messages.NpcTalkResponse(target.kind,response,null).serialize());
        const spoken=response.replace(/^[^:]+: “/,'').replace(/” \(trust -?\d+\)$/,'');
        if(target.group!==undefined)world.pushToAdjacentGroups(target.group,new Messages.Chat(target,spoken));
      };
      if(intent.verb==='quest'){
        if(chaosObjects&&!chaosObjects.canQuest(player,target)){const response=chaosObjects.talk(player,target)||'Make amends before asking this NPC for a job.';speakMemory(response);finish('blocked',response,{},action);return;}
        await router.route(player,[Types.Messages.REQUEST_QUEST,target.kind]);if(active!==action)return;finish('succeeded',`Asked ${label(target)} for an adventure. Check your quest.`);return;
      }
      if(intent.verb==='talk'){
        const memory=chaosObjects?.talk(player,target);if(memory){speakMemory(memory);finish('succeeded',memory,{interaction:'talk'},action);return;}
        await router.route(player,[Types.Messages.NPCTALK,target.kind]);
        if(active!==action)return;
        finish('succeeded',chaosObjects?.talk(player,target)||`You speak with ${label(target)}.`,{interaction:'talk'},action);return;
      }
      if(intent.verb==='open'){
        await router.route(player,[Types.Messages.OPEN,target.id]);
        if(active!==action)return;
        finish(world.getEntityById(target.id)?'blocked':'succeeded',world.getEntityById(target.id)?'The chest could not be opened.':'Chest opened. Look for its contents.');return;
      }
      if(intent.verb==='loot'){
        await router.route(player,[Types.Messages.LOOT,target.id]);
        if(active!==action)return;
        finish(world.getEntityById(target.id)?'blocked':'succeeded',world.getEntityById(target.id)?'Item was not collected. Your inventory may be full.':`${label(target)} collected.`);
      }
    }catch(error){
      // A rejected promise from a cancelled old action must not cancel its successor.
      if(action&&active===action){cancel();finish('failed','The engine could not complete that action.',{},action);}
      console.error('[Chaos actor]',error);
    }
    finally{ticking=false;}
  },120);
  socket.on('disconnect',()=>{if(pacing?.owns(player))pacing.cancel(player);clearInterval(timer);if(player.chaosControlled)chaosObjects?.releaseDoorHolds(player);cancel();active=null;});
}
