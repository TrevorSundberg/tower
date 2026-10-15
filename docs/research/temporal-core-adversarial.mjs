/** Contract-breaking tests for raw pointers, ownership and the ten-operation API. */
import assert from 'node:assert/strict';
import { createTemporalRuntime, Status } from './temporal-core-runtime.mjs';

const R = reg => ({ reg });
const F = (body, params = ['args']) => ({ body, params });
const load = (id, addr, width = 4) => ({ id, op: 'load', dst: id, addr, width });
const store = (id, addr, value, width = 4) => ({ id, op: 'store', addr, value, width });
const op = (id, name, a, b) => ({ id, op: name, dst: id, a, b });
const temporal = (id, name, args) => ({ id, op: 'temporal', dst: id, name, args });
const ret = value => ({ id: 'return', op: 'return', value });
const counts = { cases: 0, assertions: 0, successfulRepairs: 0, expectedFailures: 0 };
const failures = [], names = [];
const equal = (a, b, why) => { assert.deepEqual(a, b, why); counts.assertions++; };
const throws = (work, why) => { assert.throws(work, undefined, why); counts.assertions++; counts.expectedFailures++; };
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
function make(functions = {}) { return createTemporalRuntime({ functions }); }
function global(runtime, pointer, value = 0, width = 4) {
  runtime.builtins.builtin_temporal_global(pointer, bytes(value, width), width);
}
function repair(runtime, edit) {
  equal(runtime.api.temporal_repair(edit), Status.OK); counts.successfulRepairs++;
}
function insert(runtime, history, point, destination, source, count = source.length) {
  const edit = runtime.api.temporal_edit(history);
  const write = runtime.api.temporal_store_at(edit, point, destination, source, count);
  repair(runtime, edit); return write;
}

test('exact public operations, no convenience write, and compiler hooks are separate', () => {
  const runtime = make();
  const arity = {
    temporal_create: 0, temporal_destroy: 1, temporal_run: 4, temporal_point: 1,
    temporal_edit: 1, temporal_store_at: 5, temporal_replace: 3,
    temporal_remove: 2, temporal_repair: 1, temporal_cancel: 1,
  };
  equal(Object.keys(runtime.api).sort(), Object.keys(arity).sort());
  for (const [name, count] of Object.entries(arity)) equal(runtime.api[name].length, count, name);
  equal(Object.keys(runtime.builtins).every(name => name.startsWith('builtin_temporal_')), true);
  equal(Object.keys(Status).sort(), ['OK', 'ORPHANED_POINT', 'TRAP']);
  equal(Object.hasOwn(runtime.api, 'temporal_write'), false);
  equal(Object.hasOwn(runtime.api, 'temporal_mark'), false);
});

test('loader registrations have real bounds and cannot be invented after execution', () => {
  const runtime = make({ nothing: F([ret(0)]) });
  global(runtime, 1000, 7);
  throws(() => global(runtime, 1002, 9), 'overlapping root globals');
  equal(number(runtime, 1000), 7n);
  throws(() => runtime.debug.read(999, 1), 'unregistered memory');
  throws(() => runtime.debug.read(1003, 2), 'crosses allocation boundary');
  runtime.api.temporal_run(null, 'nothing', null, 0);
  throws(() => global(runtime, 3000, 1), 'loader metadata is sealed before ordinary execution');
});

test('malformed counts and sources fail atomically without consuming the edit', () => {
  const runtime = make(); global(runtime, 1000, 4, 8);
  const point = runtime.api.temporal_point(null), before = runtime.debug.read(1000, 8);
  const edit = runtime.api.temporal_edit(null);
  for (const count of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    throws(() => runtime.api.temporal_store_at(edit, point, 1000, bytes(9, 8), count), `count ${count}`);
  throws(() => runtime.api.temporal_store_at(edit, point, 1000, new Uint8Array(2), 3), 'short source');
  throws(() => runtime.api.temporal_store_at(edit, point, 1000, {}, 1), 'fabricated source');
  equal(runtime.debug.read(1000, 8), before);
  runtime.api.temporal_store_at(edit, point, 1000, bytes(11), 4);
  repair(runtime, edit); equal(number(runtime, 1000), 11n);
});

test('arbitrary positive byte widths, replacement width, and source snapshots', () => {
  const runtime = make(); runtime.builtins.builtin_temporal_global(1000, new Uint8Array(96), 96);
  const point = runtime.api.temporal_point(null);
  for (const width of [1, 3, 5, 7, 9, 17, 31, 64]) {
    const source = Buffer.from(Array.from({ length: width + 4 }, (_, i) => (i * 13 + width) & 255));
    const expected = new Uint8Array(source.subarray(2, 2 + width));
    const edit = runtime.api.temporal_edit(null);
    const write = runtime.api.temporal_store_at(edit, point, 1000, source.subarray(2), width);
    source.fill(99); repair(runtime, edit);
    equal(runtime.debug.read(1000, width), expected, `capture ${width} bytes`);
    const replacement = Buffer.from(Array.from({ length: width + 3 }, (_, i) => 200 - i));
    const captured = new Uint8Array(replacement.subarray(0, width));
    const change = runtime.api.temporal_edit(null);
    throws(() => runtime.api.temporal_replace(change, write, new Uint8Array(width - 1)), 'replacement keeps event width');
    runtime.api.temporal_replace(change, write, replacement);
    replacement.fill(22); repair(runtime, change);
    equal(runtime.debug.read(1000, width), captured);
  }
  const copy = runtime.debug.read(1000, 2); copy.fill(0);
  equal(runtime.debug.read(1000, 2), new Uint8Array([200, 199]), 'debug read does not expose mutable internal storage');
});

test('overlapping raw source/destination snapshots work in both directions', () => {
  for (const [source, destination] of [[1000, 1002], [1002, 1000]]) {
    const runtime = make(); runtime.builtins.builtin_temporal_global(1000, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), 8);
    const expected = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    expected.set(expected.slice(source - 1000, source - 1000 + 6), destination - 1000);
    insert(runtime, null, runtime.api.temporal_point(null), destination, source, 6);
    equal(runtime.debug.read(1000, 8), expected);
  }
});

