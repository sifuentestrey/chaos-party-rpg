/** Small local-only launcher for the Mac game-night flow. */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {pathToFileURL} from 'node:url';
import qrcode from './vendor/qrcode.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qrSvg=url=>{const code=qrcode(0,'M');code.addData(url);code.make();return code.createSvgTag({cellSize:4,margin:16,scalable:true});};
const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
const readBody=async req=>{let text='';for await(const chunk of req)text+=chunk;return text?JSON.parse(text):{};};

const launchMarkup=()=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chaos Party</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(ellipse at top,#30483d,#121b1c 65%);color:#f2eadb;font:18px system-ui}main{width:min(680px,calc(100% - 32px));padding:34px 28px;background:#182827e8;border:1px solid #c3a76055;border-radius:22px;box-shadow:0 18px 60px #0007;text-align:center}h1{margin:0 0 8px;font:600 42px Georgia,serif;color:#edc57d}p{color:#cbd5ca;line-height:1.5}.subtle{font-size:14px;color:#aab9ae}button{width:100%;min-height:62px;padding:14px 20px;border:0;border-radius:13px;background:#e7bf79;color:#17231e;font:700 22px system-ui;cursor:pointer}button:disabled{opacity:.6;cursor:wait}#stop{margin-top:18px;background:#2d413b;border:1px solid #9b766c;color:#f1c9bd;font-size:16px;min-height:44px}#status{min-height:28px;margin:18px 0 4px;color:#ecd8aa}#join{display:grid;grid-template-columns:180px 1fr;gap:22px;align-items:center;margin-top:24px;padding:18px;text-align:left;background:#20342fe6;border:1px solid #b79e5d55;border-radius:15px}#qr{width:180px;background:#fff;padding:7px}#qr svg{display:block;width:100%;height:auto}#code{font:700 34px Georgia,serif;letter-spacing:7px;color:#efc879;white-space:nowrap}#join p{font-size:15px;margin:9px 0}.error{color:#ffb9ad!important}@media(max-width:520px){main{padding:28px 18px}h1{font-size:34px}#join{grid-template-columns:1fr;text-align:center}#qr{margin:auto}#code{font-size:28px}}
</style></head><body><main><h1>Chaos Party</h1><p>Fantasy adventure on the Fracture world. Your TV is the shared story; phones are the controllers.</p><button id="start">Start game</button><p id="status" role="status" aria-live="polite">Ready when you are.</p><section id="join" hidden><div id="qr"></div><div><strong>Join on every phone</strong><div id="code"></div><p>Scan the code, or open the local phone page and enter it. Phones must use the same Wi-Fi.</p><p id="phone" class="subtle"></p></div></section><button id="stop" hidden>Stop game</button><p class="subtle">The game runs privately on this Mac. No account or internet service is required.</p></main><script>
let tvWindow=null,latest=null;const start=document.getElementById('start'),stop=document.getElementById('stop'),status=document.getElementById('status'),join=document.getElementById('join'),qr=document.getElementById('qr'),code=document.getElementById('code'),phone=document.getElementById('phone');
function paint(v){latest=v;status.textContent=v.status==='idle'?'Ready when you are.':v.status==='starting'?'Preparing the local game…':v.status==='running'?'Game ready — the TV is opening.':v.error||'The local game could not start.';status.className=v.status==='error'?'error':'';start.disabled=v.status==='starting'||v.status==='running';stop.hidden=v.status!=='running';join.hidden=v.status!=='running';if(v.status==='running'){code.textContent=v.roomCode||'';qr.innerHTML=v.qr||'';try{phone.textContent=v.phoneUrl?'Phone page: '+new URL(v.phoneUrl).origin+'/join':'';}catch{phone.textContent='';}if(v.tvUrl){if(tvWindow&&!tvWindow.closed)tvWindow.location=v.tvUrl;else window.open(v.tvUrl,'_blank','noopener');}}}
async function refresh(){try{const r=await fetch('/state');paint(await r.json());}catch{status.textContent='The local launcher is unavailable. Close this page and double-click Start again.';status.className='error';}}
start.onclick=async()=>{tvWindow=window.open('about:blank','_blank');try{const r=await fetch('/start',{method:'POST'});paint(await r.json());if(latest?.status==='starting'){const timer=setInterval(async()=>{await refresh();if(['running','error'].includes(latest?.status))clearInterval(timer);},500);}}catch{paint({status:'error',error:'The local launcher is unavailable. Close this page and double-click Start again.'});}};
stop.onclick=async()=>{try{const r=await fetch('/stop',{method:'POST'});paint(await r.json());}catch{paint({status:'error',error:'The local game could not be stopped cleanly.'});}};refresh();
</script></main></body></html>`;

/** Create the local start page. Tests inject startGame so no native checkout is touched. */
export function createLaunchPage({startGame=async()=>{throw Error('No local game starter configured.');},stopGame=async()=>{},port=4747,bind='127.0.0.1'}={}){
 let state={status:'idle',roomCode:null,tvUrl:null,phoneUrl:null,qr:null,error:null};let activeStop=null,starting=null;
 const publicState=()=>({...state});
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'content-type':'text/html','cache-control':'no-store'});return res.end(launchMarkup());}
  if(req.method==='GET'&&url.pathname==='/state')return json(res,200,publicState());
  if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{ok:true,status:state.status});
  if(req.method==='POST'&&url.pathname==='/start'){
   if(state.status==='running'||state.status==='starting')return json(res,202,publicState());
   state={status:'starting',roomCode:null,tvUrl:null,phoneUrl:null,qr:null,error:null};
   starting=Promise.resolve().then(()=>startGame()).then(info=>{activeStop=info?.stop||stopGame;state={status:'running',roomCode:info?.roomCode||null,tvUrl:info?.tvUrl||null,phoneUrl:info?.phoneUrl||null,qr:info?.phoneUrl?qrSvg(info.phoneUrl):null,error:null};return state;}).catch(error=>{state={status:'error',roomCode:null,tvUrl:null,phoneUrl:null,qr:null,error:'The local game could not start. Check that the Mac is on the same network and try again.'};return state;}).finally(()=>{starting=null;});
   return json(res,202,publicState());
  }
  if(req.method==='POST'&&url.pathname==='/stop'){
   if(starting){await starting.catch(()=>{});}
   if(activeStop)await activeStop();else await stopGame();
   activeStop=null;state={status:'idle',roomCode:null,tvUrl:null,phoneUrl:null,qr:null,error:null};return json(res,200,publicState());
  }
  await readBody(req);return json(res,404,{error:'Not found'});
 }catch(error){return json(res,400,{error:error.message||'Invalid request'});}});
 return {server,state:publicState,start:()=>new Promise((resolve,reject)=>server.once('error',reject).listen(port,bind,resolve)),async close(){if(starting)await starting.catch(()=>{});if(activeStop)await activeStop();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}

function waitForFile(file,child,timeoutMs=10*60*1000){return new Promise((resolve,reject)=>{const began=Date.now();const poll=setInterval(()=>{if(fs.existsSync(file)){clearInterval(poll);try{resolve(JSON.parse(fs.readFileSync(file,'utf8')));}catch(error){reject(error);}return;}if(child.exitCode!==null){clearInterval(poll);reject(Error('The game process exited before it was ready.'));}if(Date.now()-began>timeoutMs){clearInterval(poll);reject(Error('The game took too long to start.'));}},250);});}
async function startWorker(worker){
 const metadata=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'chaos-launch-')),'ready.json');
 const child=spawn('bash',[worker],{detached:true,stdio:'ignore',env:{...process.env,CHAOS_HEADLESS:'1',CHAOS_NO_BROWSER:'1',CHAOS_LAUNCH_METADATA:metadata}});
 try{
  const info=await waitForFile(metadata,child);
  return {...info,stop:async()=>{
   try{process.kill(-child.pid,'SIGTERM');}catch{try{child.kill('SIGTERM');}catch{}}
   if(child.exitCode===null)try{await once(child,'exit');}catch{}
   fs.rmSync(path.dirname(metadata),{recursive:true,force:true});
  }};
 }catch(error){
  try{process.kill(-child.pid,'SIGTERM');}catch{try{child.kill('SIGTERM');}catch{}}
  fs.rmSync(path.dirname(metadata),{recursive:true,force:true});
  throw error;
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const worker=process.argv[2]||process.env.CHAOS_WORKER;const page=createLaunchPage({startGame:()=>worker?startWorker(worker):Promise.reject(Error('Start entry is unavailable.'))});page.start().then(()=>{let stopping=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(stopping)return;stopping=true;await page.close();process.exit(0);});}).catch(error=>{console.error(error.message);process.exit(1);});}
