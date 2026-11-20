#!/usr/bin/env python3
"""Inventory tracked native project artifacts and, optionally, build inputs."""
import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--build', type=Path)
parser.add_argument('--target', default='towerc')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[2]
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
groups = {}
for name in tracked:
    path = Path(name)
    if path.suffix not in ('.c', '.cpp', '.h', '.hpp', '.inc') or not (root / path).exists():
        continue
    if name.startswith('third_party/'):
        continue
    if name.startswith('docs/research/'):
        group = 'research: explicitly archive or translate; not a production successor'
    elif name.startswith('scaffolding/bootstrap/'):
        group = 'bootstrap/references: retire after whole-compiler and differential gates'
    elif '/tests/' in name or name.endswith('-tests.cpp'):
        group = 'native tests: port assertions/fixtures to Tower before retirement'
    elif name in ('scaffolding/driver.cpp', 'scaffolding/compiler-host.hpp'):
        group = 'host: integrate Tower lifecycle/backend interfaces then retire adapter'
    elif '/llvm-' in name:
        group = 'backend owner: Tower lowering and linker interface required'
    elif name == 'scaffolding/runtime.c':
        group = 'runtime owner: Tower target runtimes and startup required'
    else:
        group = 'frontend/runtime owners: shared-node native adapters and interfaces'
    groups.setdefault(group, []).append(name)
report = {'revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root).decode().strip(),
          'scope': 'tracked project-owned native files still present (working tree)', 'groups': groups}
if args.build:
    inputs = subprocess.check_output(['ninja', '-C', str(args.build), '-t', 'inputs', args.target], text=True)
    active = []
    for name in inputs.splitlines():
        path = Path(name)
        if not path.is_absolute():
            path = args.build / path
        path = path.resolve()
        if path.is_relative_to(root) and path.suffix in ('.c', '.cpp'):
            name = path.relative_to(root).as_posix()
            if not name.startswith('third_party/'):
                active.append(name)
    report['build'] = {'target': args.target, 'native_inputs_including_bootstrap_dependencies': sorted(set(active))}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({group: len(files) for group, files in groups.items()}, indent=2))
