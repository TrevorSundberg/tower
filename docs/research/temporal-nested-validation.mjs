/** Real public-API exercises: bytes, opcodes, nested controllers and replay. */
import assert from 'node:assert/strict';
import { createNestedRuntime, RepairStatus } from './temporal-nested-api.mjs';
import { referenceNestedRun } from './temporal-nested-reference.mjs';

const r = (reg) => ({ reg });
const load = (id, addr, history, width = 4) => ({ id, op: 'load', dst: id, addr, width,
  ...(history === undefined ? {} : { history }) });
const store = (id, addr, value, width = 4) => ({ id, op: 'store', addr, width, value });
const binary = (op, id, a, b) => ({ op, id, dst: id, a, b });
const temporal = (id, name, args = [], dst = id) => ({ id, op: 'temporal', name, args, dst });
const enter = (id, history, fn, args = []) => ({ id, op: 'enter', dst: id, history, fn, args });
const ret = (value) => ({ id: 'return', op: 'return', value });
const fn = (body, params = []) => ({ params, body });
const location = (id, history, addr, type = 'u32') => ({ id, op: 'location', dst: id, history, addr, type });
const totals = { cases: 0, oracleComparisons: 0, successfulRepairs: 0, directedAssertions: 0 };
const cases = [];

function tree(runtime, history = null) {
  const state = runtime.inspect(history);
  return { memory: state.memory, children: state.children.map((child) => tree(runtime, child)) };
}
function oracleTree(state) {
  return { memory: state.memory, children: state.children.map(oracleTree) };
}
function same(runtime, program, values, label, options = {}) {
  const expected = referenceNestedRun(program, { memorySize: 64, ...options,
    inputs: values.map((value, i) => ({ address: 4 * i, type: 'u32', value })), fn: 'main' });
  assert.deepEqual(tree(runtime), oracleTree(expected), label);
  totals.oracleComparisons += 1;
  return expected;
}
function equal(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
  totals.directedAssertions += 1;
}
function start(program, values, options = {}) {
  const runtime = createNestedRuntime(program, { memorySize: 64, ...options });
  const writes = values.map((value, i) => runtime.api.temporal_write(runtime.location(null, i * 4, 'u32'), value));
  runtime.run(null, 'main');
  same(runtime, program, values, 'initial fresh reference', options);
  return { runtime, writes };
}
function correct(runtime, writes, values) {
  const edit = runtime.api.temporal_edit(null);
  const before = tree(runtime);
  writes.forEach((write, i) => runtime.api.temporal_replace(edit, write, values[i]));
  equal(tree(runtime), before, 'staging must not publish any subtree');
  equal(runtime.api.temporal_repair(edit), RepairStatus.OK, 'real enum result');
  totals.successfulRepairs += 1;
}
function test(name, body) { body(); totals.cases += 1; cases.push(name); }

test('all eleven public methods exist; null explicitly selects the root', () => {
  const runtime = createNestedRuntime({ functions: { main: fn([ret(0)]) } });
  equal(Object.keys(runtime.api).sort(), [
    'temporal_create', 'temporal_destroy', 'temporal_write', 'temporal_edit',
    'temporal_replace', 'temporal_remove', 'temporal_repair', 'temporal_cancel',
    'temporal_mark', 'temporal_point', 'temporal_store_at',
  ].sort());
  const edit = runtime.api.temporal_edit(null);
  equal(runtime.api.temporal_repair(edit), RepairStatus.OK);
  totals.successfulRepairs += 1;
  assert.throws(() => runtime.api.temporal_edit(undefined), (error) => error.code === 'INVALID_HISTORY');
});

// No game entities or semantic dependency callbacks: all state is raw bytes.
const counterProgram = { functions: {
  main: fn([
    load('count', 0), temporal('child', 'temporal_create'),
    { id: 'loop', op: 'repeat', count: r('count'), index: 'index', body: [enter('step', r('child'), 'increment')] },
    load('answer', 0, r('child')), store('save', 8, r('answer')), ret(r('answer')),
  ]),
  increment: fn([load('old', 0), binary('add', 'next', r('old'), 1), store('save', 0, r('next')), ret(r('next'))]),
} };

test('parent loop 2 -> 1 -> 0 revokes advances instead of duplicating them', () => {
  const { runtime, writes } = start(counterProgram, [2]);
  equal(runtime.read(runtime.location(null, 8)), 2n);
  const child = runtime.inspect(null).children[0];
  for (const count of [1, 0, 3, 2, 1, 1]) {
    correct(runtime, writes, [count]);
    same(runtime, counterProgram, [count], `parent correction count=${count}`);
    equal(runtime.read(runtime.location(null, 8)), BigInt(count));
    equal(runtime.read(runtime.location(child, 0)), BigInt(count), 'surviving child handle retains logical identity');
  }
});

