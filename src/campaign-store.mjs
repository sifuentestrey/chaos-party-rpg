import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';

export function openCampaignStore(dataDir) {
  fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
  const filename=path.join(dataDir,'campaigns.json'),keyfile=path.join(dataDir,'host-key');
  const hostKey=fs.existsSync(keyfile)?fs.readFileSync(keyfile,'utf8').trim():randomBytes(32).toString('hex');
  if(!fs.existsSync(keyfile))fs.writeFileSync(keyfile,hostKey,{mode:0o600});
  let rooms={};
  if(fs.existsSync(filename)){
    const data=JSON.parse(fs.readFileSync(filename,'utf8'));
    if(data.version!==1||!data.rooms||typeof data.rooms!=='object')throw new Error('Unsupported campaign file. Your saved file was preserved.');
    rooms=data.rooms;
  }
  const persist=()=>{
    const tmp=filename+'.tmp',fd=fs.openSync(tmp,'w',0o600);
    try{fs.writeFileSync(fd,JSON.stringify({version:1,rooms}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    fs.renameSync(tmp,filename);
  };
  return {hostKey,rooms,
    checkpoint(room){const previous=rooms[room.code];rooms[room.code]=structuredClone(room);try{persist();}catch(e){if(previous)rooms[room.code]=previous;else delete rooms[room.code];throw e;}},
    list(){return Object.values(rooms).sort((a,b)=>b.updatedAt-a.updatedAt).map(r=>({code:r.code,phase:r.phase,players:r.players.length,round:r.round,updatedAt:r.updatedAt}));}
  };
}
