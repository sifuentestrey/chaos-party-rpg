import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { CONTENT_PATHS, checkWorkerScope } from '../scripts/check-worker-scope.mjs';

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'chaos-scope-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const write = (file, text = 'baseline') => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), text);
  };
  git('init'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture');
  for (const file of [...CONTENT_PATHS, 'engine.mjs', '.gitignore']) write(file, file === '.gitignore' ? '*.log\n' : 'baseline');
  git('add', '.'); git('commit', '-m', 'baseline');
  const base = git('rev-parse', 'HEAD');
  return { cwd, git, write, base, check: () => checkWorkerScope({ cwd, base }) };
}

test('scope checks clean and approved working, staged and committed content changes', (t) => {
  const f = fixture(t);
  assert.deepEqual(f.check().changed, []);
  f.write(CONTENT_PATHS[0], 'new text');
  assert.deepEqual(f.check().changed, [CONTENT_PATHS[0]]);
  f.git('add', '.'); assert.equal(f.check().changed.length, 1);
  f.git('commit', '-m', 'content'); assert.equal(f.check().changed.length, 1);
  f.write('test.log', 'ignored log'); assert.equal(f.check().changed.length, 1);
});

for (const kind of ['working', 'staged-restored', 'committed', 'untracked', 'rename']) {
  test(`scope rejects ${kind} out-of-scope changes`, (t) => {
    const f = fixture(t);
    if (kind === 'untracked') f.write('surprise\nfile.mjs');
    else if (kind === 'rename') f.git('mv', 'engine.mjs', 'renamed.mjs');
    else {
      f.write('engine.mjs', 'unsafe');
      if (kind !== 'working') f.git('add', '.');
      if (kind === 'staged-restored') f.write('engine.mjs', 'baseline');
      if (kind === 'committed') f.git('commit', '-m', 'unsafe');
    }
    assert.throws(f.check, /Outside content task scope/);
  });
}

for (const kind of ['deleted', 'symlink', 'executable', 'index-executable']) {
  test(`scope rejects ${kind} approved file`, (t) => {
    const f = fixture(t); const file = path.join(f.cwd, CONTENT_PATHS[0]);
    if (kind === 'deleted') fs.unlinkSync(file);
    if (kind === 'symlink') { fs.unlinkSync(file); fs.symlinkSync('../../engine.mjs', file); }
    if (kind === 'executable') fs.chmodSync(file, 0o755);
    if (kind === 'index-executable') f.git('update-index', '--chmod=+x', CONTENT_PATHS[0]);
    assert.throws(f.check);
  });
}

test('scope requires a full existing ancestor commit rather than a movable branch or arbitrary input', (t) => {
  const f = fixture(t);
  for (const base of [undefined, 'HEAD', f.base.slice(0, 7), '--help', '0'.repeat(40)]) {
    assert.throws(() => checkWorkerScope({ cwd: f.cwd, base }));
  }
  f.git('checkout', '--orphan', 'unrelated'); f.git('commit', '-m', 'unrelated');
  assert.throws(f.check);
});
