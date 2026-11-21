import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';
import {lazyGenericBodySource, demandedGenericBodySource} from './generic_body_cases.mjs';

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

test('signature-only generic queries do not clone unused body descendants', async () => {
 const source = lazyGenericBodySource();
 for (const width of [4, 8]) {
  const canonical = execute(source, width, false);
  assert.doesNotMatch(canonical, /fn `large\(/);
  assert.equal(execute(source, width, true), canonical);
  assert.equal(execute(canonical, width, true), canonical);
 }
 const compiled = llvm.compile(source);
 assert.equal(compiled.status, 'compiled', compiled.error);
 assert.equal((await executeWasm(compiled)).output, '0\n');
});

test('demanded generic body copies retain the node budget and reject execution', () => {
 const source = demandedGenericBodySource();
 for (const width of [4, 8]) {
  const handle = tower.compile(source, {pointerBytes:width});
  try {
   const result = tower.execute(handle);
   assert.equal(result.status, 'error');
   assert.match(result.error, /Template expansion exceeds 65536 nodes/);
   assert.equal(result.output, '');
  } finally { tower.destroyExecution(handle); }
 }
 const compiled = llvm.compile(source);
 assert.equal(compiled.status, 'error');
 assert.match(compiled.error, /Template expansion exceeds 65536 nodes/);
});

for (const name of ['decltype', 'decltype_expressions', 'decltype_headers', 'decltype_layout', 'decltype_generic_headers', 'decltype_type_fields', 'decltype_aggregate', 'decltype_lazy_body', 'body_continuation', 'comptime', 'comptime_flow']) {
 test(`${name} preserves types and behavior through Foundation, interpreters and LLVM`, async () => {
  tower.configureModules({entry: `.tower/tests/${name}.tower`});
  const source = await readFile(`scaffolding/tests/${name}.tower`, 'utf8');
  let canonical;
  for (const width of [4, 8]) {
   canonical = execute(source, width, false);
   assert.equal(execute(canonical, width, true), canonical);
   if (name === 'decltype_lazy_body') {
    assert.doesNotMatch(canonical, /missing_body_value|fn `unused\(/);
   }
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
 ['decltype_generic_header_cycle', /initializer dependency cycle/],
 ['decltype_layout_cycle', /Recursive by-value layout: Recursive -> Recursive/],
 ['decltype_type_field_cycle', /initializer dependency cycle/],
 ['decltype_aggregate_operator', /aggregate copies are not implemented/],
 ['aggregate_inferred_copy', /aggregate copies are not implemented/],
 ['decltype_body_runtime', /Unknown local 'missing_body_value'/],
 ['decltype_body_comptime', /Unknown local 'missing_body_value'/],
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
    if (name === 'decltype_body_runtime') {
     assert.match(result.error, /Instantiated by wrapper[(]1[)]/);
     assert.doesNotMatch(result.error, /Instantiated by invalid[(]1[)]/);
    }
   } finally { tower.destroyExecution(handle); }
   const compiled = llvm.compile(source, {target:width === 4 ? 'wasm32-unknown-unknown' : 'wasm64-unknown-unknown'});
   assert.equal(compiled.status, 'error');
   assert.match(compiled.error, message);
   if (name === 'decltype_body_runtime') {
    assert.match(compiled.error, /Instantiated by wrapper[(]1[)]/);
    assert.doesNotMatch(compiled.error, /Instantiated by invalid[(]1[)]/);
   }
  }
 });
}

test('forward declaration queries resolve long annotated and inferred chains without recursive inference', () => {
 for (const inferred of [false, true]) for (const operators of [false, true]) {
  const lines = ['import tower;'];
  const suffix = operators ? ' + 1' : '';
  for (let index = 0; index < 1024; index++) {
   lines.push(inferred ? `var value${index} = value${index + 1}${suffix};` : `var value${index}: decltype(value${index + 1}${suffix});`);
  }
  lines.push(operators ? 'var value1024: u64 = 0;' : 'var value1024: bool = false;');
  const handle = tower.compile(lines.join('\n'));
  try {
   // Check type resolution/serialization without executing forward reads of
   // uninitialized runtime storage in the inference-only variant.
   const canonical = tower.foundation(handle);
   assert.equal(typeof canonical.source, 'string', canonical.error);
   assert.match(canonical.source, operators ? /var value0: u64/ : /var value0: bool/);
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

test('parameterized fields await long forward type chains without recursive checking', async () => {
 const original = await readFile('scaffolding/tests/decltype_type_fields.tower', 'utf8');
 const chain = Array.from({length:244}, (_,i) => `var seed${i+12}:decltype(seed${i+13});`);
 const source = original.replace('var seed12:u64=0;', chain.join('\n')+'\nvar seed256:u64=0;');
 for (const width of [4,8]) for (const fast of [false,true]) execute(source, width, fast);
 const compiled = llvm.compile(source);
 assert.equal(compiled.status,'compiled',compiled.error);
 assert.equal((await executeWasm(compiled)).output,'0\n');
});
