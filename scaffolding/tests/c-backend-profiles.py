"""Exercise modern integer headers and both explicit pointer profiles.

Run after c-backend.py, with the same compiler and artifact directory arguments.
Requires Clang/GCC and their 32-bit hosted libraries (gcc/g++-multilib on Ubuntu).
"""
import pathlib
import subprocess
import sys

compiler = str(pathlib.Path(sys.argv[1]).resolve())
directory = pathlib.Path(sys.argv[2]).resolve()


def run(args, success=True):
    result = subprocess.run(list(map(str, args)), capture_output=True, text=True, timeout=120)
    if success and result.returncode:
        raise AssertionError((args, result.stderr))
    return result


checks = 0
for width, triple in [(32, 'wasm32-unknown-unknown'), (64, 'x86_64-unknown-linux-gnu')]:
    for name in ['integers', 'pointers', 'alias', 'conversion', 'constant-control', 'signed-rounding']:
        source = directory / (name + '.tower')
        expected = run([compiler, source, '--target', triple, '--interpret'])
        for optimize in [False, True]:
            stem = name + f'-{width}-' + ('optimized' if optimize else 'raw')
            c = directory / (stem + '.c')
            run([compiler, source, '--target', triple, '--emit', 'c', '-o', c,
                 *([] if optimize else ['--no-optimize'])])
            for cc, language in [('clang', 'c99'), ('gcc', 'c99'), ('clang++', 'c++11'), ('g++', 'c++11')]:
                executable = directory / (stem + '-' + cc.replace('+', 'p'))
                built = run([cc, '-x', 'c++' if '++' in cc else 'c', f'-std={language}',
                             f'-m{width}', *(['-malign-double'] if width == 32 else []),
                             '-pedantic', '-Wall', '-Wextra', '-Werror', '-O2', c, '-o', executable])
                assert not built.stderr.strip(), built.stderr
                actual = run([executable])
                assert actual.stdout == expected.stdout and not actual.stderr, (stem, actual, expected)
                checks += 1
            print(stem + ': modern C/C++ profile matches graph', flush=True)
    mismatch = run(['gcc', f'-m{96-width}', '-std=c99', '-c', c, '-o', directory/'mismatched.o'], success=False)
    assert mismatch.returncode and 'tc_pointer_width' in mismatch.stderr
    if width == 32:
        mismatch = run(['gcc', '-m32', '-std=c99', '-c', c, '-o', directory/'misaligned.o'], success=False)
        assert mismatch.returncode and 'tc_u64_alignment' in mismatch.stderr
print(f'{checks} warning-free C99/C++11 profile checks; mismatched pointer layouts rejected')
