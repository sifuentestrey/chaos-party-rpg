// Reviewed, repeatable overlay for the pinned separate Fracture checkout only.
import fs from 'node:fs';
import {discoverNativeObjects} from './native-scenery.mjs';
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
    await (player as any).chaosPrepareWorld?.();
    const saved = characterExists ? storage.loadPlayerState(player.name)?.character : null;
    if (saved && world.isValidPosition(saved.x, saved.y)) player.setPosition(saved.x, saved.y);
    if (!characterExists) {
      const leader = (Object.values(world.players) as any[]).find(p => p.chaosControlled && p.hasEnteredGame && !p.isDead);
      if (leader) {
        const activeArea = (world as any).chaosPacing?.enabled ? (world as any).chaosPacing.area : null;\n        const reachable = (leader as any).chaosSpawnTiles?.(activeArea);\n        const offsets: number[][] = [];for(let r=1;r<=(activeArea?Math.max(activeArea.width,activeArea.height):5);r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(Math.max(Math.abs(dx),Math.abs(dy))===r)offsets.push([dx,dy]);
        const occupied = new Set((Object.values(world.entities) as any[]).filter(e=>e.type!=='item').map(e=>e.x+','+e.y));
        const spot = offsets.map(([dx,dy])=>({x:leader.x+dx,y:leader.y+dy})).find(p=>world.isValidPosition(p.x,p.y)&&!occupied.has(p.x+','+p.y)&&(!reachable||reachable.has(p.x+','+p.y))&&(!activeArea||(p.x>=activeArea.x&&p.x<activeArea.x+activeArea.width&&p.y>=activeArea.y&&p.y<activeArea.y+activeArea.height&&world.zoneManager.getZoneAt(p.x,p.y)?.name===activeArea.zone)));
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
// Shared TV camera owns its viewport; all ordinary camera instances default off.
patches.push(
 ['client/ts/renderer/camera.ts','  private viewportFixed: boolean = false;','  chaosSharedOwned = false;\n  private viewportFixed: boolean = false;','  setPosition(x, y) {','  setPosition(x, y) {\n    if (this.chaosSharedOwned) return;'],
 ['client/ts/world/zoning-manager.ts','  startZoningFrom(x: number, y: number): void {','  startZoningFrom(x: number, y: number): void {\n    if (this.context?.camera.chaosSharedOwned) return;','  isZoning(): boolean {','  cancelForSharedCamera(): void {\n    this.zoningMachine.cancel();\n    this.zoningQueue = [];\n    this.zoningOrientation = null;\n  }\n\n  isZoning(): boolean {'],
 ['client/ts/game.ts','if (this.player && !this.isZoning() && !this.camera.isVisible(this.player)) {','if (!this.camera.chaosSharedOwned && this.player && !this.isZoning() && !this.camera.isVisible(this.player)) {','    this.zoningManager?.onViewportResize();','    this.zoningManager?.onViewportResize((this as any).__chaosTV ? this.camera : undefined);\n    if (sharedCameraOwned) (this as any).__chaosSceneCamera?.resize();']
);
// Upstream sword1 points at platearmor and paints a helmet over every outfit.
patches.push(['client/ts/sprites.ts',"const sword1 = require('../sprites/platearmor.json');","const sword1 = require('../sprites/sword1.json');",'  sword1,','  sword1,']);
patches.push(['server/ts/player/skill.handler.ts','if (!hasUnlockedSkill(skillId as SkillId, ctx.level)) {','if (!hasUnlockedSkill(skillId as SkillId, ctx.level) && !((ctx as any).chaosControlled && (ctx as any).chaosSignatureSkill === skillId)) {','const success = executeSkill(ctx, skill);','const success = executeSkill(ctx, skill);']);
// Experimental pacing hooks. No hook is active in an ordinary Fracture world.
const pacingEdits={
 'client/ts/game.ts':[['if (this.getEntityById(t.id)) { // does it still exist?', 'if (this.entities[t.id]) { // does it still exist?']],
 'client/ts/audio.ts':[
  ['  loadMusic(name, handleLoaded?): void {', "  loadMusic(name, handleLoaded?): void {\n    if (typeof window !== 'undefined' && window.location && new URLSearchParams(window.location.search).has('chaosTV') && !"+JSON.stringify(fs.existsSync(path.join(root,'client/audio/music'))?fs.readdirSync(path.join(root,'client/audio/music')).filter(name=>/\.(mp3|ogg)$/.test(name)):[])+".includes(name + '.' + this.extension)) { handleLoaded?.(); return; }"]],

 'server/ts/ws.ts':[
  ["import express from 'express';", "import express from 'express';\nimport * as fs from 'fs';"],
  ["    app.use(express.static(clientPath, { maxAge: 300000, etag: true }));", "    if (process.env.CHAOS_ACTOR_KEY) {\n      const indexFile = path.join(clientPath, 'index.html');\n      const build = String(fs.statSync(path.join(clientPath, 'main.js')).mtimeMs);\n      const html = fs.readFileSync(indexFile, 'utf8').replace(/main\\.js(?=['\"])/g, 'main.js?chaosBuild=' + build);\n      app.get(['/', '/index.html'], (_req, res) => { res.type('html').set('Cache-Control', 'no-store').send(html); });\n    }\n    app.use(express.static(clientPath, { maxAge: 300000, etag: true, setHeaders: (res, file) => { if (process.env.CHAOS_ACTOR_KEY && /\\.(?:js|html)$/.test(file)) res.setHeader('Cache-Control', 'no-cache'); } }));"]],

 'client/ts/renderer/sprite.ts':[
  ['      spriteData.data = data;', '      // ImageData.data is readonly; its pixel buffer was changed in place.'],
  ['    finalData.data = fdata;', '    // The silhouette pixel buffer is already updated in place.'],
  ['  whiteSprite;', '  whiteSprite;\n  chaosHurtPending = false;'],
  ['  createHurtSprite() {', "  createHurtSprite() {\n    if (!this.image?.width || !this.image?.height) {\n      if (this.image && !this.chaosHurtPending) {\n        this.chaosHurtPending = true;\n        this.image.addEventListener('load', () => { this.chaosHurtPending = false; this.createHurtSprite(); }, {once:true});\n      }\n      return;\n    }"]],

 'server/ts/player/auth.handler.ts':[['  player.hasEnteredGame = true;', '  player.hasEnteredGame = true;\n  (player as any).chaosStartPacing?.();']],
 'server/ts/entity.ts':[['  setPosition(x: number, y: number): void {', '  setPosition(x: number, y: number): void {\n    const entity = this as any, world = entity.getWorld?.() || entity.chaosWorld;\n    if (world?.chaosPacing?.paused && !entity.chaosSpectator && (entity.type === \'mob\' || entity.type === \'player\' && entity.hasEnteredGame)) return;']],
 'server/ts/player/message-router.ts':[
  ['const action = parseInt(message[0]);', "const action = parseInt(message[0]);\n    const pacing = (player.getWorld?.() as any)?.chaosPacing;\n    if (pacing?.enabled && !pacing.allowMessage(player, message)) return false;"]],
 'server/ts/world/game-loop.ts':[
  ['  private ups = 50;', '  chaosCanSimulate?: () => boolean;\n  private ups = 50;'],
  ['    // Regeneration timer', '    if (this.chaosCanSimulate?.() === false) return;\n\n    // Regeneration timer']],
 'server/ts/world.ts':[
  ['  addMob(mob: Mob) {','  addMob(mob: Mob) {\n    (mob as any).chaosWorld = this;'],
  ['  addItem(item: Item) {','  addItem(item: Item) {\n    (item as any).chaosWorld = this;'],
  ['this.gameLoop = new GameLoop(this.ups);', 'this.gameLoop = new GameLoop(this.ups);\n      this.gameLoop.chaosCanSimulate = () => !(this as any).chaosPacing?.paused;'],
  ['this.riftSpawnInterval = setInterval(() => {', 'this.riftSpawnInterval = setInterval(() => {\n        if ((this as any).chaosPacing?.paused) return;']],
 'server/ts/player/skill.handler.ts':[],
 'server/ts/player/combat.handler.ts':[],
 'server/ts/combat/combat-system.ts':[],
 'shared/ts/skills/skill-data.ts':[],
 'shared/ts/skills/index.ts':[],
 'server/ts/mob.ts':[], 'server/ts/mobarea.ts':[], 'server/ts/item.ts':[],
 'server/ts/player.ts':[], 'server/ts/player/inventory.handler.ts':[], 'server/ts/player/loot.handler.ts':[]
};
for(const file of Object.keys(pacingEdits))if(!patches.some(p=>p[0]===file)){
 const anchor=execFileSync('git',['show',`HEAD:${file}`],{cwd:root,encoding:'utf8'}).split('\n')[0];
 patches.push([file,anchor,anchor,anchor,anchor]);
}
function paceSource(file,source){
 for(const [before,after] of pacingEdits[file]||[]){if(!source.includes(before))throw Error('Pacing anchor missing: '+file);source=source.replace(before,after);}
 const imports={
  'server/ts/player/skill.handler.ts': ["import {gameNow} from '../chaos-clock';\n",s=>s.replaceAll('Date.now()', 'gameNow(ctx)')],
  'server/ts/player/combat.handler.ts': ["import {gameNow} from '../chaos-clock';\n",s=>s.replaceAll('Date.now()', 'gameNow(player)')],
  'server/ts/combat/combat-system.ts': ["import {gameNow} from '../chaos-clock';\n",s=>s.replaceAll('Date.now()', 'gameNow(mob)')],
  'server/ts/mob.ts': ["import {gameNow,gameTimeout} from './chaos-clock';\n",s=>s.replaceAll('Date.now()', 'gameNow(this)').replaceAll('setTimeout(() => {','gameTimeout(this, () => {')],
  'server/ts/mobarea.ts': ["import {gameTimeout} from './chaos-clock';\n",s=>s.replace('    mob.onMove(this.world.onMobMoveCallback.bind(this.world));','    (mob as any).chaosWorld = this.world;\n    mob.onMove(this.world.onMobMoveCallback.bind(this.world));').replaceAll('setTimeout(() => {','gameTimeout(mob, () => {')],
  'server/ts/item.ts': ["import {gameTimeout} from './chaos-clock';\n",s=>s.replaceAll('setTimeout(() => {','gameTimeout(this, () => {').replace('setTimeout(params.despawnCallback, params.blinkingDuration)','gameTimeout(this, params.despawnCallback, params.blinkingDuration)')],
  'server/ts/player.ts': ["import {gameNow} from './chaos-clock';\n",s=>s.replace('Date.now() < this.skillState.phaseShiftExpires','gameNow(this) < this.skillState.phaseShiftExpires')],
  'server/ts/player/inventory.handler.ts': ["import {gameTimeout} from '../chaos-clock';\n",s=>s.replaceAll('setTimeout(() => {','gameTimeout(ctx, () => {')],
  'server/ts/player/loot.handler.ts': ["import {gameTimeout} from '../chaos-clock';\n",s=>s.replaceAll('setTimeout(() => {','gameTimeout(player, () => {')]
 };
 if(file==='server/ts/player/combat.handler.ts')source=source.replace('export function handleHit(player: Player, msg: any[]): void {', 'export function handleHit(player: Player, msg: any[]): void {\n  if ((player.getWorld() as any).chaosPacing?.paused) return;').replace('export function handleHurt(player: Player, msg: any[]): void {', 'export function handleHurt(player: Player, msg: any[]): void {\n  if ((player.getWorld() as any).chaosPacing?.paused) return;');
 if(file==='server/ts/player/message-router.ts')source=source.replace('    // Skip tracing for high-frequency messages', '    if (pacing?.enabled && !pacing.allowMessage(player, message)) return false;\n\n    // Skip tracing for high-frequency messages');
 if(imports[file]){const [header,transform]=imports[file];source=header+transform(source);}
 return source;
}
function applyChaosClassSkills(file,source){
 const replace=(needle,value)=>{if(!source.includes(needle))throw Error('Class skill anchor missing: '+file);source=source.replace(needle,value);};
 if(file==='shared/ts/skills/skill-data.ts'){
  replace("  WHIRLWIND = 'whirlwind'\n", "  WHIRLWIND = 'whirlwind',\n  FRENZY = 'frenzy',\n  BULWARK = 'bulwark',\n  AMBUSH = 'ambush'\n");
  replace("export interface WhirlwindParams {\n  type: 'whirlwind';\n  radius: number;         // tiles\n  damagePercent: number;  // % of weapon damage\n}\n", "export interface WhirlwindParams {\n  type: 'whirlwind';\n  radius: number;         // tiles\n  damagePercent: number;  // % of weapon damage\n}\n\nexport interface FrenzyParams {\n  type: 'frenzy';\n  damageMultiplier: number;\n  duration: number;\n}\n\nexport interface BulwarkParams {\n  type: 'bulwark';\n  damageReduction: number;\n  duration: number;\n}\n\nexport interface AmbushParams {\n  type: 'ambush';\n  damageMultiplier: number;\n  duration: number;\n}\n");
  replace("  | WarCryParams\n  | WhirlwindParams;", "  | WarCryParams\n  | WhirlwindParams\n  | FrenzyParams\n  | BulwarkParams\n  | AmbushParams;");
  replace("  [SkillId.WHIRLWIND]: {\n    id: SkillId.WHIRLWIND,\n    name: 'Whirlwind',\n    description: 'Deal 75% weapon damage to all enemies within 1 tile',\n    type: SkillType.OFFENSIVE,\n    unlockLevel: 20,\n    cooldown: 15,\n    hotkey: 4,\n    icon: 'skill-whirlwind',\n    params: {\n      type: 'whirlwind',\n      radius: 1,\n      damagePercent: 75\n    }\n  }\n", "  [SkillId.WHIRLWIND]: {\n    id: SkillId.WHIRLWIND,\n    name: 'Whirlwind',\n    description: 'Deal 75% weapon damage to all enemies within 1 tile',\n    type: SkillType.OFFENSIVE,\n    unlockLevel: 20,\n    cooldown: 15,\n    hotkey: 4,\n    icon: 'skill-whirlwind',\n    params: {\n      type: 'whirlwind',\n      radius: 1,\n      damagePercent: 75\n    }\n  },\n\n  [SkillId.FRENZY]: {\n    id: SkillId.FRENZY,\n    name: 'Frenzy',\n    description: 'Empower melee attacks for a short time',\n    type: SkillType.OFFENSIVE,\n    unlockLevel: 20,\n    cooldown: 15,\n    hotkey: 1,\n    icon: 'skill-power-strike',\n    params: { type: 'frenzy', damageMultiplier: 1.25, duration: 5000 }\n  },\n\n  [SkillId.BULWARK]: {\n    id: SkillId.BULWARK,\n    name: 'Bulwark',\n    description: 'Reduce the next damage you take',\n    type: SkillType.UTILITY,\n    unlockLevel: 20,\n    cooldown: 20,\n    hotkey: 2,\n    icon: 'skill-phase',\n    params: { type: 'bulwark', damageReduction: 0.5, duration: 5000 }\n  },\n\n  [SkillId.AMBUSH]: {\n    id: SkillId.AMBUSH,\n    name: 'Ambush',\n    description: 'Empower the first attack after activation',\n    type: SkillType.OFFENSIVE,\n    unlockLevel: 20,\n    cooldown: 15,\n    hotkey: 3,\n    icon: 'skill-power-strike',\n    params: { type: 'ambush', damageMultiplier: 1.5, duration: 5000 }\n  }\n");
  replace("  phaseShiftExpires: number;           // Timestamp when phasing ends\n", "  phaseShiftExpires: number;           // Timestamp when phasing ends\n  frenzyActive: boolean;                // Timed multi-hit melee modifier\n  frenzyExpires: number;                // Timestamp when Frenzy ends\n  bulwarkActive: boolean;               // Self-only next-hit reduction\n  bulwarkExpires: number;               // Timestamp when Bulwark expires\n  ambushActive: boolean;                // First attack modifier\n  ambushExpires: number;                 // Timestamp when Ambush expires\n");
  replace("    phaseShiftActive: false,\n    phaseShiftExpires: 0\n", "    phaseShiftActive: false,\n    phaseShiftExpires: 0,\n    frenzyActive: false,\n    frenzyExpires: 0,\n    bulwarkActive: false,\n    bulwarkExpires: 0,\n    ambushActive: false,\n    ambushExpires: 0\n");
  replace("      [SkillId.WHIRLWIND]: 0\n    },", "      [SkillId.WHIRLWIND]: 0,\n      [SkillId.FRENZY]: 0,\n      [SkillId.BULWARK]: 0,\n      [SkillId.AMBUSH]: 0\n    },");
 }
 if(file==='shared/ts/skills/index.ts'){
  replace("  WhirlwindParams,\n", "  WhirlwindParams,\n  FrenzyParams,\n  BulwarkParams,\n  AmbushParams,\n");
 }
 if(file==='server/ts/player/skill.handler.ts'){
  replace("    case 'whirlwind':\n      return executeWhirlwind(ctx, skill.params.radius, skill.params.damagePercent);\n", "    case 'whirlwind':\n      return executeWhirlwind(ctx, skill.params.radius, skill.params.damagePercent);\n\n    case 'frenzy':\n      return executeFrenzy(ctx, skill.params.damageMultiplier, skill.params.duration);\n\n    case 'bulwark':\n      return executeBulwark(ctx, skill.params.duration);\n\n    case 'ambush':\n      return executeAmbush(ctx, skill.params.damageMultiplier, skill.params.duration);\n");
  replace("/**\n * Calculate distance between two points\n */\n", "function executeFrenzy(ctx: SkillPlayerContext, _multiplier: number, duration: number): boolean {\n  const expires = gameNow(ctx) + duration;\n  const state = ctx.getSkillState();\n  state.frenzyActive = true;\n  state.frenzyExpires = expires;\n  return true;\n}\n\nfunction executeBulwark(ctx: SkillPlayerContext, duration: number): boolean {\n  const expires = gameNow(ctx) + duration;\n  const state = ctx.getSkillState();\n  state.bulwarkActive = true;\n  state.bulwarkExpires = expires;\n  return true;\n}\n\nfunction executeAmbush(ctx: SkillPlayerContext, _multiplier: number, duration: number): boolean {\n  const expires = gameNow(ctx) + duration;\n  const state = ctx.getSkillState();\n  state.ambushActive = true;\n  state.ambushExpires = expires;\n  return true;\n}\n\n/**\n * Calculate distance between two points\n */\n");
  replace("  return 1.0; // Normal damage\n}\n", "  return 1.0; // Normal damage\n}\n\nexport function consumeFrenzyBuff(ctx: SkillPlayerContext): number {\n  const state = ctx.getSkillState();\n  if (state.frenzyActive && gameNow(ctx) < state.frenzyExpires) return 1.25;\n  state.frenzyActive = false;\n  state.frenzyExpires = 0;\n  return 1.0;\n}\n\nexport function consumeAmbushBuff(ctx: SkillPlayerContext): number {\n  const state = ctx.getSkillState();\n  if (state.ambushActive && gameNow(ctx) < state.ambushExpires) {\n    state.ambushActive = false;\n    state.ambushExpires = 0;\n    return 1.5;\n  }\n  state.ambushActive = false;\n  state.ambushExpires = 0;\n  return 1.0;\n}\n\nexport function consumeBulwarkReduction(ctx: SkillPlayerContext): number {\n  const state = ctx.getSkillState();\n  if (state.bulwarkActive && gameNow(ctx) < state.bulwarkExpires) {\n    state.bulwarkActive = false;\n    state.bulwarkExpires = 0;\n    return 0.5;\n  }\n  state.bulwarkActive = false;\n  state.bulwarkExpires = 0;\n  return 1.0;\n}\n");
 }
 if(file==='server/ts/player.ts'){
  replace("  consumePowerStrike(): number {\n    return SkillHandler.consumePowerStrikeBuff(this);\n  }\n", "  consumePowerStrike(): number {\n    return SkillHandler.consumePowerStrikeBuff(this);\n  }\n\n  consumeFrenzy(): number {\n    return SkillHandler.consumeFrenzyBuff(this);\n  }\n\n  consumeAmbush(): number {\n    return SkillHandler.consumeAmbushBuff(this);\n  }\n\n  consumeBulwarkReduction(): number {\n    return SkillHandler.consumeBulwarkReduction(this);\n  }\n");
 }
 if(file==='server/ts/player/combat.handler.ts'){
  replace("    const powerStrikeMultiplier = player.consumePowerStrike();\n", "    const powerStrikeMultiplier = player.consumePowerStrike();\n    const frenzyMultiplier = player.consumeFrenzy();\n    const ambushMultiplier = player.consumeAmbush();\n");
  replace("    const dmg = Math.floor(baseDmg * powerStrikeMultiplier * ascensionMultiplier);\n", "    const dmg = Math.floor(baseDmg * powerStrikeMultiplier * frenzyMultiplier * ambushMultiplier * ascensionMultiplier);\n");
  replace("    const hpBefore = player.hitPoints;\n    // Nemesis power", "    const hpBefore = player.hitPoints;\n    const bulwarkMultiplier = player.consumeBulwarkReduction();\n    // Nemesis power");
  replace("    const dmg = Math.floor(Formulas.dmg(mob.weaponLevel, player.armorLevel, mob.level ?? 1) * nemesisMultiplier);\n", "    const dmg = Math.floor(Formulas.dmg(mob.weaponLevel, player.armorLevel, mob.level ?? 1) * nemesisMultiplier * bulwarkMultiplier);\n");
 }
 return source;
}
// Preflight all files before writing any source. Accept only pristine or exactly our patch.
const writes=[];
for(const [file,a,b,c,d] of patches){
 const upstream=execFileSync('git',['show',`HEAD:${file}`],{cwd:root,encoding:'utf8'});
 if(!upstream.includes(a)||!upstream.includes(c))throw Error(`Anchor missing: ${file}`);
 let patched=paceSource(file,upstream.replace(a,b).replace(c,d));
 patched=applyChaosClassSkills(file,patched);
 if(file==='client/ts/game.ts')patched=patched.replace('  resize() {','  resize() {\n    const sharedCameraOwned = this.camera.chaosSharedOwned;').replace('      this.updater.update();','      if (!(this as any).__chaosPaused) this.updater.update();');
 if(file==='client/ts/world/zoning-manager.ts')patched=patched.replace('  onViewportResize(): void {','  onViewportResize(camera?: Camera): void {\n    if (camera && this.context) this.context.camera = camera;').replace('  enqueueZoningFrom(x: number, y: number): void {','  enqueueZoningFrom(x: number, y: number): void {\n    if (this.context?.camera.chaosSharedOwned) return;');
 if(file==='client/ts/renderer/camera.ts'){patched=patched.replace('  setGridPosition(x, y) {','  setGridPosition(x, y) {\n    if (this.chaosSharedOwned) return;').replace('  setZoneViewport(width: number, height: number, isFixed: boolean): void {','  setZoneViewport(width: number, height: number, isFixed: boolean): void {\n    if (this.chaosSharedOwned) return;');}
 if(file==='client/ts/utils/storage.ts')patched=patched.replaceAll('localStorage.data','localStorage[this.storageKey]');
 if(file==='client/ts/audio.ts')patched=patched.replace('music.sound.play();','void music.sound.play().catch(() => {});');
 if(file==='client/ts/main.ts')patched=patched.replace('    app = new App();','    app = new App();\n    bootChaosTV(app);');
 const current=fs.readFileSync(path.join(root,file),'utf8');
 // Allow only the previous isolated adapter's precisely known entrypoint patch.
 const legacy="import {startChaosRemote} from './chaos-remote';\n"+upstream.replace('  game.onGameStart(function () {','  game.onGameStart(function () {\n    startChaosRemote(game);');
 if(current!==upstream&&current!==patched&&current!==legacy&&previous[file]!==digest(current))throw Error(`Local source edits in ${file}; refusing overwrite`);
 writes.push([file,patched]);
}
for(const [source,dest] of [['chaos-sprites.test.ts','client/ts/__tests__/chaos-sprites.test.ts'],['chaos-pacing.test.ts','server/ts/__tests__/chaos-pacing.test.ts'],['chaos-clock.ts','server/ts/chaos-clock.ts'],['chaos-camera.test.ts','client/ts/__tests__/chaos-camera.test.ts'],['chaos-abilities.test.ts','server/ts/__tests__/chaos-abilities.test.ts'],['chaos-actor.test.ts','server/ts/__tests__/chaos-actor.test.ts'],['chaos-actor.ts','server/ts/chaos-actor.ts'],['action-contract.ts','server/ts/chaos-action-contract.ts'],['chaos-tv.ts','client/ts/chaos-tv.ts'],['native-map-state.ts','client/ts/chaos-native-map-state.ts']]){
 const p=path.join(root,dest);
 const canonical=fs.readFileSync(path.join(dir,source),'utf8');
 if(fs.existsSync(p)){const current=fs.readFileSync(p,'utf8');if(!current.startsWith('/** Chaos-owned')||(current!==canonical&&previous[dest]!==digest(current)))throw Error(`Local or unrecognized edits in ${dest}; refusing overwrite`);}
 writes.push([dest,canonical]);
}
for(const name of ['character-profile.mjs','character-appearance.mjs','scene-view.mjs','shared-camera.mjs']){
 const dest='client/ts/'+name,content=fs.readFileSync(path.join(dir,name),'utf8'),file=path.join(root,dest);
 if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')!==content&&previous[dest]!==digest(fs.readFileSync(file,'utf8')))throw Error('Local wardrobe edits; refusing overwrite: '+dest);
 writes.push([dest,content]);
}
const serverPacing='server/ts/party-pacing.ts',pacingContent=fs.readFileSync(path.join(dir,'party-pacing.mjs'),'utf8');
if(fs.existsSync(path.join(root,serverPacing))&&previous[serverPacing]!==digest(fs.readFileSync(path.join(root,serverPacing),'utf8'))&&fs.readFileSync(path.join(root,serverPacing),'utf8')!==pacingContent)throw Error('Local pacing edits preserved');
writes.push([serverPacing,pacingContent]);
const serverScene='server/ts/scene-view.ts',sceneContent=fs.readFileSync(path.join(dir,'scene-view.mjs'),'utf8');
if(fs.existsSync(path.join(root,serverScene))&&previous[serverScene]!==digest(fs.readFileSync(path.join(root,serverScene),'utf8'))&&fs.readFileSync(path.join(root,serverScene),'utf8')!==sceneContent)throw Error('Local scene edits preserved');
writes.push([serverScene,sceneContent]);
// A cosmetic cannot silently substitute an incompatible sprite layout.
for(const outfit of ['clotharmor','leatherarmor','mailarmor','platearmor','redarmor','goldenarmor']){
 const meta=JSON.parse(fs.readFileSync(path.join(root,'client/sprites',outfit+'.json'))),png=fs.readFileSync(path.join(root,'client/img/1',outfit+'.png'));
 if(meta.width!==32||meta.height!==32||png.readUInt32BE(16)!==160||png.readUInt32BE(20)!==288)throw Error('Unsupported wardrobe sprite; original files preserved: '+outfit);
}
for(const [name,size,rows] of [['wizard',26,10],['villagegirl',24,1]]){const meta=JSON.parse(fs.readFileSync(path.join(root,'client/sprites',name+'.json'))),png=fs.readFileSync(path.join(root,'client/img/1',name+'.png'));if(meta.width!==size||meta.height!==size||png.readUInt32BE(16)%size||png.readUInt32BE(20)<size*rows)throw Error('Unsupported native garment source: '+name);}
// Register exact native scenery against the upstream atlas collision metadata.
const metadataFile=fs.openSync(path.join(root,'tools/maps/tmx/map.tmx'),'r'),metadataBuffer=Buffer.alloc(262144);
let metadataLength;try{metadataLength=fs.readSync(metadataFile,metadataBuffer,0,metadataBuffer.length,0);}finally{fs.closeSync(metadataFile);}
const tmx=metadataBuffer.toString('utf8',0,metadataLength).split('</tileset>')[0];
if(digest(tmx)!=='9b92eb9fb7b63c5db803dbe456d35c518f8f650d69d4a47897b484e5ce8c7d29')throw Error('Native atlas metadata differs from the pinned version; local edits were preserved.');
const nativeMap=fs.readFileSync(path.join(root,'client/maps/world_client.json'),'utf8');
if(nativeMap!==execFileSync('git',['show','HEAD:client/maps/world_client.json'],{cwd:root,encoding:'utf8',maxBuffer:2097152}))throw Error('Native scenery requires the pinned map; local map edits were preserved.');
const solid=[...tmx.matchAll(/<tile id="(\d+)"[^>]*>([\s\S]*?)<\/tile>/g)].filter(m=>/<property name="c"/.test(m[2])).map(m=>Number(m[1])+1);
const nativeTrees=discoverNativeObjects(JSON.parse(nativeMap),solid);
for(const dest of ['server/ts/chaos-native-scenery.ts','client/ts/chaos-native-scenery.ts']){
 const content='// Generated from pinned Fracture map and atlas properties.\nexport const nativeTrees = '+JSON.stringify(nativeTrees)+';\n';
 const file=path.join(root,dest);
 if(fs.existsSync(file)){const current=fs.readFileSync(file,'utf8');if(current!==content&&previous[dest]!==digest(current))throw Error('Local native scenery edits; refusing overwrite: '+dest);}
 writes.push([dest,content]);
}
for(const [file,content] of writes)fs.writeFileSync(path.join(root,file),content);
fs.writeFileSync(manifestPath,JSON.stringify(Object.fromEntries(writes.map(([file,content])=>[file,digest(content)]))));
const config=path.join(root,'server/config.json');
if(!fs.existsSync(config))fs.copyFileSync(path.join(root,'server/config.example.json'),config);
console.log('Pinned Chaos party overlay applied. Config and saves preserved.');