test('start and paused-tail points stay frozen before later execution', () => {
  const runtime = make({ increment: F([
    load('old', 1000), op('next', 'add', R('old'), 1), store('set', 1000, R('next')), ret(R('next')),
  ]) });
  global(runtime, 1000, 0);
  const start = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'increment', null, 0);
  const tail = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'increment', null, 0);
  equal(number(runtime, 1000), 2n);
  const atTail = insert(runtime, null, tail, 1000, bytes(20));
  equal(number(runtime, 1000), 21n, 'tail means gap before the second invocation, not the current end');
  insert(runtime, null, start, 1000, bytes(7));
  equal(number(runtime, 1000), 21n, 'earlier start write remains masked by original tail insertion');
  const remove = runtime.api.temporal_edit(null);
  runtime.api.temporal_remove(remove, atTail); repair(runtime, remove);
  equal(number(runtime, 1000), 9n);
});

test('replace preserves write order while remove-and-insert appends at the same gap', () => {
  const runtime = make(); global(runtime, 1000, 0);
  const point = runtime.api.temporal_point(null), edit = runtime.api.temporal_edit(null);
  const first = runtime.api.temporal_store_at(edit, point, 1000, bytes(1), 4);
  runtime.api.temporal_store_at(edit, point, 1000, bytes(2), 4); repair(runtime, edit);
  equal(number(runtime, 1000), 2n);
  const replacement = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(replacement, first, bytes(3)); repair(runtime, replacement);
  equal(number(runtime, 1000), 2n, 'replacement must not relocate the first intervention');
  const reinsert = runtime.api.temporal_edit(null);
  runtime.api.temporal_remove(reinsert, first);
  runtime.api.temporal_store_at(reinsert, point, 1000, bytes(3), 4); repair(runtime, reinsert);
  equal(number(runtime, 1000), 3n);
  const stale = runtime.api.temporal_edit(null);
  throws(() => runtime.api.temporal_replace(stale, first, bytes(7)), 'removed write handle never revives');
  runtime.api.temporal_cancel(stale);
});

test('orphaned dynamic point rejects atomically; removing its intervention permits retraction', () => {
  const runtime = make({ main: F([
    load('flag', 1000), { id: 'branch', op: 'if', cond: R('flag'), then: [
      temporal('inside', 'temporal_point', [null]), store('save_point', 9000, R('inside'), 8),
      store('ordinary_write', 8000, 42),
    ], else: [] }, ret(0),
  ]) });
  global(runtime, 1000, 1); global(runtime, 8000, 0); global(runtime, 9000, 0, 8);
  const start = runtime.api.temporal_point(null);
  const input = insert(runtime, null, start, 1000, bytes(1));
  runtime.api.temporal_run(null, 'main', null, 0);
  const inside = number(runtime, 9000, 8);
  const intervention = insert(runtime, null, inside, 8000, bytes(17));
  const before = runtime.debug.inspect(null), bad = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(bad, input, bytes(0));
  equal(runtime.api.temporal_repair(bad), Status.ORPHANED_POINT); counts.expectedFailures++;
  equal(runtime.debug.inspect(null), before, 'failed repair changes neither history nor public identities');
  const retract = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(retract, input, bytes(0));
  runtime.api.temporal_remove(retract, intervention); repair(runtime, retract);
  equal(number(runtime, 8000), 0n, 'ordinary branch store is automatically retracted');
  const restore = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(restore, input, bytes(1)); repair(runtime, restore);
  const fresh = number(runtime, 9000, 8);
  equal(fresh === inside, false, 'absent point is not revived by later matching control flow');
  const stale = runtime.api.temporal_edit(null);
  throws(() => runtime.api.temporal_store_at(stale, inside, 8000, bytes(7), 4));
  runtime.api.temporal_cancel(stale);
});

