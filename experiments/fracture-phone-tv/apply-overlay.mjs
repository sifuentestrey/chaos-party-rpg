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
if(current.includes('startChaosRemote'))throw new Error('Already applied; use a clean upstream checkout');
if(fs.existsSync(remoteFile))throw new Error('Existing adapter file; refusing overwrite');
fs.copyFileSync(path.join(dir,'chaos-remote.ts'),remoteFile);
fs.writeFileSync(mainFile,importLine+current.replace(anchor,anchor+'\n    startChaosRemote(game);'));
console.log('Isolated Fracture TV adapter patched; original Chaos code untouched.');
