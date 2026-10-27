import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptContentTask } from '../scripts/accept-content-task.mjs';

test('content acceptance checks scope before and after verification with the same approved base', async () => {
  const calls = []; const base = 'a'.repeat(40); const cwd = '/fixture';
  const result = await acceptContentTask({ base, cwd,
    check: (options) => { calls.push(['scope', options]); return { changed: ['approved'], base }; },
    verify: async (directory) => { calls.push(['verify', directory]); }
  });
  assert.deepEqual(calls, [['scope', { base, cwd }], ['verify', cwd], ['scope', { base, cwd }]]);
  assert.equal(result.ok, true);
});

test('out-of-scope content task cannot start verification', async () => {
  let invoked = false;
  await assert.rejects(acceptContentTask({ check: () => { throw new Error('scope failed'); }, verify: () => { invoked = true; } }), /scope failed/);
  assert.equal(invoked, false);
});

test('failed verification cannot produce accepted content', async () => {
  let scopes = 0;
  await assert.rejects(acceptContentTask({ check: () => { scopes++; return { changed: [] }; }, verify: () => { throw new Error('tests failed'); } }), /tests failed/);
  assert.equal(scopes, 1);
});

test('verification introducing an out-of-scope change cannot produce accepted content', async () => {
  let verified = false;
  await assert.rejects(acceptContentTask({
    check: () => { if (verified) throw new Error('build widened scope'); return { changed: [] }; },
    verify: () => { verified = true; }
  }), /build widened scope/);
});