test('staged changes remain private; cancel and failed repair consume edit handles', () => {
  const runtime = make(); global(runtime, 1000, 3);
  const point = runtime.api.temporal_point(null), edit = runtime.api.temporal_edit(null);
  runtime.api.temporal_store_at(edit, point, 1000, bytes(8), 4);
  equal(number(runtime, 1000), 3n);
  throws(() => runtime.api.temporal_edit(null), 'only one batch per target');
  runtime.api.temporal_cancel(edit); equal(number(runtime, 1000), 3n);
  throws(() => runtime.api.temporal_repair(edit), 'cancelled edit stale');
  const bad = runtime.api.temporal_edit(null);
  runtime.api.temporal_store_at(bad, point, 1003, bytes(8), 4);
  equal(runtime.api.temporal_repair(bad), Status.TRAP); counts.expectedFailures++;
  equal(number(runtime, 1000), 3n);
  throws(() => runtime.api.temporal_cancel(bad), 'failed repair consumed edit');
});

test('host-created histories own ordinary allocations; wrong-owner destinations reject', () => {
  const runtime = make({ allocate: F([{ id: 'allocation', op: 'alloc', dst: 'p', size: 16 }, ret(R('p'))]) });
  const a = runtime.api.temporal_create(), b = runtime.api.temporal_create();
  const pa = runtime.api.temporal_run(a, 'allocate', null, 0);
  const pb = runtime.api.temporal_run(b, 'allocate', null, 0);
  equal(runtime.debug.ownership(pa, 16), a); equal(runtime.debug.ownership(pb, 16), b);
  equal(pa === pb, false);
  const ea = runtime.api.temporal_edit(a), eb = runtime.api.temporal_edit(b);
  const point = runtime.api.temporal_point(a);
  runtime.api.temporal_store_at(ea, point, pb, bytes(1), 4);
  equal(runtime.api.temporal_repair(ea), Status.TRAP, 'foreign destination rejected at historical insertion occurrence');
  counts.expectedFailures++;
  equal(runtime.debug.read(pa, 4), new Uint8Array(4)); equal(runtime.debug.read(pb, 4), new Uint8Array(4));
  runtime.api.temporal_cancel(eb);
  runtime.api.temporal_destroy(a);
  throws(() => runtime.debug.read(pa, 1));
  throws(() => runtime.api.temporal_point(a));
  equal(runtime.debug.read(pb, 1), new Uint8Array([0]));
});

test('run copies argument bytes; argument memory is readonly and not a live outside pointer', () => {
  const runtime = make({
    capture: F([
      load('input', R('args')), { id: 'allocate', op: 'alloc', dst: 'p', size: 4 },
      store('save', R('p'), R('input')), ret(R('p')),
    ]),
    illegal_write: F([store('bad', R('args'), 99), ret(0)]),
    follow_pointer: F([load('pointer', R('args'), 8), load('follow', R('pointer')), ret(R('follow'))]),
  });
  global(runtime, 1000, 77);
  const history = runtime.api.temporal_create(), source = bytes(7);
  const p = runtime.api.temporal_run(history, 'capture', source, 4);
  source.fill(8); repair(runtime, runtime.api.temporal_edit(history)); equal(number(runtime, p), 7n);
  const before = runtime.debug.inspect(history);
  throws(() => runtime.api.temporal_run(history, 'illegal_write', bytes(1), 4), 'copied argument is readonly');
  equal(runtime.debug.inspect(history), before);
  throws(() => runtime.api.temporal_run(history, 'follow_pointer', bytes(1000, 8), 8),
    'copying a pointer value does not grant access to parent/foreign pointee');
  equal(runtime.debug.inspect(history), before);
});

test('NULL is fixed root; active self/ancestor editing and child writes to globals fail', () => {
  for (const [name, body] of [
    ['edit_root', [temporal('edit', 'temporal_edit', [null]), ret(0)]],
    ['write_root', [store('write', 1000, 4), ret(0)]],
  ]) {
    const runtime = make({ [name]: F(body) }); global(runtime, 1000, 7);
    const child = runtime.api.temporal_create(), before = runtime.debug.inspect(null);
    throws(() => runtime.api.temporal_run(child, name, null, 0));
    equal(runtime.debug.inspect(null), before); equal(number(runtime, 1000), 7n);
  }
  const runtime = make({ self: F([temporal('edit', 'temporal_edit', [null]), ret(0)]) });
  throws(() => runtime.api.temporal_run(null, 'self', null, 0));
});

