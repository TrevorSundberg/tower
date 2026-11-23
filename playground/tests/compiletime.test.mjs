import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm, generatedSource} from './compiler-fixtures.mjs';

const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
const tower = await loadTower(await readFile(process.env.TOWER_TEST_WASM || 'build/browser-wasi/tower.wasm'), undefined, foundation);
after(() => tower.close());
// Capability selections are separate tests, never a skipped LLVM assertion
// counted as portable acceptance. Ordinary unfiltered runs still require both.
let llvm;
async function llvmHost() {
 return llvm ??= await loadLLVM(process.env.TOWER_TEST_LLVM_WASM ? undefined :
  await readFile('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);
}
const stress = {};
async function stressSource(name) {
 return stress[name] ??= await generatedSource(tower, `scaffolding/tests/stress/${name}.tower`);
}

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

test('signature-only generic queries do not clone unused body descendants (portable)', async () => {
 const source = await readFile('scaffolding/tests/generic_body_lazy.tower', 'utf8');
 for (const width of [4, 8]) {
  const canonical = execute(source, width, false);
  assert.doesNotMatch(canonical, /fn `large\(/);
  assert.equal(execute(source, width, true), canonical);
  assert.equal(execute(canonical, width, true), canonical);
 }
});
test('signature-only generic queries do not clone unused body descendants (LLVM)', async () => {
 const source = await readFile('scaffolding/tests/generic_body_lazy.tower', 'utf8');
 const llvm = await llvmHost();
 const compiled = llvm.compile(source);
 assert.equal(compiled.status, 'compiled', compiled.error);
 assert.equal((await executeWasm(compiled)).output, '0\n');
});

test('demanded generic body copies retain the node budget and reject execution (portable)', async () => {
 const source = await readFile('scaffolding/tests/semantic_invalid/generic_body_demanded.tower', 'utf8');
 for (const width of [4, 8]) {
  const handle = tower.compile(source, {pointerBytes:width});
  try {
   const result = tower.execute(handle);
   assert.equal(result.status, 'error');
   assert.match(result.error, /Template expansion exceeds 65536 nodes/);
   assert.equal(result.output, '');
  } finally { tower.destroyExecution(handle); }
 }
});
test('demanded generic body copies retain the node budget and reject execution (LLVM)', async () => {
 const source = await readFile('scaffolding/tests/semantic_invalid/generic_body_demanded.tower', 'utf8');
 const llvm = await llvmHost();
 const compiled = llvm.compile(source);
 assert.equal(compiled.status, 'error');
 assert.match(compiled.error, /Template expansion exceeds 65536 nodes/);
});

for (const name of ['decltype', 'decltype_expressions', 'declaration_continuations', 'declaration_inference', 'declaration_operands', 'enum_expressions', 'decltype_headers', 'decltype_layout', 'decltype_generic_headers', 'decltype_type_fields', 'decltype_aggregate', 'decltype_lazy_body', 'body_continuation', 'comptime', 'comptime_flow', 'comptime_capture_values']) {
 test(`${name} preserves types and behavior through Foundation and interpreters (portable)`, async () => {
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
 });
 test(`${name} preserves types and behavior through Foundation and LLVM (LLVM)`, async () => {
  const llvm = await llvmHost();
  tower.configureModules({entry: `.tower/tests/${name}.tower`});
  llvm.configureModules({entry: `.tower/tests/${name}.tower`});
  const source = await readFile(`scaffolding/tests/${name}.tower`, 'utf8');
  // Foundation layout constants belong to the target that produced them.
  // The portable registration above retains both 32- and 64-bit coverage.
  const target = 'wasm32-unknown-unknown', canonicalPointerBytes = 4;
  const artifacts = process.env.TOWER_TEST_ARTIFACTS;
  if (artifacts) await mkdir(artifacts, {recursive:true});
  const phase = message => {
   if (process.env.TOWER_TEST_PHASES) console.error(`${name}: ${message}`);
  };
  phase(`Graph canonical begin pointerBytes=${canonicalPointerBytes}`);
  const canonical = execute(source, canonicalPointerBytes, false);
  phase('Graph canonical done output="0\\n"');
  for (const [kind, input] of [['source', source], ['canonical', canonical]]) {
   const label = `${name} ${kind} -> ${target} (canonical pointerBytes=${canonicalPointerBytes})`;
   const path = artifacts && `${artifacts}/${name}.${kind}`;
   if (path) await writeFile(`${path}.tower`, input);
   phase(`${label}: compile begin`);
   const result = llvm.compile(input, {target});
   if (path) await writeFile(`${path}.compile.json`, JSON.stringify({target, canonicalPointerBytes,
    status:result.status, error:result.error, errorOffset:result.errorOffset}));
   phase(`${label}: compile ${result.status}`);
   assert.equal(result.status, 'compiled', `${label}: ${result.error}`);
   if (path) await writeFile(`${path}.wasm`, result.wasm);
   const executed = await executeWasm(result);
   if (path) await writeFile(`${path}.execution.json`, JSON.stringify(executed));
   phase(`${label}: execute ${executed.status} output=${JSON.stringify(executed.output)}`);
   assert.equal(executed.status, 'done', `${label}: ${executed.error}`);
   assert.equal(executed.error, '', label);
   assert.equal(executed.outputTruncated, false, label);
   assert.equal(executed.output, '0\n', label);
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
 ['decltype_aggregate_operator', /Binary operators require scalar or pointer operands/],
 ['aggregate_inferred_copy', /Expected Other, got Item; use an explicit conversion/],
 ['decltype_body_runtime', /Unknown local 'missing_body_value'/],
 ['decltype_body_comptime', /Unknown local 'missing_body_value'/],
 ['decltype_unknown', /Unknown local/],
 ['comptime_cycle', /Compile-time dependency cycle/],
 ['comptime_defer_cycle', /Compile-time dependency cycle/],
 ['comptime_return', /without returning a value/],
 ['comptime_output', /explicit effect capability/],
 ['comptime_uninitialized', /uninitialized local/],
 ['comptime_dead_pointer', /outside live local storage/],
 ['comptime_fuel', /fuel exhausted/],
 ['comptime_generic_selected', /Division by zero/],
 ['inference_alias_invalid', /Cannot infer type argument 'T'; pass explicit type arguments/],
 ['declaration_index_cycle', /initializer dependency cycle first -> second -> first/],
 ['declaration_index_type', /An index must be an integer/],
]) {
 test(`${name} reports its stage dependency or execution error (portable)`, async () => {
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
  }
 });
 test(`${name} reports its stage dependency or execution error (LLVM)`, async () => {
  const source = await readFile(`scaffolding/tests/semantic_invalid/${name}.tower`, 'utf8');
  const llvm = await llvmHost();
  for (const width of [4, 8]) {
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

test('forward declaration queries resolve long annotated and inferred chains without recursive inference (portable)', async () => {
 for (const name of ['annotated', 'inferred', 'annotated_operators', 'inferred_operators']) {
  const handle = tower.compile(await stressSource(name));
  try {
   // Check type resolution/serialization without executing forward reads of
   // uninitialized runtime storage in the inference-only variant.
   const canonical = tower.foundation(handle);
   assert.equal(typeof canonical.source, 'string', canonical.error);
   assert.match(canonical.source, name.endsWith('_operators') ? /var value0: integer_type\(64, 0\)/ : /var value0: bool/);
  } finally { tower.destroyExecution(handle); }
 }
});

test('inferred generic call arguments retain forward declaration dependencies and cycle diagnostics (portable)', async () => {
 for (const name of ['generic_inferred', 'generic_explicit']) {
  const handle = tower.compile(await stressSource(name));
  try {
   // Only resolve the declarations; executing these forward initializers would
   // read runtime storage before its source-ordered initialization.
   const canonical = tower.foundation(handle);
   assert.equal(typeof canonical.source, 'string', canonical.error);
   assert.match(canonical.source, /var value0: bool/);
  } finally { tower.destroyExecution(handle); }
 }
 const handle = tower.compile(await readFile('scaffolding/tests/semantic_invalid/inference_generic_cycle.tower','utf8'));
 try {
  const result = tower.execute(handle);
  assert.equal(result.status, 'error');
  assert.match(result.error, /initializer dependency cycle a -> b -> a/);
 } finally { tower.destroyExecution(handle); }
});

test('parameterized fields await long forward type chains without recursive checking (portable)', async () => {
 const source = await stressSource('type_fields');
 for (const width of [4,8]) for (const fast of [false,true]) execute(source, width, fast);
});
test('parameterized fields await long forward type chains without recursive checking (LLVM)', async () => {
 const source = await stressSource('type_fields');
 const llvm = await llvmHost();
 const compiled = llvm.compile(source);
 assert.equal(compiled.status,'compiled',compiled.error);
 assert.equal((await executeWasm(compiled)).output,'0\n');
});
