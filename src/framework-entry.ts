import {bindRegionStorage} from '../public/campaign.js';
// A game plugin and narrow persistence/security extension of the real PartyFrame runtime.
// The vendored framework remains the owner of Colyseus sessions, roster, clocks,
// reconnection, lobby lifecycle, projections, rate limits, and bot scheduling.
import {Schema,type} from '@colyseus/schema';
import {ServerError,matchMaker} from '@colyseus/core';
import {randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {Rng,validateSync} from '@partyframe/game-core';
import {PartySessionRoom,SessionSchema,install,bindRuntime,runtimeHost,setIfChanged,RateLimiter,generateUniqueRoomCode} from '@partyframe/runtime';
import {JoinOptionsSchema,PlayerNameSchema,AVATARS,PLAYER_COLORS,PARTY_ROOM} from '@partyframe/protocol';
import {createRoom,addPlayer,editPlayer,publicRoom,submit,advance,startGame,hostCommand,RuleError,withGameRng} from '../public/core.js';
import {applyAIPlan} from '../public/ai-plan.js';

export {PartySessionRoom,bindRuntime,install,Rng,RateLimiter};
export {ClockSync} from '../vendor/partyframe/packages/kit/src/net/clock.js';
export {PARTY_ROOM};
export const GAME_ID='chaos-tavern';
export const UPSTREAM_COMMIT='e73cc35bfa561048cd9728991bafeeca5548e953';
let services:any;
const liveRooms=new Map<string,ChaosPartyRoom>();
const recoverAttempts=new Map<string,{at:number,count:number}>();
const equal=(a:any,b:any)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const error=(code:string,message:string)=>{throw new RuleError(code,message);};
const viewCache=new WeakMap<object,{revision:number,view:any}>();
function projection(room:any){
  const previous=viewCache.get(room);if(previous?.revision===room.revision)return previous.view;
  const view=publicRoom(room);view.framework={name:'PartyFrame',commit:UPSTREAM_COMMIT,transport:'Colyseus'};
  viewCache.set(room,{revision:room.revision,view});return view;
}
function settle(ctx:any){
  const state=ctx.state,room=state.room;if(!room)return;
  for(const [platformId,id] of Object.entries(state.seatMap)){
    const p=room.players.find((p:any)=>p.id===id);if(p&&ctx.players.has(platformId))ctx.players.setScore(platformId,p.score);
  }
  ctx.requestStatus(room.phase==='ended'?'GAME_OVER':room.phase==='reveal'?'ROUND_END':'PLAYING');
}
const actionSchema=z.object({requestId:z.string().min(1).max(90),text:z.string().min(2).max(180),kind:z.enum(['action','reaction']).optional(),reaction:z.enum(['assist','intervene','flee','custom']).optional(),turnId:z.string().max(90).optional()});
export const chaosGame={
  id:GAME_ID,nameKey:'chaos.name',minPlayers:1,maxPlayers:24,
  actionSchema,parseOptions:(raw:any)=>({reactionMs:Math.min(12000,Math.max(4000,Number(raw?.reactionMs)||10000))}),
  createState:()=>({room:null,seatMap:{},receipts:{},errors:{}}),
  start(ctx:any){if(ctx.state.room.phase==='lobby')startGame(ctx.state.room,ctx.now);settle(ctx);},
  handleAction(ctx:any,platformId:string,action:any){
    const state=ctx.state,id=state.seatMap[platformId];
    if(!id)return false;
    state.errors[platformId]=null;
    try{
      const receipt=withGameRng(state.room,ctx.rng,()=>submit(state.room,id,action,ctx.now));
      state.receipts[platformId]=receipt;
      if(!receipt.duplicate)ctx.emit({kind:receipt.kind==='action'?'declaration-committed':'reaction-committed',playerId:platformId,params:{sequence:receipt.seq}});
      settle(ctx);return true;
    }catch(e:any){state.errors[platformId]={code:e.code||'ACTION',error:e.message};settle(ctx);return false;}
  },
  update(ctx:any){if(!ctx.state.room)return;withGameRng(ctx.state.room,ctx.rng,()=>advance(ctx.state.room,ctx.now));settle(ctx);},
  isFinished:(ctx:any)=>ctx.state.room?.phase==='ended',
  onPlayerChanged(ctx:any,platformId:string){
    const id=ctx.state.seatMap[platformId],p=ctx.state.room?.players.find((p:any)=>p.id===id);if(!p)return;
    const connected=ctx.players.all().some((row:any)=>ctx.state.seatMap[row.id]===id&&row.connected);
    if(p.connected!==connected){p.connected=connected;ctx.state.room.revision++;ctx.state.room.updatedAt=ctx.now;}
  },
  getControllerState(ctx:any,platformId:string){return {active:!!ctx.state.seatMap[platformId],game:ctx.state.room?projection(ctx.state.room):null};},
  getPublicState:(ctx:any)=>ctx.state.room?projection(ctx.state.room):null,
  createBot(difficulty:string){return {difficulty,decide(ctx:any,botId:string){
    const r=ctx.state.room,id=ctx.state.seatMap[botId];if(!r||!id||r.phase!=='react'||r.paused||r.turn.actorId===id||r.turn.reactions.some((p:any)=>p.playerId===id))return null;
    return {action:{requestId:'bot-'+r.turn.id+'-'+botId,kind:'reaction',reaction:'assist',turnId:r.turn.id,text:'I help with an extremely committed distraction.'},delayMs:ctx.rng.int(450,1200)};
  }};}
};
class ChaosGameSchema extends Schema {@type('string') json='';}
class ChaosSessionSchema extends SessionSchema {@type(ChaosGameSchema) game=new ChaosGameSchema();}

export function configureChaosRuntime(next:any){
  services=next;liveRooms.clear();recoverAttempts.clear();
  const noop=()=>{};const log={debug:noop,info:noop,warn:noop,error:(name:string,extra:any)=>console.error(name,extra?.message||'')};
  bindRuntime({defaultGameId:GAME_ID,maxPlayers:24,sessionTimeoutMs:24*60*60*1000,sessionMaxAgeMs:7*24*60*60*1000,devToolsEnabled:false,log:{...log,child:()=>log}});
  install({game:chaosGame,createState:()=>new ChaosSessionSchema(),project(root:any,pub:any){setIfChanged(root.game,'json',JSON.stringify(pub));}});
}
export const currentRooms=()=>liveRooms;

export class ChaosPartyRoom extends PartySessionRoom {
  private interpretedTurn:string|null=null;
  private narratedTurn:string|null=null;
  private aiDisposed=false;
  private savedRevision=-1;
  private projectedRevision=-1;
  private lastSaved:any=null;
  override async onCreate(options:any){
    if(!equal(options.hostKey,services.store.hostKey))throw new ServerError(4400,'NOT_ALLOWED');
    if(options.resumeCode&&liveRooms.has(options.resumeCode))throw new ServerError(4400,'ROOM_ALREADY_ACTIVE');
    await super.onCreate(options);
    let room;
    if(options.resumeCode){
      const saved=services.store.rooms[options.resumeCode];if(!saved)throw new ServerError(4400,'ROOM_NOT_FOUND');
      room=structuredClone(saved);for(const p of room.players)p.connected=false;
      this.state.publicCode=room.code;
    }else{
      if(services.store.rooms[this.state.publicCode])this.state.publicCode=await generateUniqueRoomCode(async code=>!!services.store.rooms[code]||liveRooms.has(code));
      room=createRoom({code:this.state.publicCode,seed:randomInt(1,0xffffffff),reactionMs:options.reactionMs||10000});
    }
    if(services.store.regionStorage)bindRegionStorage(room,services.store.regionStorage(room.code));
    room.ai=services.ai.status();
    if(room.turn?.ai?.status==='thinking')room.turn.ai={status:'fallback',reason:'The local model was interrupted by a restart.'};
    this.narratedTurn=room.result?.id||null;
    if(room.result?.story?.status==='thinking')room.result.story={status:'fallback',reason:'Narration was interrupted by a restart.'};
    this.gameState={room,seatMap:{},receipts:{},errors:{}};this.rng.restore(room.seed);
    this.gameOptions={reactionMs:room.reactionMs};
    this.setStatus(room.phase==='lobby'?'LOBBY':room.phase==='ended'?'GAME_OVER':room.phase==='reveal'?'ROUND_END':'PLAYING');
    liveRooms.set(room.code,this);this.checkpoint();this.projectGameState(Date.now());await this.publishMetadata();
  }
  override onAuth(client:any,raw:any,request?:any):any{
    const parsed=JoinOptionsSchema.safeParse(raw);if(!parsed.success)throw new ServerError(4400,'INVALID_PAYLOAD');
    if(parsed.data.role==='host'){
      if(!equal(raw.hostKey,services.store.hostKey))throw new ServerError(4400,'NOT_ALLOWED');
      return super.onAuth(client,raw);
    }
    const r=this.tavern;let profile={...(raw.profile||{})};let recoveredId;
    if(raw.recoveryPin){
      const key=request?.req?.socket?.remoteAddress||request?.socket?.remoteAddress||request?.ip||'network',now=Date.now();let attempts=recoverAttempts.get(key)||{at:now,count:0};if(now-attempts.at>60000)attempts={at:now,count:0};attempts.count++;recoverAttempts.set(key,attempts);
      if(attempts.count>5)throw new ServerError(4400,'RECOVERY_LIMIT');
      const found=r.players.find((p:any)=>equal(p.pin,String(raw.recoveryPin)));if(!found)throw new ServerError(4400,'PIN');
      recoveredId=found.id;profile={...found,token:randomBytes(24).toString('hex')};
    }
    if(typeof profile.token!=='string'||profile.token.length<16||profile.token.length>150)throw new ServerError(4400,'TOKEN');
    const known=recoveredId?r.players.find((p:any)=>p.id===recoveredId):r.players.find((p:any)=>equal(p.token,profile.token));
    if(!known){
      const name=PlayerNameSchema.safeParse(profile.name);if(!name.success)throw new ServerError(4400,'NAME');profile.name=name.data;
      if(r.players.some((p:any)=>p.name.toLowerCase()===profile.name.toLowerCase()))throw new ServerError(4400,'NAME_TAKEN');
      if(r.players.length>=24)throw new ServerError(4400,'ROOM_FULL');
    }
    return {role:'controller',joinedAt:Date.now(),profile,recoveredId};
  }
  get tavern():any{return (this.gameState as any)?.room;}
  override onJoin(client:any,options:any,auth:any){
    super.onJoin(client,options,auth);
    if(auth.role==='controller'){
      if(auth.recoveredId){const p=this.tavern.players.find((p:any)=>p.id===auth.recoveredId);p.token=auth.profile.token;}
      let pin;do{pin=String(randomInt(100000,1000000));}while(this.tavern.players.some((p:any)=>p.pin===pin));
      const p=addPlayer(this.tavern,{...auth.profile,pin});
      (this.gameState as any).seatMap[client.sessionId]=p.id;
      client.userData={...auth,characterId:p.id,token:p.token};
      this.handleSessionAction(client,{type:'set-profile',name:p.name,avatar:AVATARS[this.state.players.size%AVATARS.length],color:PLAYER_COLORS[this.state.players.size%PLAYER_COLORS.length]});
      this.state.players.get(client.sessionId)!.score=p.score;
      this.sendWelcome(client);
    }
    this.checkpoint();this.projectGameState(Date.now());this.pushAllControllerStates();
  }
  override onDispose(){this.aiDisposed=true;this.checkpoint();liveRooms.delete(this.state.publicCode);super.onDispose();}
  protected override handleSessionAction(client:any,action:any){
    if(client.userData?.role==='controller'&&client.userData?.characterId){try{this.character(client);}catch{this.sendError(client,'NOT_ALLOWED');return;}}
    if(!['set-profile','set-ready','leave'].includes(action.type)&&client.userData?.role!=='host'){this.sendError(client,'NOT_ALLOWED');return;}
    if(action.type==='set-profile'&&client.userData?.characterId){editPlayer(this.tavern,client.userData.characterId,{name:action.name},Date.now());}
    super.handleSessionAction(client,action);
    this.checkpoint();this.projectGameState(Date.now());
  }
  protected override startGame(){
    if(this.tavern.phase!=='lobby')return;
    this.setStatus('STARTING');const ctx=this.buildContext(Date.now());chaosGame.start(ctx);this.finishTick(ctx);
  }
  protected override applyGameAction(platformId:string,action:any,now:number):boolean{
    const row=this.state.players.get(platformId);
    if(!row?.isBot){
      const client=this.clients.find((c:any)=>c.sessionId===platformId);
      try{if(!client)throw new Error('Missing connection');this.character(client);}
      catch{(this.gameState as any).errors[platformId]={code:'PLAYER',error:'Your character moved to another device. Rejoin to recover it.'};return false;}
    }
    return super.applyGameAction(platformId,action,now);
  }
  protected override registerMessageHandlers(){
    super.registerMessageHandlers();
    this.onMessage('chaos-rpc',(client:any,payload:any)=>{
      const reply=(data:any)=>client.send('chaos-reply',{id:payload?.id,...data});
      try{
        if(!this.checkPayload(client,payload))return reply({ok:false,code:'REQUEST',error:'That request is too large.'});
        if(!payload||typeof payload.id!=='string')return;
        const name=payload.name,data=payload.data||{},auth=client.userData||{};
        if(name==='whoami')return reply({ok:true,...this.identity(client),room:this.snapshot(),network:services.network()});
        if(name==='room:sync')return reply({ok:true,room:this.snapshot(),network:services.network()});
        if(name==='host:ai'){
          if(auth.role!=='host')error('HOST','Only the host can check the local model.');
          if(!this.sessionLimiter.tryConsume(client.sessionId,Date.now()))error('SLOW_DOWN','Give the local model a moment.');
          void services.ai.check().then((status:any)=>{if(!this.aiDisposed&&this.tavern){this.tavern.ai=status;this.tavern.revision++;this.finishTick(this.buildContext(Date.now()));}}).catch(()=>{});
          return reply({ok:true,status:services.ai.status()});
        }
        if(name==='host:command'){
          if(auth.role!=='host')error('HOST','Only the host can do that.');
          if(!this.sessionLimiter.tryConsume(client.sessionId,Date.now()))error('SLOW_DOWN','Give the tavern a moment.');
          const command=data.command;
          if(command.type==='start')this.handleSessionAction(client,{type:'start-game'});
          else{
            hostCommand(this.tavern,command,Date.now());
            this.setStatus(this.tavern.phase==='lobby'?'LOBBY':this.tavern.phase==='ended'?'GAME_OVER':this.tavern.phase==='reveal'?'ROUND_END':'PLAYING');
            this.finishTick(this.buildContext(Date.now()));
          }
          return reply({ok:true,room:this.snapshot()});
        }
        const p=this.character(client);
        if(name==='player:profile'){
          editPlayer(this.tavern,p.id,data.profile||{});this.state.players.get(client.sessionId)!.name=p.name;this.finishTick(this.buildContext(Date.now()));return reply({ok:true,room:this.snapshot()});
        }
        if(name==='player:submit'){
          if(!this.gameLimiter.tryConsume(client.sessionId,Date.now()))error('SLOW_DOWN','One idea at a time. Try again in a moment.');
          const validated=validateSync(actionSchema,data);if(!validated.ok)error('TEXT','Write an attempt between 2 and 180 characters.');
          const handled=this.applyGameAction(client.sessionId,validated.value,Date.now());
          const wrapped:any=this.gameState;
          if(!handled)return reply({ok:false,...(wrapped.errors[client.sessionId]||{code:'BUSY',error:'The story is not accepting that action.'}),room:this.snapshot()});
          if(!wrapped.receipts[client.sessionId]?.duplicate&&wrapped.receipts[client.sessionId]?.kind==='action'){services.ai.cancelNarration?.();this.interpretAcceptedTurn();}
          return reply({ok:true,...wrapped.receipts[client.sessionId],room:this.snapshot()});
        }
        error('COMMAND','Unknown game request.');
      }catch(e:any){reply({ok:false,code:e.code||'SERVER',error:e instanceof RuleError?e.message:'The tavern could not save that change. Please try again.'});}
    });
  }
  private interpretAcceptedTurn(){
    const room=this.tavern,turn=room.turn,status=services.ai.status();
    if(!turn||turn.worldLocked||this.interpretedTurn===turn.id)return;
    this.interpretedTurn=turn.id;
    if(!status.available){turn.ai={status:'fallback',reason:status.message};room.revision++;this.finishTick(this.buildContext(Date.now()));return;}
    turn.ai={status:'thinking',model:status.model};room.revision++;this.finishTick(this.buildContext(Date.now()));
    const id=turn.id,budget=Math.min(5500,turn.deadline-Date.now()-1000);
    void services.ai.interpret(structuredClone(room),turn.actorId,budget).then(({plan,model}:any)=>{
      if(this.aiDisposed||this.tavern!==room||room.turn?.id!==id||room.phase!=='react')return;
      if(!applyAIPlan(room,id,plan,model))throw new Error('Interpretation arrived after its animation deadline');
      room.ai=services.ai.status();
      this.finishTick(this.buildContext(Date.now()));
    }).catch(()=>{
      if(this.aiDisposed||this.tavern!==room||room.turn?.id!==id||room.phase!=='react')return;
      turn.ai={status:'fallback',model:status.model,reason:'AI was unavailable, rate-limited, slow, or returned an unsupported plan. Using the game rules.'};room.ai=services.ai.status();room.revision++;this.finishTick(this.buildContext(Date.now()));
    });
  }
  private character(client:any){
    const auth=client.userData||{},p=this.tavern.players.find((p:any)=>p.id===auth.characterId);
    if(!p||!equal(p.token,auth.token))error('PLAYER','Your character moved to another device. Rejoin to recover it.');return p;
  }
  private narrateResolvedTurn(){
    const room=this.tavern,q=room?.result;
    if(!q||this.narratedTurn===q.id||room.phase!=='reveal')return;
    const status=services.ai.status();
    this.narratedTurn=q.id;
    if(!status.available||!status.narrationEnabled||!services.ai.narrate)return;
    q.story={status:'thinking',model:status.model};room.revision++;
    const snapshot=structuredClone(room),budget=Math.min(5500,room.deadline-Date.now()-250);
    const current=()=>!this.aiDisposed&&this.tavern===room&&room.result===q&&q.story?.status==='thinking';
    void services.ai.narrate(snapshot,budget).then(({story,model}:any)=>{
      if(!current())return;
      if(room.phase!=='reveal'||Date.now()>=room.deadline)throw Error('Narration arrived after its turn.');
      q.story={status:'ready',...story,model};
      room.events.push({id:++room.seq,type:'storyteller',turnId:q.id,text:[story.text,...story.dialogue.map((d:any)=>d.name+': “'+d.line+'”')].join(' '),at:Date.now()});
      if(room.events.length>100)room.events.shift();
      room.ai=services.ai.status();room.revision++;room.updatedAt=Date.now();this.finishTick(this.buildContext(Date.now()));
    }).catch(()=>{
      if(!current())return;
      q.story={status:'fallback',reason:'Narration was unavailable, slow, or invalid. The dice result is unchanged.'};
      room.ai=services.ai.status();room.revision++;this.finishTick(this.buildContext(Date.now()));
    });
  }
  private identity(client:any){if(client.userData?.role==='host')return {role:'host'};const p=this.character(client);return {role:'controller',playerId:p.id,token:p.token,recoveryPin:p.pin};}
  snapshot(){return {...projection(this.tavern),serverNow:Date.now()};}
  private checkpoint(){
    if(!this.tavern||this.tavern.revision===this.savedRevision)return;
    try{services.store.checkpoint(this.tavern);this.savedRevision=this.tavern.revision;this.lastSaved=structuredClone(this.tavern);}
    catch(e){if(this.lastSaved){(this.gameState as any).room=structuredClone(this.lastSaved);bindRegionStorage((this.gameState as any).room,services.store.regionStorage(this.lastSaved.code));}throw e;}
  }
  protected override projectGameState(now:number){
    if(!this.tavern||this.tavern.revision===this.projectedRevision)return;
    super.projectGameState(now);this.projectedRevision=this.tavern.revision;
  }
  protected override finishTick(ctx:any){this.narrateResolvedTurn();this.checkpoint();super.finishTick(ctx);}
}
