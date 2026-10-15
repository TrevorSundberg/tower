/** Independent numerical replay checks for the minimal native-shaped API.
 * The oracle below is ordinary JavaScript arithmetic. It does not import any
 * interpreter, trace, patch, allocation, or replay implementation.
 */
import assert from 'node:assert/strict';
import { createTemporalRuntime, Status } from './temporal-core-runtime.mjs';

const R = reg => ({ reg });
const F = (body, params = ['args']) => ({ body, params });
const load = (id, addr, width = 4) => ({ id, op: 'load', dst: id, addr, width });
const store = (id, addr, value, width = 4) => ({ id, op: 'store', addr, value, width });
const op = (id, name, a, b) => ({ id, op: name, dst: id, a, b });
const temporal = (id, name, args) => ({ id, op: 'temporal', dst: id, name, args });
const ret = value => ({ id: 'return', op: 'return', value });
const counts = { cases: 0, comparisons: 0, successfulRepairs: 0, assertions: 0 };
const failures = [];
const names = [];
const equal = (a, b, why) => { assert.deepEqual(a, b, why); counts.assertions++; };
function test(name, work) {
  try { work(); counts.cases++; names.push(name); }
  catch (error) { failures.push({ name, message: error.stack }); }
}
function bytes(value, width = 4) {
  let v = BigInt(value); const result = new Uint8Array(width);
  for (let i = 0; i < width; i++) { result[i] = Number(v & 255n); v >>= 8n; }
  return result;
}
function number(runtime, pointer, width = 4) {
  const values = runtime.debug.read(pointer, width); let result = 0n;
  for (let i = values.length - 1; i >= 0; i--) result = (result << 8n) | BigInt(values[i]);
  return result;
}
function globals(runtime, values) {
  for (const [pointer, value, width = 4] of values)
    runtime.builtins.builtin_temporal_global(pointer, bytes(value, width), width);
}
function insert(runtime, history, point, destination, source, count = source.length) {
  const edit = runtime.api.temporal_edit(history);
  const write = runtime.api.temporal_store_at(edit, point, destination, source, count);
  equal(runtime.api.temporal_repair(edit), Status.OK); counts.successfulRepairs++;
  return write;
}
function replace(runtime, history, write, source) {
  const edit = runtime.api.temporal_edit(history);
  runtime.api.temporal_replace(edit, write, source);
  equal(runtime.api.temporal_repair(edit), Status.OK); counts.successfulRepairs++;
}

test('original loads: unrelated ordinary global addresses, 72 becomes 48', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    load('a', 1000), load('b', 2000), op('sum', 'add', R('a'), R('b')),
    load('c', 3000), op('result', 'mul', R('sum'), R('c')),
    store('save', 8000, R('result')), ret(R('result')),
  ]) } });
  globals(runtime, [[1000, 3], [2000, 5], [3000, 9], [8000, 0]]);
  const beginning = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'main', null, 0);
  equal(number(runtime, 8000), 72n); counts.comparisons++;
  const source = bytes(6);
  const edit = runtime.api.temporal_edit(null);
  const write = runtime.api.temporal_store_at(edit, beginning, 3000, source, 4);
  source.fill(200);
  equal(runtime.api.temporal_repair(edit), Status.OK); counts.successfulRepairs++;
  equal(number(runtime, 8000), 48n, 'source was captured before repair'); counts.comparisons++;
  replace(runtime, null, write, bytes(9));
  equal(number(runtime, 8000), 72n); counts.comparisons++;
  equal(runtime.debug.ownership(1000, 4), runtime.debug.ownership(3000, 4),
    'noncontiguous loader globals are owned by the same root history');
});

test('original masking store: changing the earlier version preserves 72', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    load('a', 1000), load('b', 2000), op('sum', 'add', R('a'), R('b')),
    store('overwrite', 3000, 9), load('c', 3000),
    op('result', 'mul', R('sum'), R('c')), store('save', 8000, R('result')), ret(R('result')),
  ]) } });
  globals(runtime, [[1000, 3], [2000, 5], [3000, 2], [8000, 0]]);
  const beginning = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'main', null, 0);
  const write = insert(runtime, null, beginning, 3000, bytes(6));
  for (const value of [6, 0, 123456, 9]) {
    replace(runtime, null, write, bytes(value));
    equal(number(runtime, 3000), 9n); equal(number(runtime, 8000), 72n); counts.comparisons++;
  }
});

