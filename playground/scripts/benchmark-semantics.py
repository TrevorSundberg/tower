#!/usr/bin/env python3
"""Usage: benchmark-semantics.py BEFORE_COMPILER AFTER_COMPILER (native CLI)."""
import json
import pathlib
import statistics
import subprocess
import sys

root = pathlib.Path(__file__).resolve().parents[2]
paths = sys.argv[1:]
assert len(paths) == 2, 'Supply before and after native compiler paths'
report = {'compilers': paths, 'warmups': 2, 'samples': 9, 'cases': {}}
for name in ['examples/structs', 'tests/semantics']:
    for target in ['wasm32-unknown-unknown', 'x86_64-pc-linux-gnu']:
        samples = [[], []]
        expected = None
        for iteration in range(11):
            for stage, compiler in enumerate(paths):
                result = subprocess.run([compiler, str(root / f'scaffolding/{name}.tower'),
                    '--interpret', '--timings', '--target', target,
                    '--bedrock', str(root / 'scaffolding/bedrock.tower'),
                    '--foundation', str(root / 'scaffolding/foundation.tower')],
                    check=True, capture_output=True, text=True)
                if expected is None:
                    expected = result.stdout
                assert result.stdout == expected
                timings = json.loads(result.stderr.split('Tower timings (ms): ')[1])
                if iteration >= 2:
                    samples[stage].append(timings['compile'])
        medians = [statistics.median(s) for s in samples]
        report['cases'][f'{name}-{target}'] = dict(beforeMs=medians[0], afterMs=medians[1],
            ratio=medians[1] / medians[0], samples=samples)
print(json.dumps(report, indent=2))
