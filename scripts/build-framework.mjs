import {build} from 'esbuild';
import path from 'node:path';
const root=process.cwd(),base=path.join(root,'vendor/partyframe/packages');
export const aliases={
  '@partyframe/runtime':path.join(base,'runtime/src/index.ts'),
  '@partyframe/protocol':path.join(base,'protocol/src/index.ts'),
  '@partyframe/game-core':path.join(base,'game-core/src/index.ts')
};
const shared={bundle:true,alias:aliases,tsconfigRaw:{compilerOptions:{experimentalDecorators:true,useDefineForClassFields:false}},logLevel:'warning'};
await build({...shared,entryPoints:[path.join(base,'game-core/src/rng.ts')],outfile:'public/vendor/partyframe-rng.js',platform:'browser',format:'esm',target:'es2020'});
await build({...shared,entryPoints:['src/framework-entry.ts'],outfile:'src/framework.mjs',platform:'node',format:'esm',target:'node22',external:['@colyseus/core','@colyseus/schema','zod']});
await build({...shared,entryPoints:[path.join(base,'kit/src/net/SessionConnection.ts')],outfile:'public/vendor/partyframe-client.js',platform:'browser',format:'esm',target:'es2020',define:{'import.meta.env':'{}'}});
console.log('Built the pinned PartyFrame runtime, game-core RNG and real browser connection SDK.');
