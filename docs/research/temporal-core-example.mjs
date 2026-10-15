/** node docs/research/temporal-core-example.mjs
 * Compiler output is the opcode data; the api calls below are user/controller code.
 */
import assert from 'node:assert/strict';
import { createTemporalRuntime, Status } from './temporal-core-runtime.mjs';

const reg = name => ({ reg: name });
const bytes = (value, width = 4) => {
  const result = new Uint8Array(width); let n = BigInt(value);
  for (let i = 0; i < width; i++) { result[i] = Number(n & 255n); n >>= 8n; }
  return result;
};
const number = data => {
  let n = 0n;
  for (let i = data.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(data[i]);
  return n;
};

// These scattered addresses stand for separate C globals, not an array.
const A = 0x1000, B = 0x2000, C = 0x3000, D = 0x4000;
const RESULT = 0x5000, SAVED_POINT = 0x6000;
const prefix = [
  { id: 'read_a', op: 'load', dst: 'a', addr: A, width: 4 },
  { id: 'read_b', op: 'load', dst: 'b', addr: B, width: 4 },
  { id: 'sum', op: 'add', dst: 'sum', a: reg('a'), b: reg('b') },
];
const finish = [
  { id: 'publish', op: 'store', addr: RESULT, width: 4, value: reg('result') },
  { id: 'return', op: 'return', value: RESULT },
];
const runtime = createTemporalRuntime({ functions: {
  basic: { params: ['args'], body: [
    ...prefix,
    { id: 'read_c', op: 'load', dst: 'c', addr: C, width: 4 },
    { id: 'product', op: 'mul', dst: 'result', a: reg('sum'), b: reg('c') },
    ...finish,
  ] },
  middle: { params: ['args'], body: [
    ...prefix,
    { id: 'capture_gap', op: 'temporal', name: 'temporal_point', args: [null], dst: 'point' },
    { id: 'save_gap', op: 'store', addr: SAVED_POINT, width: 8, value: reg('point') },
    { id: 'read_c', op: 'load', dst: 'c', addr: C, width: 4 },
    { id: 'read_d', op: 'load', dst: 'd', addr: D, width: 4 },
    { id: 'right_sum', op: 'add', dst: 'right', a: reg('c'), b: reg('d') },
    { id: 'product', op: 'mul', dst: 'result', a: reg('sum'), b: reg('right') },
    ...finish,
  ] },
} });

// COMPILER/LOADER ONLY: ordinary static declarations lower to registration.
for (const [address, value, width = 4] of [
  [A, 3], [B, 5], [C, 9], [D, 1], [RESULT, 0], [SAVED_POINT, 0, 8],
]) runtime.builtins.builtin_temporal_global(address, bytes(value, width), width);

// USER/CONTROLLER CODE: no load/store tracking or address-owner helper calls.
const t = runtime.api;
const start = t.temporal_point(null);
t.temporal_run(null, 'basic', null, 0);
assert.equal(number(runtime.debug.read(RESULT, 4)), 72n);

let edit = t.temporal_edit(null);
const correction = bytes(6);
const write = t.temporal_store_at(edit, start, C, correction, 4);
correction.fill(255); // The API has already captured the original six.
assert.equal(t.temporal_repair(edit), Status.OK);
assert.equal(number(runtime.debug.read(RESULT, 4)), 48n);

edit = t.temporal_edit(null);
t.temporal_replace(edit, write, bytes(7));
assert.equal(t.temporal_repair(edit), Status.OK);
assert.equal(number(runtime.debug.read(RESULT, 4)), 56n);

edit = t.temporal_edit(null);
t.temporal_remove(edit, write);
assert.equal(t.temporal_repair(edit), Status.OK);
assert.equal(number(runtime.debug.read(RESULT, 4)), 72n);

t.temporal_run(null, 'middle', null, 0);
assert.equal(number(runtime.debug.read(RESULT, 4)), 80n);
const middle = number(runtime.debug.read(SAVED_POINT, 8));
edit = t.temporal_edit(null);
t.temporal_store_at(edit, middle, D, bytes(2), 4);
assert.equal(t.temporal_repair(edit), Status.OK);
assert.equal(number(runtime.debug.read(RESULT, 4)), 88n);
assert.equal(number(runtime.debug.read(SAVED_POINT, 8)), middle);

console.log('PASS: original calculation 72 -> 48 -> 56 -> 72; middle insertion 80 -> 88.');
console.log('Ordinary assignments are tracked; there is no public temporal_write.');
console.log('Scattered globals have loader-registered owners; saved Points survive repair.');
