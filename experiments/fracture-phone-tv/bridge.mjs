// Chaos Party / Fracture proof of concept. Local-LAN only; no account credentials.
// Independent from both the original Chaos server and Fracture's Socket.IO server.
import http from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const token = () => randomBytes(24).toString('hex');
const htmlEscape = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = (res, code, value) => {res.writeHead(code, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(value));};
const wrap = (title, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:16px system-ui,sans-serif;background:#151b24;color:#edf1fa;margin:0;padding:28px}main{max-width:600px;margin:auto}a{color:#91c5ff}input,button{font:inherit;padding:15px;border-radius:10px}input{box-sizing:border-box;width:100%;background:#263344;color:#fff;border:1px solid #647386}button{margin-top:14px;background:#a8d6ff;color:#101927;border:0;cursor:pointer;width:100%;font-weight:700}small{color:#aebbd0}.panel{padding:18px;background:#222c3b;border-radius:14px;margin-top:18px;overflow-wrap:anywhere}#status{min-height:22px}</style></head><body><main>${body}</main></body></html>`;
const discoverLan = () => Object.values(os.networkInterfaces()).flat().find(x=>x && x.family==='IPv4' && !x.internal)?.address || 'localhost';

export function createBridge({port=4748, bind='0.0.0.0', fracturePort=8000, clock=()=>Date.now(), tokens=null, lanIp=discoverLan}={}) {
  const secrets=tokens||{host:token(), phone:token(), tv:token()};
  const clients=new Set(); let busyUntil=0; const recent=[]; const outcomes=new Map();
  const roomState=()=>({connectedTv:clients.size>0,readyAt:busyUntil,recent:[...recent]});
  const broadcast=(type,data)=>{for(const res of clients){try{res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);}catch{clients.delete(res);}}};
  const readBody=async req=>{
    let text=''; for await(const chunk of req){text+=chunk.toString('utf8');if(text.length>1600)throw Error('Too large');}
    return JSON.parse(text);
  };
  const server=http.createServer(async(req,res)=>{
    let url;
    try{url=new URL(req.url,'http://localhost');}catch{return json(res,400,{error:'Bad URL'});}
    const pathname=url.pathname;
    if(pathname==='/health' && req.method==='GET')return json(res,200,{ok:true,service:'chaos-fracture-phone-bridge',connectedTv:clients.size>0});
    if(pathname==='/host' && req.method==='GET'){
      if(url.searchParams.get('key')!==secrets.host)return json(res,403,{error:'Invalid host link'});
      const remoteHost=(req.headers.host||'localhost').split(':')[0];
      const livePort=server.address()?.port || port;
      const bridgeOrigin=`http://${remoteHost}:${livePort}`;
      const phoneHost=['localhost','127.0.0.1'].includes(remoteHost)?lanIp():remoteHost;
      const join=`http://${phoneHost}:${livePort}/join?key=${secrets.phone}`;
      const tvOrigin=`http://${remoteHost}:${fracturePort}`;
      const launch=`${tvOrigin}/?chaosBridge=${encodeURIComponent(bridgeOrigin)}&tvKey=${secrets.tv}`;
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
      return res.end(wrap('Chaos Party / Fracture host',`<h1>Chaos Party / Fracture test</h1><p>This is a <b>single-character integration test</b>, not the finished 20-player game.</p><div class="panel"><p>1. Start the modified Fracture game on port ${fracturePort}.</p><p>2. <a href="${htmlEscape(launch)}" target="_blank" rel="noopener">Launch the Fracture TV game</a> and sign in using Fracture's own account screen.</p><p>3. Open this phone-controller link on a phone on the same Wi-Fi:</p><p><a href="${htmlEscape(join)}">${htmlEscape(join)}</a></p><p><small>The TV link is private; don't share it with phone players. No provider key is required.</small></p></div>`));
    }
    if(pathname==='/join' && req.method==='GET'){
      if(url.searchParams.get('key')!==secrets.phone)return json(res,403,{error:'Invalid controller link'});
      res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
      return res.end(wrap('Chaos Party phone controller',`<h1>Chaos Party</h1><p>Type an action for the character shown on TV.</p><form id="f"><input id="action" placeholder="What do you do?" maxlength="180" autocomplete="off" autofocus required><button id="send" type="submit">Send</button></form><div class="panel" id="status" aria-live="polite">Ready.</div><p><small>Test examples: attack the rat; talk to the guard; look around. Other actions are not implemented yet.</small></p><script>const key=${JSON.stringify(secrets.phone)};const f=document.getElementById('f'),a=document.getElementById('action'),s=document.getElementById('status');f.addEventListener('submit',async(e)=>{e.preventDefault();const text=a.value.trim();if(text.length<2)return;s.textContent='Sending…';try{const r=await fetch('/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({key,text})});const v=await r.json();s.textContent=v.error||v.message;if(r.ok){a.value='';for(let i=0;i<18;i++){await new Promise(done=>setTimeout(done,250));const status=await fetch('/result?key='+encodeURIComponent(key)+'&id='+encodeURIComponent(v.id)).then(x=>x.json());if(status.status&&status.status!=='queued'){s.textContent=status.status.toUpperCase()+': '+status.message;break;}}}}catch{s.textContent='Connection failed. Check Wi-Fi and the host.'}})</script>`));
    }
    if(pathname==='/events' && req.method==='GET'){
      if(url.searchParams.get('key')!==secrets.tv)return json(res,403,{error:'Invalid TV pairing'});
      const origin=req.headers.origin;
      if(origin){let parsed;try{parsed=new URL(origin);}catch{return json(res,403,{error:'Invalid origin'});}
        if(parsed.protocol!=='http:'||Number(parsed.port)!==fracturePort||!['localhost','127.0.0.1',discoverLan(),(req.headers.host||'').split(':')[0]].includes(parsed.hostname))return json(res,403,{error:'TV origin not allowed'});
      }
      res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-store','connection':'keep-alive',...(origin?{'access-control-allow-origin':origin,'vary':'Origin'}:{})});
      clients.add(res);res.write(`event: ready\ndata: {"paired":true}\n\n`);
      req.on('close',()=>clients.delete(res));return;
    }
    if(pathname==='/result' && req.method==='GET'){
      if(url.searchParams.get('key')!==secrets.phone)return json(res,403,{error:'Invalid controller pairing'});
      const result=outcomes.get(url.searchParams.get('id'));
      return result?json(res,200,result):json(res,404,{error:'No such action'});
    }
    if(pathname==='/outcome' && req.method==='OPTIONS'){
      const origin=req.headers.origin||'';
      let parsed;try{parsed=new URL(origin);}catch{return json(res,403,{error:'Invalid TV origin'});}
      if(parsed.protocol!=='http:'||Number(parsed.port)!==fracturePort||!['localhost','127.0.0.1',discoverLan(),(req.headers.host||'').split(':')[0]].includes(parsed.hostname))return json(res,403,{error:'TV origin not allowed'});
      res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS','vary':'Origin'});return res.end();
    }
    if(pathname==='/outcome' && req.method==='POST'){
      const origin=req.headers.origin||'';
      let parsed;try{parsed=new URL(origin);}catch{return json(res,403,{error:'Invalid TV origin'});}
      if(parsed.protocol!=='http:'||Number(parsed.port)!==fracturePort||!['localhost','127.0.0.1',discoverLan(),(req.headers.host||'').split(':')[0]].includes(parsed.hostname))return json(res,403,{error:'TV origin not allowed'});
      const headers={'access-control-allow-origin':origin,'vary':'Origin','cache-control':'no-store'};
      let body;try{body=await readBody(req);}catch{return json(res,400,{error:'Invalid outcome'});}
      if(body?.key!==secrets.tv)return json(res,403,{error:'Invalid TV pairing'});
      if(!outcomes.has(body.id)||!['started','blocked','completed'].includes(body.status)||typeof body.message!=='string'||body.message.length>250)return json(res,400,{error:'Invalid action outcome'});
      outcomes.set(body.id,{status:body.status,message:body.message});
      res.writeHead(200,{'content-type':'application/json',...headers});return res.end('{"ok":true}');
    }
    if(pathname==='/action' && req.method==='POST'){
      if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')return json(res,415,{error:'Send JSON'});
      const origin=req.headers.origin;
      if(origin!==undefined && origin!==`http://${req.headers.host}`)return json(res,403,{error:'Invalid controller origin'});
      let body;try{body=await readBody(req);}catch{return json(res,400,{error:'Invalid action'});}
      if(body?.key!==secrets.phone)return json(res,403,{error:'Invalid controller pairing'});
      const text=typeof body.text==='string'?body.text.trim():'';
      if(text.length<2||text.length>180||/[<>\x00-\x08\x0e-\x1f]/.test(text))return json(res,400,{error:'Action must be 2–180 characters'});
      if(!clients.size)return json(res,503,{error:'Open the Fracture game on the TV first'});
      const isStop=/^(?:stop|halt|cancel|stop moving|stop attacking|stop fighting|wait|hold still)[.!]?$/i.test(text);
      if(clock()<busyUntil&&!isStop)return json(res,409,{error:'Another action is resolving. Try again shortly.'});
      busyUntil=isStop?clock():clock()+8000;
      const action={id:randomUUID(),text,at:clock()};recent.push(action);if(recent.length>3)recent.shift();
      outcomes.set(action.id,{status:'queued',message:'Waiting for TV interpreter'});if(outcomes.size>50)outcomes.delete(outcomes.keys().next().value);
      broadcast('action',action);return json(res,202,{ok:true,id:action.id,message:`Received: ${text}. Waiting for TV.`});
    }
    json(res,404,{error:'Not found'});
  });
  return {secrets,server,roomState,async start(){await new Promise((resolve,reject)=>server.once('error',reject).listen(port,bind,resolve));return server.address();},async close(){for(const c of clients)c.end();clients.clear();await new Promise(resolve=>server.close(resolve));}};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.CHAOS_BRIDGE_PORT)||4748;
  const app=createBridge({port});app.start().then(()=>{
    console.log(`Chaos Fracture local bridge: http://localhost:${port}/host?key=${app.secrets.host}`);
    console.log(`For phones on your Wi-Fi, use your Mac's IP: http://${discoverLan()}:${port}/host?key=${app.secrets.host}`);
    console.log('This prototype controls ONE Fracture character; do not expose port to the Internet.');
  }).catch(e=>{console.error(e);process.exitCode=1});
}