test('removed allocation addresses cannot silently become newly allocated storage', () => {
  const runtime = make({ main: F([
    load('flag', 1000), { id: 'branch', op: 'if', cond: R('flag'), then: [
      { id: 'allocate', op: 'alloc', dst: 'p', size: 8 }, store('export', 8000, R('p'), 8),
    ], else: [] }, ret(0),
  ]) });
  global(runtime, 1000, 1); global(runtime, 8000, 0, 8);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(1));
  runtime.api.temporal_run(null, 'main', null, 0);
  const old = number(runtime, 8000, 8); equal(runtime.debug.read(old, 1), new Uint8Array([0]));
  for (const flag of [0, 1]) {
    const edit = runtime.api.temporal_edit(null); runtime.api.temporal_replace(edit, input, bytes(flag)); repair(runtime, edit);
  }
  const current = number(runtime, 8000, 8);
  equal(current === old, false, 'allocation lifetime, not only static instruction, determines pointer identity');
  throws(() => runtime.debug.read(old, 1)); equal(runtime.debug.read(current, 1), new Uint8Array([0]));
});

test('nested creation, allocation, child repair and no-op replay never double-advance', () => {
  const runtime = make({
    main: F([
      temporal('child', 'temporal_create', []),
      temporal('pointer', 'temporal_run', [R('child'), 'initialize', null, 0]),
      store('export_pointer', 2000, R('pointer'), 8), store('export_child', 2016, R('child'), 8),
      temporal('point', 'temporal_point', [R('child')]), temporal('edit', 'temporal_edit', [R('child')]),
      temporal('input', 'temporal_store_at', [R('edit'), R('point'), R('pointer'), 1000, 4]),
      temporal('repair', 'temporal_repair', [R('edit')]),
      temporal('advance', 'temporal_run', [R('child'), 'increment', 2000, 8]),
      load('before', R('pointer')), store('save_before', 8000, R('before')),
      temporal('noop', 'temporal_edit', [R('child')]), temporal('noop_repair', 'temporal_repair', [R('noop')]),
      load('after', R('pointer')), store('save_after', 8004, R('after')), ret(R('pointer')),
    ]),
    initialize: F([{ id: 'alloc', op: 'alloc', dst: 'p', size: 4 }, ret(R('p'))]),
    increment: F([
      load('p', R('args'), 8), load('old', R('p')), op('next', 'add', R('old'), 1),
      store('save', R('p'), R('next')), ret(R('p')),
    ]),
  });
  global(runtime, 1000, 2);
  runtime.builtins.builtin_temporal_global(2000, new Uint8Array(24), 24);
  runtime.builtins.builtin_temporal_global(8000, new Uint8Array(8), 8);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(2));
  runtime.api.temporal_run(null, 'main', null, 0);
  const child = number(runtime, 2016, 8), pointer = number(runtime, 2000, 8);
  for (const value of [2, 8, 0, 17, 99, 3]) {
    const edit = runtime.api.temporal_edit(null); runtime.api.temporal_replace(edit, input, bytes(value)); repair(runtime, edit);
    equal(number(runtime, 8000), BigInt(value + 1)); equal(number(runtime, 8004), BigInt(value + 1));
    equal(number(runtime, pointer), BigInt(value + 1));
    equal(number(runtime, 2016, 8), child, 'continuously present child identity retained');
    equal(runtime.debug.ownership(pointer, 4), child);
  }
  throws(() => runtime.api.temporal_edit(child), 'host cannot bypass recorded parent controller');
});

test('parent failure rolls back child destruction and every published byte/ownership', () => {
  const runtime = make({
    main: F([
      temporal('child', 'temporal_create', []),
      temporal('pointer', 'temporal_run', [R('child'), 'initialize', null, 0]),
      store('export_pointer', 2000, R('pointer'), 8), store('export_child', 2016, R('child'), 8),
      load('fail', 1000), { id: 'branch', op: 'if', cond: R('fail'), then: [
        temporal('destroy', 'temporal_destroy', [R('child')]), load('invalid_read', 999999),
      ], else: [] }, ret(R('pointer')),
    ]),
    initialize: F([{ id: 'alloc', op: 'alloc', dst: 'p', size: 4 }, store('save', R('p'), 33), ret(R('p'))]),
  });
  global(runtime, 1000, 0); runtime.builtins.builtin_temporal_global(2000, new Uint8Array(24), 24);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(0));
  runtime.api.temporal_run(null, 'main', null, 0);
  const pointer = number(runtime, 2000, 8), child = number(runtime, 2016, 8);
  const beforeRoot = runtime.debug.inspect(null), beforeChild = runtime.debug.inspect(child);
  const edit = runtime.api.temporal_edit(null); runtime.api.temporal_replace(edit, input, bytes(1));
  equal(runtime.api.temporal_repair(edit), Status.TRAP); counts.expectedFailures++;
  equal(runtime.debug.inspect(null), beforeRoot); equal(runtime.debug.inspect(child), beforeChild);
  equal(runtime.debug.ownership(pointer, 4), child); equal(number(runtime, pointer), 33n);
  repair(runtime, runtime.api.temporal_edit(null)); equal(number(runtime, pointer), 33n);
});

