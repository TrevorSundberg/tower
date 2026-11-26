import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';
const traces = await Promise.all(['operators', 'null_operators'].map(async fixture => {
  const path = new URL('../../scaffolding/tests/' + fixture + '.expected', import.meta.url);
  const expected = (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
  return {fixture, expected, source:fixtureSource('.tower/tests/' + fixture + '.tower')};
}));
const tower = await openTower();
function execute(handle) {
  let output = '', result;
  for (let i = 0; i < 100000; ++i) {
    result = tower.execute(handle, 7); output += result.output;
    if (result.status !== 'executing') break;
  }
  assert.equal(result.status, 'done', result.error);
  return output;
}
for (const {fixture, source, expected} of traces) {
  test(fixture + ' preserve values, grouping and effects through Foundation', () => {
    for (const pointerBytes of [4,8]) for (const fast of [false,true]) {
      const handle = tower.compile(source, {pointerBytes});
      try {
        if (fast) tower.useFast(handle);
        assert.equal(execute(handle), expected);
        const canonical = tower.foundation(handle).source;
        const rebuilt = tower.compileFoundation(canonical);
        try {
          assert.equal(execute(rebuilt), expected);
          assert.equal(tower.foundation(rebuilt).source, canonical);
        } finally { tower.destroyExecution(rebuilt); }
      } finally { tower.destroyExecution(handle); }
    }
  });
  test(fixture + ' agree with LLVM/Wasm', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
    assert.equal(await llvmOutput(await openLLVM(), source), expected);
  });
}

test('every compound operator reuses its binary operation semantics', () => {
  tower.configureModules({entry:'.tower/tests/compound_operators.tower'});
  const handle = tower.compileTests();
  try {
    assert.equal(execute(handle), '');
    assert.equal(tower.testCount(handle), 14);
  } finally { tower.destroyExecution(handle); }
});

test('invalid operator operands are rejected before execution', async () => {
  // The outer test reads the result of a real request on a separate interpreter.
  let result;
  const encoder = new TextEncoder();
  const helperPath = '.tower/tests/increment_builtin.tower';
  const helper = {path:helperPath, text:fixtureSource(helperPath)};
  const checks = await openTower({imports: {
    operator_execute(context, name) {
      const entry = '.tower/tests/' + guestString(context, name) + '.tower';
      const handle = tower.compileFiles([{path:entry, text:fixtureSource(entry)}, helper]);
      try {
        result = tower.execute(handle, 100000);
        return result.steps;
      } finally { tower.destroyExecution(handle); }
    },
    operator_text(context, field) {
      const bytes = encoder.encode(result[guestString(context, field)] ?? '');
      const pointer = context.allocate(bytes.length + 1);
      if (!pointer) throw new Error('Cannot copy operator observation');
      const memory = context.memory();
      memory.set(bytes, pointer);
      memory[pointer + bytes.length] = 0;
      return pointer;
    },
    operator_output_length() { return result.output.length; },
  }});
  runSelectedTest(checks, '.tower/tests/operator_inputs/rejections.tower');
});
