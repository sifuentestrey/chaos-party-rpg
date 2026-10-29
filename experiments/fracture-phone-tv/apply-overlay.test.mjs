import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const patch=new URL('./apply-overlay.mjs',import.meta.url).pathname;

test('adapter patch is confined to a Fracture clone and cannot overwrite twice',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fracture-spike-'));
 try{
  fs.mkdirSync(path.join(dir,'client/ts'),{recursive:true});
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'fracture'}));
  fs.writeFileSync(path.join(dir,'client/ts/main.ts'),'const game = {};\n  game.onGameStart(function () {\n    // start\n  });\n');
  execFileSync(process.execPath,[patch,dir]);
  const contents=fs.readFileSync(path.join(dir,'client/ts/main.ts'),'utf8');
  assert.match(contents,/startChaosRemote\(game\)/);
  assert.match(contents,/import \{startChaosRemote\}/);
  assert.ok(fs.existsSync(path.join(dir,'client/ts/chaos-remote.ts')));
  assert.throws(()=>execFileSync(process.execPath,[patch,dir],{stdio:'pipe'}));
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});

test('patch refuses a non-Fracture project',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fracture-invalid-'));
 try{fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'chaos-party-rpg'}));
 assert.throws(()=>execFileSync(process.execPath,[patch,dir],{stdio:'pipe'}));
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