test('successful child repair is still private until the enclosing parent publishes', () => {
  const runtime = make({
    main: F([
      temporal('child', 'temporal_create', []),
      temporal('pointer', 'temporal_run', [R('child'), 'initialize', null, 0]),
      store('export_pointer', 2000, R('pointer'), 8), store('export_child', 2016, R('child'), 8),
      temporal('point', 'temporal_point', [R('child')]), temporal('edit', 'temporal_edit', [R('child')]),
      temporal('input', 'temporal_store_at', [R('edit'), R('point'), R('pointer'), 1000, 4]),
      temporal('repair', 'temporal_repair', [R('edit')]),
      load('flag', 1000), { id: 'fail', op: 'if', cond: R('flag'), then: [load('invalid', 999999)], else: [] },
      ret(R('pointer')),
    ]),
    initialize: F([{ id: 'alloc', op: 'alloc', dst: 'p', size: 4 }, ret(R('p'))]),
  });
  global(runtime, 1000, 0); runtime.builtins.builtin_temporal_global(2000, new Uint8Array(24), 24);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(0));
  runtime.api.temporal_run(null, 'main', null, 0);
  const pointer = number(runtime, 2000, 8), child = number(runtime, 2016, 8);
  const beforeRoot = runtime.debug.inspect(null), beforeChild = runtime.debug.inspect(child);
  const edit = runtime.api.temporal_edit(null); runtime.api.temporal_replace(edit, input, bytes(1));
  equal(runtime.api.temporal_repair(edit), Status.TRAP); counts.expectedFailures++;
  equal(runtime.debug.inspect(null), beforeRoot); equal(runtime.debug.inspect(child), beforeChild);
  equal(number(runtime, pointer), 0n, 'inner TEMPORAL_OK cannot leak out of failed enclosing candidate');
});

test('tracked source copies record actual byte reads and producer dependencies', () => {
  const runtime = make({
    main: F([
      store('produce', 1000, 6), temporal('child', 'temporal_create', []),
      temporal('run', 'temporal_run', [R('child'), 'capture', 1000, 4]), ret(R('run')),
    ]),
    capture: F([load('input', R('args')), { id: 'allocate', op: 'alloc', dst: 'p', size: 4 },
      store('save', R('p'), R('input')), ret(R('p'))]),
  });
  global(runtime, 1000, 0);
  const result = runtime.api.temporal_run(null, 'main', null, 0);
  equal(number(runtime, result), 6n);
  const copy = runtime.debug.inspect(null).trace.find(entry => entry.id.endsWith('/run'));
  equal(copy.reads.map(read => read.address), [1000n, 1001n, 1002n, 1003n]);
  equal(copy.reads.every(read => read.producer.endsWith('/produce')), true,
    'copied argument bytes remain a dependency in the calling computation');
});

test('foreign-source reading and child free of a parent allocation reject atomically', () => {
  const runtime = make({
    allocate: F([{ id: 'allocate', op: 'alloc', dst: 'p', size: 4 }, ret(R('p'))]),
    free_foreign: F([load('p', R('args'), 8), { id: 'release', op: 'free', addr: R('p') }, ret(0)]),
  });
  const a = runtime.api.temporal_create(), b = runtime.api.temporal_create();
  const p = runtime.api.temporal_run(a, 'allocate', null, 0);
  const before = runtime.debug.inspect(a);
  throws(() => runtime.api.temporal_run(b, 'free_foreign', bytes(p, 8), 8));
  equal(runtime.debug.inspect(a), before); equal(runtime.debug.ownership(p, 4), a);
});

test('callbacks cannot publish a subtree containing an unfinished descendant edit', () => {
  const runtime = make({ main: F([
    temporal('child', 'temporal_create', []), temporal('edit', 'temporal_edit', [R('child')]), ret(R('child')),
  ]) });
  const before = runtime.debug.inspect(null);
  throws(() => runtime.api.temporal_run(null, 'main', null, 0), 'publication with dangling descendant batch');
  equal(runtime.debug.inspect(null), before);
});

test('host source representation rejects non-byte typed arrays, proxies and detached views', () => {
  const runtime = make(); global(runtime, 1000, 0, 8);
  const point = runtime.api.temporal_point(null), edit = runtime.api.temporal_edit(null);
  for (const source of [new Uint16Array([0x1234, 0x5678]), new Int32Array([17]), new Proxy(new Uint8Array([1]), {})])
    throws(() => runtime.api.temporal_store_at(edit, point, 1000, source, 1));
  const detached = new Uint8Array([1]); structuredClone(detached.buffer, { transfer: [detached.buffer] });
  throws(() => runtime.api.temporal_store_at(edit, point, 1000, detached, 1));
  runtime.api.temporal_cancel(edit); equal(number(runtime, 1000), 0n);
});

