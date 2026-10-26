import {Client} from 'colyseus.js';
export async function observe(room){
  const pending=new Map();let seq=0;
  room.onMessage('welcome',()=>{});room.onMessage('controller-state',()=>{});room.onMessage('game-event',()=>{});room.onMessage('error',()=>{});room.onMessage('clock-pong',()=>{});
  room.onMessage('chaos-reply',d=>{const p=pending.get(d.id);if(p){clearTimeout(p.timer);pending.delete(d.id);p.resolve(d);}});
  const request=(name,data={})=>new Promise((resolve,reject)=>{const id='test-rpc-'+(++seq);pending.set(id,{resolve,timer:setTimeout(()=>{pending.delete(id);reject(new Error('RPC timeout: '+name));},7000)});room.send('chaos-rpc',{id,name,data});});
  const identity=await request('whoami');return {room,request,identity};
}
export async function createHost(app,options={}){const room=await new Client('http://127.0.0.1:'+app.port).create('party',{role:'host',hostKey:app.hostKey,reactionMs:4000,...options});return observe(room);}
export async function joinPlayer(app,roomId,profile,extra={}){const room=await new Client('http://127.0.0.1:'+app.port).joinById(roomId,{role:'controller',profile,...extra});return observe(room);}
export const pause=ms=>new Promise(r=>setTimeout(r,ms));
