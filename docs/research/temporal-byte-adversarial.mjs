/** Adversarial tests for the actual byte-pointer/count temporal API. */
import assert from 'node:assert/strict';
import { createByteRuntime, RepairStatus } from './temporal-nested-api.mjs';

const totals = { cases: 0, assertions: 0 };
const names = [];
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message); totals.assertions += 1;
};
const rejects = (action, code) => {
  assert.throws(action, (error) => error.code === code); totals.assertions += 1;
};
const test = (name, action) => { action(); names.push(name); totals.cases += 1; };
const fn = (body, params = []) => ({ body, params });
const empty = { functions: { main: fn([{ id: 'return', op: 'return', value: 0 }]) } };
const marked = { functions: { main: fn([
  { id: 'gap', op: 'mark', label: 'gap' },
  { id: 'return', op: 'return', value: 0 },
]) } };
const bytes = (...values) => Uint8Array.from(values);
const read = (runtime, offset, count, history = null) =>
  [...runtime.read(runtime.address(history, offset), count)];

test('only the write extents change the existing eleven-operation surface', () => {
  const { api } = createByteRuntime(empty);
  equal(Object.fromEntries(Object.entries(api).map(([name, method]) => [name, method.length])), {
    temporal_create: 0, temporal_destroy: 1, temporal_write: 3,
    temporal_edit: 1, temporal_replace: 3, temporal_remove: 2,
    temporal_repair: 1, temporal_cancel: 1, temporal_mark: 1,
    temporal_point: 3, temporal_store_at: 5,
  });
});

test('arbitrary byte extents are supported without recording a scalar type', () => {
  for (const count of [1, 3, 5, 7, 9, 17, 31, 64]) {
    const runtime = createByteRuntime(empty), { api } = runtime;
    const source = Uint8Array.from({ length: count + 3 }, (_, i) => (i * 37 + 11) & 255);
    const event = api.temporal_write(runtime.address(null, 0), source, count);
    equal(read(runtime, 0, count), [...source.subarray(0, count)]);
    const committed = runtime.inspect(null).events[0];
    equal(committed.bytes.length, count);
    equal(Object.hasOwn(committed, 'type'), false);
    const edit = api.temporal_edit(null);
    const replacement = Uint8Array.from({ length: count + 1 }, (_, i) => (255 - i) & 255);
    api.temporal_replace(edit, event, replacement);
    equal(api.temporal_repair(edit), RepairStatus.OK);
    equal(read(runtime, 0, count), [...replacement.subarray(0, count)]);
  }
});

test('malformed and zero byte counts fail without publishing or reserving writes', () => {
  const runtime = createByteRuntime(marked), { api } = runtime;
  const destination = runtime.address(null, 0);
  runtime.run(null, 'main');
  const before = runtime.inspect(null);
  const invalid = [0, -1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1,
    '1', null, undefined, 0n, -1n, 9007199254740992n];
  for (const count of invalid) {
    rejects(() => api.temporal_write(destination, bytes(1, 2), count), 'BAD_SIZE');
    equal(runtime.inspect(null), before);
  }
  const point = api.temporal_point(null, 'gap', 0), edit = api.temporal_edit(null);
  for (const count of invalid) {
    rejects(() => api.temporal_store_at(edit, point, destination, bytes(1, 2), count), 'BAD_SIZE');
    equal(runtime.inspect(null), before);
  }
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(runtime.inspect(null).patches.length, 0);
  api.temporal_write(destination, bytes(23), 1n);
  equal(read(runtime, 0, 1), [23], 'an exact positive bigint count is accepted');
});

test('host source extents and fake-memory bounds are checked before publication', () => {
  const runtime = createByteRuntime(empty), { api } = runtime;
  const destination = runtime.address(null, 0), end = runtime.address(null, 63);
  const before = runtime.inspect(null);
  for (const source of [bytes(), bytes(1)]) {
    rejects(() => api.temporal_write(destination, source, 2), 'BAD_BYTES');
    equal(runtime.inspect(null), before);
  }
  rejects(() => api.temporal_write(end, bytes(1, 2), 2), 'BOUNDS');
  rejects(() => api.temporal_write(destination, end, 2), 'BOUNDS');
  rejects(() => api.temporal_write(destination, new Uint8Array(65), 65), 'BOUNDS');
  equal(runtime.inspect(null), before);
});

