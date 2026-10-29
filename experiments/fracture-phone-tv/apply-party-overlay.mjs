// Reviewed, repeatable overlay for the pinned separate Fracture checkout only.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(process.argv[2]||'.'), dir=path.dirname(fileURLToPath(import.meta.url));
if(JSON.parse(fs.readFileSync(path.join(root,'package.json'))).name!=='fracture')throw Error('Not Fracture');
if(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!=='642c00a8a2d3a95979e85bbfa3f62deee611a4a6')throw Error('Wrong upstream version');
const manifestPath=path.join(root,'.chaos-overlay.json');
const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
const digest=s=>createHash('sha256').update(s).digest('hex');
const patches=[
 ['server/ts/main.ts',"import {Player} from './player';", "import {Player} from './player';\nimport {installChaosActor} from './chaos-actor';", 'world.connectCallback(new Player(connection, world));','const player = new Player(connection, world);\n                    installChaosActor(player, connection);\n                    world.connectCallback(player);'],
 ['client/ts/main.ts',"import {App} from './app';","import {App} from './app';\nimport {startChaosTV, bootChaosTV} from './chaos-tv';",'  game.onGameStart(function () {','  game.onGameStart(function () {\n    startChaosTV(game);']
];
patches.push(
 ['client/ts/utils/storage.ts','  data: any;',"  data: any;\n  storageKey = new URLSearchParams(window.location.search).has('chaosTV') ? 'chaosTVData' : 'data';",'localStorage.data','localStorage[this.storageKey]'],
 ['server/ts/player/message-router.ts',"const key = rateLimit === 'auth' ? player.clientIp : String(player.id);","const trustedChaos = (player as any).chaosControlled || (player as any).chaosSpectator;\n    const key = rateLimit === 'auth' ? (trustedChaos ? 'chaos:' + player.id : player.clientIp) : String(player.id);","case 'auth':","case 'auth':"],
 ['client/ts/network/gameclient.ts', 'this.connection = io(url, {', "this.connection = io(url, {\n      auth: {chaosTVKey: new URLSearchParams(location.search).has('chaosTV') ? new URLSearchParams(location.search).get('tvKey') : undefined},", 'reconnection: true,','reconnection: true,'],
 ['server/ts/player/auth.handler.ts','  player.updatePosition();\n\n  // Set spawn protection', `  player.updatePosition();
  // Only bridge-authenticated experimental actors resume their real saved position.
  // Normal Fracture login and the native death/respawn path remain unchanged.
  if ((player as any).chaosControlled) {
    const saved = characterExists ? storage.loadPlayerState(player.name)?.character : null;
    if (saved && world.isValidPosition(saved.x, saved.y)) player.setPosition(saved.x, saved.y);
    if (!characterExists) {
      const leader = (Object.values(world.players) as any[]).find(p => p.chaosControlled && p.hasEnteredGame && !p.isDead);
      if (leader) {
        const offsets: number[][] = [];for(let r=1;r<=5;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(Math.max(Math.abs(dx),Math.abs(dy))===r)offsets.push([dx,dy]);
        const occupied = new Set((Object.values(world.entities) as any[]).filter(e=>e.type!=='item').map(e=>e.x+','+e.y));
        const spot = offsets.map(([dx,dy])=>({x:leader.x+dx,y:leader.y+dy})).find(p=>world.isValidPosition(p.x,p.y)&&!occupied.has(p.x+','+p.y));
        if (spot) player.setPosition(spot.x,spot.y);
      }
    }
  }

  // Set spawn protection`,'  player.orientation = Utils.randomOrientation();','  player.orientation = Utils.randomOrientation();'],
 ['server/ts/world.ts','new AIPlayerManager(this, 5)','new AIPlayerManager(this, process.env.CHAOS_ACTOR_KEY ? 0 : 5)','this.aiPlayerManager.start();','this.aiPlayerManager.start();'],
 ['client/ts/audio.ts','music.play();','void music.play().catch(() => {});','sound.play();','void sound.play().catch(() => {});'],
 ['client/index.html','<script\n    src="https://code.jquery.com/jquery-2.2.4.min.js"\n    integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44="\n    crossorigin="anonymous"></script>','<script src="lib/jquery.min.js"></script>','<script src="lib/anime.umd.min.js"></script>','<script src="lib/anime.umd.min.js"></script>'],
 ['webpack.config.js',"{ from: 'client/lib/anime.umd.min.js', to: 'lib/anime.umd.min.js' },","{ from: 'client/lib/anime.umd.min.js', to: 'lib/anime.umd.min.js' },\n          { from: 'node_modules/jquery/dist/jquery.min.js', to: 'lib/jquery.min.js' },", "title: 'Fate of the Four'", "title: 'Chaos Party — Fracture beta'"]
);
// Preflight all files before writing any source. Accept only pristine or exactly our patch.
const writes=[];
for(const [file,a,b,c,d] of patches){
 const upstream=execFileSync('git',['show',`HEAD:${file}`],{cwd:root,encoding:'utf8'});
 if(!upstream.includes(a)||!upstream.includes(c))throw Error(`Anchor missing: ${file}`);
 let patched=upstream.replace(a,b).replace(c,d);
 if(file==='client/ts/utils/storage.ts')patched=patched.replaceAll('localStorage.data','localStorage[this.storageKey]');
 if(file==='client/ts/audio.ts')patched=patched.replace('music.sound.play();','void music.sound.play().catch(() => {});');
 if(file==='client/ts/main.ts')patched=patched.replace('    app = new App();','    app = new App();\n    bootChaosTV(app);');
 const current=fs.readFileSync(path.join(root,file),'utf8');
 // Allow only the previous isolated adapter's precisely known entrypoint patch.
 const legacy="import {startChaosRemote} from './chaos-remote';\n"+upstream.replace('  game.onGameStart(function () {','  game.onGameStart(function () {\n    startChaosRemote(game);');
 if(current!==upstream&&current!==patched&&current!==legacy&&previous[file]!==digest(current))throw Error(`Local source edits in ${file}; refusing overwrite`);
 writes.push([file,patched]);
}
for(const [source,dest] of [['chaos-actor.test.ts','server/ts/__tests__/chaos-actor.test.ts'],['chaos-actor.ts','server/ts/chaos-actor.ts'],['action-contract.ts','server/ts/chaos-action-contract.ts'],['chaos-tv.ts','client/ts/chaos-tv.ts']]){
 const p=path.join(root,dest);
 if(fs.existsSync(p)&&!fs.readFileSync(p,'utf8').startsWith('/** Chaos-owned'))throw Error(`Unrecognized ${dest}`);
 writes.push([dest,fs.readFileSync(path.join(dir,source),'utf8')]);
}
for(const [file,content] of writes)fs.writeFileSync(path.join(root,file),content);
fs.writeFileSync(manifestPath,JSON.stringify(Object.fromEntries(writes.map(([file,content])=>[file,digest(content)]))));
const config=path.join(root,'server/config.json');
if(!fs.existsSync(config))fs.copyFileSync(path.join(root,'server/config.example.json'),config);
console.log('Pinned Chaos party overlay applied. Config and saves preserved.');
