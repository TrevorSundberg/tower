"""LLVM -> compilable foundation -> private execution cache differential tests.
Usage: python3 scaffolding/tests/bytecode-llvm.py /path/to/towerc build/output
"""
from pathlib import Path
import subprocess
import sys
import json

compiler = str(Path(sys.argv[1]).resolve())
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
cases = [
    'print(42);',
    'fn sum(n: u32): u32 { var a: u32 = 0; var i: u32 = 0; loop { var done = i == n; if done { break; } a = a + i; i = i + 1; } return a; } print(sum(100));',
    'fn swap(n: u32): u32 { var a: u32 = 1; var b: u32 = 2; loop { var stop = n == 0; if stop { break; } var t = a; a = b; b = t; n = n - 1; } return a; } print(swap(9)); print(swap(10));',
    'fn f(n: i32): i32 { var stop = n <= 1; if stop { return 1; } var p = n - 1; p = f(p); p = p * n; return p; } print(f(8));',
    'var n: i32 = 0; fn next(): i32 { n = n + 1; return n; } fn add(a: i32, b: i32): i32 { var r = a + b; return r; } print(add(next(), add(next(), next()))); print(n);',
    'var p = alloc(u8, 8); fill(p, 93, 8); p = realloc(u8, p, 128); var q = alloc(u8, 128); copy(q, p, 128); print(q[0]); print(q[7]); free(q); free(p);',
    'struct S { x: u8; y: i64; z: void*; } var s: S; s.y = -3; var p = &s.y; print(*p); print(sizeof(S)); print(alignof(S)); print(sizeof(usize));',
    'var a: i32[4]; a[2] = 42; var p = &a[1]; p = p + 1; print(*p);',
    'var a: i32 = 2147483647; a = a + 1; print(a); var b: u64 = 18446744073709551615; b = b + 1; print(b);',
    'var a: i64 = -9223372036854775808; print(a); var b: u64 = 18446744073709551615; print(b); var q: i32 = -7; q = q / 3; print(q);',
    'fn f(x: bool): u32 { var n: u32 = 2; if x { n = 4; } return n; } print(f(true)); print(f(false));',
    'var p = "Hello"; print(p[0]); print(p[4]); print(p[5]);',
    'var a: u32 = 7;\nvar b: u32 = 0;\nvar q = a / b; print(q);',
    'var a: i32 = -2147483648; var b: i32 = -1; var q = a / b; print(q);',
    'var a: u64 = 256; var b = convert(u8, a); print(b);',
]
cases.extend(row[1] for row in json.loads(Path(__file__).with_name('llvm-scalar-idioms.json').read_text()))
for before, after, values in [
    ('u64', 'i64', ['9223372036854775807', '9223372036854775808']),
    ('i64', 'u64', ['-1', '9223372036854775807']),
    ('i64', 'i32', ['-2147483649', '-2147483648', '2147483647', '2147483648']),
    ('u64', 'u8', ['255', '256']),
    ('i32', 'u32', ['-1', '2147483647']),
    ('u32', 'i32', ['2147483647', '2147483648']),
    ('u64', 'usize', ['4294967295', '4294967296']),
    ('i64', 'bool', ['-9223372036854775808', '0']),
]:
    for value in values:
        cases.append(f'var a: {before} = {value}; var b = convert({after}, a); print(b);')

def run(*args):
    return subprocess.run([compiler, *map(str, args)], capture_output=True, timeout=30)

runs = 0
for width, target in [(4, 'wasm32-unknown-unknown'), (8, 'wasm64-unknown-unknown')]:
    for i, source in enumerate(cases):
        path = output / f'case-{i}.tower'
        path.write_text(source)
        reference = run(path, '--target', target, '--interpret')
        for optimize in [False, True]:
            flags = [] if optimize else ['--no-optimize']
            actual = run(path, '--target', target, '--interpret-fast', *flags)
            assert actual.returncode == reference.returncode and actual.stdout == reference.stdout, (width, i, optimize, actual, reference)
            if reference.returncode:
                assert actual.stderr == reference.stderr, (width, i, optimize, actual.stderr, reference.stderr)
            package = output / f'case-{i}-{width}-{optimize}.towerbc'
            encoded = run(path, '--target', target, '--emit', 'bytecode', '-o', package, *flags)
            assert encoded.returncode == 0, (width, i, optimize, encoded.stderr)
            data = package.read_bytes()
            assert int.from_bytes(data[24:28], 'little') == (1 if optimize else 2)
            loaded = run(package)
            assert loaded.returncode == reference.returncode and loaded.stdout == reference.stdout, (width, i, optimize, loaded)
            text = output / f'case-{i}-{width}-{optimize}.disassembled.tower'
            disassembled = run(package, '--emit', 'foundation', '-o', text)
            assert disassembled.returncode == 0, disassembled.stderr
            graph = run(text, '--target', target, '--interpret')
            assert graph.returncode == reference.returncode and graph.stdout == reference.stdout, (width, i, optimize, graph)
            repeated = run(path, '--target', target, '--emit', 'bytecode', '-o', package, *flags)
            assert repeated.returncode == 0 and package.read_bytes() == data, 'Nondeterministic package'
            runs += 1
print(f'LLVM bytecode comparisons passed: {runs} (both widths, optimized/debug, graph/cache/load/round-trip/determinism)')
