/**
 * Deliberately break the actual model and require tests to detect each mutation.
 * Source variants are loaded from data URLs in memory: no repository file edits.
 * Run: node docs/research/temporal-api-mutations.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as correct from './temporal-api-model.mjs';

const source = await readFile(new URL('./temporal-api-model.mjs', import.meta.url), 'utf8');
const r = (reg) => ({ reg });
const b = (...values) => Uint8Array.from(values);
const functionProgram = (body, extra = {}) => ({ functions: { main: { params: [], body }, ...extra } });
const loadReturn = functionProgram([
  { id: 'load', op: 'load', dst: 'v', addr: 0, width: 4 },
  { id: 'return', op: 'return', value: r('v') },
]);
const viewResult = (api, t) => [...api.temporal_inspect(t).results.values()].at(-1);
const replace = (api, t, w, data) => {
  const edit = api.temporal_edit(t); api.temporal_replace(edit, w, data); api.temporal_repair(edit);
};

const cases = {
  changedRead(api) {
    const t = api.temporal_create(loadReturn);
    const w = api.temporal_write(t, 0, b(1, 0, 0, 0));
    api.temporal_call(t, 'main');
    replace(api, t, w, b(2, 0, 0, 0));
    assert.equal(viewResult(api, t), 2n, 'A load cache must validate historical memory bytes');
  },
  overlap(api) {
    const t = api.temporal_create(loadReturn);
    api.temporal_write(t, 0, b(0x44, 0x33, 0x22, 0x11));
    const w = api.temporal_write(t, 1, b(0x33));
    api.temporal_call(t, 'main');
    replace(api, t, w, b(0xaa));
    assert.equal(viewResult(api, t), 0x1122aa44n, 'A wide load depends on every covering byte, not just its base byte');
  },
  producer(api) {
    const t = api.temporal_create(functionProgram([
      { id: 'condition', op: 'load', dst: 'flag', addr: 0, width: 1 },
      { id: 'branch', op: 'if', cond: r('flag'), then: [
        { id: 'same', op: 'store', addr: 8, width: 1, value: 7 },
      ] },
      { id: 'observed', op: 'load', dst: 'v', addr: 8, width: 1 },
      { id: 'return', op: 'return', value: r('v') },
    ]));
    const flag = api.temporal_write(t, 0, b(1));
    const initial = api.temporal_write(t, 8, b(7));
    api.temporal_call(t, 'main');
    replace(api, t, flag, b(0));
    const read = api.temporal_inspect(t).trace.find((entry) => entry.key.endsWith('/observed'));
    assert.equal(read.value, 7n);
    assert.equal(read.reads[0].source, `write:${initial.id}`, 'Equal numeric load must refresh its producer');
  },
  unchangedStore(api) {
    const t = api.temporal_create(functionProgram([
      { id: 'effect', op: 'store', addr: 8, width: 1, value: 9 },
      { id: 'return', op: 'return', value: 0 },
    ]));
    api.temporal_call(t, 'main');
    api.temporal_repair(api.temporal_edit(t));
    assert.equal(api.temporal_inspect(t).memory[8], 9, 'A reused store still has a historical effect');
  },
  removedStore(api) {
    const t = api.temporal_create(functionProgram([
      { id: 'condition', op: 'load', dst: 'flag', addr: 0, width: 1 },
      { id: 'branch', op: 'if', cond: r('flag'), then: [
        { id: 'effect', op: 'store', addr: 8, width: 1, value: 9 },
      ] },
      { id: 'return', op: 'return', value: 0 },
    ]));
    const flag = api.temporal_write(t, 0, b(1));
    api.temporal_call(t, 'main');
    replace(api, t, flag, b(0));
    assert.equal(api.temporal_inspect(t).memory[8], 0, 'Removed branch cannot leave an old store in present-day memory');
  },
  calleeEffects(api) {
    const t = api.temporal_create(functionProgram([
      { id: 'call', op: 'call', dst: 'ignored', fn: 'child', args: [] },
      { id: 'return', op: 'return', value: 0 },
    ], { child: { params: [], body: [
      { id: 'read', op: 'load', dst: 'input', addr: 0, width: 1 },
      { id: 'effect', op: 'store', addr: 8, width: 1, value: r('input') },
      { id: 'return', op: 'return', value: 0 },
    ] } }));
    const input = api.temporal_write(t, 0, b(5));
    api.temporal_call(t, 'main');
    replace(api, t, input, b(9));
    assert.equal(api.temporal_inspect(t).memory[8], 9, 'Identical call arguments/return do not prove identical memory effects');
  },
  orphan(api) {
    const t = api.temporal_create(functionProgram([
      { id: 'condition', op: 'load', dst: 'flag', addr: 0, width: 1 },
      { id: 'branch', op: 'if', cond: r('flag'), then: [
        { id: 'gap', op: 'mark', label: 'gap' },
      ] },
      { id: 'return', op: 'return', value: 0 },
    ]));
    const flag = api.temporal_write(t, 0, b(1));
    api.temporal_call(t, 'main');
    let edit = api.temporal_edit(t);
    api.temporal_store_at(edit, api.temporal_points(t)[0], 8, b(7));
    api.temporal_repair(edit);
    const old = api.temporal_inspect(t);
    edit = api.temporal_edit(t); api.temporal_replace(edit, flag, b(0));
    assert.throws(() => api.temporal_repair(edit), (error) => error.code === 'ORPHANED_POINT',
      'Missing committed intervention must reject, not silently disappear');
    assert.deepEqual(api.temporal_inspect(t), old, 'Failure must leave old revision intact');
  },
  stalePoint(api) {
    const t = api.temporal_create(functionProgram([{ id: 'gap', op: 'mark', label: 'gap' }]));
    api.temporal_call(t, 'main');
    const old = api.temporal_points(t)[0];
    api.temporal_repair(api.temporal_edit(t));
    const edit = api.temporal_edit(t);
    assert.throws(() => api.temporal_store_at(edit, old, 0, b(1)),
      (error) => error.code === 'INVALID_POINT', 'Stale public point must not silently retarget');
    api.temporal_cancel(edit);
  },
  eventIdentity(api) {
    const t = api.temporal_create(loadReturn);
    api.temporal_write(t, 0, b(3)); api.temporal_call(t, 'main');
    const later = api.temporal_write(t, 0, b(9)); api.temporal_call(t, 'main');
    replace(api, t, later, b(11));
    assert.deepEqual([...api.temporal_inspect(t).results.values()], [3n, 11n],
      'Replacing a write event must not replace another event at the same address');
  },
  bufferCopy(api) {
    const buffer = Buffer.from([1]);
    const t = api.temporal_create({ functions: {} }, { initialMemory: buffer });
    buffer[0] = 99;
    assert.equal(api.temporal_inspect(t).memory[0], 1, 'Buffer slicing must not expose a write alias into published memory');
  },
  argumentCopy(api) {
    class Sticky extends Array { map() { return this; } }
    const t = api.temporal_create({ functions: { main: { params: ['p', 'out'], body: [
      { id: 'read', op: 'load', dst: 'v', addr: r('p'), width: 1 },
      { id: 'write', op: 'store', addr: r('out'), width: 1, value: r('v') },
      { id: 'return', op: 'return', value: r('v') },
    ] } } });
    const input = api.temporal_write(t, 4, b(7));
    const args = new Sticky(4n, 8n);
    api.temporal_call(t, 'main', args);
    args[0] = 0n; args[1] = 9n;
    replace(api, t, input, b(8));
    assert.equal(viewResult(api, t), 8n, 'Caller-owned argument array must not change historical pointer operands');
    assert.deepEqual([...api.temporal_inspect(t).memory.slice(8, 10)], [8, 0]);
  },
};

function modify(text, before, after) {
  assert.equal(text.split(before).length - 1, 1, `Mutation site must be unique: ${before}`);
  return text.replace(before, after);
}
const mutations = [
  { name: 'ignore changed historical bytes', check: 'changedRead', edits: [
    ['result(entry, [addr, ins.width, ...bytes]', 'result(entry, [addr, ins.width]'],
  ] },
  { name: 'track only first byte of a wide load', check: 'overlap', edits: [
    ['result(entry, [addr, ins.width, ...bytes]', 'result(entry, [addr, ins.width, bytes[0]]'],
  ] },
  { name: 'retain old producer when decoded value is equal', check: 'producer', edits: [
    ['cache.set(entry.key, { op: entry.op, args, value });',
      "if (entry.op === 'load' && old?.value === value) entry.reads = old.reads;\n    cache.set(entry.key, { op: entry.op, args, value, reads: entry.reads });"],
  ] },
  { name: 'omit cached store effect', check: 'unchangedStore', edits: [
    ['put(entry, addr, bytes);', 'if (!previousCache.has(entry.key)) put(entry, addr, bytes);'],
  ] },
  { name: 'start repair from old present-day memory', check: 'removedStore', edits: [
    ['const memory = history.initial.slice();', 'const memory = previousCache.lastMemory?.slice() ?? history.initial.slice();'],
    ['return { memory, sources, trace, marks, results, stats, cache };',
      'cache.lastMemory = memory.slice();\n  return { memory, sources, trace, marks, results, stats, cache };'],
  ] },
  { name: 'memoize whole call without checking callee memory', check: 'calleeEffects', edits: [
    ['const value = yield { name, args, prefix: `${key}@${name}`, depth: depth + 1 };',
      'const value = previousCache.has(key) ? previousCache.get(key).value : (yield { name, args, prefix: `${key}@${name}`, depth: depth + 1 });'],
  ] },
  { name: 'silently discard orphaned intervention', check: 'orphan', edits: [
    ["requireThat(encountered.size === history.patches.length, 'ORPHANED_POINT', 'An intervention mark no longer executes');",
      '// Deliberately omit required-anchor validation.'],
  ] },
  { name: 'accept stale public point', check: 'stalePoint', edits: [
    ['info.revision === state.revision', 'true'],
  ] },
  { name: 'replace first write at address instead of identified event', check: 'eventIdentity', edits: [
    ['.find((event) => event.id === info.id);',
      ".find((event, _, all) => event.kind === 'write' && event.addr === all.find((other) => other.id === info.id)?.addr);"],
  ] },
  { name: 'restore actual Buffer alias defect', check: 'bufferCopy', edits: [
    ['return new Uint8Array(bytes);', 'return bytes.slice();'],
  ] },
  { name: 'restore actual host argument-array alias defect', check: 'argumentCopy', edits: [
    ['const capturedArgs = [];\n  const count = args.length;\n  for (let i = 0; i < count; i += 1) capturedArgs.push(integer(args[i]));',
      'const capturedArgs = args.map(integer);'],
  ] },
];

const results = [];
for (const mutation of mutations) {
  cases[mutation.check](correct); // Every counterexample must accept the real implementation.
  let variant = source;
  for (const [before, after] of mutation.edits) variant = modify(variant, before, after);
  // Syntax/import failures are not counted as detected semantic defects.
  const mutant = await import(`data:text/javascript;base64,${Buffer.from(variant).toString('base64')}`);
  let detected;
  try { cases[mutation.check](mutant); }
  catch (error) {
    assert(error instanceof assert.AssertionError, `Unexpected test failure: ${error.stack}`);
    detected = error.message.split('\n')[0];
  }
  assert(detected, `SURVIVING MUTANT: ${mutation.name}`);
  results.push({ mutation: mutation.name, status: 'DETECTED', counterexample: detected });
}

// Attack the genuine selective dirty-queue implementation too, not merely the
// conservative API scanner: drop its actual load-notification enqueue operation.
const fixed = await readFile(new URL('./temporal-memory-validation.mjs', import.meta.url), 'utf8');
const brokenQueue = modify(fixed, 'this.enqueue(readers[at]);', '// Intentionally drop a memory-reader dependency.');
let missedReadDetected;
try { await import(`data:text/javascript;base64,${Buffer.from(brokenQueue).toString('base64')}`); }
catch (error) {
  assert(error instanceof assert.AssertionError, `Unexpected dirty-queue test failure: ${error.stack}`);
  missedReadDetected = error.message.split('\n')[0];
}
assert(missedReadDetected, 'SURVIVING MUTANT: dropped historical read notification');
results.push({ mutation: 'drop actual memory-read notification in selective scheduler',
  status: 'DETECTED', counterexample: missedReadDetected });

// The reduced typed surface must preserve the same guarantees while hiding
// byte widths and explicit history parameters from application code.
const typedCorrect = await import('./temporal-minimal-api.mjs');
const typedSource = (await readFile(new URL('./temporal-minimal-api.mjs', import.meta.url), 'utf8'))
  .replace("'./temporal-api-model.mjs'", JSON.stringify(new URL('./temporal-api-model.mjs', import.meta.url).href));
const typedMutations = [
  {
    name: 'remove implicit-context edit ownership check',
    before: "if (!edits.has(edit)) reject('INVALID_EDIT', 'Wrong-owner or forged edit handle');",
    after: '// Incorrectly allow a foreign edit to control another history.',
    check(module) {
      const a = module.createValidationHarness({ functions: {} });
      const b = module.createValidationHarness({ functions: {} });
      const edit = b.api.temporal_edit();
      assert.throws(() => a.api.temporal_repair(edit), (error) => error.code === 'INVALID_EDIT',
        'Implicit history must not allow a foreign edit to publish a different history');
      b.api.temporal_cancel(edit);
    },
  },
  {
    name: 'ignore destination type when choosing write width',
    before: 'const width = TYPES[type];', after: 'const width = 8;',
    check(module) {
      const h = module.createValidationHarness({ functions: {} },
        { initialMemory: new Uint8Array(16).fill(0xaa) });
      h.api.temporal_write(h.location(0, 'u8'), 7);
      assert.deepEqual([...h.inspect().memory.slice(0, 4)], [7, 0xaa, 0xaa, 0xaa],
        'Compiler-known destination type determines written bytes; neighboring aliases must be preserved');
    },
  },
  {
    name: 'copy pointee bytes instead of a pointer-valued source',
    before: 'integer = BigInt(pointee.address);',
    after: 'integer = BigInt(kernel.temporal_inspect(history).memory[pointee.address]);',
    check(module) {
      const initial = new Uint8Array(32); initial[16] = 7;
      const h = module.createValidationHarness({ functions: {} }, { initialMemory: initial });
      h.api.temporal_write(h.location(0, 'ptr'), h.location(16, 'u8'));
      assert.equal(h.inspect().memory[0], 16, 'A pointer payload is the address value, not a pointee snapshot');
    },
  },
];
for (const mutation of typedMutations) {
  mutation.check(typedCorrect);
  const variant = modify(typedSource, mutation.before, mutation.after);
  const mutant = await import(`data:text/javascript;base64,${Buffer.from(variant).toString('base64')}`);
  let detected;
  try { mutation.check(mutant); }
  catch (error) {
    assert(error instanceof assert.AssertionError, `Unexpected typed mutation failure: ${error.stack}`);
    detected = error.message.split('\n')[0];
  }
  assert(detected, `SURVIVING MUTANT: ${mutation.name}`);
  results.push({ mutation: mutation.name, status: 'DETECTED', counterexample: detected });
}

console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-api-mutations',
  detectedMutations: results.length, survivingMutations: 0,
  meaning: 'Each test accepts the correct model and rejects its specified semantic defect. This is not exhaustive mutation coverage.',
  results }, null, 2));
