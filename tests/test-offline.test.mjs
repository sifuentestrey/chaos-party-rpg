import test from 'node:test';
import assert from 'node:assert/strict';
import { runOfflineTests } from '../scripts/test-offline.mjs';

function fixture(failAt = 0) {
  const calls = [];
  const removed = [];
  let discovered = 0;
  const dataDir = '/tmp/chaos-test-isolated';
  const env = {
    CHAOS_AI_PROVIDER: 'groq-free',
    CHAOS_AI_NARRATION: 'on',
    CHAOS_DATA_DIR: '/private/campaigns',
    GROQ_API_KEY: 'synthetic-secret',
    SESSION_PASSWORD: 'private',
    PATH: '/bin',
    HOME: '/tmp/home'
  };
  return {
    calls,
    removed,
    env,
    get discovered() { return discovered; },
    options: {
      env,
      createTempDataDir: () => dataDir,
      removeTempDataDir: (dir) => removed.push(dir),
      listTestFiles: () => { discovered++; return ['tests/z.test.mjs', 'tests/a.test.mjs']; },
      runCommand: async (command, args, options) => {
        calls.push({ command, args, options });
        if (calls.length === failAt) throw new Error(`failure ${calls.length}`);
      }
    }
  };
}

test('offline test wrapper builds then runs sorted explicit test paths with scrubbed env', async () => {
  const f = fixture();
  const result = await runOfflineTests(f.options);
  assert.equal(result.ok, true);
  assert.deepEqual(f.removed, ['/tmp/chaos-test-isolated']);
  assert.deepEqual(f.calls.map(({ args }) => args), [
    ['scripts/build-framework.mjs'],
    ['--test', 'tests/a.test.mjs', 'tests/z.test.mjs']
  ]);
  for (const call of f.calls) {
    assert.equal(call.options.env.CHAOS_AI, 'off');
    assert.equal(call.options.env.CHAOS_AI_PROVIDER, undefined);
    assert.equal(call.options.env.CHAOS_AI_NARRATION, 'off');
    assert.equal(call.options.env.CHAOS_DATA_DIR, '/tmp/chaos-test-isolated');
    assert.equal(call.options.env.GROQ_API_KEY, undefined);
    assert.equal(call.options.env.SESSION_PASSWORD, undefined);
    assert.equal(call.options.env.PATH, '/bin');
    assert.equal(call.options.env.HOME, '/tmp/home');
  }
  assert.equal(f.env.CHAOS_DATA_DIR, '/private/campaigns');
  assert.equal(f.env.CHAOS_AI_PROVIDER, 'groq-free');
});

test('offline test wrapper stops if framework build fails', async () => {
  const f = fixture(1);
  await assert.rejects(runOfflineTests(f.options), /failure 1/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.discovered, 0);
  assert.deepEqual(f.removed, ['/tmp/chaos-test-isolated']);
  assert.equal(f.env.CHAOS_DATA_DIR, '/private/campaigns');
});

test('offline test wrapper stops if test execution fails', async () => {
  const f = fixture(2);
  await assert.rejects(runOfflineTests(f.options), /failure 2/);
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.removed, ['/tmp/chaos-test-isolated']);
  assert.equal(f.env.CHAOS_DATA_DIR, '/private/campaigns');
});
