import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { offlineEnvironment } from './verify-offline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function runOfflineTests({
  runCommand,
  listTestFiles,
  env = process.env,
  createTempDataDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'chaos-party-test-data-')),
  removeTempDataDir = (dir) => fs.rmSync(dir, { recursive: true, force: true })
}) {
  const safeEnv = offlineEnvironment(env);
  const testDataDir = createTempDataDir();
  safeEnv.CHAOS_DATA_DIR = testDataDir;
  try {
    await runCommand(process.execPath, ['scripts/build-framework.mjs'], { cwd: ROOT, env: safeEnv });
    const testFiles = listTestFiles().slice().sort();
    if (!testFiles.length) throw new Error('No tests/*.test.mjs files were found.');
    await runCommand(process.execPath, ['--test', ...testFiles], { cwd: ROOT, env: safeEnv });
    return { ok: true, tests: testFiles.length, ai: 'off' };
  } finally {
    removeTempDataDir(testDataDir);
  }
}

function runCommand(command, args, options) {
  const result = spawnSync(command, args, { ...options, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(command)} ${args.join(' ')} exited with status ${result.status}`);
}

function listTestFiles() {
  return fs.readdirSync(path.join(ROOT, 'tests'))
    .filter((name) => name.endsWith('.test.mjs'))
    .sort()
    .map((name) => path.join('tests', name));
}

export async function main() {
  const result = await runOfflineTests({ runCommand, listTestFiles });
  console.log(`Offline test suite passed (${result.tests} files); AI disabled.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
