#!/usr/bin/env python3
"""Paired fresh-process source-to-object measurements, including CLI startup."""
import argparse
import hashlib
import json
import pathlib
import platform
import re
import statistics
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('baseline', type=pathlib.Path)
parser.add_argument('current', type=pathlib.Path)
parser.add_argument('report', type=pathlib.Path)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[2]
compilers = {'baseline': args.baseline.resolve(), 'current': args.current.resolve()}
digest = lambda data: hashlib.sha256(data).hexdigest()
report = {'platform': platform.platform(), 'warmups': 2, 'pairs': 12,
          'method': 'Alternating fresh CLI processes; read/grammar/compile/lower/optimize/emit and wall time; milliseconds',
          'compilers': {name: {'path': str(path), 'sha256': digest(path.read_bytes())}
                        for name, path in compilers.items()}, 'cases': {}}
with tempfile.TemporaryDirectory(prefix='tower-performance-') as directory:
    output = pathlib.Path(directory) / 'program.o'
    for fixture in ('functions', 'collections', 'templates'):
        source = root / 'scaffolding/examples' / (fixture + '.tower')
        samples = {name: {} for name in compilers}
        expected = None
        for sample in range(report['warmups'] + report['pairs']):
            order = list(compilers)
            if sample % 2:
                order.reverse()
            for name in order:
                start = time.perf_counter()
                result = subprocess.run([str(compilers[name]), str(source), '--timings',
                    '--bedrock', str(root / 'scaffolding/bedrock.tower'),
                    '--foundation', str(root / 'scaffolding/foundation.tower'),
                    '--target', 'x86_64-unknown-linux-gnu', '--emit', 'object', '-o', str(output)],
                    capture_output=True, text=True, check=True)
                wall = (time.perf_counter() - start) * 1000
                phases = json.loads(re.search(r'Tower timings \(ms\): (\{.*\})', result.stderr)[1])
                actual = output.read_bytes()
                if expected is None:
                    expected = actual
                assert actual == expected, (fixture, name, 'object mismatch')
                if sample >= report['warmups']:
                    for phase, value in {'wall': wall, **phases}.items():
                        samples[name].setdefault(phase, []).append(value)
        report['cases'][fixture] = {'sourceHash': digest(source.read_bytes()), 'objectHash': digest(expected),
            'timings': {name: {phase: {'median': statistics.median(values), 'samples': values}
                              for phase, values in phases.items()} for name, phases in samples.items()}}
        print(fixture, json.dumps({name: {phase: statistics.median(values) for phase, values in phases.items()}
                                   for name, phases in samples.items()}), flush=True)
args.report.write_text(json.dumps(report, indent=2) + '\n')
