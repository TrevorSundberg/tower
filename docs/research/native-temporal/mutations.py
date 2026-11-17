"""Compile deliberate runtime defects; only behavioral test failures count.

Run after build.ps1. Never modifies repository source or the normal executable.
"""
import argparse
from pathlib import Path
import subprocess
import json

ap = argparse.ArgumentParser()
ap.add_argument('--out', type=Path, default=Path('build/temporal-native'))
args = ap.parse_args()
out = args.out.resolve()
source = Path(__file__).with_name('benchmark.cpp').resolve()
text = source.read_text()
command = (out / 'compile.cmd').read_text()
cases = {
    'lost_dependency': ('p->versions[v].head = e;', '/* dropped producer subscription */'),
    'read_present_in_past': ('return value(p, read.version);', 'return p->state[c];'),
    'publish_failed_repair': ('if (!p->trapped) for (uint32_t v : p->changed)',
                             'if (true) for (uint32_t v : p->changed)'),
    'schedule_no_op': ('if (value(p, v) == val) return;', '/* ignored value equality */'),
}
results = []
for name, (before, after) in cases.items():
    assert text.count(before) == 1, name
    mutated = out / f'mutation-{name}.cpp'
    # Relative includes must still resolve from the original source directory.
    mutated.write_text(text.replace(before, after).replace('#include "native_temporal.h"',
                      f'#include "{source.with_name("native_temporal.h").as_posix()}"'))
    exe = out / f'mutation-{name}.exe'
    cmd = command.replace(str(source).replace('\\', '/'), str(mutated))
    # build.ps1 uses mixed Windows separators; normalize quoted source replacement.
    import re
    cmd = re.sub(r'"[^"\r\n]*[\\/]benchmark\.cpp"', lambda _: f'"{mutated}"', cmd)
    cmd = cmd.replace('temporal-native.exe', exe.name).replace('runtime.obj', f'mutation-{name}.obj')
    batch = out / f'mutation-{name}.cmd'; batch.write_text(cmd)
    compiled = subprocess.run(['cmd', '/d', '/c', str(batch)], capture_output=True, text=True)
    if compiled.returncode:
        raise RuntimeError(f'{name}: compilation failure does NOT count\n{compiled.stdout}\n{compiled.stderr}')
    tested = subprocess.run([str(exe), '--test'], capture_output=True, text=True)
    detected = tested.returncode == 1 and 'FAIL:' in tested.stderr
    results.append({'mutation': name, 'detected': detected, 'diagnostic': tested.stderr.strip()})
    if not detected:
        raise RuntimeError(f'{name}: survived or crashed, not an assertion failure\n{tested.stdout}\n{tested.stderr}')
print(json.dumps({'type': 'mutations', 'detected': len(results), 'survivors': 0, 'results': results}, indent=2))
