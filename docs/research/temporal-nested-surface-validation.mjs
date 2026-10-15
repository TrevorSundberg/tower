/** Focused checks for the exact public signature and value/handle contract. */
import assert from 'node:assert/strict';
import { createNestedRuntime, RepairStatus } from './temporal-nested-api.mjs';

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

test('exact eleven method names and argument arities', () => {
  const { api } = createNestedRuntime(empty);
  equal(Object.fromEntries(Object.entries(api).map(([name, method]) => [name, method.length])), {
    temporal_create: 0, temporal_destroy: 1, temporal_write: 2,
    temporal_edit: 1, temporal_replace: 3, temporal_remove: 2,
    temporal_repair: 1, temporal_cancel: 1, temporal_mark: 1,
    temporal_point: 3, temporal_store_at: 4,
  });
  rejects(() => api.temporal_edit(undefined), 'INVALID_HISTORY');
  rejects(() => api.temporal_mark('host-mark'), 'WRONG_PHASE');
});

test('numeric values are immediate by-value captures at all supported widths', () => {
  for (const [type, bits] of [['u8', 8], ['u16', 16], ['u32', 32], ['u64', 64]]) {
    const runtime = createNestedRuntime(empty), { api } = runtime;
    const destination = runtime.location(null, 0, type);
    let source = (1n << BigInt(bits)) + 5n;
    const write = api.temporal_write(destination, source);
    source = 900n;
    equal(runtime.read(destination), 5n, `${type}: source value captured`);
    const edit = api.temporal_edit(null);
    api.temporal_replace(edit, write, -2n + 1n);
    equal(runtime.read(destination), 5n, `${type}: staging does not publish`);
    equal(api.temporal_repair(edit), RepairStatus.OK);
    equal(runtime.read(destination), BigInt.asUintN(bits, -1n));
    const edit2 = api.temporal_edit(null);
    api.temporal_replace(edit2, write, 7 + 8);
    equal(api.temporal_repair(edit2), RepairStatus.OK);
    equal(runtime.read(destination), 15n);
    rejects(() => api.temporal_write(destination, 0.5), 'BAD_VALUE');
    rejects(() => api.temporal_write(destination, {}), 'BAD_VALUE');
  }
});

test('logical pointer captures address shallowly; null and numeric addresses are accepted', () => {
  const runtime = createNestedRuntime(empty), { api } = runtime;
  const pointer = runtime.location(null, 0, 'ptr');
  const pointee = runtime.location(null, 16, 'u32');
  const pointerWrite = api.temporal_write(pointer, pointee);
  const dataWrite = api.temporal_write(pointee, 91);
  equal(runtime.read(pointer), 16n);
  equal(runtime.read(pointee), 91n);
  const edit = api.temporal_edit(null);
  api.temporal_replace(edit, dataWrite, 42);
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(runtime.read(pointer), 16n, 'pointer value is not a snapshot of pointee bytes');
  for (const value of [null, 0, 24, -1n]) {
    const batch = api.temporal_edit(null);
    api.temporal_replace(batch, pointerWrite, value);
    equal(api.temporal_repair(batch), RepairStatus.OK);
    equal(runtime.read(pointer), value === null ? 0n : BigInt.asUintN(64, BigInt(value)));
  }
  const other = api.temporal_create();
  const otherLocation = runtime.location(other, 16, 'u32');
  rejects(() => api.temporal_write(pointer, otherLocation), 'WRONG_OWNER');
  const batch = api.temporal_edit(null);
  rejects(() => api.temporal_replace(batch, pointerWrite, otherLocation), 'WRONG_OWNER');
  api.temporal_cancel(batch);
  const numeric = runtime.location(null, 8, 'u64');
  rejects(() => api.temporal_write(numeric, pointee), 'BAD_VALUE');
});

const marks = { functions: { main: fn([
  { id: 'gap', op: 'mark', label: 'gap' },
  { id: 'load', op: 'load', dst: 'value', addr: 8, width: 4 },
  { id: 'save', op: 'store', addr: 12, width: 4, value: { reg: 'value' } },
]) } };

test('write, point and destination owners are checked independently', () => {
  const runtime = createNestedRuntime(marks), { api } = runtime;
  const other = api.temporal_create();
  const a = runtime.location(null, 8), b = runtime.location(other, 8);
  const wa = api.temporal_write(a, 1), wb = api.temporal_write(b, 2);
  runtime.run(null, 'main'); runtime.run(other, 'main');
  const pa = api.temporal_point(null, 'gap', 0), pb = api.temporal_point(other, 'gap', 0);
  const edit = api.temporal_edit(null), otherEdit = api.temporal_edit(other);
  rejects(() => api.temporal_replace(edit, wb, 3), 'INVALID_WRITE');
  rejects(() => api.temporal_remove(edit, wb), 'INVALID_WRITE');
  rejects(() => api.temporal_store_at(edit, pb, a, 3), 'INVALID_POINT');
  rejects(() => api.temporal_store_at(edit, pa, b, 3), 'WRONG_OWNER');
  api.temporal_replace(edit, wa, 4);
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(runtime.read(a), 4n);
  api.temporal_cancel(otherEdit);
  const foreign = createNestedRuntime(marks);
  rejects(() => foreign.api.temporal_write(a, 5), 'INVALID_LOCATION');
});