test('a point after an insertion is frozen and becomes orphaned if that insertion is removed', () => {
  const runtime = make({ increment: F([
    load('old', 1000), op('next', 'add', R('old'), 1), store('set', 1000, R('next')), ret(R('next')),
  ]) });
  global(runtime, 1000, 0);
  const start = runtime.api.temporal_point(null), first = insert(runtime, null, start, 1000, bytes(1));
  const afterFirst = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'increment', null, 0);
  insert(runtime, null, start, 1000, bytes(3));
  const inside = insert(runtime, null, afterFirst, 1000, bytes(10));
  equal(number(runtime, 1000), 4n, '10 follows first insertion but precedes the later same-start insertion 3');
  const before = runtime.debug.inspect(null), orphan = runtime.api.temporal_edit(null);
  runtime.api.temporal_remove(orphan, first);
  equal(runtime.api.temporal_repair(orphan), Status.ORPHANED_POINT); counts.expectedFailures++;
  equal(runtime.debug.inspect(null), before);
  const remove = runtime.api.temporal_edit(null);
  runtime.api.temporal_remove(remove, first); runtime.api.temporal_remove(remove, inside); repair(runtime, remove);
  equal(number(runtime, 1000), 4n);
});

test('foreign runtime history, point, edit, and write handles do not alias', () => {
  const a = make(), b = make(); global(a, 1000); global(b, 1000);
  const ha = a.api.temporal_create(), hb = b.api.temporal_create();
  throws(() => a.api.temporal_point(hb)); throws(() => b.api.temporal_destroy(ha));
  const pa = a.api.temporal_point(null), pb = b.api.temporal_point(null);
  const ea = a.api.temporal_edit(null), eb = b.api.temporal_edit(null);
  throws(() => a.api.temporal_store_at(ea, pb, 1000, bytes(1), 4));
  throws(() => a.api.temporal_cancel(eb));
  const wa = a.api.temporal_store_at(ea, pa, 1000, bytes(1), 4);
  const wb = b.api.temporal_store_at(eb, pb, 1000, bytes(2), 4);
  throws(() => a.api.temporal_replace(ea, wb, bytes(8)));
  throws(() => b.api.temporal_remove(eb, wa));
  repair(a, ea); repair(b, eb);
  equal(number(a, 1000), 1n); equal(number(b, 1000), 2n);
});

test('free checks base, lifetime and storage kind; argument snapshots expire on return', () => {
  const runtime = make({
    argument: F([ret(R('args'))]),
    free_global: F([{ id: 'free', op: 'free', addr: 1000 }, ret(0)]),
    free_interior: F([
      { id: 'allocate', op: 'alloc', dst: 'p', size: 4 }, op('interior', 'add', R('p'), 1),
      { id: 'free', op: 'free', addr: R('interior') }, ret(0),
    ]),
    double_free: F([
      { id: 'allocate', op: 'alloc', dst: 'p', size: 4 }, { id: 'first', op: 'free', addr: R('p') },
      { id: 'second', op: 'free', addr: R('p') }, ret(0),
    ]),
  });
  global(runtime, 1000, 7);
  const expired = runtime.api.temporal_run(null, 'argument', bytes(3), 4);
  throws(() => runtime.debug.read(expired, 1), 'entry argument snapshot lifetime ends at return');
  const before = runtime.debug.inspect(null);
  for (const fn of ['free_global', 'free_interior', 'double_free']) {
    throws(() => runtime.api.temporal_run(null, fn, null, 0)); equal(runtime.debug.inspect(null), before);
  }
  equal(number(runtime, 1000), 7n);
});

test('pointer-producing reads and arithmetic remain dependencies when a target changes', () => {
  const runtime = make({ main: F([
    load('pointer', 1000, 8), op('address', 'add', R('pointer'), 1), load('value', R('address'), 1),
    store('save', 8000, R('value')), ret(R('value')),
  ]) });
  global(runtime, 1000, 2000, 8);
  runtime.builtins.builtin_temporal_global(2000, new Uint8Array([3, 7]), 2);
  runtime.builtins.builtin_temporal_global(3000, new Uint8Array([5, 11]), 2);
  global(runtime, 8000);
  const start = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'main', null, 0); equal(number(runtime, 8000), 7n);
  const change = insert(runtime, null, start, 1000, bytes(3000, 8));
  equal(number(runtime, 8000), 11n);
  const trace = runtime.debug.inspect(null).trace;
  const read = trace.find(entry => entry.id.endsWith('/value'));
  equal(read.operands.some(producer => producer.endsWith('/address')), true);
  const edit = runtime.api.temporal_edit(null); runtime.api.temporal_replace(edit, change, bytes(2000, 8)); repair(runtime, edit);
  equal(number(runtime, 8000), 7n);
});