// A controls B; B creates, executes and repairs C. B's earlier snapshot of C
// must stay 6, while its later read sees 2*n. A repair reconstructs BOTH reads.
const nestedProgram = { functions: {
  main: fn([
    load('input', 0), temporal('child', 'temporal_create'), enter('answer', r('child'), 'controller', [r('input')]),
    store('save', 16, r('answer')), ret(r('answer')),
  ]),
  controller: fn([
    temporal('grandchild', 'temporal_create'), location('input_location', r('grandchild'), 0),
    temporal('input_event', 'temporal_write', [r('input_location'), 3]),
    enter('first', r('grandchild'), 'double'), load('before', 4, r('grandchild')),
    temporal('edit', 'temporal_edit', [r('grandchild')]),
    temporal('replace', 'temporal_replace', [r('edit'), r('input_event'), r('input')]),
    temporal('status', 'temporal_repair', [r('edit')]),
    load('after', 4, r('grandchild')), store('save_before', 8, r('before')), store('save_after', 12, r('after')),
    binary('add', 'sum', r('before'), r('after')), store('save_sum', 16, r('sum')), ret(r('sum')),
  ], ['input']),
  double: fn([load('input', 0), binary('mul', 'answer', r('input'), 2), store('save', 4, r('answer')), ret(r('answer'))]),
} };

test('three levels: child repair is retained under ancestor repair', () => {
  const { runtime, writes } = start(nestedProgram, [5]);
  const child = runtime.inspect(null).children[0];
  const grandchild = runtime.inspect(child).children[0];
  for (const value of [7, 0, 9, 3, 5]) {
    correct(runtime, writes, [value]);
    same(runtime, nestedProgram, [value], `ancestor correction n=${value}`);
    equal(runtime.read(runtime.location(child, 8)), 6n, 'earlier observation remains old child revision');
    equal(runtime.read(runtime.location(child, 12)), 2n * BigInt(value), 'later observation sees corrected revision');
    equal(runtime.read(runtime.location(grandchild, 4)), 2n * BigInt(value));
    equal(runtime.read(runtime.location(null, 16)), 6n + 2n * BigInt(value));
  }
});

test('closed-owned grandchildren disappear with a corrected ancestor branch', () => {
  const program = structuredClone(nestedProgram);
  const original = program.functions.main.body;
  program.functions.main.body = [load('enabled', 4), {
    id: 'enabled_branch', op: 'if', cond: r('enabled'), then: original.slice(0, -1),
    else: [store('disabled_result', 16, 99)],
  }, ret(0)];
  const { runtime, writes } = start(program, [5, 1]);
  const oldChild = runtime.inspect(null).children[0];
  const oldGrandchild = runtime.inspect(oldChild).children[0];
  correct(runtime, writes, [5, 0]);
  same(runtime, program, [5, 0], 'removed subtree');
  equal(runtime.inspect(null).children.length, 0);
  assert.throws(() => runtime.inspect(oldChild), (e) => e.code === 'INVALID_HISTORY');
  assert.throws(() => runtime.inspect(oldGrandchild), (e) => e.code === 'INVALID_HISTORY');
  correct(runtime, writes, [5, 1]);
  same(runtime, program, [5, 1], 'new subtree at resurrected source occurrence');
  assert.throws(() => runtime.inspect(oldChild), (e) => e.code === 'INVALID_HISTORY');
  assert.notEqual(runtime.inspect(null).children[0], oldChild, 'dead public handle never resurrects');
});

test('nesting is not hardcoded to two levels', () => {
  const program = { functions: {
    main: fn([load('depth', 0), { id: 'ordinary', op: 'call', dst: 'answer', fn: 'chain', args: [r('depth')] },
      store('save', 8, r('answer')), ret(r('answer'))]),
    chain: fn([{ id: 'branch', op: 'if', cond: r('depth'), then: [
      temporal('child', 'temporal_create'), binary('sub', 'remaining', r('depth'), 1),
      enter('tail', r('child'), 'chain', [r('remaining')]), binary('add', 'answer', r('tail'), 1),
      store('save_child', 8, r('answer')), ret(r('answer')),
    ], else: [store('leaf', 8, 1), ret(1)] }], ['depth']),
  } };
  // Distinct ids are required even in opposite branches of one function.
  program.functions.chain.body[0].then.at(-1).id = 'return_branch';
  program.functions.chain.body[0].else.at(-1).id = 'return_leaf';
  const { runtime, writes } = start(program, [8], { maxDepth: 64 });
  for (const depth of [12, 3, 0, 6]) {
    correct(runtime, writes, [depth]);
    same(runtime, program, [depth], `nested depth ${depth}`, { maxDepth: 64 });
    equal(runtime.read(runtime.location(null, 8)), BigInt(depth + 1));
  }
});