test('original middle-of-function point: 80 becomes 88 without replacing earlier loads', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    load('a', 1000), load('b', 2000), op('sum', 'add', R('a'), R('b')),
    temporal('middle', 'temporal_point', [null]), store('save_point', 9000, R('middle'), 8),
    load('d', 3000), load('e', 4000), op('other', 'add', R('d'), R('e')),
    op('result', 'mul', R('sum'), R('other')), store('save', 8000, R('result')), ret(R('result')),
  ]) } });
  globals(runtime, [[1000, 3], [2000, 5], [3000, 9], [4000, 1], [8000, 0], [9000, 0, 8]]);
  runtime.api.temporal_run(null, 'main', null, 0);
  equal(number(runtime, 8000), 80n); counts.comparisons++;
  const middle = number(runtime, 9000, 8);
  insert(runtime, null, middle, 4000, bytes(2));
  equal(number(runtime, 8000), 88n); counts.comparisons++;
  // This point is after a/b were loaded, so amending a there must not change sum.
  insert(runtime, null, middle, 1000, bytes(100));
  equal(number(runtime, 1000), 100n);
  equal(number(runtime, 8000), 88n, 'past local/SSA values are not reread from present memory'); counts.comparisons++;
});

test('deterministic seeded corrections agree with fresh independent arithmetic', () => {
  const runtime = createTemporalRuntime({ functions: {
    ordinary_sum: F([op('sum', 'add', R('left'), R('right')), ret(R('sum'))], ['left', 'right']),
    main: F([
      load('a', 1000), load('b', 2000), load('c', 3000), load('flag', 4000),
      { id: 'ordinary', op: 'call', fn: 'ordinary_sum', args: [R('a'), R('b')], dst: 'sum' },
      op('product', 'mul', R('sum'), R('c')), store('save_product', 8000, R('product'), 8),
      { id: 'branch', op: 'if', cond: R('flag'), then: [
        op('different', 'xor', R('a'), R('c')), store('branch_write', 8016, R('different'), 8),
      ], else: [] },
      { id: 'zero', op: 'const', dst: 'accumulator', value: 0 },
      { id: 'loop', op: 'repeat', count: R('c'), index: 'i', body: [
        { id: 'term', op: 'add', dst: 'term', a: R('a'), b: R('i') },
        { id: 'accumulate', op: 'add', dst: 'accumulator', a: R('accumulator'), b: R('term') },
      ] },
      store('save_loop', 8008, R('accumulator'), 8), ret(R('product')),
    ]),
  } });
  globals(runtime, [[1000, 3], [2000, 5], [3000, 9], [4000, 1]]);
  runtime.builtins.builtin_temporal_global(8000, new Uint8Array(24), 24);
  const start = runtime.api.temporal_point(null);
  const values = [3, 5, 9, 1];
  const edit = runtime.api.temporal_edit(null);
  const writes = values.map((value, i) => runtime.api.temporal_store_at(edit, start, 1000 * (i + 1), bytes(value), 4));
  equal(runtime.api.temporal_repair(edit), Status.OK); counts.successfulRepairs++;
  runtime.api.temporal_run(null, 'main', null, 0);
  const verify = turn => {
    const [a, b, c, flag] = values;
    let independentLoop = 0n;
    for (let i = 0; i < c; i++) independentLoop += BigInt(a + i);
    const expected = [BigInt(a + b) * BigInt(c), independentLoop, flag ? BigInt(a ^ c) : 0n];
    equal([number(runtime, 8000, 8), number(runtime, 8008, 8), number(runtime, 8016, 8)], expected,
      `fresh full simulation matches correction ${turn}`);
    counts.comparisons++;
  };
  verify('initial');
  let seed = 0xdeadbeef;
  for (let turn = 0; turn < 320; turn++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const index = (seed >>> 12) % 4;
    values[index] = index === 3 ? seed & 1 : index === 2 ? seed % 19 : seed % 10000;
    replace(runtime, null, writes[index], bytes(values[index])); verify(turn);
  }
  // Equivalent intermediate value: swapping the addends preserves the product.
  const before = number(runtime, 8000, 8), swap = runtime.api.temporal_edit(null);
  [values[0], values[1]] = [values[1], values[0]];
  runtime.api.temporal_replace(swap, writes[0], bytes(values[0]));
  runtime.api.temporal_replace(swap, writes[1], bytes(values[1]));
  equal(runtime.api.temporal_repair(swap), Status.OK); counts.successfulRepairs++;
  equal(number(runtime, 8000, 8), before); verify('equivalent sum');
});

test('an empty memory-cell read is a dependency and ordinary branch writes retract', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    load('slot', 1000), { id: 'collision', op: 'if', cond: R('slot'), then: [
      store('hit', 8000, 99),
    ], else: [] }, ret(R('slot')),
  ]) } });
  globals(runtime, [[1000, 0], [8000, 0]]);
  const start = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'main', null, 0);
  equal(number(runtime, 8000), 0n); counts.comparisons++;
  const patch = insert(runtime, null, start, 1000, bytes(1));
  equal(number(runtime, 8000), 99n); counts.comparisons++;
  replace(runtime, null, patch, bytes(0));
  equal(number(runtime, 8000), 0n, 'vanished ordinary store leaves no stale hit'); counts.comparisons++;
});

