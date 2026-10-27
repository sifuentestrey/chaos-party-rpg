export function createReleaseMetadata({ execGit, createdAt = new Date().toISOString() }) {
  const read = (args) => {
    try {
      return execGit(args).trim();
    } catch {
      return null;
    }
  };

  const sourceCommit = read(['rev-parse', 'HEAD']);
  const sourceCommitDate = read(['show', '-s', '--format=%cI', 'HEAD']);
  const status = read(['status', '--porcelain']);
  return {
    package: 'Chaos Party 0.3 beta candidate',
    createdAt,
    sourceCommit: sourceCommit || null,
    sourceCommitDate: sourceCommitDate || null,
    sourceDirty: status === null ? null : status.length > 0,
    provenanceNote: 'Git provenance is best-effort and may be null when source metadata is unavailable.',
    realModelQualified: false,
    qualification: 'Packaging metadata only. This release has not been qualified on physical Mac hardware or with multiple physical phone models, and no creative AI narration quality claim is made.'
  };
}
