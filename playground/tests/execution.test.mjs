import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower, runToEnd } from './compiler-fixtures.mjs';
const tower = await loadTower(await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url)), undefined,
  await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8'));
const grammar = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const example = await readFile(new URL('../../scaffolding/examples/execution.tower', import.meta.url), 'utf8');
function run(source, budget = 10000, prefix = '') {
  const handle = tower.compile(prefix + '\n' + source);
  try { return { ...tower.execute(handle, budget), source: tower.foundation(handle).source }; }
  finally { tower.destroyExecution(handle); }
}

test('expanded trees lower to typed operations and execute the actual example', () => {
  const result = run(example);
  assert.equal(result.status, 'done', result.error);
  assert.equal(result.output, '15\n16\n');
  assert.match(result.source, /count = count \+ 1;/);
  assert.doesNotMatch(result.source, /increment/);
  assert.match(result.source, /\*alias = total \+ 1;/);
  const alternate = grammar + "\nparse Statement |= 'say' $value:CoreOperand ';' => replace { print($value); };";
  assert.equal(run('say 7;', 10000, alternate).output, '7\n', 'syntax is defined by the Tower grammar');
});

test('integer semantics are explicit: wrapping, signedness, conversions and traps', () => {
  for (const [source, output] of [
    ['var a: i32; a = 2147483647; a = a + 1; print(a);', '-2147483648\n'],
    ['var a: u32; a = 4294967295; a = a + 1; print(a);', '0\n'],
    ['var a: i32; a = -5; a = a / 2; print(a); a = -5; a = a % 2; print(a);', '-2\n-1\n'],
    ['var a: u32; var b: u32; a = 4294967295; b = a / 2; print(b);', '2147483647\n'],
    ['var a: i32; var b: u32; a = -1; b = bits(u32, a); print(b);', '4294967295\n'],
    ['var a: i32; var b: u32; var c: bool; a = 42; b = convert(u32, a); c = convert(bool, b); print(b); print(c);', '42\ntrue\n'],
    ['var a: bool; a = true == false; print(a);', 'false\n'],
    ['var a: u32; var b: bool; a = 4294967295; b = a > 2147483648; print(b);', 'true\n'],
    ['var a: i32; a = 7 & 3; print(a); a = 8 | 3; print(a); a = a ^ 1; print(a);', '3\n11\n10\n'],
  ]) {
    const result = run(source);
    assert.equal(result.status, 'done', `${source}: ${result.error}`);
    assert.equal(result.output, output, source);
  }
  for (const [source, error] of [
    ['var a: i32; a = 1 / 0;', /Division by zero/],
    ['var a: i32; a = -2147483648 / -1;', /Signed division overflow/],
    ['var a: i32; var b: u32; a = -1; b = convert(u32, a);', /conversion out of range/],
    ['var a: u32; var b: i32; a = 4294967295; b = convert(i32, a);', /conversion out of range/],
  ]) assert.match(run(source).error, error, source);
});

test('type errors anywhere prevent all execution, including unreachable code', () => {
  for (const [source, error] of [
    ['var a: i32; var b: u32; a = b;', /Expected i32, got u32/],
    ['var a: i32; a = true;', /Expected i32, got bool/],
    ['if 1 {}', /integer type/],
    ['var a: i32; a = 2147483648;', /out of range/],
    ['var a: u32; a = -1;', /out of range/],
    ['var a: i32; a = 99999999999999999999999999999;', /out of range/],
    ['var a: i32; var a: i32;', /Duplicate module variable/],
    ['var a: i32; a = missing;', /Unknown local/],
    ['var a: i32; a = 1 == 1;', /Expected i32, got bool/],
    ['break;', /enclosing loop/],
    ['continue;', /enclosing loop/],
    ['if false { var a: i32; a = true; }', /Expected i32, got bool/],
    ['var a: i32; a = 1 + 2 * 3;', /Unexpected/],
  ]) {
    const result = run('print(99); ' + source);
    assert.equal(result.status, 'error', source);
    assert.match(result.error, error, source);
    assert.equal(result.steps, 0, source);
    assert.equal(result.output, '', source);
  }
});

