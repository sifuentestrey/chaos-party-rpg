import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),hash=createHash('sha256');
for(const file of ['shared-camera.mjs','scene-view.mjs','action-contract.ts','chaos-actor.ts','chaos-tv.ts','apply-party-overlay.mjs','chaos-world.mjs','native-scenery.mjs','native-map-state.ts','native-object-actions.mjs','character-profile.mjs','character-appearance.mjs','party-abilities.mjs'])hash.update(fs.readFileSync(path.join(dir,file)));
hash.update(fs.readFileSync(path.join(dir,'../../public/vendor/dnd5e-advantage.js')));
hash.update(`${process.versions.node}:${process.platform}:${process.arch}:642c00a8a2d3a95979e85bbfa3f62deee611a4a6`);console.log(hash.digest('hex'));
