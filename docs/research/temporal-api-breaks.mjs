/**
 * Regression tests for actual defects found by attacking API boundaries.
 * Run: node docs/research/temporal-api-breaks.mjs
 *
 * Buffer is a real Uint8Array subclass, but Buffer.slice() aliases its input.
 * The original payload copier used .slice(), allowing untracked host mutation
 * of initial memory and previously captured input/intervention bytes. These
 * tests assert the contract's required copies, independently of the oracle.
 */
import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import {
  temporal_create, temporal_write, temporal_call, temporal_edit,
  temporal_replace, temporal_store_at, temporal_repair, temporal_points,
  temporal_inspect,
} from './temporal-api-model.mjs';
import {referenceRun} from './temporal-api-reference.mjs';

const PROGRAM = {
  functions: {
    main: {
      params: [],
      body: [
        {id: 'gap', op: 'mark', label: 'gap'},
        {id: 'read', op: 'load', dst: 'value', addr: 0, width: 1},
        {id: 'return', op: 'return', value: {reg: 'value'}},
      ],
    },
  },
};

let passed = 0;
function test(name, check) {
  check();
  passed++;
  console.log(`PASS ${name}`);
}

function checkAgainstReference(timeline, history) {
  const expected = referenceRun(PROGRAM, history);
  const actual = temporal_inspect(timeline);
  for (const key of ['memory', 'sources', 'trace', 'marks', 'results']) {
    assert.deepEqual(actual[key], expected[key], key);
  }
}

test('Buffer initial memory is copied before any publication', () => {
  const initial = Buffer.from([2]);
  const timeline = temporal_create(PROGRAM, {initialMemory: initial});
  const before = temporal_inspect(timeline);
  initial[0] = 77;
  assert.deepEqual(temporal_inspect(timeline), before);
  assert.equal(temporal_call(timeline, 'main'), 2n);
  checkAgainstReference(timeline, {
    initial: Uint8Array.of(2), events: [{kind: 'call', id: 'i1', fn: 'main', args: []}],
  });
});

test('Buffer external input is copied at temporal_write', () => {
  const timeline = temporal_create(PROGRAM, {memorySize: 1});
  const bytes = Buffer.from([2]);
  temporal_write(timeline, 0, bytes);
  bytes[0] = 77;
  assert.equal(temporal_call(timeline, 'main'), 2n);
  checkAgainstReference(timeline, {
    initial: Uint8Array.of(0), events: [
      {kind: 'write', id: 'w1', addr: 0, bytes: Uint8Array.of(2)},
      {kind: 'call', id: 'i2', fn: 'main', args: []},
    ],
  });
});

test('Buffer replacement is copied when staged, not when repaired', () => {
  const timeline = temporal_create(PROGRAM, {memorySize: 1});
  const write = temporal_write(timeline, 0, Uint8Array.of(1));
  temporal_call(timeline, 'main');
  const edit = temporal_edit(timeline);
  const bytes = Buffer.from([2]);
  temporal_replace(edit, write, bytes);
  bytes[0] = 77;
  temporal_repair(edit);
  assert.equal(temporal_inspect(timeline).results.get('i2'), 2n);
  checkAgainstReference(timeline, {
    initial: Uint8Array.of(0), events: [
      {kind: 'write', id: 'w1', addr: 0, bytes: Uint8Array.of(2)},
      {kind: 'call', id: 'i2', fn: 'main', args: []},
    ],
  });
});

test('Buffer historical intervention is copied when staged', () => {
  const timeline = temporal_create(PROGRAM, {memorySize: 1});
  temporal_call(timeline, 'main');
  const point = temporal_points(timeline, 'gap')[0];
  const edit = temporal_edit(timeline);
  const bytes = Buffer.from([2]);
  temporal_store_at(edit, point, 0, bytes);
  bytes[0] = 77;
  temporal_repair(edit);
  assert.equal(temporal_inspect(timeline).results.get('i1'), 2n);
  checkAgainstReference(timeline, {
    initial: Uint8Array.of(0), events: [{kind: 'call', id: 'i1', fn: 'main', args: []}],
    patches: [{kind: 'write', id: 'w2', at: 'i1/main/gap', addr: 0, bytes: Uint8Array.of(2)}],
  });
});

test('Buffer subarray copies only its visible byte range', () => {
  const storage = Buffer.from([90, 2, 91]);
  const visible = storage.subarray(1, 2);
  const timeline = temporal_create(PROGRAM, {initialMemory: visible});
  storage.fill(77);
  assert.equal(temporal_inspect(timeline).memory.length, 1);
  assert.equal(temporal_call(timeline, 'main'), 2n);
});

test('Other Uint8Array subclasses cannot override the copying method', () => {
  class AliasingBytes extends Uint8Array {
    slice() { return this; }
  }
  const bytes = new AliasingBytes([2]);
  const timeline = temporal_create(PROGRAM, {initialMemory: bytes});
  bytes[0] = 77;
  assert.equal(temporal_call(timeline, 'main'), 2n);
});

console.log(`Boundary-break regressions: ${passed} passed`);
