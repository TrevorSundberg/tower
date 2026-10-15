/**
 * Typed, by-value temporal API differential and adversarial checks.
 * Run: node docs/research/temporal-minimal-validation.mjs
 *
 * The public API under test has no source-byte pointer or byte-count argument.
 * Harness locations/program bytecode are stand-ins for compiler-generated T*
 * and instrumented ordinary code, not additional language API functions.
 * The independent reference interpreter is never given an incremental trace.
 * This is bounded executable validation, not a native or formal proof.
 */
import assert from 'node:assert/strict';
import { createValidationHarness } from './temporal-minimal-api.mjs';
import { referenceRun } from './temporal-api-reference.mjs';

const r = (reg) => ({ reg });
const WIDTH = { u8: 1, u16: 2, u32: 4, u64: 8, ptr: 8 };
const totals = { comparisons: 0, successfulRepairs: 0, rejectedRepairs: 0,
  rejectedOperations: 0, numericCases: 0, suites: 0 };
const cases = [];
const empty = { functions: { main: { params: [], body: [
  { id: 'end', op: 'return', value: 0 },
] } } };

// Deliberately independent byte encoding: no conversion helpers from the facade.
function encoded(type, value) {
  const width = WIDTH[type];
  let n = BigInt(value);
  const modulus = 1n << BigInt(width * 8);
  n = ((n % modulus) + modulus) % modulus;
  const out = new Uint8Array(width);
  for (let i = 0; i < width; i += 1) {
    out[i] = Number(n % 256n);
    n /= 256n;
  }
  return out;
}

function unsigned(memory, address, width) {
  let out = 0n;
  for (let i = width - 1; i >= 0; i -= 1) out = out * 256n + BigInt(memory[address + i]);
  return out;
}

