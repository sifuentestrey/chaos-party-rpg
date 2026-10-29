// Apply only to a separate, disposable clone of the pinned Fracture project.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=process.argv[2];
if(!root)throw new Error('Usage: node apply-overlay.mjs /path/to/separate-Fracture-clone');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(pkg.name!=='fracture')throw new Error('Refusing to patch non-Fracture repository');
const dir=path.dirname(fileURLToPath(import.meta.url));
const mainFile=path.join(root,'client/ts/main.ts'),remoteFile=path.join(root,'client/ts/chaos-remote.ts');
const current=fs.readFileSync(mainFile,'utf8');
const anchor='  game.onGameStart(function () {';
const importLine="import {startChaosRemote} from './chaos-remote';\n";
if(!current.includes(anchor))throw new Error('Upstream game entry point changed; review integration before editing');
const alreadyPatched=current.includes('startChaosRemote(game)') && current.startsWith(importLine);
if(current.includes('startChaosRemote')&&!alreadyPatched)throw new Error('Unknown existing patch; refusing to overwrite');
if(fs.existsSync(remoteFile)){
  const owned=fs.readFileSync(remoteFile,'utf8');
  if(!alreadyPatched || !owned.startsWith('/**\n * Chaos Party -> Fracture experimental TV-side adapter.'))throw new Error('Unrecognized adapter file; refusing overwrite');
}
if(alreadyPatched&&!fs.existsSync(remoteFile))throw new Error('Patched entry point without adapter file; refusing unsafe repair');
const sampleConfig=path.join(root,'server/config.example.json');
const localConfig=path.join(root,'server/config.json');
if(!fs.existsSync(localConfig)){
  if(!fs.existsSync(sampleConfig))throw new Error('Upstream example server config missing; cannot boot safely');
  fs.copyFileSync(sampleConfig,localConfig); // No credential or paid-AI setup, ignored by upstream Git.
}
fs.copyFileSync(path.join(dir,'chaos-remote.ts'),remoteFile);
if(!alreadyPatched){
  fs.writeFileSync(mainFile,importLine+current.replace(anchor,anchor+'\n    startChaosRemote(game);'));
}
console.log(alreadyPatched?'Refreshed existing isolated Fracture TV adapter; original Chaos code untouched.':'Isolated Fracture TV adapter patched; original Chaos code untouched.');
