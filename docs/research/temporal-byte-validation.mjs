/** Untyped core, independent replay and tracked source-memory validation. */
import assert from 'node:assert/strict';
import { createByteRuntime, RepairStatus } from './temporal-nested-api.mjs';
import { referenceRun } from './temporal-api-reference.mjs';
import { referenceNestedRun } from './temporal-nested-reference.mjs';

const r = reg => ({ reg });
const fn = (body, params = []) => ({ body, params });
const load = (id, addr, history, width = 4) => ({ id, op: 'load', dst: id, addr, width,
  ...(history === undefined ? {} : { history }) });
const store = (id, addr, value, width = 4) => ({ id, op: 'store', addr, value, width });
const command = (id, name, args = []) => ({ id, op: 'temporal', dst: id, name, args });
const addr = (id, history, address) => ({ id, op: 'address', dst: id, history, addr: address });
const ret = value => ({ id: 'return', op: 'return', value });
const enter = (id, history, name) => ({ id, op: 'enter', dst: id, history, fn: name, args: [] });
const totals = { cases: 0, comparisons: 0, successfulRepairs: 0, assertions: 0 };
const cases = [];
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); totals.assertions++; };
function test(name, body) { body(); cases.push(name); totals.cases++; }
const bytes32 = value => {
  const output = new Uint8Array(4);
  let rest = BigInt(value);
  for (let i = 0; i < 4; i++) { output[i] = Number(rest & 255n); rest >>= 8n; }
  return output;
};
function numeric(bytes) {
  let value = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) value = (value << 8n) | BigInt(bytes[i]);
  return value;
}

test('raw arbitrary-width events match independent byte-memory replay', () => {
  const program = { functions: { main: fn([
    { id: 'gap', op: 'mark', label: 'gap' },
    { id: 'zero', op: 'const', dst: 'sum', value: 0 },
    { id: 'loop', op: 'repeat', count: 64, index: 'i', body: [
      load('byte', r('i'), undefined, 1), { id: 'add', op: 'add', dst: 'sum', a: r('sum'), b: r('byte') },
    ] }, store('output', 96, r('sum'), 8), ret(r('sum')),
  ]) } };
  const runtime = createByteRuntime(program, { memorySize: 128 });
  const history = { initial: new Uint8Array(128), events: [], patches: [], maxSteps: 100000, maxDepth: 128 };
  let id = 1;
  const verify = label => {
    const reference = referenceRun(program, history);
    const actual = runtime.inspect(null);
    equal(actual.memory, reference.memory, `${label}: full bytes`);
    equal([...actual.results.values()], [...reference.results.values()], `${label}: computed return values`);
    totals.comparisons++;
  };
  const inputs = [];
  for (const [offset, count] of [[0, 3], [2, 7], [10, 17], [25, 31], [48, 13]]) {
    const source = Uint8Array.from({ length: count + 3 }, (_, i) => (offset + 7 * i) & 255);
    const event = { kind: 'write', id: `w${id++}`, addr: offset, bytes: new Uint8Array(source.subarray(0, count)) };
    const handle = runtime.api.temporal_write(runtime.address(null, offset), source, count);
    source.fill(255);
    history.events.push(event); inputs.push({ handle, event });
    verify(`append ${count} bytes`);
  }
  runtime.run(null, 'main');
  const invocation = { kind: 'call', id: `i${id++}`, fn: 'main', args: [] };
  history.events.push(invocation); verify('ordinary loads and sum');
  for (const event of runtime.inspect(null).events.filter(event => event.kind === 'write')) {
    equal(Object.hasOwn(event, 'type'), false, 'raw event contains no T/type field');
  }
  let seed = 987654321;
  for (let turn = 0; turn < 120; turn++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const { handle, event } = inputs[seed % inputs.length];
    const source = Uint8Array.from({ length: event.bytes.length + 5 }, (_, i) => (seed + i * 13) & 255);
    const expected = new Uint8Array(source.subarray(0, event.bytes.length));
    const edit = runtime.api.temporal_edit(null);
    runtime.api.temporal_replace(edit, handle, source); // Width comes from event.
    source.fill(99);
    equal(runtime.api.temporal_repair(edit), RepairStatus.OK);
    event.bytes = expected;
    totals.successfulRepairs++; verify(`replacement ${turn}`);
  }
  const point = runtime.api.temporal_point(null, 'gap', 0);
  const edit = runtime.api.temporal_edit(null);
  const source = Uint8Array.from({ length: 11 }, (_, i) => i + 5);
  const patch = runtime.api.temporal_store_at(edit, point, runtime.address(null, 40), source, source.length);
  history.patches.push({ kind: 'write', id: 'p1', at: `${invocation.id}/main/gap`, addr: 40, bytes: new Uint8Array(source) });
  source.fill(77);
  equal(runtime.api.temporal_repair(edit), RepairStatus.OK); totals.successfulRepairs++;
  verify('eleven-byte historical insertion');
  const remove = runtime.api.temporal_edit(null);
  runtime.api.temporal_remove(remove, patch); history.patches = [];
  equal(runtime.api.temporal_repair(remove), RepairStatus.OK); totals.successfulRepairs++;
  verify('remove raw intervention');
});