class Harness {
  constructor(program = empty, options = {}) {
    this.program = structuredClone(program);
    const initial = options.initialMemory?.slice() ?? new Uint8Array(options.memorySize ?? 96);
    this.history = { initial, events: [], patches: [],
      maxSteps: options.maxSteps ?? 100000, maxDepth: options.maxDepth ?? 128 };
    this.h = createValidationHarness(program, { ...options, initialMemory: initial.slice() });
    this.api = this.h.api;
    this.locations = new Map();
    this.types = new Map();
    assert.deepEqual(Object.keys(this.api).sort(), [
      'temporal_write', 'temporal_edit', 'temporal_replace', 'temporal_store_at',
      'temporal_remove', 'temporal_repair', 'temporal_cancel',
    ].sort(), 'The public API must not grow a parallel byte-oriented or _value interface');
    for (const [name, arity] of Object.entries({ temporal_write: 2, temporal_edit: 0,
      temporal_replace: 3, temporal_store_at: 4, temporal_remove: 2,
      temporal_repair: 1, temporal_cancel: 1 })) {
      assert.equal(this.api[name].length, arity, `${name} has no explicit history, source pointer or size`);
    }
    this.verify('creation');
  }
  location(address, type) {
    const p = this.h.location(address, type);
    this.locations.set(p, { address, type });
    return p;
  }
  payload(type, value) {
    const scalar = type === 'ptr'
      ? value === null || value === 0 || value === 0n ? 0 : this.locations.get(value)?.address
      : value;
    assert.notEqual(scalar, undefined, 'The oracle needs its own known pointer identity');
    return encoded(type, scalar);
  }
  verify(label) {
    const expected = referenceRun(this.program, this.history);
    const actual = this.h.inspect();
    for (const key of ['memory', 'sources', 'trace', 'marks', 'results']) {
      assert.deepEqual(actual[key], expected[key], `${label}: ${key}`);
    }
    totals.comparisons += 1;
    return actual;
  }
  read(address, type = 'u32') { return unsigned(this.h.inspect().memory, address, WIDTH[type]); }
  write(address, type, value) {
    const capture = this.payload(type, value);
    const write = this.api.temporal_write(this.location(address, type), value);
    this.history.events.push({ kind: 'write', id: write.id, addr: address, bytes: capture });
    this.types.set(write, type);
    this.verify('typed input write');
    return write;
  }
  run(fn = 'main', args = []) {
    const prior = new Set(this.history.events.map((event) => event.id));
    const result = this.h.run(fn, args);
    const id = [...this.h.inspect().results.keys()].find((key) => !prior.has(key));
    assert(id, 'The diagnostic invocation must produce a new root identity');
    this.history.events.push({ kind: 'call', id, fn, args: args.map(BigInt) });
    assert.equal(this.verify('ordinary instrumented invocation').results.get(id), result);
    return result;
  }
  begin() {
    this.edit = this.api.temporal_edit();
    this.candidate = structuredClone(this.history);
    return this.edit;
  }
  replace(write, value) {
    const data = this.payload(this.types.get(write), value);
    this.api.temporal_replace(this.edit, write, value);
    const event = [...this.candidate.events, ...this.candidate.patches].find((x) => x.id === write.id);
    assert(event);
    event.bytes = data;
  }
  insert(point, address, type, value) {
    const data = this.payload(type, value);
    const write = this.api.temporal_store_at(this.edit, point, this.location(address, type), value);
    this.candidate.patches.push({ kind: 'write', id: write.id, at: point.key, addr: address, bytes: data });
    this.types.set(write, type);
    return write;
  }
  remove(write) {
    this.api.temporal_remove(this.edit, write);
    this.candidate.events = this.candidate.events.filter((x) => x.id !== write.id);
    this.candidate.patches = this.candidate.patches.filter((x) => x.id !== write.id);
  }
  repair(expectedCode = null) {
    const before = this.h.inspect();
    let fault;
    try { referenceRun(this.program, this.candidate); } catch (error) { fault = error; }
    assert.equal(fault?.code ?? null, expectedCode, 'Independent replay failure expectation');
    const consumed = this.edit;
    if (fault) {
      assert.throws(() => this.api.temporal_repair(consumed), (error) => error.code === fault.code);
      assert.deepEqual(this.h.inspect(), before, 'Rejected repair must leave all published state unchanged');
      totals.rejectedRepairs += 1;
    } else {
      const stats = this.api.temporal_repair(consumed);
      assert.equal(typeof stats, 'object');
      this.history = this.candidate;
      totals.successfulRepairs += 1;
    }
    this.edit = null;
    this.candidate = null;
    this.reject(() => this.api.temporal_repair(consumed), 'INVALID_EDIT');
    return this.verify('repair');
  }
  cancel() {
    const before = this.h.inspect();
    const consumed = this.edit;
    this.api.temporal_cancel(consumed);
    this.edit = null;
    this.candidate = null;
    assert.deepEqual(this.h.inspect(), before, 'Cancellation must not publish candidate writes');
    this.reject(() => this.api.temporal_cancel(consumed), 'INVALID_EDIT');
    this.verify('cancel');
  }
  reject(fn, code) {
    const before = this.h.inspect();
    assert.throws(fn, (error) => error.code === code, `Expected ${code}`);
    assert.deepEqual(this.h.inspect(), before, `Rejected ${code} operation changed published state`);
    totals.rejectedOperations += 1;
  }
  destroy() { this.h.destroy(); }
}

function suite(name, fn) {
  fn();
  totals.suites += 1;
  cases.push(name);
}

const twiceProgram = { functions: {
  main: { params: [], body: [
    { id: 'read', op: 'load', dst: 'input', addr: 0, width: 4 },
    { id: 'call', op: 'call', fn: 'twice', args: [r('input')], dst: 'output' },
    { id: 'store', op: 'store', addr: 32, width: 4, value: r('output') },
    { id: 'return', op: 'return', value: r('output') },
  ] },
  twice: { params: ['x'], body: [
    { id: 'multiply', op: 'mul', dst: 'temporary', a: r('x'), b: 2 },
    { id: 'return', op: 'return', value: r('temporary') },
  ] },
} };

