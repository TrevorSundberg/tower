import {after, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm, runToEnd} from './compiler-fixtures.mjs';

const read = path => readFile(new URL('../../' + path, import.meta.url));
const fixture = async name => (await read('scaffolding/tests/foreach_inputs/' + name + '.tower')).toString();
const foundation = (await read('scaffolding/foundation.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation);
after(() => tower.close());
const llvm = process.env.TOWER_INTERPRETER_ONLY ? null :
  await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);

// Resolve imports from the same fixture directory as the native compiler.
const directory = {entry: '.tower/tests/foreach_inputs/input.tower'};
tower.configureModules(directory);
llvm?.configureModules(directory);

function finish(handle) {
  let result, output = '';
  do {
    result = tower.execute(handle, 100000);
    output += result.output;
  } while (result.status === 'executing');
  return {...result, output};
}

function execute(source, width = 4, fast = false) {
  const handle = tower.compile(source, {pointerBytes: width});
  try {
    if (fast) tower.useFast(handle);
    const result = finish(handle);
    return {...result, foundation: result.status === 'done' ? tower.foundation(handle).source : ''};
  } finally {
    tower.destroyExecution(handle);
  }
}

async function compare(name, expected) {
  const source = await fixture(name);
  let canonical;
  for (const width of [4, 8]) {
    for (const fast of [false, true]) {
      const result = execute(source, width, fast);
      assert.equal(result.status, 'done', result.error);
      assert.equal(result.output, expected);
      const round = execute(result.foundation, width, fast);
      assert.equal(round.status, 'done', round.error);
      assert.equal(round.output, expected);
      assert.equal(round.foundation, result.foundation);
      canonical = result.foundation;
    }
  }
  if (llvm) {
    for (const [input, optimize] of [[source, false], [source, true], [canonical, true]]) {
      const built = llvm.compile(input, {optimize});
      assert.equal(built.status, 'compiled', built.error);
      const result = await executeWasm(built);
      assert.equal(result.status, 'done', result.error);
      assert.equal(result.output, expected);
    }
  }
}

const vectorOutput = '11\n12\n13\n1\n1\n2\n4\n6\n21\n22\n21\n';
const ringOutput = '6\n7\n8\n9\n16\n17\n18\n19\n4\n5\n';
const protocolOutput = '4\n1332\n99\n3\n132\n3\n1122\n12\n42\n';
const controlOutput = '26\n1\n2\n1\n';
const workerOutput = '39\n';

test('foreach copies scalar values, borrows aggregates and evaluates its source once',
  () => compare('vector_values', vectorOutput));
test('foreach preserves ring FIFO order and aliases inherit nominal iteration',
  () => compare('ring_order', ringOutput));
test('nominal protocols in one module clean up exactly once on break return and nesting',
  () => compare('protocol_cleanup', protocolOutput));
test('foreach inside for and deferred blocks keeps continue targets and cleanup order',
  () => compare('loop_targets', controlOutput));

test('foreach diagnoses unsupported sources invalid protocols and escaping names', async () => {
  for (const [name, error] of [
    ['scalar_source', /nominal collection/],
    ['missing_protocol', /Missing iteration protocol/],
    ['aggregate_copy', /explicit borrow/],
    ['escaped_item', /Unknown/],
    ['mismatched_state', /parameter types must agree/],
    ['scalar_element', /element: pointer/],
    ['void_element', /element: pointer/],
    ['missing_return', /without returning/],
  ]) {
    const result = execute(await fixture(name));
    assert.equal(result.status, 'error', name);
    assert.match(result.error, error);
    assert.equal(result.output, '');
  }
});

test('foreach formatting is stable and Foundation retains ordinary identifiers', async () => {
  const source = await fixture('format_borrow');
  function format(input) {
    const handle = tower.create(input);
    try {
      assert.equal(runToEnd(tower, handle).end.status, 'done');
      const result = tower.format(handle);
      assert.equal(result.error, undefined);
      return result.source;
    } finally {
      tower.destroy(handle);
    }
  }
  const formatted = format(source);
  assert.equal(format(formatted), formatted);
  for (const text of [formatted, await fixture('foundation_identifier')]) {
    const result = execute(text);
    assert.equal(result.status, 'done', result.error);
    assert.equal(result.output, '42\n');
  }
});

test('the shared iteration worker fixture retains its runtime behavior',
  () => compare('worker_checksum', workerOutput));

test('Tests discovers the borrowed foreach companion from the worker unit', () => {
  tower.configureModules({entry: '.tower/tests/iteration_parallel_unit.tower'});
  let handle;
  try {
    handle = tower.compileTests();
    const result = finish(handle);
    assert.equal(result.status, 'done', result.error);
    assert.equal(tower.testCount(handle), 5);
    assert.equal(result.output, vectorOutput + ringOutput + protocolOutput + controlOutput + workerOutput);
  } finally {
    if (handle) tower.destroyExecution(handle);
    tower.configureModules(directory);
  }
});
