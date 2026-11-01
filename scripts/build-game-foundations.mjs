import {build} from 'esbuild';
import fs from 'node:fs';
// Keep upstream originals reviewable. Only adapt the platform boundary.
const base='experiments/dungeonz-world/upstream/server/src';
await build({stdin:{contents:`export {default as WoodDoor} from './${base}/entities/classes/statics/interactables/breakables/WoodDoor.js'; export {default as Damage} from './${base}/gameplay/Damage.js'; export {default as Entity} from './${base}/entities/classes/Entity.js';`,resolveDir:process.cwd()},outfile:'public/vendor/dungeonz.js',bundle:true,format:'esm',platform:'browser',plugins:[{name:'platform-boundary',setup(b){
  b.onResolve({filter:/^fs$/},()=>({path:'fs',namespace:'platform'}));
  b.onResolve({filter:/^\.\.\/settings$/},()=>({path:'settings',namespace:'platform'}));
  b.onResolve({filter:/EventsList$/},()=>({path:'events',namespace:'platform'}));
  b.onLoad({filter:/.*/,namespace:'platform'},a=>({contents:a.path==='fs'?'module.exports={existsSync:()=>true,writeFileSync:()=>{}};':a.path==='events'?`module.exports={active_state:'active',inactive_state:'inactive',damage:'damage',heal:'heal'};`:'module.exports={IGNORE_WARNINGS:false};'}));
}}]});
await build({entryPoints:['node_modules/rot-js/lib/path/astar.js'],bundle:true,format:'esm',platform:'browser',outfile:'public/vendor/rot-astar.js'});
// Foundry's actual advantage selection; remove async because the body has no awaits.
const original=fs.readFileSync('vendor/dnd5e/basic-die.mjs','utf8');
const begin=original.indexOf('async advantage(modifier) {')+'async advantage(modifier) {'.length;
let end=begin,depth=1;while(depth){if(original[end]==='{')depth++;if(original[end]==='}')depth--;end++;}
const body=original.slice(begin,end-1);
fs.writeFileSync('public/vendor/dnd5e-advantage.js',`// Adapted from Foundry D&D5e BasicDie. MIT, Copyright 2021 Andrew Clayton.\n// Original selection body; synchronous platform adapter, no Foundry runtime.\nfunction select(){${body}}\nexport function selectD20(values,mode){const term={options:{pending:{advantage:{count:1,adv:mode>0,size:1}}},results:values.map(result=>({result,active:true}))};select.call(term);return term.results.find(r=>r.active).result;}\n`);
for(const file of ['public/vendor/dungeonz.js','public/vendor/rot-astar.js','public/vendor/dnd5e-advantage.js'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/[\t ]+$/gm,''));