suite('literals, temporary registers, nested ordinary call, expression capture exactly once', () => {
  const h = new Harness(twiceProgram);
  let evaluations = 0;
  const next = () => { evaluations += 1; return 3; };
  const input = h.write(0, 'u32', next());
  assert.equal(h.run(), 6n);
  assert.equal(evaluations, 1);
  const replacement = () => { evaluations += 1; return Number(h.read(32)) + 1; };
  h.begin();
  h.replace(input, replacement());
  assert.equal(h.read(0), 3n, 'Staging must not publish');
  h.repair();
  assert.equal(h.read(0), 7n);
  assert.equal(h.read(32), 14n, 'Captured current expression is 6 + 1, not a historical input increment');
  assert.equal(evaluations, 2, 'Repair must not reevaluate the external expression');
  h.destroy();
});

suite('finite-width literal matrix and seeded exact-integer conversions', () => {
  const h = new Harness();
  const values = [0, -0, 1, -1, 255, 256, 65535, 65536, 4294967295, 4294967296,
    Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 0n, -1n, 1n << 64n,
    (1n << 127n) + 0x123456789abcdefn, -(1n << 130n) + 5n];
  let state = 0x8e12abcd;
  for (let i = 0; i < 80; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const high = BigInt(state);
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const n = (high << 32n) | BigInt(state);
    values.push(i & 1 ? -n : n);
  }
  for (const type of ['u8', 'u16', 'u32', 'u64']) {
    const write = h.write(8, type, 0);
    for (const value of values) {
      h.begin();
      h.replace(write, value);
      h.repair();
      assert.equal(h.read(8, type), BigInt.asUintN(WIDTH[type] * 8, BigInt(value)));
      totals.numericCases += 1;
    }
  }
  h.destroy();
});

suite('overlapping typed stores retain byte-level last-preceding-writer semantics', () => {
  const program = { functions: { main: { params: [], body: [
    { id: 'load', op: 'load', dst: 'n', addr: 0, width: 4 },
    { id: 'store', op: 'store', addr: 32, width: 4, value: r('n') },
    { id: 'return', op: 'return', value: r('n') },
  ] } } };
  const h = new Harness(program);
  const wide = h.write(0, 'u32', 0x11223344);
  const middle = h.write(1, 'u16', 0xaabb);
  assert.equal(h.run(), 0x11aabb44n);
  h.begin();
  h.replace(wide, 0x55667788);
  h.repair();
  assert.equal(h.read(32), 0x55aabb88n);
  h.begin();
  h.replace(middle, 0xccdd);
  h.repair();
  assert.equal(h.read(32), 0x55ccdd88n);
  h.begin();
  h.remove(middle);
  h.repair();
  assert.equal(h.read(32), 0x55667788n);
  h.destroy();
});

suite('pointer payload captures address; equal-value pointer retarget updates dependencies', () => {
  const program = { functions: { main: { params: [], body: [
    { id: 'pointer', op: 'load', dst: 'p', addr: 0, width: 8 },
    { id: 'deref', op: 'load', dst: 'n', addr: r('p'), width: 4 },
    { id: 'double', op: 'mul', dst: 'n', a: r('n'), b: 2 },
    { id: 'store', op: 'store', addr: 48, width: 4, value: r('n') },
    { id: 'return', op: 'return', value: r('n') },
  ] } } };
  const h = new Harness(program);
  const oldData = h.write(16, 'u32', 11);
  const newData = h.write(24, 'u32', 11);
  const oldTarget = h.location(16, 'u32');
  const newTarget = h.location(24, 'u32');
  const pointer = h.write(0, 'ptr', oldTarget);
  assert.equal(h.run(), 22n);
  h.begin();
  h.replace(pointer, newTarget);
  h.repair();
  assert.equal(h.read(0, 'ptr'), 24n);
  assert.equal(h.read(48), 22n);
  h.begin();
  h.replace(newData, 17);
  h.repair();
  assert.equal(h.read(48), 34n, 'Future corrections follow the new address even after equal-valued repair');
  h.begin();
  h.replace(oldData, 99);
  h.repair();
  assert.equal(h.read(48), 34n, 'Old target must not supply the new dereference');
  h.destroy();
});

