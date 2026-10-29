import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const patch=new URL('./apply-overlay.mjs',import.meta.url).pathname;

test('adapter patch is confined to Fracture and refreshes only its owned adapter',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fracture-spike-'));
 try{
  fs.mkdirSync(path.join(dir,'client/ts'),{recursive:true});
  fs.mkdirSync(path.join(dir,'server'),{recursive:true});
  fs.writeFileSync(path.join(dir,'server/config.example.json'),'\"config\"');
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'fracture'}));
  fs.writeFileSync(path.join(dir,'client/ts/main.ts'),'const game = {};\n  game.onGameStart(function () {\n    // start\n  });\n');
  execFileSync(process.execPath,[patch,dir]);
  const contents=fs.readFileSync(path.join(dir,'client/ts/main.ts'),'utf8');
  assert.match(contents,/startChaosRemote\(game\)/);
  assert.match(contents,/import \{startChaosRemote\}/);
  assert.ok(fs.existsSync(path.join(dir,'client/ts/chaos-remote.ts')));
  assert.equal(fs.readFileSync(path.join(dir,'server/config.json'),'utf8'),'\"config\"');
  const adapter=path.join(dir,'client/ts/chaos-remote.ts');
  const original=fs.readFileSync(adapter,'utf8');
  fs.writeFileSync(adapter,original+'\n// stale test adapter\n');
  execFileSync(process.execPath,[patch,dir]);
  assert.equal(fs.readFileSync(adapter,'utf8'),original);
  assert.equal(fs.readFileSync(path.join(dir,'client/ts/main.ts'),'utf8'),contents);
  // Unknown local adapter must never be overwritten.
  fs.writeFileSync(adapter,'// unrelated script');
  assert.throws(()=>execFileSync(process.execPath,[patch,dir],{stdio:'pipe'}));
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});

test('patch refuses a non-Fracture project',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fracture-invalid-'));
 try{fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'chaos-party-rpg'}));
 assert.throws(()=>execFileSync(process.execPath,[patch,dir],{stdio:'pipe'}));
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
