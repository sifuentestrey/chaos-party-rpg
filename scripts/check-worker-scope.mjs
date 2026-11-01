import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const CONTENT_PATHS = Object.freeze([
  'public/content/campaign-text.json',
  'public/content/campaign-text.generated.js',
  'src/framework.mjs'
]);

// This policy belongs to the reviewer. Never accept a worker-supplied allowlist.
export function checkWorkerScope({ cwd = process.cwd(), base } = {}) {
  if (!/^[a-f0-9]{40}$/.test(base ?? '')) throw new Error('Supply the reviewer-approved full 40-character base commit.');
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('cat-file', '-e', `${base}^{commit}`);
  git('merge-base', '--is-ancestor', base, 'HEAD');
  const split = (value) => value.split('\0').filter(Boolean);
  // Include committed, staged, unstaged and non-ignored untracked changes.
  // The separate index diff catches staged edits restored in the working tree.
  const changed = [...new Set([
    ...split(git('diff', '--name-only', '--no-renames', '-z', base, '--')),
    ...split(git('diff', '--cached', '--name-only', '--no-renames', '-z', base, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z'))
  ])].sort();
  const unexpected = changed.filter((file) => !CONTENT_PATHS.includes(file));
  if (unexpected.length) throw new Error(`Outside content task scope: ${unexpected.map(JSON.stringify).join(', ')}`);
  for (const file of CONTENT_PATHS) {
    const baseline = git('ls-tree', base, '--', file);
    const index = git('ls-files', '--stage', '--', file);
    const parts = file.split('/');
    for (let count = 1; count < parts.length; count++) {
      if (!fs.lstatSync(path.join(cwd, ...parts.slice(0, count))).isDirectory()) {
        throw new Error(`Content parent must remain a real directory: ${file}`);
      }
    }
    const stat = fs.lstatSync(path.join(cwd, file));
    if (!baseline.startsWith('100644 blob ') || !/^100644 [a-f0-9]+ 0\t/.test(index) ||
        index.trimEnd().split('\n').length !== 1 || !stat.isFile() || (stat.mode & 0o111)) {
      throw new Error(`Content paths must remain regular, non-executable tracked files: ${file}`);
    }
  }
  return { base, changed, lane: 'content' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/check-worker-scope.mjs <approved-full-base-sha>');
    console.log(JSON.stringify(checkWorkerScope({ base: process.argv[2] }), null, 2));
  } catch (error) {
    console.error(`Worker scope check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