suite('null pointer value encoding, without falsely claiming null dereference validity', () => {
  const h = new Harness();
  const p = h.write(0, 'ptr', null);
  for (const value of [0, 0n, null]) {
    h.begin();
    h.replace(p, value);
    h.repair();
    assert.equal(h.read(0, 'ptr'), 0n);
  }
  h.destroy();
});

suite('insertion after a load preserves that register while changing later reads', () => {
  const program = { functions: { main: { params: [], body: [
    { id: 'first', op: 'load', dst: 'old', addr: 0, width: 4 },
    { id: 'gap', op: 'mark', label: 'after_load' },
    { id: 'second', op: 'load', dst: 'new', addr: 0, width: 4 },
    { id: 'sum', op: 'add', dst: 'sum', a: r('old'), b: r('new') },
    { id: 'store', op: 'store', addr: 32, width: 4, value: r('sum') },
    { id: 'return', op: 'return', value: r('sum') },
  ] } } };
  const h = new Harness(program);
  h.write(0, 'u32', 2);
  assert.equal(h.run(), 4n);
  const point = h.h.points('after_load')[0];
  let count = 0;
  const value = () => { count += 1; return 3; };
  h.begin();
  const inserted = h.insert(point, 0, 'u32', value());
  h.repair();
  assert.equal(h.read(0), 3n);
  assert.equal(h.read(32), 5n);
  assert.equal(count, 1);
  h.begin();
  h.replace(inserted, 9);
  h.repair();
  assert.equal(h.read(32), 11n);
  h.begin();
  h.reject(() => h.api.temporal_store_at(h.edit, point, h.location(0, 'u32'), 4), 'INVALID_POINT');
  h.cancel();
  h.destroy();
});

suite('atomic batch avoids an invalid intermediate state; failed repair is consumed', () => {
  const program = { functions: { main: { params: [], body: [
    { id: 'a', op: 'load', dst: 'a', addr: 0, width: 4 },
    { id: 'b', op: 'load', dst: 'b', addr: 4, width: 4 },
    { id: 'address', op: 'sub', dst: 'p', a: r('a'), b: r('b') },
    { id: 'deref', op: 'load', dst: 'n', addr: r('p'), width: 4 },
    { id: 'store', op: 'store', addr: 48, width: 4, value: r('n') },
    { id: 'return', op: 'return', value: r('n') },
  ] } } };
  const h = new Harness(program, { memorySize: 64 });
  h.write(16, 'u32', 123);
  const a = h.write(0, 'u32', 16);
  const b = h.write(4, 'u32', 0);
  assert.equal(h.run(), 123n);
  h.begin();
  h.replace(a, 72);
  h.repair('BOUNDS');
  assert.equal(h.read(0), 16n);
  h.begin();
  h.replace(a, 72);
  h.replace(b, 56);
  h.repair();
  assert.equal(h.read(0), 72n);
  assert.equal(h.read(4), 56n);
  assert.equal(h.read(48), 123n);
  h.destroy();
});

suite('malformed, inexact and object values cannot silently become captured bytes', () => {
  const h = new Harness();
  const p = h.location(0, 'u32');
  for (const bad of [NaN, Infinity, -Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1,
    true, false, '12', undefined, null]) {
    h.reject(() => h.api.temporal_write(p, bad), 'BAD_VALUE');
  }
  for (const bad of [{}, { valueOf: () => 12 }]) {
    h.reject(() => h.api.temporal_write(p, bad), 'TYPE_MISMATCH');
  }
  const scalar = h.write(0, 'u32', 2);
  const pointer = h.write(8, 'ptr', null);
  const target = h.location(24, 'u32');
  h.begin();
  h.reject(() => h.api.temporal_replace(h.edit, scalar, target), 'TYPE_MISMATCH');
  h.reject(() => h.api.temporal_replace(h.edit, pointer, 24), 'TYPE_MISMATCH');
  h.reject(() => h.api.temporal_replace(h.edit, scalar, 0.5), 'BAD_VALUE');
  h.cancel();
  h.destroy();
});

