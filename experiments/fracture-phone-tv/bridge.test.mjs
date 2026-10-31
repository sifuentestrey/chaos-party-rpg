import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridge} from './bridge.mjs';

async function setup(t){
  let now=1000;
  const app=createBridge({port:0,bind:'127.0.0.1',clock:()=>now,tokens:{host:'host',phone:'phone',tv:'tv'},lanIp:()=> '192.168.5.22'});
  await app.start(); t.after(()=>app.close());
  return {app,base:`http://127.0.0.1:${app.server.address().port}`,setTime:v=>now=v};
}
const post=(base,data,headers={})=>fetch(`${base}/action`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)});

test('host and phone pairing secrets are independent', async t=>{
 const {base}=await setup(t);
 assert.equal((await fetch(`${base}/host?key=phone`)).status,403);
 const host=await fetch(`${base}/host?key=host`);
 assert.equal(host.status,200);
 const hostHtml=await host.text();
 assert.match(hostHtml,new RegExp('http://192\\.168\\.5\\.22:'+new URL(base).port+'/join'));
 assert.match(hostHtml,/http:\/\/127\.0\.0\.1:8000/);
 assert.equal((await fetch(`${base}/join?key=host`)).status,403);
 assert.equal((await fetch(`${base}/join?key=phone`)).status,200);
 assert.equal((await fetch(`${base}/events?key=phone`)).status,403);
 assert.equal((await post(base,{key:'host',text:'attack goblin'})).status,403);
});

test('no action accepted when TV is absent',async t=>{
 const {base}=await setup(t);
 assert.equal((await post(base,{key:'phone',text:'attack goblin'})).status,503);
});

test('valid TV event stream gets exactly one action and lock prevents spam',async t=>{
 const {base,app,setTime}=await setup(t);
 const abort=new AbortController();
 const events=fetch(`${base}/events?key=tv`,{signal:abort.signal,headers:{Origin:'http://localhost:8000'}});
 const r=await events;
 assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'http://localhost:8000');
 const reader=r.body.getReader();
 const welcome=new TextDecoder().decode((await reader.read()).value);
 assert.match(welcome,/event: ready/);
 assert.equal((await post(base,{key:'phone',text:'tackle the goblin'})).status,202);
 assert.equal((await post(base,{key:'phone',text:'tackle the goblin'})).status,409);
 const payload=new TextDecoder().decode((await reader.read()).value);
 assert.match(payload,/event: action/);assert.match(payload,/tackle the goblin/);
 assert.equal(app.roomState().recent.length,1);
 setTime(9001);
 assert.equal((await post(base,{key:'phone',text:'talk to the guard'})).status,202);
 await reader.cancel();abort.abort();
});

test('remote website cannot hijack TV events or submit browser action',async t=>{
 const {base}=await setup(t);
 assert.equal((await fetch(`${base}/events?key=tv`,{headers:{Origin:'https://bad.example:8000'}})).status,403);
 assert.equal((await post(base,{key:'phone',text:'tackle goblin'},{Origin:'http://bad.example:3000'})).status,403);
 assert.equal((await post(base,{key:'phone',text:'x'})).status,400);
 assert.equal((await post(base,{key:'phone',text:'<img src=x onerror=alert(1)>'})).status,400);
});

test('STOP bypasses action lock and interpreter results distinguish queued from started or blocked', async t=>{
 const {base}=await setup(t);
 const controller=new AbortController();
 const event=await fetch(`${base}/events?key=tv`,{signal:controller.signal,headers:{Origin:'http://localhost:8000'}});
 assert.equal(event.status,200);
 const reader=event.body.getReader(); await reader.read();
 const attack=await post(base,{key:'phone',text:'attack the rat'});
 assert.equal(attack.status,202);
 const a=await attack.json();
 assert.equal((await (await fetch(`${base}/result?key=phone&id=${a.id}`)).json()).status,'queued');
 assert.equal((await post(base,{key:'phone',text:'move left'})).status,409);
 const stop=await post(base,{key:'phone',text:'stop'});
 assert.equal(stop.status,202);
 const s=await stop.json();
 assert.equal((await post(base,{key:'phone',text:'move left'})).status,202);
 assert.equal((await fetch(`${base}/result?key=host&id=${s.id}`)).status,403);
 assert.equal((await fetch(`${base}/outcome`,{method:'POST',headers:{'content-type':'application/json',Origin:'https://evil.example:8000'},body:JSON.stringify({key:'tv',id:s.id,status:'started',message:'Stopped'})})).status,403);
 assert.equal((await fetch(`${base}/outcome`,{method:'POST',headers:{'content-type':'application/json',Origin:'http://localhost:8000'},body:JSON.stringify({key:'host',id:s.id,status:'started',message:'Stopped'})})).status,403);
 const outcome=await fetch(`${base}/outcome`,{method:'POST',headers:{'content-type':'application/json',Origin:'http://localhost:8000'},body:JSON.stringify({key:'tv',id:s.id,status:'started',message:'Stopping your character.'})});
 assert.equal(outcome.status,200);
 assert.deepEqual(await (await fetch(`${base}/result?key=phone&id=${s.id}`)).json(),{status:'started',message:'Stopping your character.'});
 assert.equal((await fetch(`${base}/outcome`,{method:'OPTIONS',headers:{Origin:'http://localhost:8000','access-control-request-method':'POST','access-control-request-headers':'content-type'}})).status,204);
 await reader.cancel();controller.abort();
});
