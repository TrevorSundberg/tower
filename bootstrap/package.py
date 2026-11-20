#!/usr/bin/env python3
"""Package an explicitly validated Linux development compiler with its resources."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--compiler', type=Path, required=True)
parser.add_argument('--predecessor', type=Path, required=True)
args = parser.parse_args()
compiler = args.compiler.resolve()
sha = lambda data: hashlib.sha256(data).hexdigest()
files = {'towerc': compiler.read_bytes()}
resources = compiler.parent / 'share'
for path in sorted(resources.rglob('*')):
    if path.is_file():
        files[path.relative_to(compiler.parent).as_posix()] = path.read_bytes()
files['LLVM-LICENSE.txt'] = (ROOT / 'third_party/llvm-project/llvm/LICENSE.TXT').read_bytes()
archive = io.BytesIO()
with tarfile.open(fileobj=archive, mode='w') as package:
    for name, data in sorted(files.items()):
        member = tarfile.TarInfo(name)
        member.size = len(data)
        member.mode = 0o755 if name == 'towerc' else 0o644
        package.addfile(member, io.BytesIO(data))
packed = gzip.compress(archive.getvalue(), compresslevel=9, mtime=0)
destination = ROOT / 'bootstrap/linux-x64/towerc.tar.gz'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(packed)
tracked = subprocess.check_output(['git', 'ls-files', '-z', 'scaffolding', 'cmake', 'CMakeLists.txt'], cwd=ROOT).split(b'\0')
inputs = {name.decode(): sha((ROOT / name.decode()).read_bytes()) for name in tracked if name}
manifest = {
    'schema': 1, 'host': 'linux-x64-ubuntu24-llvm19',
    'archive': 'linux-x64/towerc.tar.gz', 'sha256': sha(packed),
    'source_base_revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'source_identity': 'Exact source_files hashes include the working changes accompanying this bootstrap update.',
    'source_files': inputs,
    'build': {'compiler': 'Clang 19.1.1', 'llvm': '19.1.1', 'configuration': 'Release',
              'command': 'cmake --build /cache/c-native --target towerc -j 8',
              'predecessor_sha256': sha(args.predecessor.read_bytes())},
    'dynamic_dependencies': subprocess.check_output(['ldd', str(compiler)], text=True).splitlines(),
    'files': {name: {'sha256': sha(data), 'size': len(data)} for name, data in sorted(files.items())},
}
# Addresses and local loader paths are observations, not a distributable library closure.
(ROOT / 'bootstrap/development.json').write_text(json.dumps(manifest, indent=2, sort_keys=True)+'\n')
print(f'Packaged {len(packed)} bytes, sha256 {sha(packed)}')
