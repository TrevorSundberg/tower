import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compilerThreads} from '../src/compiler-threads.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';

let bytes;
try { bytes = await readFile('build/browser-wasi-threads/tower-work-tests.wasm'); }
catch (error) {
 if (error.code !== 'ENOENT' || process.env.TOWER_REQUIRE_THREADS === '1') throw error;
}

test('the Tower pool overlaps four distinct Wasm threads and reuses their jobs', {skip:!bytes, timeout:30000}, async () => {
 const module = await WebAssembly.compile(bytes);
 const transport = await compilerThreads(module);
 try {
  const wasi = new TowerWASI();
  const instance = await WebAssembly.instantiate(module, {
   env:transport.env, wasi:transport.wasi, wasi_snapshot_preview1:wasi.wasiImport,
  });
  transport.attach(instance); wasi.initialize(instance);
  // The Tower fixture holds all four workers behind one barrier. Queue width
  // alone cannot pass it. Repeat the complete pool lifecycle in one host too.
  for (let repeat = 0; repeat < 128; repeat++) {
   assert.equal(instance.exports.main(), 0, `pool lifecycle ${repeat}`);
  }
 } finally { transport.close(); }
});

test('a worker trap interrupts a blocked coordinator through shared failure state', {skip:!bytes, timeout:10000}, async () => {
 const module = await WebAssembly.compile(bytes);
 const transport = await compilerThreads(module, {workerURL:new URL('./compiler-failure-worker.mjs', import.meta.url)});
 try {
  const wasi = new TowerWASI();
  const instance = await WebAssembly.instantiate(module, {
   env:transport.env, wasi:transport.wasi, wasi_snapshot_preview1:wasi.wasiImport,
  });
  transport.attach(instance); wasi.initialize(instance);
  assert.throws(() => instance.exports.main(), /Injected compiler worker failure/);
  assert.equal(transport.failed(), true);
 } finally { transport.close(); }
});

test('declaration, body checking, lowering and staging are deterministic at 1/2/4/8 workers', {skip:!bytes, timeout:120000}, async () => {
 const {loadTower} = await import('./compiler-fixtures.mjs');
 const compiler = await readFile('build/browser-wasi-threads/tower.wasm');
 const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
 const functions = Array.from({length:16}, (_, i) => `
fn f${i}(value: decltype(seed)): decltype(value) {
 var state: Shared;
 state.value = value;
 var address = &state.value;
 var result: decltype(address[0]) = address[0];
 var bonus: u64 = comptime(1 + 2);
 result += bonus;
 { defer { result += comptime(3); } }
 defer { result += bonus; }
 for(var j: u64 = 0; j < 3; j++) { result += j + ${i}; }
 if comptime(true) { return result; }
}`);
 const source = 'import tower;\nstruct Shared { value: u64; }\nfn identity(T:type, value:T):T { return value; }\n' + functions.join('\n') +
  '\nvar seed: u64 = 0;\nvar `control value 1.0`: u64 = 7;\n' +
  'var inferredType: decltype(identity(seed));\n' +
  'var total = comptime(identity(' + functions.map((_,i) => `f${i}(0)`).join(' + ') + '));\n' +
  'print(total); print(`control value 1.0`);';
 const canonical = new Map();
 for (const capacity of [1,2,4,8]) {
  const tower = await loadTower(compiler, undefined, foundation, undefined, undefined, {threads:{capacity}});
  try {
   assert.equal(tower.exports.lr_work_tests(), 0, `LR tables and ECS cleanup at ${capacity} workers`);
   for (const pointerBytes of [4,8]) for (let repeat = 0; repeat < 2; repeat++) {
    const handle = tower.compile(source, {pointerBytes});
    try {
     if (repeat) tower.useFast(handle);
     let output = '', result;
     do { result = tower.execute(handle, 10000); output += result.output; } while (result.status === 'executing');
     assert.equal(result.status, 'done', result.error);
     assert.equal(output, '504\n7\n');
     const text = tower.foundation(handle).source;
     if (!canonical.has(pointerBytes)) canonical.set(pointerBytes, text);
     assert.equal(text, canonical.get(pointerBytes), `workers=${capacity}, width=${pointerBytes}, repeat=${repeat}`);
    } finally { tower.destroyExecution(handle); }
   }
   const invalid = tower.compile('import tower; fn earlier():i32 { return unknownFirst; } fn later():i32 { return unknownSecond; }');
   try {
    const result = tower.execute(invalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /unknownFirst/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(invalid); }
  } finally { tower.close(); }
  assert.throws(() => tower.compile('print(1);'), /compiler is closed/);
  assert.doesNotThrow(() => tower.destroyExecution(0));
 }
});