function nestedProgram(byteMode) {
  const pointer = (id, history, address) => byteMode ? addr(id, history, address) : {
    id, op: 'location', dst: id, history, addr: address, type: 'u32',
  };
  return { functions: {
    main: fn([
      store('seed', 8, 3), load('seed_value', 8), load('new_value', 0),
      command('child', 'temporal_create'), pointer('destination', r('child'), 0),
      ...(byteMode ? [addr('source', null, 8), addr('replacement', null, 0)] : []),
      command('input', 'temporal_write', byteMode ? [r('destination'), r('source'), 4] : [r('destination'), r('seed_value')]),
      enter('run_child', r('child'), 'double'), load('before', 4, r('child')),
      command('edit', 'temporal_edit', [r('child')]),
      command('replace', 'temporal_replace', [r('edit'), r('input'), byteMode ? r('replacement') : r('new_value')]),
      command('repair', 'temporal_repair', [r('edit')]), load('after', 4, r('child')),
      store('save_before', 16, r('before')), store('save_after', 20, r('after')), ret(r('after')),
    ]),
    double: fn([load('n', 0), { id: 'multiply', op: 'mul', dst: 'twice', a: r('n'), b: 2 },
      store('save', 4, r('twice')), ret(r('twice'))]),
  } };
}
function runtimeTree(runtime, h = null) {
  const state = runtime.inspect(h);
  return { memory: state.memory, children: state.children.map(child => runtimeTree(runtime, child)) };
}
function referenceTree(state) { return { memory: state.memory, children: state.children.map(referenceTree) }; }

test('tracked source copy records byte reads and survives ancestor correction', () => {
  const byteProgram = nestedProgram(true), typedReferenceProgram = nestedProgram(false);
  const runtime = createByteRuntime(byteProgram, { memorySize: 64 });
  const input = runtime.api.temporal_write(runtime.address(null, 0), bytes32(5), 4);
  runtime.run(null, 'main');
  for (const value of [5, 7, 0, 257, 3, 23]) {
    const edit = runtime.api.temporal_edit(null);
    runtime.api.temporal_replace(edit, input, bytes32(value));
    equal(runtime.api.temporal_repair(edit), RepairStatus.OK); totals.successfulRepairs++;
    const reference = referenceNestedRun(typedReferenceProgram, {
      memorySize: 64, inputs: [{ address: 0, type: 'u32', value }], fn: 'main',
    });
    equal(runtimeTree(runtime), referenceTree(reference), 'raw source-copy behavior agrees with independent by-value semantics');
    totals.comparisons++;
    equal(numeric(runtime.read(runtime.address(null, 16), 4)), 6n, 'earlier child observation remains historical');
    equal(numeric(runtime.read(runtime.address(null, 20), 4)), 2n * BigInt(value));
    const trace = runtime.inspect(null).trace;
    const copy = trace.find(entry => entry.key.endsWith('/input'));
    const replacement = trace.find(entry => entry.key.endsWith('/replace'));
    equal(copy.reads.map(read => read.addr).sort((a, b) => a - b), [8, 9, 10, 11]);
    equal(copy.reads.every(read => read.source.endsWith('/seed')), true, 'initial copy links to the ordinary source store');
    equal(replacement.reads.map(read => read.addr).sort((a, b) => a - b), [0, 1, 2, 3]);
    equal(replacement.reads.every(read => read.source.startsWith('write:')), true, 'replacement copy links to parent input bytes');
  }
});

