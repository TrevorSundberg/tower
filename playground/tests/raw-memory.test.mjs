import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower } from '../src/tower-host.mjs';
import { loadLLVM, executeWasm } from '../src/llvm-host.mjs';
import { originalDiagnostic } from '../src/foundation-source.mjs';
const read = p => readFile(new URL('../../' + p, import.meta.url));
const grammar = (await read('scaffolding/foundation.tower')).toString();
const bytes = await read('build/browser-wasi/tower.wasm');
const tower = await loadTower(bytes, undefined, grammar);
const llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, grammar);
const linkedOutput = '33\ntrue\ntrue\n42\n42\n18446744073709551615\n0\ntrue\n5\n42\n';
let nativeWasm;
try { nativeWasm = await read('build/linking/native-compiled.wasm'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const cases = [
  ['Tower storage library: byte strings, arenas and rehashing maps', (await read('scaffolding/library/bytes.tower')).toString() + '\n' + (await read('scaffolding/library/storage.tower')).toString() + '\n' + (await read('scaffolding/tests/storage.tower')).toString(), 'true\ntrue\n10\n84\ntrue\n0\ntrue\n16\ntrue\ntrue\n42\n200\ntrue\n597\n42\nfalse\n200\n'],
  ['growable buffer example', (await read('scaffolding/examples/memory.tower')).toString(), '5\n84\n42\n'],
  ['raw pointer integer round trip', 'var x: i32 = 42; var p: i32* = &x; var address: usize = bits(usize, p); var q: i32* = bits(i32*, address); *q = 7; print(x); var same: bool = p == q; print(same);', '7\ntrue\n'],
  ['null and void pointers', 'var p: void* = null; var x: i32 = 42; var q: i32* = &x; p = bits(void*, q); q = bits(i32*, p); var result: i32 = *q; print(result);', '42\n'],
  ['bytes alias integer storage', 'var x: u32 = 16909060; var p: u32* = &x; var b: u8* = bits(u8*, p); print(b[0]); print(b[3]); b[1] = 0; print(x);', '4\n1\n16908292\n'],
  ['pointer offsets and subviews', 'var a: i32[4]; a[0] = 1; a[1] = 2; a[2] = 3; a[3] = 4; var p: i32* = &a[0]; p = p + 2; print(p[0]); p = p - 1; print(p[0]); var negative: i32 = -1; print(p[negative]);', '3\n2\n1\n'],
  ['nested fixed arrays', 'var grid: i32[2][3]; grid[2][1] = 42; print(grid[2][1]); var size: usize = sizeof(i32[2][3]); print(size);', '42\n24\n'],
  ['arrays of pointers', 'var x: i32 = 42; var p: i32*[2]; p[0] = &x; var ref: i32* = p[0]; *ref = 7; print(x);', '7\n'],
  ['array struct fields', 'struct S { tag: u8; values: i32[3]; } var s: S; s.values[2] = 42; var p: S* = &s; print(p.values[2]); var size: usize = sizeof(S); print(size);', '42\n16\n'],
  ['allocate grow preserve free', 'var p: i32* = alloc(i32, 2); p[0] = 20; p[1] = 22; p = realloc(i32, p, 100); var x: i32 = p[0] + p[1]; print(x); free(p);', '42\n'],
  ['reallocation zero and allocation failure', 'var p: u8* = null; p = realloc(u8, p, 8); p[0] = 7; p = realloc(u8, p, 0); var b: bool = p == null; print(b); p = alloc(u8, 4294967295); b = p == null; print(b); free(p);', 'true\ntrue\n'],
  ['allocation size overflow returns null', 'var p: u64* = alloc(u64, 4294967295); var b: bool = p == null; print(b);', 'true\n'],
  ['copy permits overlap', 'var a: u8[6]; var p: u8* = &a[0]; fill(p, 1, 6); p[0] = 7; p[1] = 8; var q: u8* = p + 1; copy(q, p, 5); print(p[0]); print(p[1]); print(p[2]); print(p[5]);', '7\n7\n8\n1\n'],
  ['strings, escapes, terminator and UTF-8', 'var p: u8* = "A\\n雪"; print(p[0]); print(p[1]); print(p[2]); print(p[5]);', '65\n10\n233\n0\n'],
  ['wide literals and wrapping', 'var x: i64 = -9223372036854775808; print(x); x = x - 1; print(x); var y: u64 = 18446744073709551615; print(y); y = y + 1; print(y);', '-9223372036854775808\n9223372036854775807\n18446744073709551615\n0\n'],
  ['wide arithmetic comparison and conversion', 'var a: i64 = -5000000000; var b: i64 = a / 3; print(b); var yes: bool = a < b; print(yes); var c: u8 = 255; var d: u64 = convert(u64, c); print(d); var e: i64 = -2; var f: i32 = convert(i32, e); print(f);', '-1666666666\ntrue\n255\n-2\n'],
  ['raw field offsets', 'struct S { tag: u8; value: i32; link: S*; } var s: S; var p: S* = &s; var f: i32* = &s.value; var base: usize = bits(usize, p); var field: usize = bits(usize, f); var offset: usize = field - base; print(offset); var size: usize = sizeof(S); print(size); var alignment: usize = alignof(S); print(alignment);', '4\n12\n4\n'],
];
for (const [name, source, expected] of cases) test('raw memory: ' + name, async () => {
  const handle = tower.compile(source);
  try {
    const reference = tower.execute(handle, 100000);
    assert.equal(reference.status, 'done', reference.error); assert.equal(reference.output, expected);
    const fastHandle = tower.compile(source);
    try {
      tower.useFast(fastHandle);
      const fast = tower.execute(fastHandle,100000);
      assert.equal(fast.status,'done',fast.error); assert.equal(fast.output,expected);
    } finally { tower.destroyExecution(fastHandle); }
    const formatted = tower.foundation(handle), round = tower.compileFoundation(formatted.source);
    try { assert.equal(tower.foundation(round).source, formatted.source); assert.deepEqual(tower.foundation(round).types, formatted.types); }
    finally { tower.destroyExecution(round); }
    const compiled = llvm.compile(formatted.source); assert.equal(compiled.status, 'compiled', compiled.error);
    assert.doesNotMatch(compiled.before, /tower\.pointer|tower\.cell|\.initialized|\.generation|\.active/);
    const actual = originalDiagnostic(await executeWasm(compiled), formatted.spans);
    assert.equal(actual.status, 'done', actual.error); assert.equal(actual.output, expected);
  } finally { tower.destroyExecution(handle); }
});

test('raw pointer printing exposes addresses without embedding display metadata', async () => {
  const source = 'var value: i32 = 1; var p: i32* = &value; print(p);';
  const h = tower.compile(source);
  try { assert.match(tower.execute(h).output, /^0x[0-9a-f]{8}\n$/); }
  finally { tower.destroyExecution(h); }
  const c = llvm.compile(source); assert.equal(c.status, 'compiled', c.error);
  assert.match((await executeWasm(c)).output, /^0x[0-9a-f]{8}\n$/);
});

test('raw-memory semantic errors are diagnosed before execution', () => {
  for (const source of [
    'var a: i32[0];', 'var a: void[1];', 'var a: i32; a[0] = 1;',
    'var p: void* = null; var b: i32 = p[0];',
    'var p: i32* = alloc(void, 1);', 'var p: i32* = alloc(i32, -1);',
    'var p: i32*; free(1);', 'var p: u8* = alloc(u8, 1); copy(p, 1, 1);',
    'var p: i32* = null; var n: u64 = bits(u64, p);',
    'var a: u8 = 256;', 'var a: u64 = 18446744073709551616;', 'var a: i64 = -9223372036854775809;',
    "parse CoreCopy = 'broken'; broken", "parse CoreFree = 'broken'; broken",
  ]) {
    let h; assert.doesNotThrow(() => { h = tower.compile('print(99); ' + source); }, source);
    try { const r = tower.execute(h); assert.equal(r.status, 'error', source); assert.equal(r.steps, 0); assert.equal(r.output, ''); }
    finally { tower.destroyExecution(h); }
  }
});

test('external host implementations receive scalar values and actual byte views', async () => {
  const imports = {
    add: (_ctx, a, b) => a + b,
    mutate: (ctx, pointer, count) => { const data = new DataView(ctx.memory().buffer, ctx.memory().byteOffset); for (let i=0;i<count;i++) data.setInt32(pointer+i*4, 20+i*2, true); },
    wide: (_ctx, value) => value + 1n,
  };
  const source = 'extern fn add(a: i32, b: i32): i32; extern fn mutate(p: i32*, n: usize): void; extern fn wide(x: u64): u64; var a: i32* = alloc(i32, 2); mutate(a, 2); var sum: i32 = add(a[0], a[1]); print(sum); var large: u64 = wide(18446744073709551614); print(large); free(a);';
  const interpreter = await loadTower(bytes, undefined, grammar, undefined, undefined, {imports});
  const h = interpreter.compile(source);
  try { assert.equal(interpreter.execute(h).output, '42\n18446744073709551615\n'); }
  finally { interpreter.destroyExecution(h); }
  const compiled = llvm.compile(source); assert.equal(compiled.status, 'compiled', compiled.error);
  const r = await executeWasm(compiled, undefined, {imports}); assert.equal(r.output, '42\n18446744073709551615\n');
  await assert.rejects(executeWasm(compiled), /No implementation registered/);
  const missing = tower.compile(source); try { assert.match(tower.execute(missing).error, /No implementation registered/); } finally { tower.destroyExecution(missing); }
});

test('browser LLVM statically links a real C archive, including calls back into exported Tower', async () => {
  const library = await read('build/linking/wasm-fixture.a');
  const source = (await read('scaffolding/tests/linking.tower')).toString();
  const compiled = llvm.compile(source, {inputs: {'fixture.a': library}});
  assert.equal(compiled.status, 'compiled', compiled.error);
  assert.equal((await executeWasm(compiled)).output, linkedOutput);
  const module = await WebAssembly.compile(compiled.wasm);
  assert.ok(WebAssembly.Module.exports(module).some(x => x.name === 'tower_twice'));
  assert.ok(WebAssembly.Module.imports(module).every(x => x.module === 'tower'));
  const bad = llvm.compile(source, {inputs: {'broken.a': new Uint8Array([1,2,3])}}); assert.equal(bad.status, 'error'); assert.match(bad.error, /Link failed/);
  const recovery = llvm.compile('print(42);'); assert.equal((await executeWasm(recovery)).output, '42\n');
});

test('native compiler output also executes in the browser Wasm host', {skip: !nativeWasm}, async () => {
  const result = await executeWasm({wasm: nativeWasm}); assert.equal(result.output, linkedOutput);
});

test('separately compiled Tower library objects link without duplicate entry points', async () => {
  const library = llvm.compile('export fn multiply(a: i32, b: i32): i32 { var result: i32 = a * b; return result; }', {library:true});
  assert.equal(library.status, 'compiled', library.error); assert.equal(library.format, 'object'); assert.doesNotMatch(library.before, /define .*@tower_main/);
  const program = llvm.compile('extern fn multiply(a: i32, b: i32): i32; var result: i32 = multiply(6, 7); print(result);', {inputs:{'library.o':library.object}});
  assert.equal(program.status, 'compiled', program.error); assert.equal((await executeWasm(program)).output, '42\n');
  const invalid = llvm.compile('print(42);', {library:true}); assert.match(invalid.error, /top-level executable/);
});

test('browser semantic compilation uses the selected target width, not the browser width', () => {
  const source = 'var big: usize = 4294967296; var size: usize = sizeof(void*); print(size); print(big);';
  const handle = tower.compile(source, {pointerBytes:8});
  try {
    assert.equal(tower.execute(handle).output, '8\n4294967296\n');
    assert.match(tower.foundation(handle).source, /sizeof\(void\*\)/);
  } finally { tower.destroyExecution(handle); }
  const narrow = tower.compile(source);
  try { assert.equal(tower.execute(narrow).status, 'error'); } finally { tower.destroyExecution(narrow); }
});

test('array reflection and 64-bit interpreter foreign arguments retain target types', async () => {
  const handle = tower.compile('var values: i32[3];');
  try {
    const type = tower.foundation(handle).types.find(type => type.kind === 'array');
    assert.equal(type.element, 'i32'); assert.equal(type.length, 3); assert.equal(type.size, 12);
  } finally { tower.destroyExecution(handle); }
  const host = await loadTower(bytes, undefined, grammar, undefined, undefined, {imports:{identity: (ctx,value) => {
    assert.equal(ctx.pointerBytes,8); assert.equal(value,4294967296n); return value;
  }}});
  const wide = host.compile('extern fn identity(n: usize): usize; var n: usize = identity(4294967296); print(n);', {pointerBytes:8});
  try { assert.equal(host.execute(wide).output,'4294967296\n'); } finally { host.destroyExecution(wide); }
});

test('Wasm allocator reuses and coalesces split blocks', async () => {
  const compiled = llvm.compile(''); assert.equal(compiled.status, 'compiled', compiled.error);
  const {instance} = await WebAssembly.instantiate(compiled.wasm, {tower:{print(){},trap(){assert.fail('unexpected trap');}}});
  const {tower_allocate: allocate, tower_deallocate: free, memory} = instance.exports;
  const initial = memory.buffer.byteLength;
  // Split a middle free block, then free its neighbours and request the merged
  // space repeatedly. Prepending a split block breaks the sorted free-list invariant.
  for (let i=0;i<64;i++) {
    const a = allocate(256*1024,1), b = allocate(512*1024,1), c = allocate(256*1024,1);
    assert.ok(a && b && c); free(b);
    const part = allocate(128*1024,1); assert.ok(part);
    free(a); free(c); free(part);
    const merged = allocate(1000*1024,1); assert.ok(merged); free(merged);
  }
  assert.equal(memory.buffer.byteLength, initial);
});