test('allocation size/alignment validation is atomic and ownership is not inferred from proximity', () => {
  throws(() => make({ allocate: F([
    { id: 'alloc', op: 'alloc', dst: 'p', size: 4, alignment: 1.5 }, ret(R('p')),
  ]) }), 'fractional machine operands are rejected when compiling opcode data');
  for (const alignment of [0, 3, -1, 33554432]) {
    const runtime = make({ allocate: F([
      { id: 'alloc', op: 'alloc', dst: 'p', size: 4, alignment }, ret(R('p')),
    ]) });
    const before = runtime.debug.inspect(null);
    throws(() => runtime.api.temporal_run(null, 'allocate', null, 0));
    equal(runtime.debug.inspect(null), before);
  }
  const runtime = make({ allocate: F([
    { id: 'alloc', op: 'alloc', dst: 'p', size: 17, alignment: 64 }, ret(R('p')),
  ]) });
  const pointer = runtime.api.temporal_run(null, 'allocate', null, 0);
  equal(pointer % 64n, 0n); equal(runtime.debug.read(pointer + 16n, 1), new Uint8Array([0]));
  throws(() => runtime.debug.read(pointer + 17n, 1), 'one-past pointer is not a live byte');
  throws(() => runtime.debug.ownership(pointer - 1n, 1), 'nearby virtual addresses are not implicitly owned');
});

test('ordinary calls and numerical equality use tracked machine values without a temporal call operation', () => {
  const runtime = make({
    equals: F([op('equal', 'eq', R('x'), 1), ret(R('equal'))], ['x']),
    main: F([
      load('value', 1000), { id: 'ordinary', op: 'call', dst: 'answer', fn: 'equals', args: [R('value')] },
      store('save', 8000, R('answer')), ret(R('answer')),
    ]),
  });
  global(runtime, 1000, 1); global(runtime, 8000, 0);
  const start = runtime.api.temporal_point(null);
  runtime.api.temporal_run(null, 'main', null, 0); equal(number(runtime, 8000), 1n);
  const intervention = insert(runtime, null, start, 1000, bytes(2));
  equal(number(runtime, 8000), 0n);
  const edit = runtime.api.temporal_edit(null); runtime.api.temporal_replace(edit, intervention, bytes(1)); repair(runtime, edit);
  equal(number(runtime, 8000), 1n);
  const ordinary = runtime.debug.inspect(null).trace.find(entry => entry.id.endsWith('/ordinary'));
  equal(ordinary.operands.some(producer => producer.endsWith('/value')), true);
  equal(Object.hasOwn(runtime.api, 'temporal_call'), false);
});

test('a controller cannot mutate a grandchild behind the immediate parent', () => {
  const runtime = make({
    main: F([
      temporal('middle', 'temporal_create', []),
      temporal('leaf', 'temporal_run', [R('middle'), 'make_leaf', null, 0]),
      temporal('illegal', 'temporal_edit', [R('leaf')]), ret(0),
    ]),
    make_leaf: F([temporal('leaf', 'temporal_create', []), ret(R('leaf'))]),
  });
  const before = runtime.debug.inspect(null);
  throws(() => runtime.api.temporal_run(null, 'main', null, 0)); equal(runtime.debug.inspect(null), before);
});

test('prototype execution-budget exhaustion is ordinary TRAP and rolls back, not an extra API status', () => {
  const runtime = createTemporalRuntime({ functions: { main: F([
    load('count', 1000), { id: 'loop', op: 'repeat', count: R('count'), index: 'i', body: [
      load('previous', 8000), op('next', 'add', R('previous'), 1), store('save', 8000, R('next')),
    ] }, ret(0),
  ]) } }, { maxSteps: 40 });
  global(runtime, 1000, 1); global(runtime, 8000, 0);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(1));
  runtime.api.temporal_run(null, 'main', null, 0);
  const before = runtime.debug.inspect(null), edit = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(edit, input, bytes(10000));
  equal(runtime.api.temporal_repair(edit), Status.TRAP); counts.expectedFailures++;
  equal(runtime.debug.inspect(null), before); equal(number(runtime, 8000), 1n);
  equal(Object.hasOwn(Status, 'LIMIT'), false);
});

test('retained raw arguments replay create then destroy without rewriting captured handles', () => {
  const runtime = make({
    create_child: F([temporal('child', 'temporal_create', []), ret(R('child'))]),
    destroy_child: F([
      load('child', R('args'), 8), temporal('destroy', 'temporal_destroy', [R('child')]), ret(0),
    ]),
  });
  const child = runtime.api.temporal_run(null, 'create_child', null, 0);
  equal(runtime.debug.inspect(child).alive, true);
  const captured = bytes(child, 8);
  runtime.api.temporal_run(null, 'destroy_child', captured, 8);
  throws(() => runtime.debug.inspect(child), 'the later recorded destruction makes the child currently dead');
  const before = runtime.debug.inspect(null);
  repair(runtime, runtime.api.temporal_edit(null));
  equal(runtime.debug.inspect(null), before, 'no-op replay preserves the frozen argument bytes and producer identities');
  throws(() => runtime.debug.inspect(child), 'replay must perform the same destruction again');
  equal(runtime.debug.inspect(null).events[1].args, captured,
    'replay must not secretly rewrite an accepted argument snapshot to a new handle');
});

