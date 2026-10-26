// UI adapter around PartyFrame's actual framework-independent SessionConnection.
import {SessionConnection} from './vendor/partyframe-client.js';
const errorFor=code=>({NAME_TAKEN:'That name is already in the tavern. Try a nickname.',NAME:'Give your adventurer a name.',PIN:'That recovery PIN doesn’t match this room.',RECOVERY_LIMIT:'Too many recovery attempts. Wait one minute.',ROOM_FULL:'This tavern already has 24 adventurers.',NOT_ALLOWED:'Open the host screen on the Mac running the game.',TOKEN:'Your character connection expired. Rejoin the tavern.',ROOM_NOT_FOUND:'That room isn’t here. Check its code.'}[code]||code||'Could not reach the tavern.');

export class PartyClient {
  constructor(){this.connection=null;this.onState=()=>{};this.onConnection=()=>{};this.onIdentity=()=>{};this.onClock=()=>{};this.network=null;this.joinOptions=null;}
  get connected(){return !this.connection||this.connection.connected;}
  async connect(options){
    this.connection?.dispose();
    const connection=new SessionConnection(location.origin);this.connection=connection;this.joinOptions=options;
    let lastRevision=-1,previous='idle';
    connection.subscribe(view=>{
      if(this.connection!==connection)return;
      this.onConnection(view.status==='connected'||view.status==='idle');
      if(connection.clock.synced)this.onClock(connection.clock.offset);
      const raw=view.snapshot?.game?.json;
      if(raw){try{const room=JSON.parse(raw);if(room&&room.revision!==lastRevision){lastRevision=room.revision;this.onState(room);}}catch{}}
      if(view.status==='connected'&&previous==='reconnecting')void this.identity().catch(()=>{});
      previous=view.status;
    });
    try{await connection.connect(options);}catch(e){const text=String(e.message||e);const code=['NAME_TAKEN','RECOVERY_LIMIT','ROOM_NOT_FOUND','ROOM_FULL','NOT_ALLOWED','TOKEN','NAME','PIN'].find(c=>text.includes(c));throw new Error(errorFor(code||text));}
    const identity=await this.identity();return identity;
  }
  async identity(){
    const d=await this.connection.request('whoami',{});if(!d.ok)throw new Error(d.error);
    if(d.token&&this.joinOptions){this.joinOptions.profile={...this.joinOptions.profile,token:d.token};delete this.joinOptions.recoveryPin;}
    this.network=d.network;this.onIdentity(d);return d;
  }
  async request(name,data={}){
    if(name==='host:list'){
      const response=await fetch('/api/campaigns',{headers:{'X-Chaos-Host':data.hostKey},cache:'no-store'});
      if(!response.ok)throw new Error('Open the host screen on the Mac running the game.');return {ok:true,...await response.json()};
    }
    if(name==='host:create')return this.connect({role:'host',hostKey:data.hostKey,reactionMs:data.reactionMs,gameId:'chaos-tavern'});
    if(name==='host:watch')return this.connect({role:'host',hostKey:data.hostKey,roomCode:data.code,gameId:'chaos-tavern'});
    if(name==='player:join')return this.connect({role:'controller',roomCode:data.code,profile:data.profile,recoveryPin:data.recoveryPin,gameId:'chaos-tavern'});
    if(!this.connection?.connected)throw new Error('Reconnecting. Your draft is safe; try again when connected.');
    const ack=await this.connection.request(name,data);if(!ack.ok)throw Object.assign(new Error(ack.error||errorFor(ack.code)),{code:ack.code});return ack;
  }
}
