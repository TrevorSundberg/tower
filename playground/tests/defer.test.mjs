import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower();
const source = fixtureSource('.tower/tests/defer_scopes.tower');
const expected = (await readFile(new URL('../../scaffolding/tests/defer_scopes.expected.txt', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
const fixture = name => fixtureSource(`.tower/tests/defer_cases/${name}.tower`);
function finish(handle, fast = false) {
  if (fast) tower.useFast(handle);
  let output = '', result;
  for (let i = 0; i < 10000; i++) {
    result = tower.execute(handle, 11);
    output += result.output;
    if (result.status !== 'executing') return {...result, output};
  }
  assert.fail('Deferred cleanup did not finish within the fixture budget');
}
// Keep the executing test and the compiler or IDE it calls in different Wasm instances.
const encoder = new TextEncoder();
let observedOutputs;
function observe(texts) { observedOutputs = texts.map(text => encoder.encode(text)); }
const probes = await openTower({threads: {capacity: 1}, imports: {
  defer_read_output(context, slot, destination, capacity) {
    const bytes = observedOutputs[Number(slot)];
    if (destination && bytes.length <= Number(capacity)) context.memory().set(bytes, Number(destination));
    return bytes.length;
  },
  defer_roundtrip(_context, pointerBytes, fast) {
    const handle = tower.compile(source, {pointerBytes:Number(pointerBytes)});
    try {
      const result = finish(handle, fast);
      assert.equal(result.status, 'done', result.error);
      const canonical = tower.foundation(handle).source;
      const round = tower.compileFoundation(canonical);
      try {
        const reparsed = finish(round, fast);
        assert.equal(reparsed.status, 'done', reparsed.error);
        observe([expected, result.output, reparsed.output, canonical, tower.foundation(round).source]);
      } finally { tower.destroyExecution(round); }
    } finally { tower.destroyExecution(handle); }
  },
  defer_error_offset(context, path, fast) {
    const name = guestString(context, path);
    const handle = tower.compile(fixture(name));
    try {
      const result = finish(handle, fast);
      observe([result.output, result.error, result.status]);
      return result.errorOffset;
    } finally { tower.destroyExecution(handle); }
  },
  defer_complete(context, path, cursor) {
    const result = tower.complete(fixture(guestString(context, path)), Number(cursor));
    assert.equal(result.error, undefined);
    observe(result.options.map(option => option.label));
    return result.options.length;
  },
}});

// Each registered Node selector enters a real inline Tower test with its own capabilities.
function checkCase(name, outputs = [], chunks = 1) {
  try {
    observe(outputs);
    runSelectedTest(probes, `.tower/compiler/semantic_defer_test/${name}.tower`, chunks);
  } finally { observedOutputs = undefined; }
}

test('defer preserves scope, exit order, return snapshots and captured bindings through Foundation', () => {
  // Compare the complete canonical texts produced by all four executions.
  checkCase('roundtrip', [], 200);
});
test('defer agrees with raw and optimized LLVM/Wasm', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
  const outputs = [expected];
  const llvm = await openLLVM();
  for (const optimize of [false, true]) outputs.push(await llvmOutput(llvm, source, {optimize}));
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