test('replacement keeps its original width and a rejected replacement preserves staged bytes', () => {
  const runtime = createByteRuntime(empty), { api } = runtime;
  const destination = runtime.address(null, 3);
  const event = api.temporal_write(destination, bytes(1, 2, 3), 3);
  const before = runtime.inspect(null), edit = api.temporal_edit(null);
  const source = bytes(7, 8, 9, 10, 11);
  api.temporal_replace(edit, event, source);
  source.fill(255);
  rejects(() => api.temporal_replace(edit, event, bytes(20, 21)), 'BAD_BYTES');
  equal(runtime.inspect(null), before, 'neither a valid nor invalid staged replacement publishes');
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(read(runtime, 2, 5), [0, 7, 8, 9, 0]);
  equal(runtime.inspect(null).events[0].bytes.length, 3);
});

test('a failed insertion leaves its edit usable and does not create a patch', () => {
  const runtime = createByteRuntime(marked), { api } = runtime;
  runtime.run(null, 'main');
  const before = runtime.inspect(null), destination = runtime.address(null, 0);
  const point = api.temporal_point(null, 'gap', 0), edit = api.temporal_edit(null);
  rejects(() => api.temporal_store_at(edit, point, destination, bytes(1), 3), 'BAD_BYTES');
  equal(runtime.inspect(null), before);
  const patch = api.temporal_store_at(edit, point, destination, bytes(4, 5, 6), 3);
  api.temporal_replace(edit, patch, bytes(7, 8, 9));
  rejects(() => api.temporal_replace(edit, patch, bytes()), 'BAD_BYTES');
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(read(runtime, 0, 3), [7, 8, 9]);
  equal(runtime.inspect(null).patches.length, 1);
  equal(Object.hasOwn(runtime.inspect(null).patches[0], 'type'), false);
});

test('Buffer and subarray offsets are honored and all three capture paths own their bytes', () => {
  const runtime = createByteRuntime(marked), { api } = runtime;
  const destination = runtime.address(null, 0);
  const backing = Buffer.from([200, 10, 20, 30, 201]);
  const event = api.temporal_write(destination, backing.subarray(1, 4), 3);
  backing.fill(88);
  equal(read(runtime, 0, 3), [10, 20, 30]);
  const replacementBacking = Uint8Array.from([210, 40, 50, 60, 211]);
  const edit = api.temporal_edit(null);
  api.temporal_replace(edit, event, replacementBacking.subarray(1, 4));
  replacementBacking.fill(99);
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(read(runtime, 0, 3), [40, 50, 60]);
  runtime.run(null, 'main');
  const patchBacking = Buffer.from([220, 70, 80, 90, 221]);
  const patchEdit = api.temporal_edit(null);
  api.temporal_store_at(patchEdit, api.temporal_point(null, 'gap', 0), destination,
    patchBacking.subarray(1, 4), 3);
  patchBacking.fill(77);
  equal(api.temporal_repair(patchEdit), RepairStatus.OK);
  equal(read(runtime, 0, 3), [70, 80, 90]);
  equal(api.temporal_repair(api.temporal_edit(null)), RepairStatus.OK);
  equal(read(runtime, 0, 3), [70, 80, 90], 'later replay cannot resurrect caller aliases');
});

test('hostile byte-view length overrides, proxies, and detached buffers cannot fabricate source bytes', () => {
  class Overreported extends Uint8Array { get length() { return 1000; } }
  class Underreported extends Uint8Array { get length() { return 0; } }
  const runtime = createByteRuntime(empty), { api } = runtime;
  const destination = runtime.address(null, 0), before = runtime.inspect(null);
  const tooShort = new Overreported([17]);
  rejects(() => api.temporal_write(destination, tooShort, 2), 'BAD_BYTES');
  equal(runtime.inspect(null), before);
  const proxy = new Proxy(bytes(1, 2, 3), {});
  rejects(() => api.temporal_write(destination, proxy, 3), 'BAD_BYTES');
  equal(runtime.inspect(null), before);
  const forged = Object.create(Uint8Array.prototype);
  rejects(() => api.temporal_write(destination, forged, 1), 'BAD_BYTES');
  equal(runtime.inspect(null), before);
  const detached = bytes(4, 5, 6);
  structuredClone(detached.buffer, { transfer: [detached.buffer] });
  rejects(() => api.temporal_write(destination, detached, 1), 'BAD_BYTES');
  equal(runtime.inspect(null), before);
  api.temporal_write(destination, new Underreported([7, 8, 9]), 3);
  equal(read(runtime, 0, 3), [7, 8, 9], 'real backing extent, not an overridable property, determines readability');
});

test('overlapping fake-memory ranges snapshot source before either-direction writes', () => {
  for (const [destination, source, expected] of [
    [2, 0, [1, 2, 1, 2, 3, 4, 5, 6]],
    [0, 2, [3, 4, 5, 6, 7, 8, 7, 8]],
  ]) {
    const runtime = createByteRuntime(empty, { initialMemory: bytes(1, 2, 3, 4, 5, 6, 7, 8) });
    runtime.api.temporal_write(runtime.address(null, destination), runtime.address(null, source), 6);
    equal(read(runtime, 0, 8), expected);
    equal(runtime.api.temporal_repair(runtime.api.temporal_edit(null)), RepairStatus.OK);
    equal(read(runtime, 0, 8), expected);
  }
});