test('typed pointers preserve raw aliasing and indirection', () => {
  const good = run('var a: i32; var p: i32*; var q: i32*; var pp: i32**; p = &a; q = p; pp = &p; *q = 41; *p = a + 1; q = *pp; var b: i32; b = *q; print(b); var same: bool; same = p == q; print(same);');
  assert.equal(good.status, 'done', good.error);
  assert.equal(good.output, '42\ntrue\n');
  for (const [source, error] of [
    ['var a: i32; var p: u32*; p = &a;', /Expected u32\*, got i32\*/],
    ['var a: i32; var p: i32*; p = &a; *p = true;', /Expected i32, got bool/],
    ['var a: i32; var p: i32*; p = &a; var b: u32; b = *p;', /Expected u32, got i32/],
    ['var a: u64 = 0; var p: i32*; p = bits(i32*, a);', /equal-width/],
  ]) assert.match(run(source).error, error, source);
});

test('nested structured control flow, scope, and resumable loops', () => {
  const result = run('var a: i32; a = 0; var stop: bool; loop { a = a + 1; stop = a < 3; if stop { continue; } else { loop { break; } break; } } print(a); { var a: i32; a = 9; print(a); } print(a);');
  assert.equal(result.status, 'done', result.error);
  assert.equal(result.output, '3\n9\n3\n');
  assert.match(run('{ var hidden: i32; } print(hidden);').error, /Unknown local/);
  const handle = tower.compile(grammar + '\nloop {}');
  try {
    assert.equal(tower.execute(handle, 0).steps, 0);
    assert.equal(tower.execute(handle, 100).steps, 100);
    const next = tower.execute(handle, 250);
    assert.equal(next.status, 'executing'); assert.equal(next.steps, 350);
  } finally { tower.destroyExecution(handle); }
});

test('output is bounded, drained once, and machines release their parse trees', () => {
  const before = tower.exports.tw_live_nodes();
  const handle = tower.compile(grammar + '\nloop { print(1234567890); }');
  try {
    const result = tower.execute(handle, 100000);
    assert.equal(result.status, 'executing'); assert.equal(result.outputTruncated, true);
    assert.ok(result.output.length <= 65536);
    assert.equal(tower.execute(handle, 1000).output, '');
  } finally { tower.destroyExecution(handle); }
  assert.equal(tower.exports.tw_live_nodes(), before);
  assert.equal(tower.execute(handle).status, 'error');
});

test('replacement diagnostics retain invocation coordinates, including UTF-8', () => {
  const text = grammar + "\nparse Statement |= 'bad' => replace { print(missing); };\n// λ\nbad";
  const handle = tower.compile(text);
  try {
    const result = tower.execute(handle);
    assert.match(result.error, /Unknown local 'missing'/);
    assert.equal(result.errorOffset, Buffer.byteLength(text.slice(0, text.lastIndexOf('bad'))));
  } finally { tower.destroyExecution(handle); }
  assert.match(run("parse Statement = 'custom'; custom", 100, '').error, /No execution semantics/);
});

test('editing the executable example reuses every compiled grammar revision', () => {
  const handle = tower.create(example);
  try {
    assert.equal(runToEnd(tower, handle).end.status, 'done');
    tower.reset(handle, example.replace('count == 5', 'count == 6'));
    const result = runToEnd(tower, handle);
    assert.equal(result.end.status, 'done', result.end.error);
    const snapshot = tower.inspect(handle);
    assert.equal(snapshot.grammarBuilds, 0);
    assert.ok(snapshot.grammarCacheHits >= 1);
  } finally { tower.destroy(handle); }
});

test('edited semantic rules fail with diagnostics instead of invalid node access', () => {
  for (const source of [
    "parse CoreIf = 'broken'; broken",
    "parse CoreAssign = 'broken'; broken",
    "parse CoreCallStatement = 'broken'; broken",
    "parse CoreAddress = 'broken'; var p: i32* = broken;",
    "parse CoreLoad = 'broken'; var a: i32 = broken;",
    "parse CoreCall = 'broken'; var a: i32 = broken;",
    "parse CoreFunction = 'broken'; broken",
  ]) {
    const result = run(source);
    assert.equal(result.status, 'error', source);
    assert.equal(result.steps, 0, source);
    assert.match(result.error, /Missing foundation tree|missing capture/, source);
  }
});