test('historical insertion captures present source bytes, not historical source bytes', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    temporal('middle', 'temporal_point', [null]), store('save_point', 9000, R('middle'), 8),
    load('value', 2000), store('result', 8000, R('value')), store('future_source', 1000, 99), ret(R('value')),
  ]) } });
  globals(runtime, [[1000, 7], [2000, 1], [8000, 0], [9000, 0, 8]]);
  runtime.api.temporal_run(null, 'main', null, 0);
  const middle = number(runtime, 9000, 8);
  insert(runtime, null, middle, 2000, 1000, 4);
  equal(number(runtime, 8000), 99n); counts.comparisons++;
});

test('ordinary heap allocation owns raw pointers and a live historical gap remains editable after free', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    { id: 'allocate', op: 'alloc', dst: 'p', size: 8 },
    store('initial', R('p'), 4), store('export_pointer', 8000, R('p'), 8),
    temporal('middle', 'temporal_point', [null]), store('export_point', 9000, R('middle'), 8),
    load('value', R('p')), store('answer', 8016, R('value')),
    { id: 'release', op: 'free', addr: R('p') }, ret(R('value')),
  ]) } });
  runtime.builtins.builtin_temporal_global(8000, new Uint8Array(24), 24);
  runtime.builtins.builtin_temporal_global(9000, new Uint8Array(8), 8);
  runtime.api.temporal_run(null, 'main', null, 0);
  const pointer = number(runtime, 8000, 8), point = number(runtime, 9000, 8);
  equal(number(runtime, 8016), 4n);
  insert(runtime, null, point, pointer, bytes(17));
  equal(number(runtime, 8016), 17n, 'destination checked at insertion occurrence, not present time'); counts.comparisons++;
  const atDead = runtime.api.temporal_point(null), before = runtime.debug.inspect(null);
  const edit = runtime.api.temporal_edit(null);
  runtime.api.temporal_store_at(edit, atDead, pointer, bytes(33), 4);
  equal(runtime.api.temporal_repair(edit), Status.TRAP);
  equal(runtime.debug.inspect(null), before, 'failed edit preserves bytes, allocation ownership, points and events');
});

test('three nested controllers agree with independent fresh value computation', () => {
  const runtime = createTemporalRuntime({ functions: {
    main: F([
      temporal('middle', 'temporal_create', []),
      temporal('result', 'temporal_run', [R('middle'), 'middle', 1000, 4]),
      load('value', R('result')), store('save', 8000, R('value')), ret(R('result')),
    ]),
    middle: F([
      { id: 'allocate', op: 'alloc', dst: 'data', size: 16 },
      op('source', 'add', R('data'), 8), load('input', R('args')),
      store('save_input', R('source'), R('input')),
      temporal('leaf', 'temporal_create', []),
      temporal('pointer', 'temporal_run', [R('leaf'), 'allocate_leaf', null, 0]),
      store('save_pointer', R('data'), R('pointer'), 8),
      temporal('point', 'temporal_point', [R('leaf')]), temporal('edit', 'temporal_edit', [R('leaf')]),
      temporal('input_patch', 'temporal_store_at', [R('edit'), R('point'), R('pointer'), R('source'), 4]),
      temporal('repair_leaf', 'temporal_repair', [R('edit')]),
      temporal('advance_leaf', 'temporal_run', [R('leaf'), 'leaf_step', R('data'), 8]),
      load('answer', R('pointer')), store('save_answer', R('data'), R('answer')), ret(R('data')),
    ]),
    allocate_leaf: F([{ id: 'allocate', op: 'alloc', dst: 'p', size: 4 }, ret(R('p'))]),
    leaf_step: F([
      load('p', R('args'), 8), load('input', R('p')),
      op('square', 'mul', R('input'), R('input')), op('answer', 'add', R('square'), 1),
      store('save', R('p'), R('answer')), ret(R('p')),
    ]),
  } });
  globals(runtime, [[1000, 3], [8000, 0]]);
  const beginning = runtime.api.temporal_point(null);
  const input = insert(runtime, null, beginning, 1000, bytes(3));
  runtime.api.temporal_run(null, 'main', null, 0);
  let seed = 1337;
  for (let turn = 0; turn < 96; turn++) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const value = seed % 1024;
    replace(runtime, null, input, bytes(value));
    const independentFreshValue = BigInt(value) * BigInt(value) + 1n;
    equal(number(runtime, 8000), independentFreshValue, `fresh three-level result ${turn}`);
    counts.comparisons++;
  }
});

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', suite: 'temporal-core-validation', ...counts, failures }, null, 2));
  process.exitCode = 1;
} else console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-core-validation', ...counts, names }, null, 2));