test('same-range writes capture immutable source bytes and driver reads expose no writable alias', () => {
  const runtime = createByteRuntime(empty, { initialMemory: bytes(1, 2, 3, 4) }), { api } = runtime;
  const destination = runtime.address(null, 0);
  const first = api.temporal_write(destination, destination, 4);
  const exposed = runtime.read(destination, 4);
  exposed.fill(99);
  equal(read(runtime, 0, 4), [1, 2, 3, 4]);
  const later = api.temporal_write(destination, bytes(9, 8, 7, 6), 4);
  const edit = api.temporal_edit(null);
  api.temporal_remove(edit, later);
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(read(runtime, 0, 4), [1, 2, 3, 4]);
  const replacement = api.temporal_edit(null);
  api.temporal_replace(replacement, first, destination);
  equal(api.temporal_repair(replacement), RepairStatus.OK);
  equal(read(runtime, 0, 4), [1, 2, 3, 4]);
});

test('foreign runtime and destroyed-history addresses cannot be used as sources or destinations', () => {
  const runtime = createByteRuntime(empty), foreign = createByteRuntime(empty), { api } = runtime;
  const destination = runtime.address(null, 0), foreignAddress = foreign.address(null, 0);
  const before = runtime.inspect(null);
  rejects(() => api.temporal_write(foreignAddress, bytes(1), 1), 'INVALID_LOCATION');
  rejects(() => api.temporal_write(destination, foreignAddress, 1), 'INVALID_LOCATION');
  equal(runtime.inspect(null), before);
  const dead = api.temporal_create(), deadAddress = runtime.address(dead, 0);
  api.temporal_destroy(dead);
  rejects(() => api.temporal_write(deadAddress, bytes(1), 1), 'INVALID_HISTORY');
  rejects(() => api.temporal_write(destination, deadAddress, 1), 'INVALID_HISTORY');
  equal(runtime.inspect(null), before);
});

test('host can intentionally copy bytes across independent histories without transferring destination ownership', () => {
  const runtime = createByteRuntime(empty), { api } = runtime;
  const other = api.temporal_create(), source = runtime.address(other, 0);
  const sourceWrite = api.temporal_write(source, bytes(11, 12, 13), 3);
  api.temporal_write(runtime.address(null, 0), source, 3);
  equal(read(runtime, 0, 3), [11, 12, 13]);
  const edit = api.temporal_edit(other);
  api.temporal_replace(edit, sourceWrite, bytes(21, 22, 23));
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(read(runtime, 0, 3), [11, 12, 13], 'host capture is a value snapshot, not a retained source pointer');
  equal(read(runtime, 0, 3, other), [21, 22, 23]);
});

test('tracked source reads cannot observe an unrelated history and failure rolls back child creation', () => {
  const program = { functions: { main: fn([
    { id: 'create', op: 'temporal', name: 'temporal_create', dst: 'child', args: [] },
    { id: 'destination', op: 'address', dst: 'destination', history: { reg: 'child' }, addr: 0 },
    { id: 'copy', op: 'temporal', name: 'temporal_write',
      args: [{ reg: 'destination' }, { reg: 'source' }, 1] },
  ], ['source']) } };
  const runtime = createByteRuntime(program), { api } = runtime;
  const unrelated = api.temporal_create(), source = runtime.address(unrelated, 0);
  api.temporal_write(source, bytes(91), 1);
  const before = runtime.inspect(null), otherBefore = runtime.inspect(unrelated);
  rejects(() => runtime.run(null, 'main', [source]), 'WRONG_OWNER');
  equal(runtime.inspect(null), before);
  equal(runtime.inspect(unrelated), otherBefore);
});

test('opaque pointer-looking bytes are copied without inventing typed pointer provenance checks', () => {
  const runtime = createByteRuntime(empty), { api } = runtime;
  const addressBits = bytes(0xef, 0xbe, 0xad, 0xde, 0xfe, 0xff, 0xff, 0xff);
  api.temporal_write(runtime.address(null, 0), addressBits, addressBits.length);
  equal(read(runtime, 0, 8), [...addressBits]);
  equal(Object.hasOwn(runtime.inspect(null).events[0], 'type'), false);
  // No dereference is performed: successful copying does not establish that
  // these bytes denote a valid, owned, portable, or memory-safe native pointer.
});

console.log(JSON.stringify({ status: 'PASS', totals, cases: names }, null, 2));
