#!/usr/bin/env python3
"""Build a source-only beta ZIP from a committed experimental-branch snapshot."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import time
import zipfile

root = Path(__file__).resolve().parents[2]
def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)
if git('branch', '--show-current').decode().strip() != 'spike/fracture-phone-tv':
    raise SystemExit('Only the isolated experimental branch may be packaged.')
paths = ['vendor/partyframe/LICENSE','public/world-items.js','public/entity-rules.js','public/environment.js','public/expedition.js','public/campaign.js','public/content/campaign-text.generated.js','public/vendor/dungeonz.js','public/vendor/Dungeonz-LICENSE.txt','public/vendor/partyframe-rng.js','public/vendor/dnd5e-advantage.js','experiments/fracture-phone-tv', 'src/free-ai-budget.mjs', 'docs/FRACTURE_GAME_NIGHT_RELEASE.md', 'docs/CHAOS_TO_FRACTURE_PARITY.md']
if git('diff', '--name-only', 'HEAD', '--', *paths).strip():
    raise SystemExit('Commit the reviewed source/checklist before packaging an immutable snapshot.')
sha = git('rev-parse', 'HEAD').decode().strip()
commit_time = int(git('show', '-s', '--format=%ct', 'HEAD').decode())
output = Path(sys.argv[1] if len(sys.argv) > 1 else '/mnt/data/Chaos_Party_Fracture_Beta.zip')
output.parent.mkdir(parents=True, exist_ok=True)
prefix = 'Chaos_Party_Fracture_Beta/'
def blob(name):
    return git('show', f'HEAD:{name}')
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    def add(name, data, mode=0o100644):
        info = zipfile.ZipInfo(prefix + name, time.gmtime(commit_time)[:6])
        info.create_system = 3
        info.external_attr = mode << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data)
    for line in git('ls-tree', '-r', 'HEAD', '--', *paths).decode().splitlines():
        meta, name = line.split('\t', 1)
        mode = int(meta.split()[0], 8)
        if any(part in name.split('/') for part in ['node_modules', 'data', '.env']) or name.endswith(('.db', '.sqlite', '.zip')):
            raise SystemExit(f'Refusing unexpected release member: {name}')
        add(name, blob(name), mode)
    add('Start_Chaos_Party.command', blob('experiments/fracture-phone-tv/package/Start_Chaos_Party.command'), 0o100755)
    add('README_FIRST.txt', blob('experiments/fracture-phone-tv/package/README_FIRST.txt'))
    add('package.json', blob('experiments/fracture-phone-tv/package/package.json'))
    add('THIRD_PARTY_NOTICES.txt', blob('experiments/fracture-phone-tv/package/THIRD_PARTY_NOTICES.txt'))
    add('SOURCE.txt', f'Chaos Party experimental beta\nSource commit: {sha}\nBranch: spike/fracture-phone-tv\nFracture: 642c00a8a2d3a95979e85bbfa3f62deee611a4a6\npnpm: 10.34.9\nNo accounts, credentials, databases, node_modules or raw upstream assets are bundled.\n'.encode())
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.zip.sha256').write_text(f'{digest}  {output.name}\n')
print(json.dumps({'zip': str(output), 'bytes': output.stat().st_size, 'sha256': digest, 'source': sha}))
