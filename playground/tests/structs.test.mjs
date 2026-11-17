import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower } from '../src/tower-host.mjs';
import { loadLLVM, executeWasm } from '../src/llvm-host.mjs';
import { originalDiagnostic } from '../src/foundation-source.mjs';
const read = path => readFile(new URL('../../' + path, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation);
let llvm;
try { llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const cases = [
  ['milestone example', (await read('scaffolding/examples/structs.tower')).toString(), '42\n22\n7\n'],
  ['nested inline structs', 'struct Outer { flag: bool; pair: Pair; } struct Pair { x: i32; y: u32; } var o: Outer; o.flag = true; o.pair.x = -3; o.pair.y = 8; print o.flag; print o.pair.x; print o.pair.y; var p: Pair* = &o.pair; p.x = p.x + 4; print o.pair.x;', 'true\n-3\n8\n1\n'],
  ['recursive pointer fields', 'struct Node { value: i32; next: Node*; } var a: Node; var b: Node; a.value = 1; b.value = 2; a.next = &b; b.next = &a; print a.next.value; print a.next.next.value;', '2\n1\n'],
  ['forward types and functions', 'var p: Pair; p.x = 40; var ref: Pair* = &p; ref = identity(ref); ref.x = add(p.x, 2); print p.x; fn identity(p: Pair*): Pair* { return p; } fn add(a: i32, b: i32): i32 { var r: i32 = a + b; return r; } struct Pair { x: i32; }', '42\n'],
  ['field destination captured before a call redirects its pointer', 'struct Pair { x: i32; } struct Ref { p: Pair*; } fn redirect(r: Ref*, next: Pair*): i32 { r.p = next; return 9; } var a: Pair; var b: Pair; a.x = 1; b.x = 2; var r: Ref; r.p = &a; var rp: Ref* = &r; var bp: Pair* = &b; r.p.x = redirect(rp, bp); print a.x; print b.x; print r.p.x;', '9\n2\n2\n'],
  ['pointer stored in a field aliases a scalar', 'struct Ref { p: i32*; } var x: i32 = 3; var r: Ref; r.p = &x; *r.p = 9; var y: i32 = *r.p; print y; print x;', '9\n9\n'],
  ['field pointers before initialization', 'struct Pair { x: i32; y: i32; } var p: Pair; var a: i32* = &p.y; *a = 12; print p.y; print a;', '12\n&p.y\n'],
  ['separate initialization per field', 'struct Pair { x: i32; y: i32; } var p: Pair; p.x = 1; print p.x; print p.y;', '1\n', /uninitialized field 'p.y'/],
  ['uninitialized pointer field', 'struct Node { value: i32; next: Node*; } var a: Node; print a.next.value;', '', /uninitialized field 'a.next'/],
  ['uninitialized struct pointer', 'struct S { x: i32; } var p: S*; print p.x;', '', /uninitialized local 'p'/],
  ['field pointer expires at block exit', 'struct Pair { x: i32; y: i32; } var p: i32*; { var a: Pair; a.y = 5; p = &a.y; } var b: Pair; b.y = 9; var result: i32 = *p;', '', /expired/],
  ['returned struct pointer expires with frame', 'struct Pair { x: i32; } fn invalid(): Pair* { var p: Pair; p.x = 4; var r: Pair* = &p; return r; } var p: Pair* = invalid(); print p.x;', '', /expired/],
  ['loop generation invalidates old field pointers', 'struct S { x: i32; } var escaped: i32*; var iteration: i32 = 0; loop { var local: S; local.x = 7; var again: bool = iteration == 1; if again { var x: i32 = *escaped; print x; break; } escaped = &local.x; iteration = 1; }', '', /expired/],
  ['empty structs still have distinct storage', 'struct Empty {} var a: Empty; var b: Empty; var ap: Empty* = &a; var bp: Empty* = &b; var same: bool = ap == bp; print same;', 'false\n'],
  ['quoted type and field names', 'struct `odd type` { `first-field`: i32; `struct`: bool; } var a: `odd type`; a.`first-field` = 42; a.`struct` = true; print a.`first-field`; print a.`struct`;', '42\ntrue\n'],
];
for (const [name, source, output, failure] of cases) test(`structs round trip and execute: ${name}`, async () => {
  const handle = tower.compile(source);
  try {
    const result = tower.execute(handle, 10000);
    assert.notEqual(result.status, 'executing');
    assert.equal(result.output, output, result.error);
    if (failure) assert.match(result.error, failure); else assert.equal(result.status, 'done', result.error);
    const formatted = tower.foundation(handle), second = tower.compileFoundation(formatted.source);
    try {
      assert.equal(tower.foundation(second).source, formatted.source);
      assert.deepEqual(tower.foundation(second).types, formatted.types);
      const roundtrip = tower.execute(second);
      assert.equal(roundtrip.output, output); assert.equal(roundtrip.error, result.error);
    } finally { tower.destroyExecution(second); }
    if (llvm) {
      const compiled = llvm.compile(formatted.source);
      assert.equal(compiled.status, 'compiled', compiled.error);
      const actual = originalDiagnostic(await executeWasm(compiled), formatted.spans);
      for (const key of ['status', 'error', 'errorOffset', 'output', 'outputTruncated']) assert.equal(actual[key], result[key], key);
    }
  } finally { tower.destroyExecution(handle); }
});

test('type objects expose deterministic layout and fields from one registry', () => {
  const source = 'struct Inner { flag: bool; value: i32; } struct Outer { lead: bool; nested: Inner; tail: bool; link: Outer*; }';
  const handle = tower.compile(source);
  try {
    assert.equal(tower.execute(handle).status, 'done');
    const types = tower.foundation(handle).types;
    assert.deepEqual(types.slice(0, 4).map(t => [t.name, t.size, t.alignment]), [['i32',4,4], ['u32',4,4], ['bool',1,1], ['void',0,1]]);
    const inner = types.find(t => t.name === 'Inner'), outer = types.find(t => t.name === 'Outer');
    assert.deepEqual([inner.size, inner.alignment, inner.fields.map(f => f.offset)], [8,4,[0,4]]);
    assert.deepEqual([outer.size, outer.alignment, outer.fields.map(f => f.offset)], [40,8,[0,4,12,16]]);
    assert.deepEqual(outer.fields[3], { name:'link', type:'Outer*', offset:16, size:24, alignment:8 });
  } finally { tower.destroyExecution(handle); }
});

test('invalid structs and field operations are checked before effects', () => {
  for (const [source, error] of [
    ['struct i32 {}', /duplicate type/], ['struct A {} struct A {}', /duplicate type/],
    ['struct A { x: i32; x: bool; }', /duplicate field/], ['struct A { x: Missing; }', /Unknown type/],
    ['struct A { x: void; }', /void type/], ['struct A { x: A; }', /Recursive by-value/],
    ['struct A { b: B; } struct B { a: A; }', /Recursive by-value/], ['{ struct A {} }', /top level/],
    ['struct A { x: i32; } var a: A; a.y = 1;', /Unknown field/], ['var a: i32; a.x = 1;', /requires a struct/],
    ['struct A { x: i32; } var p: A**; p.x = 1;', /single pointer/],
    ['struct A { x: i32; } var a: A; a.x = true;', /Expected i32/],
    ['struct A {} struct B {} var a: A; var p: B* = &a;', /Expected B\*/],
    ['struct A {} var a: A; var b: A = a;', /aggregate copies/], ['struct A {} var a: A; print a;', /field access or a pointer/],
    ['struct A {} fn f(a: A): void {}', /Struct parameters/], ['struct A {} fn f(): A {}', /Struct returns/],
    ["parse CoreStruct = 'broken'; broken", /missing capture/],
    ["parse CorePlace = 'broken'; var a: i32 = broken;", /missing capture/],
  ]) {
    const handle = tower.compile('print 99; ' + source);
    try { const result = tower.execute(handle); assert.equal(result.status, 'error', source); assert.match(result.error, error, source); assert.equal(result.steps, 0); assert.equal(result.output, ''); }
    finally { tower.destroyExecution(handle); }
  }
  let huge = 'struct S0 { x: i32; }';
  for (let i = 1; i <= 13; ++i) huge += `struct S${i} { a: S${i - 1}; b: S${i - 1}; }`;
  const handle = tower.compile(huge);
  try { assert.match(tower.execute(handle).error, /storage limit/); }
  finally { tower.destroyExecution(handle); }
  const deep = tower.compile('struct N { next: N*; } var n: N; print n' + '.next'.repeat(140) + ';');
  try { assert.match(tower.execute(deep).error, /field path limit/); }
  finally { tower.destroyExecution(deep); }
});

test('struct/type nodes are released with successful and rejected programs', () => {
  const before = tower.exports.tw_live_nodes();
  for (let i = 0; i < 20; ++i) for (const source of [cases[0][1], 'struct A { self: A; }', 'struct A { field: Missing; }']) {
    const handle = tower.compile(source); tower.execute(handle); tower.foundation(handle); tower.destroyExecution(handle);
  }
  assert.equal(tower.exports.tw_live_nodes(), before);
});
