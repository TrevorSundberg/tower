"""Compile the C files captured by playground/scripts/verify-deployment.mjs.

Run in the Linux Clang/GCC environment after the deployment verifier. The emitted
expected.json can then be consumed by c-backend-msvc.ps1 in the same directory.
"""
import json
import pathlib
import subprocess
import sys

directory = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'build/deployment-verification').resolve()
cases = []
for profile in ['desktop', 'mobile']:
    for mode in ['raw', 'optimized']:
        name = profile + '-c-' + mode
        source = directory / (name + '.c')
        assert 'int main(void)' in source.read_text()
        for cc, language in [('clang', 'c89'), ('gcc', 'c89'), ('clang++', 'c++98'), ('g++', 'c++98')]:
            for level in ['-O0', '-O2']:
                exe = directory / (name + '-' + cc.replace('+', 'p') + level)
                result = subprocess.run([cc, '-x', 'c++' if '++' in cc else 'c', '-std=' + language,
                    '-pedantic', '-Wall', '-Wextra', '-Werror', level, str(source), '-o', str(exe)],
                    capture_output=True, text=True, timeout=60)
                assert (result.returncode, result.stderr) == (0, ''), (name, cc, result.stderr)
                result = subprocess.run([str(exe)], capture_output=True, text=True, timeout=10)
                assert (result.returncode, result.stdout, result.stderr) == (0, '42\n', ''), (name, cc, result)
        cases.append({'name':name, 'file':source.name, 'stdout':'42\n', 'stderr':'', 'code':0})
        print(name + ': browser C matches execution in C89/C++98 O0/O2', flush=True)
(directory / 'expected.json').write_text(json.dumps(cases))
print('32 warning-free Clang/GCC browser-output checks passed')
