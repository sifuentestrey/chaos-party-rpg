import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
const root=process.cwd(),out=path.join(root,'release','Chaos_Party_Mac');
const downloads=process.env.CHAOS_RUNTIME_DOWNLOADS||path.resolve(root,'../runtime-downloads');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
await build({entryPoints:[path.join(root,'server.mjs')],bundle:true,platform:'node',format:'cjs',target:'node22',outfile:path.join(out,'server.cjs'),logLevel:'warning',external:['bufferutil','utf-8-validate'],define:{'import.meta.url':'undefined','process.env.CHAOS_PREVIEW':'"0"'}});
fs.cpSync(path.join(root,'public'),path.join(out,'public'),{recursive:true,filter:p=>!path.basename(p).startsWith('__qa')&&path.basename(p)!=='release.json'});
for(const arch of ['x64','arm64']){
  const target=path.join(out,'runtime',arch);fs.mkdirSync(target,{recursive:true});
  fs.copyFileSync(path.join(downloads,'darwin-'+arch,'node'),path.join(target,'node'));fs.chmodSync(path.join(target,'node'),0o755);
}
fs.mkdirSync(path.join(out,'licenses'),{recursive:true});
fs.copyFileSync(path.join(downloads,'darwin-x64','LICENSE'),path.join(out,'licenses','Node-LICENSE.txt'));
fs.copyFileSync(path.join(root,'vendor/partyframe/LICENSE'),path.join(out,'licenses','PartyFrame-LICENSE.txt'));
fs.copyFileSync(path.join(root,'public/assets/ninja/LICENSE.txt'),path.join(out,'licenses','Ninja-Adventure-CC0.txt'));
let notices='THIRD-PARTY NOTICES — Chaos Party v0.2\n\n';
const seen=new Set();
function addLicenses(dir){
  if(!fs.existsSync(dir))return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(!e.isDirectory())continue;const pkg=path.join(dir,e.name);
    if(e.name.startsWith('@')){addLicenses(pkg);continue;}
    const meta=path.join(pkg,'package.json');if(!fs.existsSync(meta))continue;const p=JSON.parse(fs.readFileSync(meta));
    if(['esbuild','@esbuild/linux-x64'].includes(p.name))continue;
    const key=p.name+'@'+p.version;if(seen.has(key))continue;seen.add(key);
    const licenseFile=fs.readdirSync(pkg).find(f=>/^licen[cs]e(?:\..*)?$/i.test(f));
    if(licenseFile)notices+=`\n${'='.repeat(70)}\n${key}\n${fs.readFileSync(path.join(pkg,licenseFile),'utf8')}\n`;
    addLicenses(path.join(pkg,'node_modules'));
  }
}
addLicenses(path.join(root,'node_modules'));
notices+='\nPartyFrame — '+fs.readFileSync(path.join(root,'vendor/partyframe/LICENSE'),'utf8');
fs.writeFileSync(path.join(out,'licenses','THIRD_PARTY_NOTICES.txt'),notices);
for(const name of ['README.md','CREDITS.md','TEST_REPORT.md','RESEARCH.md','FOUNDATION_AUDIT.md'])if(fs.existsSync(path.join(root,name)))fs.copyFileSync(path.join(root,name),path.join(out,name));
const launcher=`#!/bin/bash
set -eu
game_dir="$(cd "$(dirname "$0")" && pwd)"
case "$(uname -m)" in
  arm64) game_arch="arm64" ;;
  x86_64) game_arch="x64" ;;
  *) echo "This build supports Intel and Apple Silicon Macs."; read -r -p "Press Return to close."; exit 1 ;;
esac
export CHAOS_LAUNCH=1
export CHAOS_OPEN=1
export CHAOS_DATA_DIR="$HOME/Library/Application Support/Chaos Party"
cd "$game_dir"
if ! "$game_dir/runtime/$game_arch/node" "$game_dir/server.cjs"; then
  echo ""
  echo "The tavern could not start. See the message above."
  read -r -p "Press Return to close."
fi
`;
fs.writeFileSync(path.join(out,'Start Chaos Party.command'),launcher,{mode:0o755});
fs.writeFileSync(path.join(out,'START_HERE.txt'),'CHAOS PARTY — FIRST PLAYABLE PROTOTYPE\n\n1. Double-click Start Chaos Party.command.\n2. Choose Host a party, then Create a private room.\n3. Show the browser on your TV. Friends join by scanning the QR on the same Wi-Fi.\n4. Start the heist when everyone has a character.\n\nNo installation, account, internet connection, or paid service is needed. Keep the launcher window open while playing.\n\nIf macOS blocks the downloaded launcher, right-click it and choose Open. Review Privacy & Security if your macOS version requires confirmation. Allow local network access for phones.\n\nRead README.md for recovery, troubleshooting, and honest test limits.\n');
console.log(JSON.stringify({release:out,files:fs.readdirSync(out),thirdPartyNotices:seen.size}));