suite('forged, foreign and removed value handles cannot select or retype a write', () => {
  const h = new Harness();
  const other = new Harness();
  const owned = h.location(0, 'u32');
  const foreign = other.location(0, 'u32');
  h.reject(() => h.api.temporal_write(foreign, 3), 'INVALID_LOCATION');
  h.reject(() => h.api.temporal_write({ ...owned }, 3), 'INVALID_LOCATION');
  h.reject(() => h.api.temporal_write(0, 3), 'INVALID_LOCATION');
  const ownWrite = h.write(0, 'u32', 4);
  const otherWrite = other.write(0, 'u32', 9);
  h.begin();
  h.reject(() => h.api.temporal_replace(h.edit, otherWrite, 7), 'INVALID_WRITE');
  h.reject(() => h.api.temporal_replace(h.edit, { ...ownWrite }, 7), 'INVALID_WRITE');
  h.remove(ownWrite);
  h.repair();
  h.begin();
  h.reject(() => h.api.temporal_replace(h.edit, ownWrite, 7), 'INVALID_WRITE');
  h.cancel();
  h.destroy();
  other.destroy();
});

suite('implicit context rejects foreign edit control and foreign pointer payloads', () => {
  const program = { functions: { main: { params: [], body: [
    { id: 'point', op: 'mark', label: 'gap' },
    { id: 'return', op: 'return', value: 0 },
  ] } } };
  const h = new Harness(program);
  const other = new Harness(program);
  const scalar = h.write(0, 'u32', 4);
  const pointer = h.write(8, 'ptr', null);
  h.run();
  other.run();
  const foreignEdit = other.begin();
  const point = h.h.points('gap')[0];
  h.reject(() => h.api.temporal_repair(foreignEdit), 'INVALID_EDIT');
  h.reject(() => h.api.temporal_cancel(foreignEdit), 'INVALID_EDIT');
  h.reject(() => h.api.temporal_replace(foreignEdit, scalar, 9), 'INVALID_EDIT');
  h.reject(() => h.api.temporal_remove(foreignEdit, scalar), 'INVALID_EDIT');
  h.reject(() => h.api.temporal_store_at(foreignEdit, point, h.location(0, 'u32'), 9), 'INVALID_EDIT');
  other.cancel();
  h.begin();
  h.reject(() => h.api.temporal_replace(h.edit, pointer, other.location(24, 'u32')), 'TYPE_MISMATCH');
  h.reject(() => h.api.temporal_store_at(h.edit, other.h.points('gap')[0], h.location(0, 'u32'), 1), 'INVALID_POINT');
  h.cancel();
  h.destroy();
  other.destroy();
});

suite('cancelled provisional insertion cannot later be treated as a live input', () => {
  const program = { functions: { main: { params: [], body: [
    { id: 'point', op: 'mark', label: 'gap' },
    { id: 'return', op: 'return', value: 0 },
  ] } } };
  const h = new Harness(program);
  h.run();
  h.begin();
  const provisional = h.insert(h.h.points('gap')[0], 0, 'u16', 0xabcd);
  h.cancel();
  h.begin();
  h.reject(() => h.api.temporal_replace(h.edit, provisional, 1), 'INVALID_WRITE');
  h.cancel();
  h.destroy();
});

console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-minimal-validation', cases, totals,
  scope: 'Bounded unsigned scalar and logical pointer lowering over byte-addressed tracked memory.',
  limitations: 'Not a native compiler/ABI benchmark, arbitrary C semantics validation, or formal proof.',
}, null, 2));
