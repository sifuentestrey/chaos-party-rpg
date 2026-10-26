// Single-process entry point. PartyFrame/Colyseus owns the live game runtime.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGameServer} from './src/game-server.mjs';
export {createGameServer};

const isEntry=process.argv[1]&&(typeof __filename==='string'?path.resolve(process.argv[1])===__filename:typeof import.meta.url==='string'&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url));
if(process.env.CHAOS_LAUNCH==='1'||isEntry) {
  const openBrowser=async url=>{if(process.env.CHAOS_OPEN!=='1')return;const {spawn}=await import('node:child_process');if(process.platform==='darwin')spawn('open',[url],{stdio:'ignore'}).unref();else if(process.platform==='win32')spawn('cmd',['/c','start','',url],{stdio:'ignore'}).unref();};
  const launch=async()=>{
    const portIndex=process.argv.indexOf('--port');
    const requestedPort=process.env.PORT || (portIndex>=0?process.argv[portIndex+1]:null);
    if(!requestedPort){
      // Repeated double-clicks reopen an existing tavern rather than starting competing writers.
      try{const live=await fetch('http://localhost:4747/health',{signal:AbortSignal.timeout(600)}).then(r=>r.json());if(live.service==='chaos-party'&&live.ok){console.log('The tavern is already open: http://localhost:4747/host');await openBrowser('http://localhost:4747/host');return;}}catch{}
    }
    let app;
    for(let attempt=0;attempt<10;attempt++){
      if(attempt>0&&!requestedPort){try{const live=await fetch(`http://localhost:${4747+attempt}/health`,{signal:AbortSignal.timeout(600)}).then(r=>r.json());if(live.service==='chaos-party'&&live.ok){const url=`http://localhost:${4747+attempt}/host`;console.log('The tavern is already open: '+url);await openBrowser(url);return;}}catch{}}
      try{app=await createGameServer({port:requestedPort?Number(requestedPort):4747+attempt});break;}
      catch(e){if(e.code!=='EADDRINUSE'||requestedPort)throw e;}
    }
    if(!app)throw new Error('Could not find an available local port. Close another running copy and try again.');
    const url=`http://localhost:${app.port}/host`;
    console.log('\n  CHAOS PARTY — THE TIPSY WYVERN\n\n  Host screen: '+url+'\n  Phones: scan the QR on the host screen.\n  Keep this window open while playing. Press Control+C to save and stop.\n');
    await openBrowser(url);
    let stopping=false;
    const stop=async()=>{if(stopping)return;stopping=true;await app.close();process.exit(0);};
    process.on('SIGINT',stop);process.on('SIGTERM',stop);
  };
  launch().catch(e=>{console.error('Could not start the tavern:',e.code==='EADDRINUSE'?'That port is in use. If the game is already running, open its host screen. Otherwise close the conflicting app and try again.':e.message);process.exitCode=1;});
}
