import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Server,matchMaker} from '@colyseus/core';
import {WebSocketTransport} from '@colyseus/ws-transport';
import {ChaosPartyRoom,configureChaosRuntime,currentRooms,PARTY_ROOM,GAME_ID} from './framework.mjs';
import {openCampaignStore} from './campaign-store.mjs';
import {VERSION} from '../public/core.js';

const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const local=a=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(a);
const HERE=typeof __dirname==='string'?__dirname:path.dirname(fileURLToPath(import.meta.url));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wav':'audio/wav','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
export async function createGameServer(options={}){
  const base=options.baseDir||(typeof __dirname==='string'?__dirname:path.resolve(HERE,'..'));
  const publicDir=options.publicDir||path.join(base,'public');
  const dataDir=options.dataDir||process.env.CHAOS_DATA_DIR||path.join(base,'data');
  const store=openCampaignStore(dataDir);if(options.hostKey)store.hostKey=options.hostKey;
  let port=0,closing=false;
  const addresses=()=>{try{return [...new Set(Object.values(os.networkInterfaces()).flat().filter(n=>n&&n.family==='IPv4'&&!n.internal&&!n.address.startsWith('169.254.')).map(n=>n.address))];}catch{return [];}};
  const network=()=>({port,addresses:addresses(),version:VERSION,framework:'PartyFrame',serverNow:Date.now()});
  const pendingLoads=new Map();
  async function lookup(code){
    if(currentRooms().has(code))return currentRooms().get(code);
    if(!store.rooms[code])return null;
    if(!pendingLoads.has(code))pendingLoads.set(code,(async()=>{await matchMaker.createRoom(PARTY_ROOM,{hostKey:store.hostKey,resumeCode:code});return currentRooms().get(code);})().finally(()=>pendingLoads.delete(code)));
    return pendingLoads.get(code);
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self'; frame-ancestors 'self'; object-src 'none'");
    const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
    try{
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
      let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return json(400,{error:'Invalid address'});}
      if(pathname==='/health')return json(200,{ok:true,status:'ok',service:'chaos-party',version:VERSION,framework:'PartyFrame',rooms:currentRooms().size});
      if(pathname==='/api/info')return json(200,network());
      if(pathname==='/api/host-key'){
        const sameOrigin=!req.headers.origin||req.headers.origin===`http://${req.headers.host}`||req.headers.origin===`https://${req.headers.host}`;
        const site=req.headers['sec-fetch-site'];const preview=process.env.CHAOS_PREVIEW==='1';
        if((!preview&&!local(req.socket.remoteAddress))||!sameOrigin||(site&&!['same-origin','none'].includes(site)))return json(403,{error:'Open the host screen on the Mac running the game.'});
        return json(200,{hostKey:store.hostKey});
      }
      if(pathname==='/api/campaigns'){
        if(!equal(req.headers['x-chaos-host'],store.hostKey))return json(403,{error:'Host access required.'});
        return json(200,{rooms:store.list()});
      }
      if(pathname==='/api/config')return json(200,{defaultGameId:GAME_ID,games:[{id:GAME_ID,nameKey:'chaos.name',minPlayers:1,maxPlayers:24}],publicBaseUrl:'',devTools:false});
      if(pathname.startsWith('/api/rooms/')){
        const code=pathname.slice('/api/rooms/'.length).toUpperCase();if(!/^[A-Z0-9]{6}$/.test(code))return json(404,{code:'ROOM_NOT_FOUND'});
        const room=await lookup(code);if(!room)return json(404,{code:'ROOM_NOT_FOUND'});
        return json(200,{roomId:room.roomId,roomCode:code,gameId:GAME_ID,status:room.state.status,playerCount:room.tavern.players.length,maxPlayers:24,joinable:room.tavern.players.length<24});
      }
      if(pathname==='/runtime.js'){res.writeHead(200,{'Content-Type':MIME['.js'],'Cache-Control':'no-store'});res.end('window.CHAOS_CONFIG = '+JSON.stringify({standalone:false,version:VERSION,framework:'PartyFrame'})+';');return;}
      if(['/', '/host','/game','/join'].includes(pathname)||/^\/join\/[A-Z0-9]{6}$/.test(pathname))pathname='/index.html';
      const target=path.resolve(publicDir,'.'+pathname);
      if(!target.startsWith(path.resolve(publicDir)+path.sep)){res.writeHead(403);res.end();return;}
      let stat;try{stat=fs.statSync(target);}catch{res.writeHead(404);res.end('Not found');return;}
      if(!stat.isFile()){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'Content-Type':MIME[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':stat.size});
      if(req.method==='HEAD')return res.end();fs.createReadStream(target).pipe(res);
    }catch(e){console.error('Game request failed:',e.message);if(!res.headersSent)json(500,{error:'The tavern could not load that request.'});else res.end();}
  });
  configureChaosRuntime({store,network});
  const transport=new WebSocketTransport({server,pingInterval:6000,pingMaxRetries:4,maxPayload:16*1024});
  const gameServer=new Server({transport,greet:false,gracefullyShutdown:false});
  gameServer.define(PARTY_ROOM,ChaosPartyRoom);
  try{await gameServer.listen(options.port??Number(process.env.PORT||4747),options.host||'0.0.0.0');}
  catch(e){await gameServer.gracefullyShutdown(false);throw e;}
  port=server.address().port;
  return {server,gameServer,port,hostKey:store.hostKey,network,store,
    rooms:()=>Object.fromEntries([...currentRooms()].map(([code,r])=>[code,structuredClone(r.tavern)])),
    async close(){if(closing)return;closing=true;for(const r of currentRooms().values())store.checkpoint(r.tavern);await gameServer.gracefullyShutdown(false);}
  };
}