test('undoing a later destruction restores the same continuously present creation occurrence', () => {
  const runtime = make({ main: F([
    temporal('child', 'temporal_create', []), load('flag', 1000),
    { id: 'destroy_if', op: 'if', cond: R('flag'), then: [
      temporal('destroy', 'temporal_destroy', [R('child')]),
    ], else: [] }, store('export', 2000, R('child'), 8), ret(R('child')),
  ]) });
  global(runtime, 1000, 1); global(runtime, 2000, 0, 8);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(1));
  runtime.api.temporal_run(null, 'main', null, 0);
  const child = number(runtime, 2000, 8);
  throws(() => runtime.debug.inspect(child));
  for (const flag of [0, 1, 0]) {
    const edit = runtime.api.temporal_edit(null);
    runtime.api.temporal_replace(edit, input, bytes(flag)); repair(runtime, edit);
    equal(number(runtime, 2000, 8), child, 'creation occurrence survived; only its later destruction changed');
    if (flag) throws(() => runtime.debug.inspect(child));
    else equal(runtime.debug.inspect(child).alive, true);
  }
});

test('undoing cancellation commits the same continuously present insertion occurrence', () => {
  const runtime = make({
    main: F([
      temporal('child', 'temporal_create', []),
      temporal('pointer', 'temporal_run', [R('child'), 'allocate', null, 0]),
      temporal('point', 'temporal_point', [R('child')]), temporal('edit', 'temporal_edit', [R('child')]),
      temporal('write', 'temporal_store_at', [R('edit'), R('point'), R('pointer'), 1008, 4]),
      load('flag', 1000), { id: 'finish', op: 'if', cond: R('flag'), then: [
        temporal('cancel', 'temporal_cancel', [R('edit')]),
      ], else: [temporal('repair', 'temporal_repair', [R('edit')])] },
      store('export_child', 2000, R('child'), 8), store('export_write', 2008, R('write'), 8),
      store('export_pointer', 2016, R('pointer'), 8), ret(R('child')),
    ]),
    allocate: F([{ id: 'allocate', op: 'alloc', dst: 'p', size: 4 }, ret(R('p'))]),
  });
  global(runtime, 1000, 1); global(runtime, 1008, 7);
  runtime.builtins.builtin_temporal_global(2000, new Uint8Array(24), 24);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(1));
  runtime.api.temporal_run(null, 'main', null, 0);
  const child = number(runtime, 2000, 8), write = number(runtime, 2008, 8), pointer = number(runtime, 2016, 8);
  equal(runtime.debug.inspect(child).patches, []); equal(number(runtime, pointer), 0n);
  for (const flag of [0, 1, 0]) {
    const edit = runtime.api.temporal_edit(null);
    runtime.api.temporal_replace(edit, input, bytes(flag)); repair(runtime, edit);
    equal(number(runtime, 2000, 8), child); equal(number(runtime, 2008, 8), write);
    equal(runtime.debug.inspect(child).patches.map(patch => patch.id), flag ? [] : [write]);
    equal(number(runtime, pointer), flag ? 0n : 7n);
  }
});

test('a disappearing creation producer retires its identity even if that branch later reappears', () => {
  const runtime = make({ main: F([
    load('flag', 1000), { id: 'conditional_creation', op: 'if', cond: R('flag'), then: [
      temporal('child', 'temporal_create', []), store('export_child', 2000, R('child'), 8),
    ], else: [] }, ret(0),
  ]) });
  global(runtime, 1000, 1); global(runtime, 2000, 0, 8);
  const start = runtime.api.temporal_point(null), input = insert(runtime, null, start, 1000, bytes(1));
  runtime.api.temporal_run(null, 'main', null, 0);
  const oldChild = number(runtime, 2000, 8); equal(runtime.debug.inspect(oldChild).alive, true);
  const remove = runtime.api.temporal_edit(null); runtime.api.temporal_replace(remove, input, bytes(0)); repair(runtime, remove);
  throws(() => runtime.debug.inspect(oldChild)); equal(number(runtime, 2000, 8), 0n);
  const restore = runtime.api.temporal_edit(null); runtime.api.temporal_replace(restore, input, bytes(1)); repair(runtime, restore);
  const newChild = number(runtime, 2000, 8);
  equal(newChild === oldChild, false, 'new dynamic creation lifetime, not undo of a subsequent destruction');
  equal(runtime.debug.inspect(newChild).alive, true); throws(() => runtime.debug.inspect(oldChild));
});

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', suite: 'temporal-core-adversarial', ...counts, failures }, null, 2));
  process.exitCode = 1;
} else console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-core-adversarial', ...counts, names }, null, 2));
