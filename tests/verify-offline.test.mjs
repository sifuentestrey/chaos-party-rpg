import test from 'node:test';
import assert from 'node:assert/strict';
import { GENERATED_OUTPUTS, offlineEnvironment, runOfflineVerification } from '../scripts/verify-offline.mjs';

function fixture({ failCommand = null, changeOutput = null, trackedFiles = GENERATED_OUTPUTS } = {}) {
  const files = new Map(GENERATED_OUTPUTS.map((file) => [file, Buffer.from(`baseline:${file}`)]));
  const calls = [];
  return {
    files,
    calls,
    options: {
      env: { CHAOS_AI_PROVIDER: 'groq-free', CHAOS_AI_NARRATION: 'on', CHAOS_AI_BASE_URL: 'https://example.invalid', CHAOS_DATA_DIR: '/private/save', CHAOS_PUBLIC_URL: 'https://example.invalid', CHAOS_LAUNCH: '1', CHAOS_OPEN: '1', CHAOS_PREVIEW: '1', CHAOS_AI_BENCHMARK_DATA_DIR: '/private/bench', GROQ_API_KEY: 'fixture-key', SESSION_PASSWORD: 'secret', NODE_USE_ENV_PROXY: '1', KEEP_THIS: 'yes' },
      listTrackedGenerated: () => trackedFiles,
      readGenerated: (file) => files.get(file) ?? null,
      runCommand: async (command, args, options) => {
        calls.push({ command, args, options });
        if (changeOutput) changeOutput(files, calls.length);
        if (failCommand === args.join(' ')) throw new Error(`failed ${args.join(' ')}`);
      }
    }
  };
}

test('offline verifier runs tests, checks outputs, then builds with AI configuration removed', async () => {
  const f = fixture();
  const result = await runOfflineVerification(f.options);
  assert.deepEqual(f.calls.map(({ args }) => args), [['test'], ['run', 'build']]);
  assert.equal(result.ok, true);
  assert.equal(f.calls[0].options.env.CHAOS_AI, 'off');
  assert.equal(f.calls[0].options.env.CHAOS_AI_NARRATION, 'off');
  assert.equal(f.calls[0].options.env.CHAOS_AI_PROVIDER, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_AI_BASE_URL, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_DATA_DIR, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_PUBLIC_URL, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_LAUNCH, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_OPEN, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_PREVIEW, undefined);
  assert.equal(f.calls[0].options.env.CHAOS_AI_BENCHMARK_DATA_DIR, undefined);
  assert.equal(f.calls[0].options.env.GROQ_API_KEY, undefined);
  assert.equal(f.calls[0].options.env.SESSION_PASSWORD, undefined);
  assert.equal(f.calls[0].options.env.NODE_USE_ENV_PROXY, undefined);
  assert.equal(f.calls[0].options.env.KEEP_THIS, 'yes');
});

test('offline verifier stops when npm test fails', async () => {
  const f = fixture({ failCommand: 'test' });
  await assert.rejects(runOfflineVerification(f.options), /failed test/);
  assert.equal(f.calls.length, 1);
});

test('offline verifier stops when static build fails', async () => {
  const f = fixture({ failCommand: 'run build' });
  await assert.rejects(runOfflineVerification(f.options), /failed run build/);
  assert.equal(f.calls.length, 2);
});

test('offline verifier reports generated output drift after tests', async () => {
  const f = fixture({ changeOutput: (files) => files.set(GENERATED_OUTPUTS[0], Buffer.from('rebuilt')) });
  await assert.rejects(runOfflineVerification(f.options), /changed during npm test/);
  assert.equal(f.calls.length, 1);
});

test('offline verifier reports a generated output missing before verification', async () => {
  const f = fixture();
  f.files.delete(GENERATED_OUTPUTS[0]);
  await assert.rejects(runOfflineVerification(f.options), /missing before verification/);
  assert.equal(f.calls.length, 0);
});

test('offline verifier reports a generated output missing after tests', async () => {
  const f = fixture({ changeOutput: (files) => files.delete(GENERATED_OUTPUTS[0]) });
  await assert.rejects(runOfflineVerification(f.options), /is missing during npm test/);
  assert.equal(f.calls.length, 1);
});

test('offline verifier rejects an expected output that is not tracked', async () => {
  const f = fixture({ trackedFiles: GENERATED_OUTPUTS.slice(0, -1) });
  await assert.rejects(runOfflineVerification(f.options), /not tracked/);
  assert.equal(f.calls.length, 0);
});

test('offline verifier detects generated output drift from the static build', async () => {
  const f = fixture({ changeOutput: (files, callNumber) => {
    if (callNumber === 2) files.set(GENERATED_OUTPUTS[0], Buffer.from('changed by build'));
  } });
  await assert.rejects(runOfflineVerification(f.options), /changed during the static build/);
  assert.equal(f.calls.length, 2);
});

test('offline environment always disables AI and strips unsafe config and secret variables', () => {
  const env = offlineEnvironment({ CHAOS_AI: 'on', CHAOS_AI_MODEL: 'paid-model', CHAOS_DATA_DIR: '/private', CHAOS_LAUNCH: '1', CHAOS_PREVIEW: '1', OPENAI_API_KEY: 'secret', OTHER_TOKEN: 'secret', SESSION_PASSWORD: 'secret', PATH: '/bin' });
  assert.equal(env.CHAOS_AI, 'off');
  assert.equal(env.CHAOS_AI_MODEL, undefined);
  assert.equal(env.OPENAI_API_KEY, undefined);
  assert.equal(env.OTHER_TOKEN, undefined);
  assert.equal(env.SESSION_PASSWORD, undefined);
  assert.equal(env.CHAOS_DATA_DIR, undefined);
  assert.equal(env.CHAOS_LAUNCH, undefined);
  assert.equal(env.CHAOS_PREVIEW, undefined);
  assert.equal(env.PATH, '/bin');
});
