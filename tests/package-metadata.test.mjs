import test from 'node:test';
import assert from 'node:assert/strict';
import { createReleaseMetadata } from '../scripts/release-metadata.mjs';

const knownValues = (status) => (args) => {
  if (args[0] === 'rev-parse') return 'abc123\n';
  if (args[0] === 'show') return '2026-10-27T12:00:00Z\n';
  if (args[0] === 'status') return status;
  throw new Error('unexpected git command');
};

test('release metadata marks a clean source tree false', () => {
  const metadata = createReleaseMetadata({ execGit: knownValues(''), createdAt: 'fixed' });
  assert.equal(metadata.sourceDirty, false);
  assert.equal(metadata.sourceCommit, 'abc123');
  assert.equal(metadata.sourceCommitDate, '2026-10-27T12:00:00Z');
  assert.equal(metadata.realModelQualified, false);
});

test('release metadata marks a dirty source tree true', () => {
  const metadata = createReleaseMetadata({ execGit: knownValues(' M file.mjs\n') });
  assert.equal(metadata.sourceDirty, true);
});

test('release metadata marks unavailable Git status null', () => {
  const execGit = (args) => {
    if (args[0] === 'status') throw new Error('not a Git checkout');
    return knownValues('')(args);
  };
  const metadata = createReleaseMetadata({ execGit });
  assert.equal(metadata.sourceDirty, null);
});
