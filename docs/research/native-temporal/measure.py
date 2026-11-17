"""Run the already-built executable sequentially and retain raw samples + provenance."""
import argparse
import datetime
import hashlib
import json
import platform
import subprocess
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('--build', type=Path, default=Path('build/temporal-native'))
ap.add_argument('--output', type=Path, default=Path('build/temporal-native/measurements.json'))
ap.add_argument('--trials', type=int, default=15)
args = ap.parse_args()
build = args.build.resolve()
exe = build / 'temporal-native.exe'
def run(*command):
    result = subprocess.run([str(exe), *map(str, command)], capture_output=True, text=True, check=True)
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]

rows = run(1024, 64, args.trials)
rows += run('--disk', build / 'history.bin')
rows += run('--reopen', build / 'history.bin')
source = Path(__file__).parent
files = [source / n for n in ['benchmark.cpp', 'generate.py', 'native_temporal.h', 'build.ps1']]
files += [source.parent / 'temporal-core.h']
files += [build / n for n in ['temporal-native.exe', 'plain.obj', 'undo.obj', 'tracked.obj']]
cpu = subprocess.run(['powershell', '-NoProfile', '-Command',
                      '(Get-CimInstance Win32_Processor).Name'], capture_output=True, text=True, check=True).stdout.strip()
report = {
    'measured_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'platform': platform.platform(), 'processor': cpu,
    'runtime_compiler': 'MSVC x64 /O2 /EHsc /std:c++17; no LTO',
    'runtime_compiler_banner': (build / 'compiler-version.txt').read_text() if
                               (build / 'compiler-version.txt').exists() else 'Not captured by this build',
    'llvm': json.loads((build / 'llvm-audit.json').read_text()),
    'method': 'One discarded warmup and medians of raw samples. Native steady_clock. '
              'Allocation, setup and oracle excluded; recording first touches included. '
              'Forward order rotated; repair order fixed. No affinity, frequency lock or hardware counters.',
    'sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
    'results': rows,
}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(report, indent=2) + '\n')
for r in rows:
    if r['type'] == 'benchmark':
        print(f"mode={r['mode']} work={r['work']} edits={r['edits']}: "
              f"record {r['tracked_record_ms']/r['plain_ms']:.2f}x plain; "
              f"repair {r['repair_ms']:.4f}ms vs snapshot {r['snapshot_replay_ms']:.4f}ms; "
              f"regions={r['regions_rerun']}")
    else:
        print(json.dumps(r))
