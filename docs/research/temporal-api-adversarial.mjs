/**
 * Independent, directed conformance tests for the bounded temporal byte machine.
 *
 * Run: node docs/research/temporal-api-adversarial.mjs
 *
 * This suite owns its event/patch records and concrete expected byte values.
 * It never copies the implementation's event history into the reference runner.
 * Opaque invocation IDs are observed solely to name independently owned events.
 * Passing is bounded executable evidence, not a native implementation proof.
 */
import assert from 'node:assert/strict';
import * as api from './temporal-api-model.mjs';
import { referenceRun } from './temporal-api-reference.mjs';

const {
  temporal_create, temporal_write, temporal_call, temporal_edit,
  temporal_replace, temporal_store_at, temporal_remove, temporal_repair,
  temporal_cancel, temporal_points, temporal_inspect, temporal_destroy,
} = api;
const reg = name => ({ reg: name });
const bytes = values => Uint8Array.from(values);
const cloneHistory = h => ({
  ...h,
  initial: h.initial.slice(),
  events: h.events.map(e => e.kind === 'write'
    ? { ...e, bytes: e.bytes.slice() }
    : { ...e, args: e.args.slice() }),
  patches: h.patches.map(e => ({ ...e, bytes: e.bytes.slice() })),
});
const observation = value => Object.fromEntries(
  ['memory', 'sources', 'trace', 'marks', 'results'].map(key => [key, value[key]]),
);

const results = [];
let activeCase;
function equal(actual, expected, message) {
  assert.deepStrictEqual(actual, expected, message);
  activeCase.assertions.push(message);
}
function rejected(fn, message, code) {
  let error;
  try { fn(); } catch (caught) { error = caught; }
  assert.ok(error, `${message}: expected rejection`);
  if (code !== undefined) assert.equal(error.code, code, message);
  activeCase.assertions.push(message);
  return error;
}
function test(name, body) {
  activeCase = { name, assertions: [] };
  try {
    body();
    activeCase.status = 'PASS';
    results.push(activeCase);
  } catch (error) {
    activeCase.status = 'FAIL';
    activeCase.error = { message: error.message, stack: error.stack };
    results.push(activeCase);
    throw error;
  }
}

function fixture(program, memorySize = 32, initialMemory, limits = {}) {
  const initial = initialMemory?.slice() ?? new Uint8Array(memorySize);
  const timeline = temporal_create(program, { memorySize, initialMemory, ...limits });
  let history = { initial, events: [], patches: [], ...limits };
  const inspect = () => temporal_inspect(timeline);
  const check = message => equal(
    observation(inspect()), referenceRun(program, cloneHistory(history)),
    `${message}: memory, byte producers, dynamic trace, marks, and results match independent replay`,
  );
  const input = (addr, payload) => {
    const owned = Uint8Array.from(payload);
    const token = temporal_write(timeline, addr, payload instanceof Uint8Array ? payload : bytes(payload));
    history.events.push({ kind: 'write', id: token.id, addr, bytes: owned });
    check('append external write');
    return token;
  };
  const call = (fn, args = []) => {
    const before = new Set(inspect().results.keys());
    const owned = [];
    for (let i = 0; i < args.length; i += 1) owned.push(BigInt(args[i]));
    const value = temporal_call(timeline, fn, args);
    const added = [...inspect().results.keys()].filter(id => !before.has(id));
    equal(added.length, 1, 'ordinary top-level call publishes one invocation result');
    const id = added[0];
    history.events.push({ kind: 'call', id, fn, args: owned });
    check('append ordinary call');
    return { value, id };
  };
  const edit = () => {
    const handle = temporal_edit(timeline);
    const candidate = cloneHistory(history);
    const find = token => [...candidate.events, ...candidate.patches].find(e => e.id === token.id && e.kind === 'write');
    return {
      handle,
      replace(token, payload) {
        temporal_replace(handle, token, bytes(payload));
        const event = find(token);
        assert.ok(event, 'test owns the event being replaced');
        event.bytes = bytes(payload);
      },
      insert(point, addr, payload) {
        const token = temporal_store_at(handle, point, addr, bytes(payload));
        candidate.patches.push({ kind: 'write', id: token.id, at: point.key, addr, bytes: bytes(payload) });
        return token;
      },
      remove(token) {
        temporal_remove(handle, token);
        candidate.events = candidate.events.filter(e => e.id !== token.id);
        candidate.patches = candidate.patches.filter(e => e.id !== token.id);
      },
      repair(message = 'repair') {
        const stats = temporal_repair(handle);
        history = candidate;
        check(message);
        return stats;
      },
      fail(message, code) {
        const before = inspect();
        rejected(() => temporal_repair(handle), message, code);
        equal(inspect(), before, `${message}: failed candidate leaves the entire published revision unchanged`);
        check(`${message}: published history retained`);
      },
      cancel() { temporal_cancel(handle); check('cancel does not publish staged changes'); },
    };
  };
  return {
    timeline, inspect, input, call, edit, check,
    points: label => temporal_points(timeline, label),
    point: label => {
      const points = temporal_points(timeline, label);
      assert.equal(points.length, 1, `expected exactly one live ${label} point`);
      return points[0];
    },
  };
}

