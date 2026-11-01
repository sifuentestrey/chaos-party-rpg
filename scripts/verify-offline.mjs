import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

export const GENERATED_OUTPUTS = [
  'public/vendor/dungeonz.js',
  'public/vendor/rot-astar.js',
  'public/vendor/dnd5e-advantage.js',
  'src/framework.mjs',
  'public/vendor/partyframe-rng.js',
  'public/vendor/partyframe-client.js',
  'public/content/campaign-text.generated.js'
];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function offlineEnvironment(env = process.env) {
  const safe = { ...env };
  for (const key of Object.keys(safe)) {
    if (/(?:API_KEY|TOKEN|SECRET|PASSWORD)$/i.test(key) || /^CHAOS_/.test(key) || key === 'NODE_USE_ENV_PROXY') delete safe[key];
  }
  safe.CHAOS_AI = 'off';
  safe.CHAOS_AI_NARRATION = 'off';
  safe.CHAOS_AI_ACTION_CONTRACT = 'off';
  return safe;
}

function snapshotOutputs(readGenerated) {
  return new Map(GENERATED_OUTPUTS.map((file) => [file, readGenerated(file)]));
}

function assertOutputsUnchanged(before, after, phase) {
  const changes = [];
  for (const file of GENERATED_OUTPUTS) {
    const oldValue = before.get(file);
    const newValue = after.get(file);
    if (oldValue === null) changes.push(`${file} was missing before verification`);
    else if (newValue === null) changes.push(`${file} is missing during ${phase}`);
    else if (!oldValue.equals(newValue)) changes.push(`${file} changed during ${phase}`);
  }
  if (changes.length) throw new Error(`Generated output drift detected:\n- ${changes.join('\n- ')}`);
}

export async function runOfflineVerification({
  runCommand,
  readGenerated,
  listTrackedGenerated,
  env = process.env
}) {
  const safeEnv = offlineEnvironment(env);
  const tracked = new Set(listTrackedGenerated(GENERATED_OUTPUTS));
  const untracked = GENERATED_OUTPUTS.filter((file) => !tracked.has(file));
  if (untracked.length) throw new Error(`Expected generated outputs are not tracked:\n- ${untracked.join('\n- ')}`);

  const before = snapshotOutputs(readGenerated);
  const missingBefore = GENERATED_OUTPUTS.filter((file) => before.get(file) === null);
  if (missingBefore.length) throw new Error(`Generated outputs are missing before verification:\n- ${missingBefore.join('\n- ')}`);
  await runCommand('npm', ['test'], { cwd: ROOT, env: safeEnv });
  const afterTests = snapshotOutputs(readGenerated);
  assertOutputsUnchanged(before, afterTests, 'npm test');
  await runCommand('npm', ['run', 'build'], { cwd: ROOT, env: safeEnv });
  assertOutputsUnchanged(before, snapshotOutputs(readGenerated), 'the static build');
  return { ok: true, generatedOutputsChecked: GENERATED_OUTPUTS.length, ai: 'off' };
}

function runCommand(command, args, options) {
  const result = spawnSync(command, args, { ...options, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
}

function readGenerated(file) {
  try { return fs.readFileSync(path.join(ROOT, file)); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function listTrackedGenerated(files) {
  const listed = execFileSync('git', ['ls-files', '--error-unmatch', '--', ...files], { cwd: ROOT, encoding: 'utf8' });
  return listed.split(/\r?\n/).filter(Boolean);
}

export async function main() {
  const result = await runOfflineVerification({ runCommand, readGenerated, listTrackedGenerated });
  console.log(`Offline verification passed: npm test, generated output drift check (${result.generatedOutputsChecked} files), and static build; AI disabled.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
