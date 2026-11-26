import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {executeWasm, generatedSource} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';

const project = {entry:'input.tower'};
let observations;
const encoder = new TextEncoder();
const tower = await openTower({project, imports: {
 generic_body_text(context, name) {
  const key = guestString(context, name);
  const value = observations[key];
  if (typeof value !== 'string' || value.includes('\0')) throw new Error('Invalid text observation: ' + key);
  const bytes = encoder.encode(value + '\0');
  const pointer = context.allocate(bytes.length);
  if (!pointer) throw new Error('Cannot allocate observation: ' + key);
  context.memory().set(bytes, pointer);
  return pointer;
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

// Each subject handle is closed before its observations enter the selected Tower test.
function checkGenericBody(name, values) {
 try {
  observations = values;
  runSelectedTest(tower, `.tower/tests/generic_body_browser/${name}.tower`);
 } finally {
  observations = undefined;
  tower.configureModules(project);
 }
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

import {checkStageRejection} from './stage_rejection_host.mjs';

for (const name of [
 'decltype_cycle', 'decltype_header_cycle', 'decltype_parameter_cycle', 'decltype_parameter_field_cycle',
 'decltype_field_cycle', 'decltype_generic_header_cycle', 'decltype_layout_cycle', 'decltype_type_field_cycle',
 'decltype_aggregate_operator', 'aggregate_inferred_copy', 'decltype_body_runtime', 'decltype_body_comptime',
 'decltype_unknown', 'comptime_cycle', 'comptime_defer_cycle', 'comptime_return', 'comptime_output',
 'comptime_uninitialized', 'comptime_dead_pointer', 'comptime_fuel', 'comptime_generic_selected',
 'inference_alias_invalid', 'declaration_index_cycle', 'declaration_index_type',
]) {
 for (const backend of ['portable', 'LLVM']) {
  test(`${name} reports its stage dependency or execution error (${backend})`, async () => {
   const host = backend === 'portable' ? tower : await llvmHost();
   await checkStageRejection(host, project, name, backend);
  });
 }
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