function run() {
  test('byte overlap, partial shadowing, and little-endian reads', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'wide', dst: 'v', addr: 1, width: 4 },
      { op: 'store', id: 'copy', addr: 16, width: 4, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const first = f.input(0, [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
    const shadow = f.input(3, [0xef, 0xbe]);
    const call = f.call('main');
    equal(call.value, 0xbeef3322n, 'overlapping byte writes compose a 32-bit little-endian load');
    let edit = f.edit();
    edit.replace(first, [8, 7, 6, 5, 4, 3, 2, 1]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 0xbeef0607n, 'replacement affects unshadowed bytes, not bytes overwritten later');
    const load = f.inspect().trace.find(r => r.key.endsWith('/wide'));
    equal(load.reads.map(r => r.source), [`write:${first.id}`, `write:${first.id}`, `write:${shadow.id}`, `write:${shadow.id}`],
      'one multi-byte load can depend on several distinct historical producers');
    edit = f.edit();
    edit.remove(shadow);
    edit.repair();
    equal(f.inspect().results.get(call.id), 0x04050607n, 'removing the overlapping write reveals the correct earlier bytes');
  });

  test('historical insertion does not rewrite previously computed registers', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'before', dst: 'before', addr: 0, width: 1 },
      { op: 'mark', id: 'gap', label: 'gap' },
      { op: 'load', id: 'after', dst: 'after', addr: 0, width: 1 },
      { op: 'store', id: 'saveBefore', addr: 8, width: 1, value: reg('before') },
      { op: 'store', id: 'saveAfter', addr: 9, width: 1, value: reg('after') },
      { op: 'return', id: 'done', value: reg('after') },
    ] } } });
    const original = f.input(0, [3]);
    const hostResult = f.call('main');
    let edit = f.edit();
    edit.insert(f.point('gap'), 0, [7]);
    edit.repair();
    equal([...f.inspect().memory.slice(8, 10)], [3, 7], 'past load retains 3; load after the insertion sees 7');
    equal(hostResult.value, 3n, 'ordinary host return is a copied value and cannot retroactively mutate');
    equal(f.inspect().results.get(hostResult.id), 7n, 'the revised invocation result is observable separately');
    edit = f.edit();
    edit.replace(original, [4]);
    edit.repair();
    equal([...f.inspect().memory.slice(8, 10)], [4, 7], 'replacing an earlier event changes the pre-gap load but the patch shadows its later load');
    f.input(0, [9]);
    equal([...f.inspect().memory.slice(8, 10)], [4, 7], 'appending a later write does not correct the already completed invocation');
    equal(f.inspect().memory[0], 9, 'the later append still determines current memory');
  });

  test('write handles identify occurrences, not addresses', () => {
    const f = fixture({ functions: { sample: { params: ['out'], body: [
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'store', id: 'save', addr: reg('out'), width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const first = f.input(0, [1]);
    f.call('sample', [8n]);
    const second = f.input(0, [2]);
    f.call('sample', [9n]);
    let edit = f.edit();
    edit.replace(first, [9]);
    edit.repair();
    equal([...f.inspect().memory.slice(8, 10)], [9, 2], 'replacing the first write at an address leaves the later occurrence intact');
    edit = f.edit();
    edit.remove(second);
    edit.repair();
    equal([...f.inspect().memory.slice(8, 10)], [9, 9], 'removing the later occurrence reconnects its consumers to the earlier producer');
    edit = f.edit();
    rejected(() => temporal_replace(edit.handle, second, bytes([4])), 'removed write token is permanently invalid');
    rejected(() => temporal_replace(edit.handle, first, bytes([1, 2])), 'replacement cannot silently change an event width');
    edit.cancel();
  });

  test('equal-valued indirect read must retarget its byte dependency', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'pointer', dst: 'p', addr: 0, width: 1 },
      { op: 'load', id: 'deref', dst: 'v', addr: reg('p'), width: 1 },
      { op: 'store', id: 'save', addr: 8, width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const pointer = f.input(0, [4]);
    const oldTarget = f.input(4, [7]);
    const newTarget = f.input(5, [7]);
    const call = f.call('main');
    let edit = f.edit();
    edit.replace(pointer, [5]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 7n, 'pointer retarget can preserve the loaded numeric result');
    equal(f.inspect().trace.find(r => r.key.endsWith('/deref')).reads.map(r => [r.addr, r.source]),
      [[5, `write:${newTarget.id}`]], 'equal numeric result must not preserve the obsolete address or producer edge');
    edit = f.edit();
    edit.replace(newTarget, [9]);
    edit.repair();
    equal(f.inspect().memory[8], 9, 'subsequent correction to the new target propagates');
    edit = f.edit();
    edit.replace(oldTarget, [12]);
    edit.repair();
    equal(f.inspect().memory[8], 9, 'subsequent correction to the abandoned target does not alter the consumer');
  });

  test('blind overwrite shields subsequent loads from an earlier correction', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'store', id: 'overwrite', addr: 0, width: 1, value: 7 },
      { op: 'load', id: 'load', dst: 'v', addr: 0, width: 1 },
      { op: 'store', id: 'save', addr: 8, width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const input = f.input(0, [3]);
    f.call('main');
    const edit = f.edit();
    edit.replace(input, [4]);
    edit.repair();
    equal(f.inspect().memory[8], 7, 'a later unconditional write removes the earlier value from this load dependency');
    equal(f.inspect().trace.find(r => r.key.endsWith('/load')).reads[0].source.endsWith('/overwrite'), true,
      'read metadata identifies the actual computed overwrite, not the earlier input');
  });

  test('empty byte cells are explicit dependencies before any nonzero value appears', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'mark', id: 'start', label: 'start' },
      { op: 'const', id: 'zero', dst: 'sum', value: 0 },
      { op: 'repeat', id: 'scan', count: 8, index: 'i', body: [
        { op: 'load', id: 'cell', dst: 'v', addr: reg('i'), width: 1 },
        { op: 'add', id: 'accumulate', dst: 'sum', a: reg('sum'), b: reg('v') },
      ] },
      { op: 'store', id: 'save', addr: 16, width: 1, value: reg('sum') },
      { op: 'return', id: 'done', value: reg('sum') },
    ] } } });
    const call = f.call('main');
    equal(call.value, 0n, 'the initial scan of zero-initialized memory returns zero');
    equal(f.inspect().trace.filter(r => r.op === 'load').flatMap(r => r.reads.map(v => v.source)),
      Array.from({ length: 8 }, (_, i) => `init:${i}`), 'reading an empty cell still records an explicit byte producer dependency');
    let edit = f.edit();
    const patch = edit.insert(f.point('start'), 4, [9]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 9n, 'a historical write into a formerly empty scanned byte changes its consumer');
    edit = f.edit();
    edit.replace(patch, [0]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 0n, 'correcting the byte back to empty propagates as ordinary memory');
  });

  test('equal-valued producer change at one address still refreshes provenance', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'store', id: 'save', addr: 8, width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const first = f.input(0, [7]);
    const second = f.input(0, [7]);
    const call = f.call('main');
    let edit = f.edit();
    edit.remove(second);
    edit.repair();
    equal(f.inspect().results.get(call.id), 7n, 'producer removal can preserve both loaded address and loaded numeric value');
    equal(f.inspect().trace.find(r => r.key.endsWith('/read')).reads[0].source, `write:${first.id}`,
      'same-address same-value read must still update its historical producer');
    edit = f.edit();
    edit.replace(first, [9]);
    edit.repair();
    equal(f.inspect().memory[8], 9, 'a later correction follows the newly exposed producer');
  });

  test('changed store address retracts the old destination and updates the new one', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'pointer', dst: 'p', addr: 0, width: 1 },
      { op: 'store', id: 'indirectStore', addr: reg('p'), width: 1, value: 9 },
      { op: 'load', id: 'left', dst: 'a', addr: 8, width: 1 },
      { op: 'load', id: 'right', dst: 'b', addr: 9, width: 1 },
      { op: 'store', id: 'saveLeft', addr: 16, width: 1, value: reg('a') },
      { op: 'store', id: 'saveRight', addr: 17, width: 1, value: reg('b') },
      { op: 'return', id: 'done', value: 0 },
    ] } } });
    const pointer = f.input(0, [8]);
    f.input(8, [2, 3]);
    f.call('main');
    equal([...f.inspect().memory.slice(16, 18)], [9, 3], 'initial indirect store updates only its first target');
    const edit = f.edit();
    edit.replace(pointer, [9]);
    edit.repair();
    equal([...f.inspect().memory.slice(16, 18)], [2, 9], 'moving a historical store restores the preceding old-target byte and changes new-target consumers');
    equal(f.inspect().trace.find(r => r.key.endsWith('/indirectStore')).writes.map(r => r.addr), [9],
      'write metadata follows the changed store address');
  });

  test('nested ordinary calls propagate memory effects despite equal returns', () => {
    const f = fixture({ functions: {
      outer: { params: [], body: [
        { op: 'call', id: 'callMiddle', dst: 'ignored', fn: 'middle', args: [] },
        { op: 'load', id: 'observe', dst: 'v', addr: 8, width: 1 },
        { op: 'store', id: 'save', addr: 9, width: 1, value: reg('v') },
        { op: 'return', id: 'done', value: 0 },
      ] },
      middle: { params: [], body: [
        { op: 'call', id: 'callInner', dst: 'ignored', fn: 'inner', args: [] },
        { op: 'return', id: 'done', value: 0 },
      ] },
      inner: { params: [], body: [
        { op: 'load', id: 'source', dst: 'v', addr: 0, width: 1 },
        { op: 'store', id: 'effect', addr: 8, width: 1, value: reg('v') },
        { op: 'return', id: 'done', value: 0 },
      ] },
    } });
    const input = f.input(0, [5]);
    const call = f.call('outer');
    const edit = f.edit();
    edit.replace(input, [9]);
    edit.repair();
    equal([...f.inspect().memory.slice(8, 10)], [9, 9], 'three nested call levels preserve effects and the caller read dependency');
    equal(f.inspect().results.get(call.id), 0n, 'equal enclosing return values are not evidence that nested effects stayed equal');
    equal(f.inspect().trace.filter(r => r.op === 'call').every(r => r.value === 0n), true,
      'all call results remain zero while dependent memory changed');
  });

  test('orphaned historical point rejects atomically; patch removal resolves it', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'condition', dst: 'c', addr: 0, width: 1 },
      { op: 'if', id: 'branch', cond: reg('c'), then: [
        { op: 'mark', id: 'inside', label: 'inside' },
        { op: 'store', id: 'effect', addr: 8, width: 1, value: 9 },
      ], else: [] },
      { op: 'return', id: 'done', value: 0 },
    ] } } });
    const condition = f.input(0, [1]);
    f.call('main');
    let edit = f.edit();
    const patch = edit.insert(f.point('inside'), 16, [7]);
    edit.repair();
    const stillCurrentPoint = f.point('inside');
    edit = f.edit();
    edit.replace(condition, [0]);
    const doomedProvisional = edit.insert(stillCurrentPoint, 17, [6]);
    edit.fail('missing dynamic mark is a conflict, not permission to drop an old patch', 'ORPHANED_POINT');
    rejected(() => temporal_cancel(edit.handle), 'failed repair consumes the edit');
    edit = f.edit();
    rejected(() => temporal_replace(edit.handle, doomedProvisional, bytes([4])), 'failed candidate invalidates its provisional handles');
    const extra = edit.insert(stillCurrentPoint, 18, [3]);
    edit.remove(extra);
    edit.replace(condition, [0]);
    edit.remove(patch);
    edit.repair('removing patch and anchor-producing branch in the same transaction');
    equal([f.inspect().memory[8], f.inspect().memory[16], f.inspect().memory[17], f.inspect().memory[18]], [0, 0, 0, 0],
      'removed branch and patches leave no residual stores');
    equal(f.points('inside').length, 0, 'removed dynamic branch exposes no public point');
  });

  test('changed loop count retracts removed dynamic stores', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'count', dst: 'n', addr: 0, width: 1 },
      { op: 'repeat', id: 'loop', count: reg('n'), index: 'i', body: [
        { op: 'add', id: 'address', dst: 'p', a: 8, b: reg('i') },
        { op: 'add', id: 'value', dst: 'v', a: 1, b: reg('i') },
        { op: 'store', id: 'save', addr: reg('p'), width: 1, value: reg('v') },
        { op: 'mark', id: 'iteration', label: 'iteration' },
      ] },
      { op: 'return', id: 'done', value: reg('n') },
    ] } } });
    const count = f.input(0, [3]);
    f.call('main');
    equal(f.points('iteration').length, 3, 'one static mark has three distinct dynamic loop occurrences');
    const edit = f.edit();
    edit.replace(count, [1]);
    edit.repair();
    equal([...f.inspect().memory.slice(8, 11)], [1, 0, 0], 'removed iterations do not leave stale memory effects');
    equal(f.points('iteration').length, 1, 'only the surviving dynamic loop occurrence remains');
  });

  test('indirect call retarget replaces both result and callee stores', () => {
    const f = fixture({ functions: {
      main: { params: [], body: [
        { op: 'load', id: 'target', dst: 'fn', addr: 0, width: 1 },
        { op: 'call', id: 'dispatch', dst: 'r', fn: reg('fn'), args: [] },
        { op: 'return', id: 'done', value: reg('r') },
      ] },
      1: { params: [], body: [
        { op: 'store', id: 'effect', addr: 8, width: 1, value: 11 },
        { op: 'store', id: 'extra', addr: 9, width: 1, value: 33 },
        { op: 'return', id: 'done', value: 11 },
      ] },
      2: { params: [], body: [
        { op: 'store', id: 'effect', addr: 8, width: 1, value: 22 },
        { op: 'return', id: 'done', value: 22 },
      ] },
    } });
    const target = f.input(0, [1]);
    const call = f.call('main');
    const edit = f.edit();
    edit.replace(target, [2]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 22n, 'indirect target selection is part of tracked execution');
    equal([...f.inspect().memory.slice(8, 10)], [22, 0], 'old callee effects disappear when the call target changes');
  });

  test('point tokens are revision-bound; committed patch anchors are not', () => {
    const program = { functions: { main: { params: [], body: [
      { op: 'mark', id: 'gap', label: 'gap' },
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } };
    const f = fixture(program);
    f.call('main');
    const oldPoint = f.point('gap');
    let edit = f.edit();
    const patch = edit.insert(oldPoint, 0, [4]);
    edit.repair();
    edit = f.edit();
    rejected(() => temporal_store_at(edit.handle, oldPoint, 0, bytes([9])), 'successful publication invalidates old public point tokens');
    edit.replace(patch, [5]);
    edit.repair();
    equal(f.inspect().memory[0], 5, 'committed patch retains its exact anchor without retaining the old public point');
    const beforeNoop = f.point('gap');
    const revision = f.inspect().revision;
    edit = f.edit();
    edit.repair('successful no-op repair');
    equal(f.inspect().revision > revision, true, 'no-op repair is still a successful publication');
    edit = f.edit();
    rejected(() => temporal_store_at(edit.handle, beforeNoop, 0, bytes([8])), 'no-op publication also invalidates earlier public point tokens');
    edit.cancel();
  });

  test('same-gap insertion order and provisional removal have precise semantics', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'mark', id: 'gap', label: 'gap' },
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const call = f.call('main');
    let edit = f.edit();
    const point = f.point('gap');
    const first = edit.insert(point, 0, [5]);
    const second = edit.insert(point, 0, [7]);
    const removed = edit.insert(point, 0, [99]);
    edit.remove(removed);
    edit.repair();
    equal(f.inspect().results.get(call.id), 7n, 'same-gap patches execute in insertion order; removed provisional patch never executes');
    edit = f.edit();
    edit.replace(first, [9]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 7n, 'replacement preserves an earlier patch position');
    edit = f.edit();
    edit.remove(second);
    edit.repair();
    equal(f.inspect().results.get(call.id), 9n, 'removing the later patch reveals the revised earlier patch');
    edit = f.edit();
    rejected(() => temporal_replace(edit.handle, removed, bytes([8])), 'removed provisional token never becomes committed');
    edit.cancel();
  });

  test('cross-owner and forged handles cannot authorize historical writes', () => {
    const program = { functions: { main: { params: [], body: [
      { op: 'mark', id: 'gap', label: 'gap' },
      { op: 'return', id: 'done', value: 0 },
    ] } } };
    const a = fixture(program), b = fixture(program);
    const aWrite = a.input(0, [1]), bWrite = b.input(0, [2]);
    a.call('main'); b.call('main');
    const point = a.point('gap');
    const edit = a.edit();
    rejected(() => temporal_replace(edit.handle, bWrite, bytes([4])), 'a write owned by another timeline is rejected');
    rejected(() => temporal_store_at(edit.handle, b.point('gap'), 0, bytes([4])), 'a point owned by another timeline is rejected');
    rejected(() => temporal_replace(edit.handle, { ...aWrite }, bytes([4])), 'copying readable write token fields does not forge authority');
    rejected(() => temporal_store_at(edit.handle, { ...point }, 0, bytes([4])), 'copying readable point token fields does not forge authority');
    edit.cancel();
    a.check('rejected forged and cross-owner staging');
    b.check('other owner remains unchanged');
  });

  test('quiescent edit controls reject interleaving and invalidate canceled handles', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'mark', id: 'gap', label: 'gap' },
      { op: 'return', id: 'done', value: 0 },
    ] } } });
    const write = f.input(0, [1]);
    f.call('main');
    const before = f.inspect();
    let edit = f.edit();
    const provisional = edit.insert(f.point('gap'), 0, [9]);
    rejected(() => temporal_write(f.timeline, 0, bytes([3])), 'ordinary append is rejected while a correction batch is open');
    rejected(() => temporal_call(f.timeline, 'main'), 'ordinary execution is rejected while a correction batch is open');
    rejected(() => temporal_edit(f.timeline), 'a second simultaneous edit is rejected');
    equal(f.inspect(), before, 'inspection during staging returns the last published revision');
    edit.cancel();
    rejected(() => temporal_repair(edit.handle), 'cancel consumes the edit');
    edit = f.edit();
    rejected(() => temporal_replace(edit.handle, provisional, bytes([3])), 'cancel invalidates provisional writes');
    edit.replace(write, [2]);
    edit.repair();
    equal(f.inspect().memory[0], 2, 'the original committed write remains valid after a canceled batch');
  });

  test('host buffers and inspection cannot mutate tracked bytes by alias', () => {
    const initial = new Uint8Array(32); initial[0] = 2;
    const program = { functions: { main: { params: ['pointer', 'out'], body: [
      { op: 'load', id: 'read', dst: 'v', addr: reg('pointer'), width: 1 },
      { op: 'store', id: 'save', addr: reg('out'), width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } };
    const f = fixture(program, 32, initial);
    initial[0] = 99;
    f.check('initial memory is captured by value');
    const payload = bytes([7]);
    const input = f.input(4, payload);
    payload[0] = 99;
    f.check('external write payload is captured by value');
    const args = [4n, 8n];
    const call = f.call('main', args);
    args[0] = 0n; args[1] = 9n;
    const exposed = f.inspect();
    exposed.memory.fill(255);
    exposed.sources[4] = 'forged';
    exposed.results.set(call.id, 999n);
    exposed.trace[0].writes[0].value = 111;
    f.check('inspection exposes no aliases into runtime memory or observation metadata');
    const edit = f.edit();
    edit.replace(input, [8]);
    edit.repair();
    equal([f.inspect().memory[8], f.inspect().memory[9]], [8, 0], 'captured pointer arguments retain addresses, and revised pointees remain live tracked memory');
    equal(f.inspect().results.get(call.id), 8n, 'pointer arguments do not snapshot their pointee bytes');
  });

  test('staged replacement and insertion payloads are copied immediately', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'mark', id: 'gap', label: 'gap' },
      { op: 'return', id: 'done', value: 0 },
    ] } } });
    const input = f.input(0, [1]);
    f.call('main');
    // This case uses direct API calls to mutate the exact buffers supplied to it.
    // Explicit concrete expectations remain independent of model metadata.
    const edit = temporal_edit(f.timeline);
    const replacement = bytes([4]), insertion = bytes([7]);
    temporal_replace(edit, input, replacement);
    temporal_store_at(edit, f.point('gap'), 1, insertion);
    replacement[0] = 99; insertion[0] = 99;
    temporal_repair(edit);
    equal([...f.inspect().memory.slice(0, 2)], [4, 7], 'host mutation after staging cannot change the candidate payload');
  });

  test('program capture cannot be bypassed by mutating host instruction objects', () => {
    const program = { functions: { main: { params: [], body: [
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'store', id: 'save', addr: 8, width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } };
    const ownedProgram = structuredClone(program);
    const timeline = temporal_create(program, { memorySize: 16 });
    const write = temporal_write(timeline, 0, bytes([4]));
    program.functions.main.body[1].addr = 9;
    program.functions.main.body[2].value = 99;
    const initial = temporal_call(timeline, 'main');
    const invocation = [...temporal_inspect(timeline).results.keys()][0];
    equal(initial, 4n, 'mutating original program objects after creation cannot replace executed code');
    const edit = temporal_edit(timeline);
    temporal_replace(edit, write, bytes([7]));
    temporal_repair(edit);
    equal(observation(temporal_inspect(timeline)), referenceRun(ownedProgram, {
      initial: new Uint8Array(16),
      events: [
        { kind: 'write', id: write.id, addr: 0, bytes: bytes([7]) },
        { kind: 'call', id: invocation, fn: 'main', args: [] },
      ], patches: [],
    }), 'repaired execution uses the captured program, not the mutable host instruction objects');
  });

  test('an Array subclass cannot make captured invocation arguments alias host memory', () => {
    class NonCopyingArray extends Array { map() { return this; } }
    const f = fixture({ functions: { main: { params: ['pointer', 'out'], body: [
      { op: 'load', id: 'read', dst: 'v', addr: reg('pointer'), width: 1 },
      { op: 'store', id: 'save', addr: reg('out'), width: 1, value: reg('v') },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } }, 16);
    const input = f.input(4, [7]);
    const args = new NonCopyingArray(4n, 8n);
    const call = f.call('main', args);
    args[0] = 0n;
    args[1] = 9n;
    const edit = f.edit();
    edit.replace(input, [8]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 8n, 'overridden Array.map cannot preserve a live reference to caller-owned argument storage');
    equal([...f.inspect().memory.slice(8, 10)], [8, 0], 'revised execution retains the original captured pointer and output addresses');
  });

  test('memory-access trap during repair cannot partially publish', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'pointer', dst: 'p', addr: 0, width: 1 },
      { op: 'store', id: 'earlyEffect', addr: 8, width: 1, value: 9 },
      { op: 'load', id: 'deref', dst: 'v', addr: reg('p'), width: 4 },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } }, 16);
    const pointer = f.input(0, [4]);
    f.input(4, [1, 2, 3, 4]);
    const call = f.call('main');
    let edit = f.edit();
    edit.replace(pointer, [15]);
    edit.fail('a revised out-of-bounds read traps after a private early store');
    equal(f.inspect().results.get(call.id), 0x04030201n, 'failed revision does not replace a previously valid invocation result');
    edit = f.edit();
    edit.replace(pointer, [5]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 0x09040302n, 'the original write handle remains usable after repair failure');
  });

  test('failed forward calls cannot publish early stores or invocation results', () => {
    const f = fixture({ functions: {
      good: { params: [], body: [
        { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
        { op: 'return', id: 'done', value: reg('v') },
      ] },
      unknownTarget: { params: [], body: [
        { op: 'store', id: 'earlyEffect', addr: 8, width: 1, value: 99 },
        { op: 'call', id: 'unsupported', dst: 'v', fn: 'missing', args: [] },
      ] },
      undefinedRegister: { params: [], body: [
        { op: 'store', id: 'earlyEffect', addr: 8, width: 1, value: 99 },
        { op: 'return', id: 'undefined', value: reg('neverAssigned') },
      ] },
      boundsTrap: { params: [], body: [
        { op: 'store', id: 'earlyEffect', addr: 8, width: 1, value: 99 },
        { op: 'load', id: 'invalidRead', dst: 'v', addr: 15, width: 4 },
      ] },
    } }, 16);
    f.input(0, [4]);
    for (const [fn, code] of [['unknownTarget', 'BAD_PROGRAM'], ['undefinedRegister', 'UNDEFINED_REGISTER'], ['boundsTrap', 'BOUNDS']]) {
      const before = f.inspect();
      rejected(() => temporal_call(f.timeline, fn), `${fn}: failed forward execution reports a bounded machine trap`, code);
      equal(f.inspect(), before, `${fn}: no early byte store, failed invocation result, trace, or revision is published`);
      f.check(`${fn}: independently owned history unchanged`);
    }
    equal(f.call('good').value, 4n, 'valid forward execution remains possible after several failed appends');
  });

  test('step-limited repair is atomic and consumes only the failed edit', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'count', dst: 'n', addr: 0, width: 1 },
      { op: 'repeat', id: 'repeat', count: reg('n'), index: 'i', body: [
        { op: 'store', id: 'effect', addr: 8, width: 1, value: reg('i') },
      ] },
      { op: 'return', id: 'done', value: reg('n') },
    ] } } }, 16, undefined, { maxSteps: 12 });
    const count = f.input(0, [2]);
    f.call('main');
    let edit = f.edit();
    edit.replace(count, [10]);
    edit.fail('step budget exceeded after private iteration stores', 'STEP_LIMIT');
    rejected(() => temporal_repair(edit.handle), 'step-limited failed edit cannot be repaired again');
    edit = f.edit();
    edit.replace(count, [3]);
    edit.repair();
    equal(f.inspect().memory[8], 2, 'a subsequent bounded correction succeeds with the old committed input handle');
  });

  test('depth-limited repair leaves no partially executed recursive stores', () => {
    const f = fixture({ functions: {
      main: { params: [], body: [
        { op: 'load', id: 'depth', dst: 'n', addr: 0, width: 1 },
        { op: 'call', id: 'enter', dst: 'r', fn: 'recurse', args: [reg('n')] },
        { op: 'return', id: 'done', value: reg('r') },
      ] },
      recurse: { params: ['n'], body: [
        { op: 'store', id: 'effect', addr: 8, width: 1, value: reg('n') },
        { op: 'if', id: 'branch', cond: reg('n'), then: [
          { op: 'sub', id: 'decrement', dst: 'next', a: reg('n'), b: 1 },
          { op: 'call', id: 'recur', dst: 'r', fn: 'recurse', args: [reg('next')] },
        ], else: [] },
        { op: 'return', id: 'done', value: reg('n') },
      ] },
    } }, 16, undefined, { maxDepth: 6 });
    const depth = f.input(0, [2]);
    f.call('main');
    let edit = f.edit();
    edit.replace(depth, [5]);
    edit.fail('call depth limit exceeded after private recursive stores', 'DEPTH_LIMIT');
    edit = f.edit();
    edit.replace(depth, [4]);
    edit.repair();
    equal(f.inspect().memory[8], 0, 'execution exactly at the configured depth budget reaches the base store');
  });

  test('configured deep temporal calls do not inherit the JavaScript call-stack limit', () => {
    const f = fixture({ functions: { recurse: { params: ['n'], body: [
      { op: 'if', id: 'branch', cond: reg('n'), then: [
        { op: 'sub', id: 'decrement', dst: 'next', a: reg('n'), b: 1 },
        { op: 'call', id: 'recur', dst: 'r', fn: 'recurse', args: [reg('next')] },
      ], else: [] },
    ] } } }, 1, undefined, { maxDepth: 1538, maxSteps: 10000 });
    const call = f.call('recurse', [1536n]);
    equal(call.value, 0n, '1537 function levels below the configured limit finish without a host RangeError');
    equal(f.inspect().trace.filter(r => r.op === 'call').length, 1536,
      'all deep nested call occurrences are retained in the dynamic trace');
    const edit = f.edit();
    edit.repair('deep-call no-op repair');
    equal(f.inspect().results.get(call.id), 0n, 'repair of the deep trace also avoids host-stack recursion');
  });

  test('a rejected replacement cannot damage earlier staged edits', () => {
    const f = fixture({ functions: {} });
    const input = f.input(0, [1, 2]);
    const edit = f.edit();
    edit.replace(input, [3, 4]);
    rejected(() => temporal_replace(edit.handle, input, bytes([8])), 'short replacement is rejected without changing candidate bytes', 'SIZE_MISMATCH');
    rejected(() => temporal_replace(edit.handle, input, bytes([8, 9, 10])), 'long replacement is rejected without changing candidate bytes', 'SIZE_MISMATCH');
    rejected(() => temporal_replace(edit.handle, input, [8, 9]), 'non-byte-buffer replacement is rejected without changing candidate bytes', 'BAD_BYTES');
    edit.repair();
    equal([...f.inspect().memory.slice(0, 2)], [3, 4], 'the valid earlier staged replacement survives all subsequent staging errors');
  });

  test('remove then replace cannot resurrect an event within one batch', () => {
    const f = fixture({ functions: {} });
    const input = f.input(0, [1]);
    const edit = f.edit();
    edit.remove(input);
    rejected(() => temporal_replace(edit.handle, input, bytes([9])), 'replacement of an event already removed from this candidate is rejected', 'INVALID_WRITE');
    rejected(() => temporal_remove(edit.handle, input), 'duplicate removal is rejected instead of acting on a different event', 'INVALID_WRITE');
    edit.repair();
    equal(f.inspect().memory[0], 0, 'rejected operations do not undo the valid staged removal');
  });

  test('destroy cannot strand an open edit or invalidate its live timeline', () => {
    const f = fixture({ functions: {} });
    const input = f.input(0, [1]);
    const edit = f.edit();
    edit.replace(input, [2]);
    const before = f.inspect();
    rejected(() => temporal_destroy(f.timeline), 'destroy is rejected while an edit is open', 'EDIT_OPEN');
    equal(f.inspect(), before, 'rejected destroy leaves the published timeline accessible');
    edit.repair();
    equal(f.inspect().memory[0], 2, 'the original open edit remains valid after rejected destruction');
    temporal_destroy(f.timeline);
    rejected(() => temporal_inspect(f.timeline), 'destruction succeeds once the correction has finished', 'INVALID_TIMELINE');
  });

  test('copied mark metadata cannot redirect or remove a live historical anchor', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'mark', id: 'first', label: 'first' },
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'mark', id: 'second', label: 'second' },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const call = f.call('main');
    const first = f.point('first');
    const copy = f.inspect();
    copy.marks[0].key = copy.marks[1].key;
    copy.marks[0].label = 'forged';
    copy.marks.length = 0;
    copy.trace.find(record => record.op === 'mark').key = 'forged';
    f.check('mutating copied mark and trace metadata');
    const edit = f.edit();
    edit.insert(first, 0, [7]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 7n, 'original authority still anchors before the load, not at the forged later gap');
  });

  test('repair of a returned value does not secretly reexecute ordinary host code', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 1 },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const input = f.input(0, [3]);
    const call = f.call('main');
    let hostExecutions = 0;
    const hostCompute = value => { hostExecutions += 1; return value * 2n; };
    const hostDerived = hostCompute(call.value);
    const edit = f.edit();
    edit.replace(input, [5]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 5n, 'tracked invocation result changes after correction');
    equal([call.value, hostDerived, hostExecutions], [3n, 6n, 1], 'ordinary copied result and untracked host computation do not join temporal repair implicitly');
  });

  test('return inside a loop exits the function and retracts unreachable writes', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'load', id: 'condition', dst: 'c', addr: 0, width: 1 },
      { op: 'repeat', id: 'loop', count: 3, index: 'i', body: [
        { op: 'if', id: 'early', cond: reg('c'), then: [
          { op: 'return', id: 'earlyReturn', value: 42 },
        ], else: [] },
        { op: 'add', id: 'address', dst: 'p', a: 8, b: reg('i') },
        { op: 'store', id: 'effect', addr: reg('p'), width: 1, value: 1 },
      ] },
      { op: 'store', id: 'tail', addr: 11, width: 1, value: 2 },
      { op: 'return', id: 'done', value: 3 },
    ] } } });
    const condition = f.input(0, [0]);
    const call = f.call('main');
    const edit = f.edit();
    edit.replace(condition, [1]);
    edit.repair();
    equal(f.inspect().results.get(call.id), 42n, 'nested return exits the whole current function');
    equal([...f.inspect().memory.slice(8, 12)], [0, 0, 0, 0], 'no old loop or tail write survives the corrected early return');
  });

  test('unsigned wrapping arithmetic and narrow stores use exact bits', () => {
    const f = fixture({ functions: { main: { params: [], body: [
      { op: 'const', id: 'max', dst: 'max', value: 0xffffffffffffffffn },
      { op: 'add', id: 'wrap', dst: 'zero', a: reg('max'), b: 1 },
      { op: 'sub', id: 'underflow', dst: 'maxAgain', a: reg('zero'), b: 1 },
      { op: 'store', id: 'wide', addr: 0, width: 8, value: reg('maxAgain') },
      { op: 'store', id: 'narrow', addr: 1, width: 2, value: 0x123456n },
      { op: 'load', id: 'read', dst: 'v', addr: 0, width: 8 },
      { op: 'return', id: 'done', value: reg('v') },
    ] } } });
    const call = f.call('main');
    equal(call.value, 0xffffffffff3456ffn, 'narrow store truncates low bits and overlaps a wide U64 value exactly');
    equal([...f.inspect().memory.slice(0, 8)], [255, 86, 52, 255, 255, 255, 255, 255], 'byte ordering and arithmetic do not use floating-point approximation');
  });

  test('zero-byte external writes are harmless events, including at memory end', () => {
    const f = fixture({ functions: {} }, 8);
    const empty = f.input(8, []);
    const edit = f.edit();
    edit.replace(empty, []);
    edit.repair();
    equal([...f.inspect().memory], Array(8).fill(0), 'zero-byte write does not alter memory');
    equal(f.inspect().sources, Array.from({ length: 8 }, (_, i) => `init:${i}`), 'zero-byte write claims no byte producer');
  });

  test('destroy invalidates timeline control and extant write handles', () => {
    const f = fixture({ functions: {} });
    const token = f.input(0, [1]);
    temporal_destroy(f.timeline);
    rejected(() => temporal_inspect(f.timeline), 'destroyed timeline cannot expose live state');
    rejected(() => temporal_edit(f.timeline), 'destroyed timeline cannot accept a repair');
    rejected(() => temporal_write(f.timeline, 0, bytes([2])), 'destroyed timeline cannot append input');
    const other = fixture({ functions: {} });
    const edit = other.edit();
    rejected(() => temporal_replace(edit.handle, token, bytes([3])), 'destroyed owner cannot be bypassed with its old write token');
    edit.cancel();
  });

  test('invalid memory sizes reject explicitly before typed-array allocation', () => {
    for (const size of [-1, -Infinity, Infinity, NaN, 1.5, 2 ** 53]) {
      rejected(() => temporal_create({ functions: {} }, { memorySize: size }),
        `invalid memory size ${String(size)} reports a deliberate bounds error`, 'BOUNDS');
    }
    const zero = temporal_create({ functions: {} }, { memorySize: 0 });
    equal(temporal_inspect(zero).memory.length, 0, 'zero-byte memory is a valid finite arena');
    temporal_destroy(zero);
  });

  test('malformed call arguments reject without changing a published history', () => {
    const f = fixture({ functions: { identity: { params: ['value'], body: [
      { op: 'return', id: 'done', value: reg('value') },
    ] } } });
    const before = f.inspect();
    for (const invalid of [null, {}, new Uint8Array([1]), [1.5], [Number.MAX_SAFE_INTEGER + 1], ['1'], [undefined], []]) {
      rejected(() => temporal_call(f.timeline, 'identity', invalid), 'malformed argument container, value, or arity is rejected', 'BAD_PROGRAM');
      equal(f.inspect(), before, 'malformed invocation cannot alter memory, trace, result map, or revision');
    }
    equal(f.call('identity', [4n]).value, 4n, 'the timeline remains usable after malformed invocation attempts');
    rejected(() => temporal_create({ functions: { main: { params: [], body: [
      { op: 'call', id: 'bad', dst: 'v', fn: 'main', args: {} },
    ] } } }), 'malformed bytecode call arguments reject during program validation', 'BAD_PROGRAM');
  });
}

try {
  run();
  console.log(JSON.stringify({
    status: 'PASS',
    suite: 'temporal-api-adversarial',
    scope: 'Single-threaded bounded byte-memory API; full-trace oracle comparison; not a native performance or general correctness proof.',
    cases: results.length,
    assertions: results.reduce((n, result) => n + result.assertions.length, 0),
    results,
  }, null, 2));
} catch {
  console.log(JSON.stringify({ status: 'FAIL', suite: 'temporal-api-adversarial', results }, null, 2));
  process.exitCode = 1;
}
