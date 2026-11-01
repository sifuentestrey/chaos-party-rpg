import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkWorkerScope } from './check-worker-scope.mjs';
import { offlineEnvironment } from './verify-offline.mjs';

export async function acceptContentTask({ base, cwd = process.cwd(), check = checkWorkerScope, verify = runVerification } = {}) {
  const before = check({ base, cwd });
  await verify(cwd);
  const after = check({ base, cwd });
  return { ...after, ok: true, changedBeforeVerification: before.changed };
}

function runVerification(cwd) {
  const result = spawnSync('npm', ['run', 'verify'], { cwd, env: offlineEnvironment(), stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Offline verification failed (${result.status}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) {
    console.error('Usage: node scripts/accept-content-task.mjs <approved-full-base-sha>');
    process.exitCode = 1;
  } else {
    acceptContentTask({ base: process.argv[2] }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
      console.error(`Content acceptance failed: ${error.message}`);
      process.exitCode = 1;
    });
  }
}
