"""Compare eligible native LLVM programs with production Tower interpretation.
Usage: python3 scaffolding/tests/interpreter-llvm.py /path/to/towerc build/output
"""
from pathlib import Path
import subprocess
import sys
compiler = str(Path(sys.argv[1]).resolve())
output = Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
cases = [
    'var a: i32 = 2147483647; a = a + 1; print(a); var b: u64 = 18446744073709551615; b = b + 1; print(b);',
    'fn factorial(n: i32): i32 { var stop = n <= 1; if stop { return 1; } var p = n - 1; p = factorial(p); p = p * n; return p; } print(factorial(8));',
    'var n: i32 = 0; fn next(): i32 { n = n + 1; return n; } fn add(a: i32, b: i32): i32 { var r = a + b; return r; } print(add(next(), add(next(), next()))); print(n);',
    'var n: i32 = 0; loop { n = n + 1; var small = n < 3; if small { continue; } loop { print(n); break; } var stop = n == 5; if stop { break; } }',
    'var p = alloc(u8, 8); fill(p, 93, 8); p = realloc(u8, p, 128); var q = alloc(u8, 128); copy(q, p, 128); print(q[0]); print(q[7]); free(q); free(p);',
    'struct S { x: u8; y: i64; z: void*; } var s: S; s.y = -3; var p = &s.y; print(*p); print(sizeof(S)); print(alignof(S)); print(sizeof(usize));',
    'var a: i32[4]; a[2] = 42; var p = &a[1]; p = p + 1; print(*p);',
    'var a: i64 = -9223372036854775808; print(a); var b: u64 = 18446744073709551615; print(b); var q: i32 = -7; q = q / 3; print(q);',
]
for i, source in enumerate(cases):
    path = output / f'case-{i}.tower'
    path.write_text(source)
    interpreted = subprocess.check_output([compiler, str(path), '--interpret'])
    for optimized in [False, True]:
        exe = output / f'case-{i}-{optimized}'
        command = [compiler, str(path), '-o', str(exe)]
        if not optimized:
            command.append('--no-optimize')
        subprocess.run(command, check=True, capture_output=True)
        actual = subprocess.check_output([str(exe)])
        assert actual == interpreted, (i, optimized, actual, interpreted)
print(f'LLVM comparisons passed: {len(cases) * 2} (optimized and unoptimized)')
