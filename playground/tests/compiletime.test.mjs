import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';

const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
const tower = await loadTower(await readFile(process.env.TOWER_TEST_WASM || 'build/browser-wasi/tower.wasm'), undefined, foundation);
after(() => tower.close());
const llvm = await loadLLVM(await readFile('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);

function execute(source, pointerBytes, fast) {
 const handle = tower.compile(source, {pointerBytes});
 try {
  if (fast) tower.useFast(handle);
  let result, output = '';
  do { result = tower.execute(handle, 100000); output += result.output; }
  while (result.status === 'executing');
  assert.equal(result.status, 'done', result.error);
  assert.equal(output, '0\n');
  return tower.foundation(handle).source;
 } finally { tower.destroyExecution(handle); }
}

for (const name of ['decltype', 'decltype_headers', 'decltype_layout', 'comptime', 'comptime_flow']) {
 test(`${name} preserves types and behavior through Foundation, interpreters and LLVM`, async () => {
  tower.configureModules({entry: `.tower/tests/${name}.tower`});
  const source = await readFile(`scaffolding/tests/${name}.tower`, 'utf8');
  let canonical;
  for (const width of [4, 8]) {
   canonical = execute(source, width, false);
   assert.equal(execute(canonical, width, true), canonical);
  }
  for (const input of [source, canonical]) {
   const result = llvm.compile(input);
   assert.equal(result.status, 'compiled', result.error);
   assert.equal((await executeWasm(result)).output, '0\n');
  }
 });
}

for (const [name, message] of [
 ['decltype_cycle', /initializer dependency cycle/],
 ['decltype_header_cycle', /initializer dependency cycle/],
 ['decltype_parameter_cycle', /initializer dependency cycle/],
 ['decltype_parameter_field_cycle', /initializer dependency cycle/],
 ['decltype_field_cycle', /initializer dependency cycle/],
 ['decltype_unknown', /Unknown local/],
 ['comptime_cycle', /Compile-time dependency cycle/],
 ['comptime_defer_cycle', /Compile-time dependency cycle/],
 ['comptime_return', /without returning a value/],
 ['comptime_capture', /cannot capture runtime storage/],
 ['comptime_output', /explicit effect capability/],
 ['comptime_uninitialized', /uninitialized local/],
 ['comptime_dead_pointer', /outside live local storage/],
 ['comptime_fuel', /fuel exhausted/],
]) {
 test(`${name} reports its stage dependency or execution error`, async () => {
  const source = await readFile(`scaffolding/tests/semantic_invalid/${name}.tower`, 'utf8');
  for (const width of [4, 8]) {
   const handle = tower.compile(source, {pointerBytes: width});
   try {
    const result = tower.execute(handle);
    assert.equal(result.status, 'error');
    assert.match(result.error, message);
   } finally { tower.destroyExecution(handle); }
   const compiled = llvm.compile(source, {target:width === 4 ? 'wasm32-unknown-unknown' : 'wasm64-unknown-unknown'});
   assert.equal(compiled.status, 'error');
   assert.match(compiled.error, message);
  }
 });
}

test('forward declaration queries resolve long annotated and inferred chains without recursive inference', () => {
 for (const inferred of [false, true]) {
  const lines = ['import tower;'];
  for (let index = 0; index < 1024; index++) {
   lines.push(inferred ? `var value${index} = value${index + 1};` : `var value${index}: decltype(value${index + 1});`);
  }
  lines.push('var value1024: bool = false;');
  const handle = tower.compile(lines.join('\n'));
  try {
   // Check type resolution/serialization without executing forward reads of
   // uninitialized runtime storage in the inference-only variant.
   const canonical = tower.foundation(handle);
   assert.equal(typeof canonical.source, 'string', canonical.error);
   assert.match(canonical.source, /var value0: bool/);
  } finally { tower.destroyExecution(handle); }
 }
});

test('inferred generic call arguments retain forward declaration dependencies and cycle diagnostics', () => {
 for (const explicit of [false, true]) {
  const lines = ['import tower; fn identity(T:type, value:T):T { return value; }'];
  for (let index = 0; index < 256; index++) {
   lines.push(`var value${index} = identity(${explicit ? 'bool, ' : ''}value${index + 1});`);
  }
  lines.push('var value256: bool = false;');
  const handle = tower.compile(lines.join('\n'));
  try {
   // Only resolve the declarations; executing these forward initializers would
   // read runtime storage before its source-ordered initialization.
   const canonical = tower.foundation(handle);
   assert.equal(typeof canonical.source, 'string', canonical.error);
   assert.match(canonical.source, /var value0: bool/);
  } finally { tower.destroyExecution(handle); }
 }
 const handle = tower.compile('import tower; fn identity(T:type, value:T):T { return value; } var a = identity(b); var b = identity(a);');
 try {
  const result = tower.execute(handle);
  assert.equal(result.status, 'error');
  assert.match(result.error, /initializer dependency cycle a -> b -> a/);
 } finally { tower.destroyExecution(handle); }
});