test('store_at snapshots present source memory, not source at the past mark', () => {
  const program = { functions: { main: fn([
    { id: 'gap', op: 'mark', label: 'gap' }, load('loaded', 16), store('result', 20, r('loaded')),
    store('future_source', 0, 99), ret(r('loaded')),
  ]) } };
  const runtime = createByteRuntime(program);
  const source = runtime.address(null, 0), destination = runtime.address(null, 16);
  runtime.api.temporal_write(source, bytes32(7), 4);
  runtime.api.temporal_write(destination, bytes32(1), 4);
  runtime.run(null, 'main');
  equal(numeric(runtime.read(source, 4)), 99n);
  const point = runtime.api.temporal_point(null, 'gap', 0), edit = runtime.api.temporal_edit(null);
  runtime.api.temporal_store_at(edit, point, destination, source, 4);
  equal(runtime.api.temporal_repair(edit), RepairStatus.OK); totals.successfulRepairs++;
  equal(numeric(runtime.read(runtime.address(null, 20), 4)), 99n, 'must not recapture historical 7 instead of present 99');
});

test('three-level raw controllers use each executing history as the source owner', () => {
  function threeLevel(byteMode) {
    const program = nestedProgram(byteMode);
    const worker = program.functions.main;
    worker.params = ['argument'];
    worker.body.unshift(store('argument_store', 0, r('argument')));
    // An omitted history here means the executing worker, not the root.
    for (const ins of worker.body) if (ins.id === 'source' || ins.id === 'replacement') delete ins.history;
    program.functions.worker = worker;
    program.functions.main = fn([
      load('input', 0), command('middle', 'temporal_create'),
      { id: 'run_middle', op: 'enter', history: r('middle'), fn: 'worker', args: [r('input')], dst: 'answer' },
      store('save', 20, r('answer')), ret(r('answer')),
    ]);
    return program;
  }
  const runtime = createByteRuntime(threeLevel(true));
  const input = runtime.api.temporal_write(runtime.address(null, 0), bytes32(11), 4);
  runtime.run(null, 'main');
  for (const value of [4, 0, 255, 11]) {
    const edit = runtime.api.temporal_edit(null);
    runtime.api.temporal_replace(edit, input, bytes32(value));
    equal(runtime.api.temporal_repair(edit), RepairStatus.OK); totals.successfulRepairs++;
    const reference = referenceNestedRun(threeLevel(false), { inputs: [{ address: 0, type: 'u32', value }], fn: 'main' });
    equal(runtimeTree(runtime), referenceTree(reference)); totals.comparisons++;
    equal(numeric(runtime.read(runtime.address(null, 20), 4)), 2n * BigInt(value));
    const middle = runtime.inspect(null).children[0];
    equal(runtime.inspect(middle).children.length, 1, 'middle owns the repaired grandchild');
    equal(runtime.inspect(middle).trace.find(entry => entry.key.endsWith('/replace')).reads.length, 4);
  }
});

test('bad corrected byte counts trap without publishing any child changes', () => {
  const program = { functions: { main: fn([
    load('count', 0), store('seed', 8, 0x112233), addr('source', null, 8),
    command('child', 'temporal_create'), addr('destination', r('child'), 0),
    command('copy', 'temporal_write', [r('destination'), r('source'), r('count')]), ret(0),
  ]) } };
  const runtime = createByteRuntime(program);
  const count = runtime.api.temporal_write(runtime.address(null, 0), bytes32(3), 4);
  runtime.run(null, 'main');
  const before = runtimeTree(runtime);
  for (const invalid of [0, 1000]) {
    const edit = runtime.api.temporal_edit(null);
    runtime.api.temporal_replace(edit, count, bytes32(invalid));
    equal(runtime.api.temporal_repair(edit), RepairStatus.TRAP);
    equal(runtimeTree(runtime), before, 'bad count leaves the entire published tree intact');
  }
});

console.log(JSON.stringify({ status: 'PASS', totals, cases,
  scope: 'Untyped byte-core API and captured-source reads; independent byte and nested value replay' }, null, 2));
