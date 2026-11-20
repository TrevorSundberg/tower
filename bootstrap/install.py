#!/usr/bin/env python3
"""Install the pinned development compiler; never download or select an unpinned binary."""
import argparse
import hashlib
import json
import os
import platform
from pathlib import Path, PurePosixPath
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parent


def digest(data):
    return hashlib.sha256(data).hexdigest()


def install(cache):
    if platform.system() != 'Linux' or platform.machine() not in ('x86_64', 'AMD64'):
        raise ValueError('The pinned development bootstrap runs in the linux/amd64 build container. '
                         'Use ./build.sh bash playground/scripts/build-native.sh; see bootstrap/README.md.')
    manifest = json.loads((ROOT / 'development.json').read_text())
    if manifest['schema'] != 1 or manifest['host'] != 'linux-x64-ubuntu24-llvm19':
        raise ValueError('Unsupported development bootstrap manifest')
    archive = (ROOT / manifest['archive']).resolve()
    if not archive.is_relative_to(ROOT):
        raise ValueError('Bootstrap archive must be inside bootstrap/')
    if digest(archive.read_bytes()) != manifest['sha256']:
        raise ValueError('Bootstrap archive checksum mismatch')
    expected = manifest['files']
    for name in expected:
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or '\\' in name or not path.parts:
            raise ValueError('Invalid bootstrap member path')
    cache = cache.resolve()
    cache.mkdir(parents=True, exist_ok=True)
    destination = cache / manifest['sha256']

    def verify(folder):
        for name, item in expected.items():
            path = folder / name
            if path.is_symlink() or not path.is_file() or digest(path.read_bytes()) != item['sha256']:
                raise ValueError(f'Invalid cached bootstrap member: {path}')
        if not os.access(folder / 'towerc', os.X_OK):
            raise ValueError('Cached bootstrap compiler is not executable')

    if not destination.exists():
        with tempfile.TemporaryDirectory(prefix='install-', dir=cache) as temporary:
            stage = Path(temporary) / 'package'
            stage.mkdir()
            with tarfile.open(archive, 'r:gz') as package:
                members = package.getmembers()
                if len(members) != len(expected) or {m.name for m in members} != set(expected):
                    raise ValueError('Bootstrap archive members disagree with manifest')
                for member in members:
                    if not member.isfile() or member.size != expected[member.name]['size']:
                        raise ValueError('Invalid bootstrap archive member')
                    data = package.extractfile(member).read()
                    if digest(data) != expected[member.name]['sha256']:
                        raise ValueError('Bootstrap member checksum mismatch')
                    target = stage / member.name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
                    target.chmod(0o755 if member.name == 'towerc' else 0o644)
            verify(stage)
            try:
                stage.rename(destination)
            except OSError:
                if not destination.exists():
                    raise
    verify(destination)
    return destination / 'towerc'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=Path.home() / '.cache/tower/bootstrap')
    args = parser.parse_args()
    try:
        print(install(args.cache))
    except (ValueError, OSError, KeyError, tarfile.TarError) as error:
        parser.exit(1, f'{error}\n')
