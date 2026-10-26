import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true,filter:p=>!path.basename(p).startsWith('__qa')});
fs.writeFileSync(path.join(root,'dist','runtime.js'),"window.CHAOS_CONFIG = { standalone: true, version: '0.3.0-beta.1' };\n");
console.log('Private solo preview built. The Mac release uses the real LAN server.');
