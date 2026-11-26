import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower();
const llvm = process.env.TOWER_INTERPRETER_ONLY ? null : await openLLVM();
const inputs = 'inference_inputs/';
const source = path => fixtureSource('.tower/tests/' + path + '.tower');
const expected = path => readFile(new URL('../../scaffolding/tests/' + path + '.expected', import.meta.url));

function withProgram(text, width, read) {
  const handle = tower.compile(text, {pointerBytes:width});
  try { return read(handle); }
  finally { tower.destroyExecution(handle); }
}

function execute(text, width = 4) {
  return withProgram(text, width, handle => {
    const result = tower.execute(handle, 100_000);
    requireStatus(result, 'done');
    return {output:result.output, foundation:tower.foundation(handle).source};
  });
}

// The selected assertion and the compiler it observes have independent Wasm memories.
let records, streams;
const encoder = new TextEncoder();
const checks = await openTower({threads:{capacity:1}, imports:{
  inference_has_llvm: () => Boolean(llvm),
  inference_select(context, name) { streams = records[guestString(context, name)]; },
  inference_read(context, name, destination, capacity) {
    const key = guestString(context, name);
    const value = key.startsWith('invalid/') ? fixtureSource('.tower/tests/' + inputs + key) : streams[key];
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    if (!(bytes instanceof Uint8Array)) throw new Error('Missing inference observation ' + key);
    if (destination && bytes.length <= Number(capacity)) context.memory().set(bytes, Number(destination));
    return bytes.length;
  },
  inference_run_width(_context, width) {
    streams.output = execute(source(inputs + 'width'), Number(width)).output;
  },
  inference_reject(context, marked, plain) {
    const result = withProgram(guestString(context, marked), 4, handle => tower.execute(handle, 100_000));
    Object.assign(streams, result);
    if (llvm) {
      const compiled = llvm.compile(guestString(context, plain));
      streams['LLVM status'] = compiled.status;
      streams['LLVM error'] = compiled.error;
    }
    if (!Number.isSafeInteger(result.steps)) throw new Error('Missing execution step count');
    return result.steps;
  },
}});

// Selection re-registers its project. Only the assertion reactor needs this small import set.
checks.configureModules({files:files.filter(({path}) => path.startsWith('.tower/compiler/semantic_types_test/') ||
  path.startsWith('.tower/library/') || path === '.tower/backend/text.tower')});

function check(suite, values) {
  records = streams = values;
  try { runSelectedTest(checks, '.tower/compiler/semantic_types_test/' + suite + '.tower', 60); }
  finally { records = streams = undefined; }
}

async function roundtrip(path) {
  const text = source(path);
  const original = execute(text);
  const replay = execute(original.foundation);
  const values = {expected:await expected(path), output:original.output, Foundation:original.foundation,
    'replay output':replay.output, 'replay Foundation':replay.foundation};
  if (llvm) {
    values['LLVM source'] = await llvmOutput(llvm, text);
    values['LLVM Foundation'] = await llvmOutput(llvm, original.foundation);
  }
  return values;
}

async function compare(suite, ...names) {
  const values = {};
  for (const name of names) {
    values[name] = await roundtrip(name === 'inference_bindings' ? name : inputs + name);
  }
  check(suite, values);
}

test('initializer inference supports literals, calls, comparisons and raw locations', async () => {
  await compare('bindings', 'inference_bindings', 'locations');
});
test('typed operands constrain literal peers without silently widening typed values', () => compare('peers', 'peers'));
test('module inference follows forward dependencies without changing effect order or storage order', async () => {
  await compare('dependencies', 'dependencies', 'annotation');
});
test('inference works through replacements and preserves local lexical scope', async () => {
  await compare('replacements', 'replacements', 'scope');
});
test('inferred address and storage widths follow the selected target', async () => {
  check('width', {'32-bit expected':await expected(inputs + 'width_32'), '64-bit expected':await expected(inputs + 'width_64')});
});
test('unresolved inference, incompatible types and literal range errors prevent every effect', async () => {
  // Inspect the declarations without running their forward reads of uninitialized storage.
  const canonical = withProgram(source(inputs + 'chain'), 4, handle => tower.foundation(handle));
  if (canonical.error) throw new Error(canonical.error);
  check('diagnostics', {Foundation:canonical.source, expected:await expected(inputs + 'chain'),
    'aggregate_inferred_copy.tower':source('semantic_invalid/aggregate_inferred_copy')});
});
test('source formatting preserves inference while canonical output spells the checked types', async () => {
  const handle = tower.create(source(inputs + 'format'));
  try {
    requireStatus(runToEnd(tower, handle).end, 'done');
    const formatted = tower.format(handle);
    if (formatted.error !== undefined) throw new Error(formatted.error);
    const actual = execute(formatted.source);
    const replay = execute(actual.foundation);
    check('format', {formatted:formatted.source, Foundation:actual.foundation, output:actual.output,
      'replay output':replay.output, expected:await expected(inputs + 'format')});
  } finally { tower.destroy(handle); }
});
