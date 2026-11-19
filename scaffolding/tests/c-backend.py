"""Generate C from shared Foundation; compare strict C/C++ builds to Tower.

Run in the documented Linux toolchain: python3 scaffolding/tests/c-backend.py
  /path/to/towerc build/c-validation
Generated sources and expected JSON are also consumed by c-backend-msvc.ps1.
"""
import json
import pathlib
import subprocess
import sys

compiler = str(pathlib.Path(sys.argv[1]).resolve())
output = pathlib.Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)


def run(args, success=True):
    result = subprocess.run(list(map(str, args)), capture_output=True, text=True, timeout=120)
    if success and result.returncode:
        raise AssertionError(f'{args}\n{result.stdout}\n{result.stderr}')
    return result


cases = {}
for name in ['execution', 'functions', 'structs', 'memory', 'inference', 'templates', 'control', 'collections']:
    file = pathlib.Path('scaffolding/examples') / (name + '.tower')
    if file.exists():
        cases[name] = file.read_text()

scalars = []
for kind, a, b in [('u8', '250', '3'), ('u32', '4294967294', '3'), ('i32', '-17', '3'),
                   ('u64', '18446744073709551614', '3'), ('i64', '-5000000000', '3')]:
    for op in ['+', '-', '*', '/', '%', '&', '|', '^', '==', '!=', '<', '<=', '>', '>=']:
        scalars.append('{var a: ' + kind + ' = ' + a + '; var b: ' + kind + ' = ' + b +
                       '; var c = a ' + op + ' b; print(c);}')
cases['integers'] = '\n'.join(scalars)
cases['conversion'] = '''var a: i32 = -1; print(bits(u32,a)); print(convert(i64,a));
var b: i64 = -9223372036854775808; print(convert(i64,b)); print(convert(bool,b));
var c: u64 = 18446744073709551615; print(bits(i64,c)); print(convert(u8,42));
var p = alloc(u32, 3); p[0] = 42; var q = p + 2; q = q - 2; print(q[0]);
var address = bits(usize,p); var r = bits(u32*,address); print(r[0]); free(p);'''
cases['order'] = '''var state: i32;
fn next(): i32 { state = state + 1; return state; }
fn pair(a:i32,b:i32):i32 { var value = a * 10; value = value + b; return value; }
print(pair(next(),next())); {var state:i32=7; print(state);} print(state);'''
cases['alias'] = '''struct Pair { first:u8; second:u64; }
var value:Pair; value.second = 18446744073709551615; var raw = bits(u8*, &value.second);
raw[0] = 1; print(value.second); print(sizeof(Pair)); print(alignof(Pair));
var bytes = alloc(u8,16); var unaligned = bytes + 1; var wide = bits(u64*,unaligned);
*wide = 123456789; print(*wide); copy(bytes,unaligned,8); var bp=bits(u64*,bytes); print(*bp); free(bytes);'''
cases['comments'] = '''// carry source notes
fn answer():i32 { /* nested note */ return 42; }
print(answer()); // trailing note
'''
cases['labels'] = '''fn choose(x:bool):i32 { if x { jump(yes); } else { jump(no); }
label(yes); return 1; label(no); return 2; } print(choose(false));'''
cases['pointers'] = 'var p:u8*=null; print(p); p=bits(u8*,convert(usize,4660)); print(p);'
cases['constant-control'] = '''fn always():i32 { if true { return 42; } }
fn forever():i32 { loop { if false { break; } return 17; } return 1; }
fn dead():i32 { if false { jump(unused); } return 5; label(unused); return 9; }
fn backwards():i32 { jump(last); label(first); return 7; label(last); jump(first); }
print(always()); print(forever()); print(dead()); print(backwards());'''
cases['long-string'] = 'var text="' + ('x' * 1200) + '"; print(text[1199]);'
cases['signed-rounding'] = '''var a:i64=-17; var b:i64=-3;
var q=a/b; var r=a%b; print(q); print(r); a=17;
q=a/b; r=a%b; print(q); print(r);'''
cases['signed-abi'] = '''export fn signed32(value:i32):i32 { return value; }
export fn signed64(value:i64):i64 { return value; }
print(signed32(-2147483648)); print(signed64(-9223372036854775808));'''
cases['comment-preprocessing'] = '// trigraph ??/ and trailing ' + chr(92) + '\nprint(42);\n'
for name, source in {
    'zero': 'var a = 1 / 0;',
    'overflow': 'var a = -2147483648 / -1;',
    'overflow64': 'var a:i64=-9223372036854775808; var b = a % -1;',
    'range': 'var a:i32=-1; print(convert(u32,a));',
    'range64': 'var a:u64=18446744073709551615; print(convert(i64,a));',
}.items():
    cases['trap-' + name] = source

results = []
for name, source in cases.items():
    path = output / (name + '.tower')
    path.write_text(source)
    graph = run([compiler, path, '--interpret'], success=False)
    if graph.returncode and not name.startswith('trap-'):
        raise AssertionError(graph.stderr)
    for optimize in [False, True]:
        stem = name + ('-optimized' if optimize else '-raw')
        c = output / (stem + '.c')
        options = [] if optimize else ['--no-optimize']
        run([compiler, path, '--emit', 'c', '-o', c, *options])
        assert 'int main(void)' in c.read_text()
        if name == 'comments':
            assert 'carry source notes' in c.read_text()
            assert 'nested note' in c.read_text()
            assert 'trailing note' in c.read_text()
        # Differential oracle includes the native LLVM path with identical options.
        native = output / (stem + '-native')
        run([compiler, path, '-o', native, *options])
        expected = run([native], success=False)
        assert expected.stdout == graph.stdout, (name, graph.stdout, expected.stdout)
        assert bool(expected.returncode) == bool(graph.returncode), name
        for cc, language in [('clang', 'c89'), ('gcc', 'c89'), ('clang++', 'c++98'), ('g++', 'c++98')]:
            for level in ['-O0', '-O2']:
                exe = output / (stem + '-' + cc.replace('+', 'p') + level)
                args = [cc, '-x', 'c++' if '++' in cc else 'c', '-std=' + language,
                        '-pedantic', '-Wall', '-Wextra', '-Werror', level, c, '-o', exe]
                built = run(args)
                assert not built.stderr.strip(), (args, built.stderr)
                actual = run([exe], success=False)
                assert (actual.stdout, actual.stderr, actual.returncode) == (expected.stdout, expected.stderr, expected.returncode), (args, actual, expected)
        results.append({'name':stem, 'file':c.name, 'stdout':expected.stdout, 'stderr':expected.stderr, 'code':expected.returncode})
        print(stem + ': C89/C++98 Clang/GCC O0/O2 match graph and native', flush=True)
(output / 'expected.json').write_text(json.dumps(results, indent=2))
print(f'{len(results) * 8} warning-free compiled C/C++ checks passed')
