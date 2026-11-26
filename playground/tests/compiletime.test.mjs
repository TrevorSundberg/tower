import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {executeWasm, files, generatedSource} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';

const project = {entry:'input.tower'};
let observations;
let selectedBackend;
const encoder = new TextEncoder();
const tower = await openTower({project, imports: {
 observed_text(context, name) {
  const key = guestString(context, name);
  const value = observations[key];
  if (typeof value !== 'string' || value.includes('\0')) throw new Error('Invalid text observation: ' + key);
  const bytes = encoder.encode(value + '\0');
  const pointer = context.allocate(bytes.length);
  if (!pointer) throw new Error('Cannot allocate observation: ' + key);
  context.memory().set(bytes, pointer);
  return pointer;
 },
 compiletime_is_llvm() { return selectedBackend.engine === 'LLVM'; },
 select_compiletime_run(_context, index) {
  assert.equal(Number(index), selectedBackend.consumed, 'Unexpected observation index');
  observations = selectedBackend.runs[Number(index)];
  selectedBackend.consumed++;
  return observations.pointerBytes;
 },
}});
let llvm;
async function llvmHost() {
 return llvm ??= await openLLVM();
}
const stress = {};
async function stressSource(name) {
 return stress[name] ??= await generatedSource(tower, `scaffolding/tests/stress/${name}.tower`);
}

function observeExecution(source, pointerBytes, fast) {
 const handle = tower.compile(source, {pointerBytes});
 try {
  if (fast) tower.useFast(handle);
  let result, output = '';
  do {
   result = tower.execute(handle, 100000);
   assert.ok(!result.outputTruncated, 'Truncated guest output');
   output += result.output;
  } while (result.status === 'executing');
  assert.equal(result.status, 'done', result.error);
  return {output, canonical:tower.foundation(handle).source};
 } finally { tower.destroyExecution(handle); }
}

function execute(source, pointerBytes, fast) {
 const {output, canonical} = observeExecution(source, pointerBytes, fast);
 assert.equal(output, '0\n');
 return canonical;
}

// Only the assertion session binds the browser implementation of the result
// reader. Ordinary source, Foundation replay and native discovery keep their inputs.
const readerPath = '.tower/tests/compiletime_results.tower';
const browserReader = fixtureSource('.tower/tests/compiletime_browser/profile.tower');
const assertionFiles = files.map(file => file.path === readerPath ? {...file, text:browserReader} : file);
// Comparing both complete body_continuation texts took 217 chunks of 100,000 steps.
const compiletimeCheckChunks = 300;

function checkObserved(entry, values, backend) {
 try {
  observations = values;
  selectedBackend = backend && {...backend, consumed:0};
  runSelectedTest(tower, entry, backend ? compiletimeCheckChunks : undefined, backend && assertionFiles);
  if (backend) assert.equal(selectedBackend.consumed, backend.runs.length, entry);
 } finally {
  observations = undefined;
  selectedBackend = undefined;
  tower.configureModules(backend ? {...project, files} : project);
 }
}

function checkGenericBody(name, values) {
 checkObserved(`.tower/tests/generic_body_browser/${name}.tower`, values);
}

const lazyBody = fixtureSource('.tower/tests/generic_body_lazy.tower');
const demandedBody = fixtureSource('.tower/tests/semantic_invalid/generic_body_demanded.tower');

test('signature-only generic queries do not clone unused body descendants (portable)', () => {
 for (const width of [4, 8]) {
  const graph = observeExecution(lazyBody, width, false);
  const fast = observeExecution(lazyBody, width, true);
  const round = observeExecution(graph.canonical, width, true);
  checkGenericBody('lazy_portable', {
   'graph output':graph.output, 'fast output':fast.output, 'round-trip output':round.output,
   'graph Foundation':graph.canonical, 'fast Foundation':fast.canonical, 'round-trip Foundation':round.canonical,
  });
 }
});
test('signature-only generic queries do not clone unused body descendants (LLVM)', async () => {
 checkGenericBody('lazy_llvm', {'LLVM output':await llvmOutput(await llvmHost(), lazyBody)});
});

test('demanded generic body copies retain the node budget and reject execution (portable)', () => {
 for (const width of [4, 8]) {
  const handle = tower.compile(demandedBody, {pointerBytes:width});
  let result;
  try { result = tower.execute(handle); }
  finally { tower.destroyExecution(handle); }
  assert.ok(!result.outputTruncated, 'Truncated guest output');
  checkGenericBody('demanded_portable', result);
 }
});
test('demanded generic body copies retain the node budget and reject execution (LLVM)', async () => {
 checkGenericBody('demanded_llvm', (await llvmHost()).compile(demandedBody));
});

for (const name of ['decltype', 'decltype_expressions', 'declaration_continuations', 'declaration_inference', 'declaration_operands', 'enum_expressions', 'decltype_headers', 'decltype_layout', 'decltype_generic_headers', 'decltype_type_fields', 'decltype_aggregate', 'decltype_lazy_body', 'body_continuation', 'comptime', 'comptime_flow', 'comptime_capture_values']) {
 const file = name + '.tower', entry = '.tower/tests/' + file;
 // These two generic owners emit empty test bodies under paired discovery on the release reactor.
 const paired = name !== 'decltype_lazy_body' && name !== 'decltype_type_fields';
 const companion = `.tower/tests/${name}_${paired ? 'test' : 'browser'}.tower`;
 const source = fixtureSource(entry);
 test(`${name} preserves types and behavior through Foundation and interpreters (portable)`, () => {
  tower.configureModules({entry});
  const runs = [];
  for (const width of [4, 8]) {
   const graph = observeExecution(source, width, false);
   const fast = observeExecution(graph.canonical, width, true);
   runs.push({pointerBytes:width, 'source file':file, 'graph output':graph.output,
    'graph Foundation':graph.canonical, 'fast output':fast.output, 'fast Foundation':fast.canonical});
  }
  checkObserved(companion, undefined, {engine:'portable', runs});
 });
 test(`${name} preserves types and behavior through Foundation and LLVM (LLVM)`, async () => {
  const llvm = await llvmHost();
  tower.configureModules({entry});
  llvm.configureModules({entry});
  // Foundation layout constants belong to the target that produced them.
  // The portable registration above retains both 32- and 64-bit coverage.
  const target = 'wasm32-unknown-unknown', canonicalPointerBytes = 4;
  const artifacts = process.env.TOWER_TEST_ARTIFACTS;
  if (artifacts) await mkdir(artifacts, {recursive:true});
  const phase = message => {
   if (process.env.TOWER_TEST_PHASES) console.error(`${name}: ${message}`);
  };
  phase(`Graph canonical begin pointerBytes=${canonicalPointerBytes}`);
  const {output, canonical} = observeExecution(source, canonicalPointerBytes, false);
  const run = {pointerBytes:canonicalPointerBytes, 'source file':file, 'graph output':output, 'graph Foundation':canonical};
  phase(`Graph canonical done output=${JSON.stringify(output)}`);
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
   run[`LLVM ${kind} error`] = executed.error;
   assert.equal(executed.outputTruncated, false, label);
   run[`LLVM ${kind} output`] = executed.output;
  }
  checkObserved(companion, undefined, {engine:'LLVM', runs:[run]});
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
   if (name.endsWith('_operators')) {
    assert.match(canonical.source, /^var u64: type = integer_type\(64, 0\);$/m);
    assert.match(canonical.source, /^var value0: u64(?:;| = )/m);
   } else assert.match(canonical.source, /var value0: bool/);
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