test('same-gap staging order is stable; removing provisional writes does not publish them', () => {
  const runtime = createNestedRuntime(marks), { api } = runtime;
  const destination = runtime.location(null, 8), result = runtime.location(null, 12);
  runtime.run(null, 'main');
  const point = api.temporal_point(null, 'gap', 0), edit = api.temporal_edit(null);
  const first = api.temporal_store_at(edit, point, destination, 2);
  const second = api.temporal_store_at(edit, point, destination, 3);
  const removed = api.temporal_store_at(edit, point, destination, 100);
  api.temporal_remove(edit, removed);
  rejects(() => api.temporal_replace(edit, removed, 200), 'INVALID_WRITE');
  api.temporal_replace(edit, first, 6);
  equal(runtime.read(result), 0n);
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(runtime.read(result), 3n, 'replacement does not move first after second');
  const next = api.temporal_edit(null);
  rejects(() => api.temporal_remove(next, removed), 'INVALID_WRITE');
  api.temporal_remove(next, second);
  const later = api.temporal_store_at(next, api.temporal_point(null, 'gap', 0), destination, 9);
  equal(api.temporal_repair(next), RepairStatus.OK);
  equal(runtime.read(result), 9n, 'new insertion follows existing first insertion');
  const final = api.temporal_edit(null);
  api.temporal_remove(final, later);
  equal(api.temporal_repair(final), RepairStatus.OK);
  equal(runtime.read(result), 6n);
});

test('cancellation preserves fresh points and invalidates cancelled provisional writes', () => {
  const runtime = createNestedRuntime(marks), { api } = runtime;
  runtime.run(null, 'main');
  const point = api.temporal_point(null, 'gap', 0), destination = runtime.location(null, 8);
  const revision = runtime.inspect(null).revision;
  const edit = api.temporal_edit(null), provisional = api.temporal_store_at(edit, point, destination, 2);
  api.temporal_cancel(edit);
  equal(runtime.inspect(null).revision, revision);
  rejects(() => api.temporal_cancel(edit), 'INVALID_EDIT');
  const next = api.temporal_edit(null);
  rejects(() => api.temporal_remove(next, provisional), 'INVALID_WRITE');
  api.temporal_store_at(next, point, destination, 4);
  equal(api.temporal_repair(next), RepairStatus.OK);
  equal(runtime.read(destination), 4n);
});

test('failed repair preserves fresh points and published state but consumes edit', () => {
  const program = { functions: { main: fn([
    { id: 'addr', op: 'load', dst: 'address', addr: 0, width: 4 },
    { id: 'gap', op: 'mark', label: 'gap' },
    { id: 'value', op: 'load', dst: 'value', addr: { reg: 'address' }, width: 4 },
  ]) } };
  const runtime = createNestedRuntime(program), { api } = runtime;
  const address = runtime.location(null, 0), destination = runtime.location(null, 8);
  const input = api.temporal_write(address, 0);
  runtime.run(null, 'main');
  const point = api.temporal_point(null, 'gap', 0), before = runtime.inspect(null);
  const edit = api.temporal_edit(null);
  api.temporal_replace(edit, input, 63);
  const provisional = api.temporal_store_at(edit, point, destination, 100);
  equal(api.temporal_repair(edit), RepairStatus.TRAP);
  equal(runtime.inspect(null).memory, before.memory);
  equal(runtime.inspect(null).revision, before.revision);
  rejects(() => api.temporal_repair(edit), 'INVALID_EDIT');
  const next = api.temporal_edit(null);
  rejects(() => api.temporal_replace(next, provisional, 3), 'INVALID_WRITE');
  api.temporal_store_at(next, point, destination, 8);
  equal(api.temporal_repair(next), RepairStatus.OK);
  equal(runtime.read(destination), 8n);
});

test('successful no-op publication expires points but not committed Write handles', () => {
  const runtime = createNestedRuntime(marks), { api } = runtime;
  const destination = runtime.location(null, 8);
  const input = api.temporal_write(destination, 1);
  runtime.run(null, 'main');
  const point = api.temporal_point(null, 'gap', 0), revision = runtime.inspect(null).revision;
  equal(api.temporal_repair(api.temporal_edit(null)), RepairStatus.OK);
  equal(runtime.inspect(null).revision, revision + 1);
  const edit = api.temporal_edit(null);
  rejects(() => api.temporal_store_at(edit, point, destination, 5), 'INVALID_POINT');
  api.temporal_replace(edit, input, 9);
  equal(api.temporal_repair(edit), RepairStatus.OK);
  equal(runtime.read(destination), 9n);
});

console.log(JSON.stringify({ status: 'PASS', totals, cases: names }, null, 2));
