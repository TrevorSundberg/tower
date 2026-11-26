import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { files, loadTower, loadLLVM, executeWasm } from './compiler-fixtures.mjs';
import { fixtureSource, guestString, openTower, requireStatus, runSelectedTest } from './compiler_test_host.mjs';
import { originalDiagnostic } from '../src/foundation-source.mjs';
const read = p => readFile(new URL('../../' + p, import.meta.url));
const grammar = (await read('scaffolding/foundation.tower')).toString();
const bytes = await read('build/browser-wasi/tower.wasm');
const tower = await loadTower(bytes, undefined, grammar);
const llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, grammar);
const linkedOutput = '33\ntrue\ntrue\n42\n42\n18446744073709551615\n0\ntrue\n5\n42\n';
let nativeWasm;
try { nativeWasm = await read('build/linking/native-compiled.wasm'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const directory = 'tests/raw_memory_cases/';
const cases = [
  ['Tower storage library: byte strings, arenas and rehashing maps', 'storage_imports'],
  ['growable buffer example', 'memory', 'examples/'],
  ['raw pointer integer round trip', 'pointer_round_trip'],
  ['null and void pointers', 'void_pointers'],
  ['bytes alias integer storage', 'byte_alias'],
  ['pointer offsets and subviews', 'pointer_offsets'],
  ['nested fixed arrays', 'nested_arrays'],
  ['arrays of pointers', 'pointer_array'],
  ['array struct fields', 'array_field'],
  ['allocate grow preserve free', 'grow_allocation'],
  ['reallocation zero and allocation failure', 'reallocate_zero'],
  ['allocation size overflow returns null', 'allocation_overflow'],
  ['copy permits overlap', 'overlapping_copy'],
  ['strings, escapes, terminator and UTF-8', 'utf8_string'],
  ['wide literals and wrapping', 'wide_wrapping'],
  ['wide arithmetic comparison and conversion', 'wide_arithmetic'],
  ['raw field offsets', 'field_offsets'],
];

// The assertion interpreter sees counted guest outputs and the host objects
// returned by the real formatter and LLVM compiler. The companion owns the oracle.
let sample;
const encoder = new TextEncoder();
const assertionHost = await openTower({imports:{
  raw_bytes(context, file, stream, length) {
    const key = guestString(context, file) + '/' + guestString(context, stream);
    const bytes = sample.streams.get(key);
    if (!bytes) throw new Error('Missing raw memory observation ' + key);
    const address = context.allocate(bytes.length || 1);
    if (!address) throw new Error('Cannot allocate raw memory observation ' + key);
    const memory = context.memory();
    memory.set(bytes, address);
    assert.equal(context.pointerBytes, 4);
    new DataView(memory.buffer, memory.byteOffset, memory.byteLength).setUint32(Number(length), bytes.length, true);
    sample.streams.delete(key);
    return address;
  },
  raw_round_trip_equal(context, name) {
    const key = guestString(context, name);
    return Object.hasOwn(sample.formatted, key) && Object.hasOwn(sample.round, key)
      && isDeepStrictEqual(sample.formatted[key], sample.round[key]);
  },
  raw_ir_contains: (context, text) => sample.ir.includes(guestString(context, text)),
}});
async function checkOutputs(stem, path, outputs, formatted, round, ir) {
  const entry = '.tower/' + path + stem;
  const streams = new Map(Object.entries(outputs).map(([engine, output]) =>
    [stem + '.tower/' + engine, encoder.encode(output)]));
  streams.set(stem + '.expected/file', await read('scaffolding/' + path + stem + '.expected'));
  sample = {formatted, round, ir, streams};
  try {
    runSelectedTest(assertionHost, entry + '_test.tower', undefined, {files:assertionFiles});
    assert.equal(streams.size, 0, 'The selected Tower test must consume the oracle and all three outputs');
  } finally { sample = undefined; }
}
const reader = '.tower/' + directory + 'results.tower';
const browserReader = fixtureSource('.tower/' + directory + 'browser_results.tower');
const assertionFiles = files.filter(({path}) => path.startsWith('.tower/' + directory)
  || path.startsWith('.tower/library/') || path.startsWith('.tower/examples/memory')
  || path === '.tower/tests/storage.tower' || path === '.tower/backend/text.tower')
  .map(file => file.path === reader ? {...file, text:browserReader} : file);

function executeFixture(handle) {
  let result, output = '';
  // Expression normalization can exceed one bounded worker slice. Continue
  // through the existing execution API, preserving output from every slice.
  for (let slice = 0; slice < 20; ++slice) {
    result = tower.execute(handle, 100000); output += result.output;
    assert.ok(!result.outputTruncated, 'Truncated guest output');
    if (result.status !== 'executing') break;
  }
  return {...result, output};
}
for (const [name, stem, path = directory] of cases) test('raw memory: ' + name, async t => {
  const entry = '.tower/' + path + stem + '.tower';
  const source = fixtureSource(entry);
  // The storage wrapper has imports relative to its own directory.
  if (stem === 'storage_imports') {
    tower.configureModules({entry});
    t.after(() => tower.configureModules({entry:'input.tower'}));
  }
  const handle = tower.compile(source);
  try {
    const graph = executeFixture(handle);
    requireStatus(graph, 'done');
    const fastHandle = tower.compile(source);
    let fast;
    try {
      tower.useFast(fastHandle);
      fast = executeFixture(fastHandle);
      requireStatus(fast, 'done');
    } finally { tower.destroyExecution(fastHandle); }
    const formatted = tower.foundation(handle);
    const rebuilt = tower.compileFoundation(formatted.source);
    let round;
    try { round = tower.foundation(rebuilt); }
    finally { tower.destroyExecution(rebuilt); }
    const compiled = llvm.compile(formatted.source);
    requireStatus(compiled, 'compiled');
    const wasm = originalDiagnostic(await executeWasm(compiled), formatted.spans, formatted.sourceMap);
    requireStatus(wasm, 'done');
    await checkOutputs(stem, path, {Graph:graph.output, Fast:fast.output, LLVM:wasm.output},
      formatted, round, compiled.before);
  } finally { tower.destroyExecution(handle); }
});

test('raw pointer printing exposes addresses without embedding display metadata', async () => {
  const source = 'import foundation; var value: i32 = 1; var p: i32* = &value; print(p);';
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
    let h; assert.doesNotThrow(() => { h = tower.compile('import foundation; print(99); ' + source); }, source);
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
  imports.f32_add = imports.f64_add = imports.add;
  const expectedCalls = [['i8_add', -120, -7], ['i16_add', -30000, -2000], ['u16_add', 60000, 5000]];
  const calls = [];
  for (const [name] of expectedCalls) {
    imports[name] = (ctx, a, b) => {
      calls.push([name, a, b]);
      return imports.add(ctx, a, b);
    };
  }
  const expected = (await read('scaffolding/tests/foreign_host_calls.expected')).toString();
  function checkHostCalls(result) {
    assert.equal(result.status, 'done', result.error);
    assert.deepEqual(calls, expectedCalls);
    assert.equal(result.output, expected);
    calls.length = 0;
  }
  const source = (await read('scaffolding/tests/foreign_host_calls.tower')).toString();
  const interpreter = await loadTower(bytes, undefined, grammar, undefined, undefined, {imports});
  const h = interpreter.compile(source);
  try { checkHostCalls(interpreter.execute(h)); }
  finally { interpreter.destroyExecution(h); }
  const compiled = llvm.compile(source); assert.equal(compiled.status, 'compiled', compiled.error);
  checkHostCalls(await executeWasm(compiled, undefined, {imports}));
  await assert.rejects(executeWasm(compiled), /No implementation registered/);
  const missing = tower.compile(source); try { assert.match(tower.execute(missing).error, /No implementation registered/); } finally { tower.destroyExecution(missing); }
});

test('browser LLVM statically links a Tower foreign archive, including calls back into exported Tower', async () => {
  const library = await read('build/linking/wasm-fixture.a');
  const source = (await read('scaffolding/tests/linking.tower')).toString();
  const compiled = llvm.compile(source, {inputs: {'fixture.a': library}});
  assert.equal(compiled.status, 'compiled', compiled.error);
  const result = await executeWasm(compiled);
  assert.equal(result.status, 'done', result.error); assert.equal(result.output, linkedOutput);
  const module = await WebAssembly.compile(compiled.wasm);
  assert.ok(WebAssembly.Module.exports(module).some(x => x.name === 'tower_twice'));
  assert.ok(WebAssembly.Module.imports(module).every(x => x.module === 'tower'));
  const bad = llvm.compile(source, {inputs: {'broken.a': new Uint8Array([1,2,3])}}); assert.equal(bad.status, 'error'); assert.match(bad.error, /Link failed/);
  const recovery = llvm.compile('import foundation; print(42);'); assert.equal(recovery.status, 'compiled', recovery.error);
  const recovered = await executeWasm(recovery); assert.equal(recovered.status, 'done', recovered.error); assert.equal(recovered.output, '42\n');
});

test('native compiler output also executes in the browser Wasm host', {skip: !nativeWasm}, async () => {
  const result = await executeWasm({wasm: nativeWasm}); assert.equal(result.status, 'done', result.error); assert.equal(result.output, linkedOutput);
  const module = await WebAssembly.compile(nativeWasm);
  assert.ok(WebAssembly.Module.exports(module).some(x => x.name === 'tower_twice'));
  assert.ok(WebAssembly.Module.imports(module).every(x => x.module === 'tower'));
});

test('separately compiled Tower library objects link without duplicate entry points', async () => {
  const library = llvm.compile('import foundation; export fn multiply(a: i32, b: i32): i32 { var result: i32 = a * b; return result; }', {library:true});
  assert.equal(library.status, 'compiled', library.error); assert.equal(library.format, 'object'); assert.doesNotMatch(library.before, /define .*@tower_main/);
  const program = llvm.compile('import foundation; extern fn multiply(a: i32, b: i32): i32; var result: i32 = multiply(6, 7); print(result);', {inputs:{'library.o':library.object}});
  assert.equal(program.status, 'compiled', program.error); assert.equal((await executeWasm(program)).output, '42\n');
  const invalid = llvm.compile('import foundation; print(42);', {library:true}); assert.match(invalid.error, /top-level executable/);
});

test('browser semantic compilation uses the selected target width, not the browser width', () => {
  const source = 'import foundation; var big: usize = 4294967296; var size: usize = sizeof(void*); print(size); print(big);';
  const handle = tower.compile(source, {pointerBytes:8});
  try {
    const result = tower.execute(handle);
    assert.equal(result.status, 'done', result.error);
    assert.equal(result.output, '8\n4294967296\n');
    assert.match(tower.foundation(handle).source, /^var size: usize = sizeof\(void\*\);$/m);
  } finally { tower.destroyExecution(handle); }
  const narrow = tower.compile(source);
  try {
    const result = tower.execute(narrow);
    assert.equal(result.status, 'error'); assert.match(result.error, /out of range/);
    assert.equal(result.steps, 0); assert.equal(result.output, '');
  } finally { tower.destroyExecution(narrow); }
});

test('array reflection and 64-bit interpreter foreign arguments retain target types', async () => {
  const handle = tower.compile('import foundation; var values: i32[3];');
  try {
    const type = tower.foundation(handle).types.find(type => type.kind === 'array');
    assert.equal(type.element, 'i32'); assert.equal(type.length, 3); assert.equal(type.size, 12);
  } finally { tower.destroyExecution(handle); }
  const host = await loadTower(bytes, undefined, grammar, undefined, undefined, {imports:{identity: (ctx,value) => {
    assert.equal(ctx.pointerBytes,8); assert.equal(value,4294967296n); return value;
  }}});
  const wide = host.compile('import foundation; extern fn identity(n: usize): usize; var n: usize = identity(4294967296); print(n);', {pointerBytes:8});
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
