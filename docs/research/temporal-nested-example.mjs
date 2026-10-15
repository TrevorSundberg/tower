/** Run: node docs/research/temporal-nested-example.mjs */
import assert from 'node:assert/strict';
import { createNestedRuntime, RepairStatus } from './temporal-nested-api.mjs';

const r = (reg) => ({ reg });

// Fake compiler output for this ordinary parent/child computation:
//   parent: create child; repeat count times { execute increment in child; }
//   child:  counter = counter + 1;
// No application-defined dependency callbacks exist.
const program = { functions: {
  parent: { params: [], body: [
    { id: 'read_count', op: 'load', dst: 'count', addr: 0, width: 4 },
    { id: 'create_child', op: 'temporal', name: 'temporal_create', args: [], dst: 'child' },
    { id: 'loop', op: 'repeat', count: r('count'), index: 'i', body: [
      { id: 'advance_child', op: 'enter', history: r('child'), fn: 'increment', args: [], dst: 'ignored' },
    ] },
    { id: 'read_child', op: 'load', history: r('child'), dst: 'answer', addr: 0, width: 4 },
    { id: 'save_answer', op: 'store', addr: 4, width: 4, value: r('answer') },
    { id: 'return', op: 'return', value: r('answer') },
  ] },
  increment: { params: [], body: [
    { id: 'load', op: 'load', dst: 'old', addr: 0, width: 4 },
    { id: 'add', op: 'add', dst: 'next', a: r('old'), b: 1 },
    { id: 'store', op: 'store', addr: 0, width: 4, value: r('next') },
    { id: 'return', op: 'return', value: r('next') },
  ] },
} };

// Driver setup stands in for the compiler/runtime starting the program.
const runtime = createNestedRuntime(program, { memorySize: 16 });
const api = runtime.api;
const countAddress = runtime.location(null, 0, 'u32');
const answerAddress = runtime.location(null, 4, 'u32');

// Actual API: inputs are values, not source buffers.
const input = api.temporal_write(countAddress, 2);
runtime.run(null, 'parent');
console.log(`Initially: ${runtime.read(answerAddress)}`);

// null selects this runtime's default/root history.
// Correct the original parent input; do not append another child increment.
const edit = api.temporal_edit(null);
api.temporal_replace(edit, input, 1);
assert.equal(api.temporal_repair(edit), RepairStatus.OK);
assert.equal(runtime.read(answerAddress), 1n);
console.log(`After correcting 2 -> 1: ${runtime.read(answerAddress)}`);

const child = runtime.inspect(null).children[0];
assert.equal(runtime.read(runtime.location(child, 0, 'u32')), 1n);
console.log('Child counter is 1, not 3. Parent and child published atomically.');