test('original loads and overwrites use actual typed constants and memory reads', () => {
  for (const masked of [false, true]) {
    const program = { functions: { main: fn([
      load('a', 0), load('b', 4), binary('add', 'sum', r('a'), r('b')),
      ...(masked ? [store('overwrite', 8, 9)] : []), load('c', 8),
      binary('mul', 'answer', r('sum'), r('c')), store('save', 16, r('answer')), ret(r('answer')),
    ]) } };
    const { runtime, writes } = start(program, [3, 5, 9]);
    equal(runtime.read(runtime.location(null, 16)), 72n);
    correct(runtime, writes, [3, 5, 6]);
    same(runtime, program, [3, 5, 6], `original masked=${masked}`);
    equal(runtime.read(runtime.location(null, 16)), masked ? 72n : 48n);
  }
});

test('historical insertion changes subsequent reads, not an already loaded temporary', () => {
  for (const afterLoad of [false, true]) {
    const marker = { id: 'gap', op: 'mark', label: 'gap' };
    const read = load('extra', 12);
    const program = { functions: { main: fn([
      load('a', 0), load('b', 4), binary('add', 'sum', r('a'), r('b')), load('c', 8),
      ...(afterLoad ? [read, marker] : [marker, read]), binary('add', 'factor', r('c'), r('extra')),
      binary('mul', 'answer', r('sum'), r('factor')), store('save', 16, r('answer')), ret(r('answer')),
    ]) } };
    const { runtime } = start(program, [3, 5, 9, 1]);
    equal(runtime.read(runtime.location(null, 16)), 80n);
    const point = runtime.api.temporal_point(null, 'gap', 0);
    const edit = runtime.api.temporal_edit(null);
    const patch = runtime.api.temporal_store_at(edit, point, runtime.location(null, 12), 2);
    equal(runtime.api.temporal_repair(edit), RepairStatus.OK);
    totals.successfulRepairs += 1;
    equal(runtime.read(runtime.location(null, 12)), 2n);
    equal(runtime.read(runtime.location(null, 16)), afterLoad ? 80n : 88n);
    const removal = runtime.api.temporal_edit(null);
    runtime.api.temporal_remove(removal, patch);
    equal(runtime.api.temporal_repair(removal), RepairStatus.OK);
    totals.successfulRepairs += 1;
    same(runtime, program, [3, 5, 9, 1], 'removed historical insertion matches original fresh replay');
  }
});

test('overlapping byte reads preserve unaffected bytes', () => {
  const program = { functions: { main: fn([load('word', 0), store('save', 16, r('word')), ret(r('word'))]) } };
  const runtime = createNestedRuntime(program, { memorySize: 64 });
  const wide = runtime.api.temporal_write(runtime.location(null, 0, 'u32'), 0x11223344);
  const byte = runtime.api.temporal_write(runtime.location(null, 1, 'u8'), 0xaa);
  runtime.run(null, 'main');
  equal(runtime.read(runtime.location(null, 16)), 0x1122aa44n);
  const edit = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(edit, wide, 0x55667788);
  equal(runtime.api.temporal_repair(edit), RepairStatus.OK);
  totals.successfulRepairs += 1;
  equal(runtime.read(runtime.location(null, 16)), 0x5566aa88n);
  const remove = runtime.api.temporal_edit(null);
  runtime.api.temporal_remove(remove, byte);
  equal(runtime.api.temporal_repair(remove), RepairStatus.OK);
  totals.successfulRepairs += 1;
  equal(runtime.read(runtime.location(null, 16)), 0x55667788n);
});

test('all small parent transition pairs match an independent fresh interpreter', () => {
  for (let before = 0; before <= 6; before += 1) {
    for (let after = 0; after <= 6; after += 1) {
      const { runtime, writes } = start(counterProgram, [before]);
      correct(runtime, writes, [after]);
      same(runtime, counterProgram, [after], `${before} -> ${after}`);
    }
  }
});

test('seeded multilevel correction sequence matches independent fresh replay', () => {
  const { runtime, writes } = start(nestedProgram, [3]);
  let seed = 0x51a7c0de;
  for (let iteration = 0; iteration < 160; iteration += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = seed % 257;
    correct(runtime, writes, [value]);
    same(runtime, nestedProgram, [value], `seeded revision ${iteration}`);
  }
});

console.log(JSON.stringify({ status: 'PASS', totals, cases,
  scope: 'Closed-owned nested history API, byte/opcode execution, conservative full subtree replay',
  nativePerformanceClaim: false, mechanizedProofClaim: false }, null, 2));
