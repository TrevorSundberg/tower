import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';

const read = path => readFile(new URL('../../' + path, import.meta.url));
const fixture = async name => (await read('scaffolding/tests/increment/' + name + '.tower')).toString();
const foundation = (await read('scaffolding/foundation.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation);
const llvm = process.env.TOWER_INTERPRETER_ONLY ? null
  : await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);

async function compare(source, output) {
  const handle = tower.compile(source);
  try {
    let actual = '', result;
    for (let i = 0; i < 20000; i++) {
      result = tower.execute(handle, 1);
      actual += result.output;
      if (result.status !== 'executing') break;
    }
    assert.equal(result.status, 'done', result.error);
    assert.equal(actual, output);

    const canonical = tower.foundation(handle).source;
    const replay = tower.compileFoundation(canonical);
    try {
      assert.equal(tower.foundation(replay).source, canonical);
    } finally {
      tower.destroyExecution(replay);
    }
    if (llvm) {
      const compiled = llvm.compile(canonical);
      assert.equal(compiled.status, 'compiled', compiled.error);
      const executed = await executeWasm(compiled);
      assert.equal(executed.status, 'done', executed.error);
      assert.equal(executed.output, output);
    }
  } finally {
    tower.destroyExecution(handle);
  }
}

test('increment example uses ordinary places and standalone calls', async () => {
  await compare((await read('scaffolding/examples/increment.tower')).toString(), '5\n6\n7\n7\n9\n');
});
test('the same increment rules compose in operands, calls, returns, conditions and indices', async () => {
  await compare(await fixture('composition'), '7\n9\n20\n11\n11\n12\n13\ntrue\n14\n20\n1\n21\n40\n42\n43\n');
});
test('nested operands preserve left-to-right values and capture the assignment target first', async () => {
  await compare(await fixture('nested'), '11\n2\nfalse\n4\n2\n1\n20\n');
});
test('address operands share checking and lowering for user and builtin calls', async () => {
  await compare(await fixture('address'), '42\n42\n42\n7\n42\ntrue\n');
});
test('increment and nested calls retain static errors before execution', async () => {
  const helpers = {path: 'tests/increment_builtin.tower', text: (await read('scaffolding/tests/increment_builtin.tower')).toString()};
  for (const [name, message] of [
    ['bool_operand', /integer operands/],
    ['argument_type', /integer type|Expected i32\*/],
    ['void_value', /void call cannot be used as a value/],
    ['missing_local', /Unknown local/],
    ['literal_place', /addressable location/],
    ['nesting_limit', /expression nesting limit/],
  ]) {
    const handle = tower.compileFiles([{path: `tests/increment/${name}.tower`, text: await fixture(name)}, helpers]);
    try {
      const result = tower.execute(handle);
      assert.equal(result.status, 'error', name);
      assert.equal(result.steps, 0, name);
      assert.equal(result.output, '', name);
      assert.match(result.error, message, name);
    } finally {
      tower.destroyExecution(handle);
    }
  }
});
test('an infinite nested call stays resumable with one-step budgets', async () => {
  const handle = tower.compile(await fixture('forever'));
  try {
    for (let step = 1; step <= 20; step++) {
      const result = tower.execute(handle, 1);
      assert.equal(result.status, 'executing');
      assert.equal(result.steps, step);
      assert.equal(result.output, '');
    }
  } finally {
    tower.destroyExecution(handle);
  }
});
