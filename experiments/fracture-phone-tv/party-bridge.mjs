/** Chaos-owned local room host. Fracture credentials never reach a phone. */
import http from 'node:http';
import qrcode from './vendor/qrcode.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomBytes,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createOptionalDM} from './optional-dm.mjs';
import {parseIntent} from './action-contract.ts';
const token=()=>randomBytes(24).toString('hex');
const lanIp=()=>Object.values(os.networkInterfaces()).flat().find(x=>x.family==='IPv4'&&!x.internal)?.address||'localhost';
const phoneHost=req=>{const host=(req.headers.host||'localhost').split(':')[0];return ['localhost','127.0.0.1'].includes(host)?lanIp():host;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qrSvg=url=>{const code=qrcode(0,'M');code.addData(url);code.make();return code.createSvgTag({cellSize:4,margin:16,scalable:true});};
const page=(title,body)=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{box-sizing:border-box}body{margin:0;background:#121922;color:#f4eddc;font:18px system-ui;padding:24px}main{max-width:650px;margin:auto}h1{color:#efbd68}input,button,select{font:inherit;padding:14px;border-radius:8px;width:100%;margin:5px 0;border:1px solid #647386}button{background:#edbd70;color:#18212a;font-weight:bold;cursor:pointer}a{color:#b4dbff}#log{white-space:pre-wrap;line-height:1.5;max-height:180px;overflow:auto}h1{margin:0 0 16px}details{margin:12px 0}summary{cursor:pointer;color:#b4dbff}small{color:#bfc8d3}.row{display:flex;gap:8px}.row button{width:auto;flex:1}.card{padding:18px;background:#202c39;margin:18px 0;border-radius:10px}</style></head><body><main>${body}</main></body></html>`;
export function createPartyBridge({root=process.env.FRACTURE_ROOT,actorKey=process.env.CHAOS_ACTOR_KEY,tvKey=process.env.CHAOS_TV_KEY,port=4748,bind='0.0.0.0',dataDir=process.env.CHAOS_PARTY_DATA||path.join(root||'.','server/data/chaos-party'),ioFactory,fracturePort=8000,idleMs=45000}={}) {
 if(!root||!actorKey||!tvKey)throw Error('Isolated Fracture root and private runtime keys required');
 const io=ioFactory||createRequire(path.join(root,'package.json'))('socket.io-client').io;
 fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
 const dm=createOptionalDM({dataDir});
 const save=path.join(dataDir,'room.json');
 let room=fs.existsSync(save)?JSON.parse(fs.readFileSync(save,'utf8')):{host:token(),join:token(),players:[]};
 const persist=()=>{const tmp=save+'.tmp';fs.writeFileSync(tmp,JSON.stringify(room),{mode:0o600});fs.renameSync(tmp,save);};persist();
 const sessions=new Map(),events=room.events||[];room.turn=null;persist();
 const meaningful=new Set(['attack','talk','quest','open','loot','manipulate','unknown']);
 function record(event){events.push({...event,at:Date.now()});if(events.length>80)events.shift();room.events=events;persist();}
 function connect(player){
  const socket=io(`http://127.0.0.1:${fracturePort}`,{transports:['websocket'],reconnection:true,autoConnect:false,auth:{chaosActorKey:actorKey}});
  const session={player,socket,actor:null,results:new Map(),lastAction:0,epoch:0,lastSeen:0,suspending:false};sessions.set(player.token,session);
  socket.on('connect_error',()=>{session.error='Fracture is unavailable. The host should check its launcher.';});
  socket.on('connect',()=>{session.error=null;session.actor=null;socket.emit('message',[0,player.account,21,60,0,player.password]);});
  socket.on('disconnect',()=>{session.actor=null;for(const [id,result] of session.results)if(['received','started'].includes(result.status))session.results.set(id,{...result,status:'failed',message:'Game connection lost. Reconnect and try again.'});});
  socket.on('message',data=>{const messages=Array.isArray(data?.[0])?data:[data];for(const msg of messages){
   if(!Array.isArray(msg))continue;
   if(msg[0]===1){session.actor={id:msg[1],name:player.name,x:msg[3],y:msg[4],hp:msg[5],ready:true};refresh(session);}
   if(msg[0]===28){record({player:player.name,message:String(msg[2]),status:'dialogue'});session.dialogue=String(msg[2]);}
   if(msg[0]===30)session.quest={type:msg[1],target:msg[2],count:msg[3],progress:msg[4],reward:msg[5],xp:msg[6],description:msg[7]};
   if(msg[0]===31)session.quest=msg[1]===null?null:{...session.quest,type:msg[1],target:msg[2],count:msg[3],progress:msg[4]};
   if(msg[0]===32){session.quest={...session.quest,completed:true,description:msg[3]};record({player:player.name,status:'succeeded',message:'Quest completed! '+String(msg[3])});}
   if(msg[0]===86)session.error='Character authentication failed.';
  }});
  socket.on('chaos:receipt',r=>{if(!session.results.has(r.id))return;const {actor,...outcome}=r;session.results.set(r.id,outcome);if(actor)session.actor=actor;record({player:player.name,...r,actor:undefined});});
  socket.on('chaos:position',s=>session.actor=s);
  return session;
 }
 function refresh(s){if(s.socket.connected&&s.actor)s.socket.timeout(1500).emit('chaos:state',{key:actorKey},(err,r)=>{if(!err&&r?.ok)s.actor=r.actor;});}
 room.players.forEach(connect);
 const polling=setInterval(()=>{for(const s of sessions.values()){
   if(s.socket.connected&&s.actor&&Date.now()-s.lastSeen>idleMs&&!s.suspending){s.suspending=true;s.socket.timeout(2000).emit('chaos:save',{key:actorKey},()=>{if(Date.now()-s.lastSeen>idleMs)s.socket.disconnect();s.suspending=false;});}
   else refresh(s);
  }},1000);
 const publicPlayer=s=>({name:s.player.name,color:s.player.color,actor:s.actor,error:s.error});
 const roster=()=>[...sessions.values()].map(publicPlayer);
 const json=(res,code,value)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
 const body=async req=>{let chunks='',bytes=0;for await(const c of req){bytes+=c.length;if(bytes>4096)throw Error('Body too large');chunks+=c;}return JSON.parse(chunks);};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),p=url.pathname;
   if(req.method==='POST'&&req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return json(res,403,{error:'Invalid origin'});
   if(p==='/health')return json(res,200,{ok:true,players:sessions.size,connected:[...sessions.values()].filter(s=>s.actor).length});
   if(p==='/host'&&req.method==='GET'){
    if(url.searchParams.get('key')!==room.host)return json(res,403,{error:'Private host link required'});
    const host=(req.headers.host||'localhost').split(':')[0],actual=server.address().port;
    const lan=Object.values(os.networkInterfaces()).flat().find(x=>x.family==='IPv4'&&!x.internal)?.address||host;
    const join=`http://${['localhost','127.0.0.1'].includes(host)?lan:host}:${actual}/join?key=${room.join}`;
    const tv=`http://${host}:${fracturePort}/?chaosTV=${encodeURIComponent(`http://${host}:${actual}`)}&tvKey=${tvKey}`;
    res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});return res.end(page('Chaos Party host',`<h1>Chaos Party</h1><p>Local game-night beta · Fracture world</p><div class="card"><a href="${esc(tv)}" target="_blank" rel="noopener">Open shared TV</a><p>Each phone joins here:</p><a href="${esc(join)}">${esc(join)}</a><div style="width:220px;background:white;margin:16px auto">${qrSvg(join)}</div><button id="dm">Optional free Groq interpretation: ${dm.enabled?'ON':'OFF'}</button><script>document.getElementById('dm').onclick=async()=>{const r=await fetch('/dm',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key:${JSON.stringify(room.host)},enabled:${!dm.enabled}})});const v=await r.json();if(r.ok)location.reload();else alert(v.error);};</script><p>Keep this host link private. Each phone gets its own character.</p></div><p>Adventure: meet a villager, defeat a rat, collect loot, then explore north together. Use “look around” to discover real targets.</p><div class="card"><h2>Recover a character</h2>${room.players.map(p=>`<p>${esc(p.name)}: <a href="${esc(join)}#recover=${p.token}">personal reconnect link</a></p>`).join('')}<small>Share each personal link only with its player. It never contains the Fracture password.</small></div><p>12–20-player performance and physical Mac acceptance remain unverified.</p>`));
   }
   if(p==='/join'&&req.method==='GET'){
    if(url.searchParams.get('key')!==room.join)return json(res,403,{error:'Valid room link required'});
    res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});return res.end(page('Chaos Party controller',`<h1>Chaos Party</h1><section id="pair"><p>Your own character in our shared adventure.</p><input id="name" maxlength="18" placeholder="Character name"><select id="color"><option>Amber</option><option>Blue</option><option>Green</option><option>Rose</option></select><small>Your color tints your character on TV. Equipment is earned in Fracture.</small><button id="join">Join adventure</button></section><section id="play" hidden><h2 id="who"></h2><p id="stats"></p><form id="form"><input id="text" maxlength="180" placeholder="What do you do?" required autocomplete="off"><button>Act</button></form><button id="stop">Stop my character</button><button id="revive" hidden>Respawn at checkpoint</button><p id="turn"></p><details><summary>Gear and quest</summary><p id="inventory"></p><p id="quest"></p></details><div class="row"><button data-action="walk north 3">↑</button></div><div class="row"><button data-action="walk west 3">←</button><button data-action="look around">Look</button><button data-action="walk east 3">→</button></div><div class="row"><button data-action="walk south 3">↓</button></div><small>Try: attack rat · talk to guard · open chest · pick up flask · walk north 6. Stop interrupts your action.</small></section><div class="card" id="log" role="status" aria-live="polite">Connecting…</div><script>
const room=${JSON.stringify(room.join)},storage='chaos-party:'+location.host+':'+room;let auth=localStorage.getItem(storage),pending=null;const recovery=new URLSearchParams(location.hash.slice(1)).get('recover');if(recovery){auth=recovery;localStorage.setItem(storage,auth);history.replaceState(null,'',location.pathname+location.search);}
const el=id=>document.getElementById(id),log=s=>el('log').textContent=s;el('stop').after(el('log'));
async function api(path,data){const r=await fetch(path,{method:data?'POST':'GET',headers:data?{'content-type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const v=await r.json();if(!r.ok)throw Error(v.error);return v;}
el('join').onclick=async()=>{try{const v=await api('/pair',{key:room,name:el('name').value,color:el('color').value});auth=v.token;localStorage.setItem(storage,auth);await poll();}catch(e){log(e.message);}};
async function act(text){try{const r=await api('/action',{token:auth,text});pending=r.id;log('RECEIVED: '+text);}catch(e){log(e.message);}}
el('form').onsubmit=e=>{e.preventDefault();act(el('text').value);el('text').value='';};el('stop').onclick=()=>act('stop');el('revive').onclick=()=>act('respawn');document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
async function poll(){if(!auth){log('Choose your name to join.');return;}try{const v=await api('/state?token='+encodeURIComponent(auth));el('pair').hidden=true;el('play').hidden=false;el('who').textContent=v.name;el('stats').textContent=v.actor?(v.actor.dead?'Knocked out — respawn to continue.':'HP '+v.actor.hp+'/'+v.actor.maxHp+' · '+(v.actor.zone||'')+' · position '+v.actor.x+', '+v.actor.y):(v.error||'Connecting to Fracture…');el('revive').hidden=!v.actor?.dead;el('inventory').textContent=v.actor?'Gear: '+v.actor.weapon+' / '+v.actor.armor+' · Bag: '+(v.actor.inventory||[]).map(i=>i.name).join(', '):'';el('quest').textContent=v.quest?'Quest: '+(v.quest.description||'Adventure complete')+' '+(v.quest.progress!==undefined?v.quest.progress+'/'+v.quest.count:''):'Ask a nearby NPC for a quest, or explore freely.';el('turn').textContent=v.turn?'Reaction window: '+Math.max(0,Math.ceil((v.turn.deadline-Date.now())/1000))+'s · '+v.turn.actor+' declared '+v.turn.text:'';const r=v.results.find(r=>r.id===pending)||v.results.at(-1);if(r)log(r.status.toUpperCase()+': '+r.message+(v.dialogue?'\\nNPC: '+v.dialogue:''));}catch(e){log(e.message);}}
setInterval(poll,750);poll();
</script>`));
   }
   if(p==='/dm'&&req.method==='POST'){const b=await body(req);if(b.key!==room.host)return json(res,403,{error:'Private host required'});if(!dm.available)return json(res,409,{error:'No approved Groq key is configured. Offline actions remain available.'});dm.enabled=b.enabled===true;return json(res,200,{enabled:dm.enabled});}
   if(p==='/pair'&&req.method==='POST'){
    const b=await body(req);if(b.key!==room.join)return json(res,403,{error:'Wrong room'});
    if(sessions.size>=20)return json(res,409,{error:'Room is full'});
    const name=typeof b.name==='string'?b.name.trim():'';
    if(!/^[\p{L}\p{N} _-]{2,18}$/u.test(name))return json(res,400,{error:'Use a name of 2–18 letters or numbers.'});
    if(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return json(res,409,{error:'That name is taken. Reconnect with the same phone or choose another.'});
    const player={name,color:['Amber','Blue','Green','Rose'].includes(b.color)?b.color:'Amber',token:token(),account:name.replace(/[^a-zA-Z0-9]/g,'').slice(0,8)+'_'+randomBytes(3).toString('hex'),password:token()};
    room.players.push(player);persist();const session=connect(player);session.lastSeen=Date.now();session.socket.connect();return json(res,201,{token:player.token});
   }
   if(p==='/state'&&req.method==='GET'){
    const s=sessions.get(url.searchParams.get('token'));if(!s)return json(res,403,{error:'Reconnect using your original phone and room link.'});
    s.lastSeen=Date.now();if(!s.socket.connected&&!s.socket.active)s.socket.connect();
    return json(res,200,{...publicPlayer(s),dialogue:s.dialogue,quest:s.quest,turn:room.turn&&room.turn.deadline>Date.now()?{actor:room.turn.actor,text:room.turn.text,deadline:room.turn.deadline}:null,results:[...s.results.entries()].slice(-12).map(([id,r])=>({id,...r}))});
   }
   if(p==='/tv-state'&&req.method==='GET'){
    if(url.searchParams.get('key')!==tvKey)return json(res,403,{error:'Private TV link required'});
    const origin=req.headers.origin;
    if(origin){const u=new URL(origin);if(u.protocol!=='http:'||Number(u.port)!==fracturePort||u.hostname!==(req.headers.host||'').split(':')[0])return json(res,403,{error:'Invalid TV origin'});res.setHeader('access-control-allow-origin',origin);}
    return json(res,200,{players:roster(),events:events.slice(-8),lobby:{join:`http://${phoneHost(req)}:${server.address().port}/join?key=${room.join}`,qr:qrSvg(`http://${phoneHost(req)}:${server.address().port}/join?key=${room.join}`)},turn:room.turn&&room.turn.deadline>Date.now()?{actor:room.turn.actor,text:room.turn.text,deadline:room.turn.deadline}:null});
   }
   if(p==='/action'&&req.method==='POST'){
    const b=await body(req),s=sessions.get(b.token);if(!s)return json(res,403,{error:'Invalid personal controller'});
    if(typeof b.text!=='string'||b.text.trim().length<2||b.text.length>180)return json(res,400,{error:'Action must contain 2–180 characters'});
    s.lastSeen=Date.now();
    if(!s.actor?.ready)return json(res,503,{error:'Your character is connecting. Try again shortly.'});
    let intent=parseIntent(b.text);const epoch=intent.verb==='cancel'?++s.epoch:s.epoch;
    const unresolved=intent.target&&['go','attack','talk','quest','open','loot','equip'].includes(intent.verb)&&![...(s.actor.nearby||[]),...(s.actor.inventory||[])].some(e=>e.name.toLowerCase().includes(intent.target.toLowerCase()));
    if(intent.verb==='unknown'||unresolved)intent=await dm.interpret(b.text,s.actor)||intent;
    if(epoch!==s.epoch)return json(res,409,{error:'That pending interpretation was cancelled.'});
    const now=Date.now();
    const turn=room.turn&&room.turn.deadline>now?room.turn:null;
    if(meaningful.has(intent.verb)&&turn&&turn.participants.includes(s.player.token))return json(res,409,{error:'Your declaration is locked for this reaction window. You can still move or stop.'});
    if(intent.verb!=='cancel'&&now-s.lastAction<200)return json(res,429,{error:'Give your character a moment.'});s.lastAction=now;
    const id=randomUUID();s.results.set(id,{status:'received',message:b.text.trim()});if(s.results.size>80)s.results.delete(s.results.keys().next().value);
    s.socket.timeout(2000).emit('chaos:action',{key:actorKey,id,intent,actorId:s.actor.id,issuedAt:Date.now()},(error,r)=>{if(error||r?.error){const result={status:'blocked',message:r?.error||'No engine acknowledgment. Please stop before retrying.'};s.results.set(id,result);record({player:s.player.name,id,...result});}else if(meaningful.has(intent.verb)&&!['blocked','failed'].includes(s.results.get(id)?.status)){
      if(!room.turn||room.turn.deadline<=Date.now())room.turn={id,actor:s.player.name,text:b.text.trim(),deadline:Date.now()+10000,participants:[s.player.token]};
      else if(!room.turn.participants.includes(s.player.token))room.turn.participants.push(s.player.token);persist();
    }});
    return json(res,202,{id});
   }
   json(res,404,{error:'Not found'});
  }catch(e){json(res,400,{error:'Invalid request'});}
 });
 server.requestTimeout=5000;server.headersTimeout=5000;
 return {server,room,sessions,async start(){await new Promise((resolve,reject)=>server.once('error',reject).listen(port,bind,resolve));return server.address();},async close(){clearInterval(polling);await Promise.all([...sessions.values()].filter(s=>s.socket.connected&&s.actor).map(s=>new Promise(resolve=>s.socket.timeout(2000).emit('chaos:save',{key:actorKey},(error,result)=>{if(error||result?.error)console.error('[Chaos Party] Save acknowledgment failed; attempting native disconnect save.');resolve();}))));persist();for(const s of sessions.values())s.socket.disconnect();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const app=createPartyBridge();app.start().then(()=>console.log(`Chaos Fracture local bridge: http://localhost:4748/host?key=${app.room.host}`)).catch(e=>{console.error(e.message);process.exit(1);});let stopping=false;for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{if(stopping)return;stopping=true;await app.close();process.exit(0);});}
