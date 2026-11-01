import {build} from 'esbuild';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname);
await build({stdin:{contents:`export {default as WoodDoor} from './upstream/server/src/entities/classes/statics/interactables/breakables/WoodDoor.js'; export {default as Damage} from './upstream/server/src/gameplay/Damage.js';`,resolveDir:root},outfile:path.join(root,'engine.js'),bundle:true,format:'esm',platform:'browser',plugins:[{
  name:'isolate-server-side-effects',setup(b){
    b.onResolve({filter:/^fs$/},()=>({path:'fs',namespace:'adapter'}));
    b.onResolve({filter:/^\.\.\/settings$/},()=>({path:'settings',namespace:'adapter'}));
    b.onLoad({filter:/.*/,namespace:'adapter'},args=>({contents:args.path==='fs'?`module.exports={existsSync:()=>true,writeFileSync:()=>{}};`:`module.exports={IGNORE_WARNINGS:false};`}));
  }
}]});
