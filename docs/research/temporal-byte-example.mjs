/** Run: node docs/research/temporal-byte-example.mjs */
import assert from 'node:assert/strict';
import { createByteRuntime, RepairStatus } from './temporal-nested-api.mjs';

const r = reg => ({ reg });
const program = { functions: { main: { params: [], body: [
  { id: 'a', op: 'load', dst: 'a', addr: 0, width: 4 },
  { id: 'b', op: 'load', dst: 'b', addr: 4, width: 4 },
  { id: 'sum', op: 'add', dst: 'sum', a: r('a'), b: r('b') },
  { id: 'c', op: 'load', dst: 'c', addr: 8, width: 4 },
  { id: 'result', op: 'mul', dst: 'result', a: r('sum'), b: r('c') },
  { id: 'store', op: 'store', addr: 12, width: 4, value: r('result') },
  { id: 'return', op: 'return', value: r('result') },
] } } };

const initialMemory = new Uint8Array([3, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const runtime = createByteRuntime(program, { initialMemory });
const source = new Uint8Array([9, 0, 0, 0]);
const input = runtime.api.temporal_write(runtime.address(null, 8), source, 4);
source.fill(123); // The runtime owns a copy, not this source buffer.
assert.equal(runtime.run(null, 'main'), 72n);
console.log('Initially: (3 + 5) * 9 = 72');

const edit = runtime.api.temporal_edit(null);
const replacement = new Uint8Array([6, 0, 0, 0]);
runtime.api.temporal_replace(edit, input, replacement); // Original width is already 4.
replacement.fill(0);
assert.equal(runtime.api.temporal_repair(edit), RepairStatus.OK);
assert.deepEqual(runtime.read(runtime.address(null, 12), 4), new Uint8Array([48, 0, 0, 0]));
console.log('After correction: (3 + 5) * 6 = 48');
console.log('Sources were captured immediately. The Write has no T/type metadata.');
