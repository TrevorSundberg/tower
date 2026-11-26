import {after, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {files, loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';
const read = path => readFile(new URL('../../' + path, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const bytes = process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm');
const tower = await loadTower(bytes, undefined, foundation);
after(() => tower.close());
const source = (await read('scaffolding/tests/defer_scopes.tower')).toString();
const expected = (await read('scaffolding/tests/defer_scopes.expected.txt')).toString().replaceAll('\r\n', '\n');
function finish(handle) {
  let output = '', result;
  for (let i = 0; i < 10000; i++) {
    result = tower.execute(handle, 11);
    output += result.output;
    if (result.status !== 'executing') return {...result, output};
  }
  assert.fail('Deferred cleanup did not finish within the fixture budget');
}
// Keep the executing test and the compiler or IDE it calls in different Wasm instances.
const fixtureRoot = '.tower/tests/defer_cases/';
const fixtures = new Map(files.filter(file => file.path.startsWith(fixtureRoot))
  .map(file => [file.path.slice(fixtureRoot.length), file.text]));
function fixture(name) {
  const text = fixtures.get(name + '.tower');
  assert.notEqual(text, undefined, name);
  return text;
}
function guestString(context, address) {
  const memory = context.memory(), start = Number(address);
  const end = memory.indexOf(0, start);
  assert.notEqual(end, -1, 'unterminated fixture string');
  return new TextDecoder().decode(memory.subarray(start, end));
}
const encoder = new TextEncoder();
let observedOutputs;
const probes = await loadTower(bytes, undefined, foundation, undefined, undefined, {threads: {capacity: 1}, imports: {
  defer_read_output(context, slot, destination, capacity) {
    const bytes = observedOutputs[Number(slot)];
    if (destination && bytes.length <= Number(capacity)) context.memory().set(bytes, Number(destination));
    return bytes.length;
  },
  defer_error_offset(context, path, fast) {
    const name = guestString(context, path);
    const handle = tower.compile(fixture(name));
    try {
      if (fast) tower.useFast(handle);
      const result = finish(handle);
      assert.equal(result.status, 'error', name);
      observedOutputs = [encoder.encode(result.output), encoder.encode(result.error)];
      return result.errorOffset;
    } finally { tower.destroyExecution(handle); }
  },
  defer_completion_count(context, path, cursor, label) {
    const result = tower.complete(fixture(guestString(context, path)), Number(cursor));
    assert.equal(result.error, undefined);
    if (!label) return result.options.length;
    const text = guestString(context, label);
    return result.options.filter(option => option.label === text).length;
  },
}});
after(() => probes.close());

// Each registered Node selector enters a real inline Tower test with its own capabilities.
function checkCase(name, outputs = []) {
  observedOutputs = outputs.map(text => encoder.encode(text));
  probes.configureModules({entry:`.tower/compiler/semantic_defer_test/${name}.tower`});
  const handle = probes.compileTests();
  try {
    const result = probes.execute(handle, 100000);
    assert.equal(result.status, 'done', result.error && `${result.errorFile} at byte ${result.errorOffset}: ${result.error}`);
    assert.equal(probes.testCount(handle), 1);
  } finally {
    probes.destroyExecution(handle);
    observedOutputs = undefined;
  }
}

test('defer preserves scope, exit order, return snapshots and captured bindings through Foundation', () => {
  const outputs = [expected];
  const byWidth = new Map();
  for (const pointerBytes of [4, 8]) for (const fast of [false, true]) {
    const handle = tower.compile(source, {pointerBytes});
    try {
      if (fast) tower.useFast(handle);
      const result = finish(handle);
      assert.equal(result.status, 'done', result.error);
      outputs.push(result.output);
      const canonical = tower.foundation(handle).source;
      if (byWidth.has(pointerBytes)) assert.equal(canonical, byWidth.get(pointerBytes));
      else byWidth.set(pointerBytes, canonical);
      assert.doesNotMatch(canonical, /\bdefer\b/);
      const round = tower.compileFoundation(canonical);
      try {
        if (fast) tower.useFast(round);
        const result = finish(round);
        assert.equal(result.status, 'done', result.error);
        outputs.push(result.output);
        assert.equal(tower.foundation(round).source, canonical);
      } finally { tower.destroyExecution(round); }
    } finally { tower.destroyExecution(handle); }
  }
  checkCase('roundtrip', outputs);
});
test('defer agrees with raw and optimized LLVM/Wasm', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
  const outputs = [expected];
  const llvm = await loadLLVM(process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);
  for (const optimize of [false, true]) {
    const result = llvm.compile(source, {optimize});
    assert.equal(result.status, 'compiled', result.error);
    const executed = await executeWasm(result);
    assert.equal(executed.status, 'done', executed.error);
    outputs.push(executed.output);
  }
  checkCase('llvm', outputs);
});
test('defer rejects escaping cleanup control flow and unavailable lexical bindings', () => {
  checkCase('diagnostics');
});
test('traps stop execution without unwinding and deferred traps preserve definite termination', () => {
  checkCase('traps');
});
test('Foundation retains defer as an ordinary identifier', () => {
  const handle = tower.compile(fixture('foundation_identifier'));
  try {
    const result = finish(handle);
    assert.equal(result.status, 'done', result.error);
    checkCase('identifier', [result.output]);
  } finally { tower.destroyExecution(handle); }
});
test('defer completion retains source bindings and cleanup control-flow scope', () => {
  checkCase('completion');
});
