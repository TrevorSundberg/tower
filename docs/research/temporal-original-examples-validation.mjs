/**
 * Executable translations of docs/temporal-opcode.md through the minimal typed API.
 * Run: node docs/research/temporal-original-examples-validation.mjs
 *
 * All memory operands are u32, with m[i] at byte address 4*i. Intermediates fit
 * u32, so the diagnostic's u64 register arithmetic agrees with these examples.
 * The independent oracle receives its own initial bytes and input/patch data.
 * Cache counts describe reusable results, not skipped trace traversal: this
 * model scans instructions and reconstructs effects. No native-speed claim.
 */
import assert from 'node:assert/strict';
import { createValidationHarness } from './temporal-minimal-api.mjs';
import { referenceRun } from './temporal-api-reference.mjs';

const r = (reg) => ({ reg });
const load = (id, index) => ({ id, op: 'load', dst: id, addr: 4 * index, width: 4 });
const add = (id, a, b) => ({ id, op: 'add', dst: id, a: r(a), b: r(b) });
const mul = (id, a, b) => ({ id, op: 'mul', dst: id, a: r(a), b: r(b) });
const mark = (label) => ({ id: label, op: 'mark', label });
const storeResult = (result, address = 32) => ({ id: 'output', op: 'store', addr: address, width: 4, value: r(result) });
const returnResult = (result) => ({ id: 'return', op: 'return', value: r(result) });
const program = (body) => ({ functions: { calculate: { params: [], body } } });
const prefix = () => [load('a', 0), load('b', 1), add('c', 'a', 'b')];
const totals = { oracleComparisons: 0, successfulRepairs: 0, cases: 0 };
const cases = [];

// Independent integer-to-byte conversion, not imported from the typed facade.
function bytes32(value) {
  let n = BigInt(value);
  assert(n >= 0n && n <= 0xffffffffn);
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i += 1) { bytes[i] = Number(n % 256n); n /= 256n; }
  return bytes;
}

function read32(memory, address) {
  let n = 0n;
  for (let i = 3; i >= 0; i -= 1) n = n * 256n + BigInt(memory[address + i]);
  return n;
}

class Example {
  constructor(name, code, initial) {
    this.name = name;
    this.code = structuredClone(code);
    const bytes = new Uint8Array(64);
    initial.forEach((value, index) => bytes.set(bytes32(value), 4 * index));
    this.oracle = { initial: bytes.slice(), events: [], patches: [], maxSteps: 100000, maxDepth: 128 };
    this.h = createValidationHarness(code, { initialMemory: bytes.slice() });
    this.api = this.h.api;
    this.verify('creation');
  }

  verify(stage) {
    const expected = referenceRun(this.code, this.oracle);
    const actual = this.h.inspect();
    for (const field of ['memory', 'sources', 'trace', 'marks', 'results']) {
      assert.deepEqual(actual[field], expected[field], `${this.name}/${stage}: ${field}`);
    }
    totals.oracleComparisons += 1;
    return actual;
  }

  write(index, value) {
    const captured = bytes32(value);
    const event = this.api.temporal_write(this.h.location(4 * index, 'u32'), value);
    this.oracle.events.push({ kind: 'write', id: event.id, addr: 4 * index, bytes: captured });
    this.verify('input');
    return event;
  }

  run(fn = 'calculate', args = []) {
    const previous = new Set(this.oracle.events.map((event) => event.id));
    const value = this.h.run(fn, args);
    const id = [...this.h.inspect().results.keys()].find((key) => !previous.has(key));
    assert(id, 'Compiler/runtime invocation must have a unique result identity');
    this.oracle.events.push({ kind: 'call', id, fn, args: args.map(BigInt) });
    assert.equal(this.verify('ordinary execution').results.get(id), value);
    return { id, value, fn };
  }

  begin() {
    this.edit = this.api.temporal_edit();
    this.candidate = structuredClone(this.oracle);
    this.beforeEdit = this.h.inspect();
  }

  replace(event, value) {
    const captured = bytes32(value);
    this.api.temporal_replace(this.edit, event, value);
    const target = [...this.candidate.events, ...this.candidate.patches].find((item) => item.id === event.id);
    assert(target);
    target.bytes = captured;
    assert.deepEqual(this.h.inspect(), this.beforeEdit, 'Staging must not publish a partial correction');
  }

  insert(label, index, value) {
    const captured = bytes32(value);
    const point = this.h.points(label)[0];
    assert(point, `Expected executed marker ${label}`);
    const event = this.api.temporal_store_at(this.edit, point, this.h.location(4 * index, 'u32'), value);
    this.candidate.patches.push({ kind: 'write', id: event.id, at: point.key, addr: 4 * index, bytes: captured });
    assert.deepEqual(this.h.inspect(), this.beforeEdit, 'Staged insertion must not publish');
    return event;
  }

  repair() {
    const expected = referenceRun(this.code, this.candidate);
    this.stats = this.api.temporal_repair(this.edit);
    this.oracle = this.candidate;
    this.candidate = null;
    this.edit = null;
    totals.successfulRepairs += 1;
    const actual = this.verify('repair');
    for (const field of ['memory', 'sources', 'trace', 'marks', 'results']) {
      assert.deepEqual(actual[field], expected[field], `${this.name}: precomputed candidate ${field}`);
    }
    totals.oracleComparisons += 1;
    return actual;
  }

  entry(invocation, instruction) {
    const key = `${invocation.id}/${invocation.fn}/${instruction}`;
    const entry = this.h.inspect().trace.find((item) => item.key === key);
    assert(entry, `Expected instruction ${key}`);
    return entry;
  }

  cached(invocation, instruction, expectedHit) {
    const entry = this.entry(invocation, instruction);
    assert.equal(this.stats.cacheMissKeys.includes(entry.key), !expectedHit,
      `${this.name}: ${instruction} expected cache ${expectedHit ? 'hit' : 'miss'}`);
  }

  finish(values) {
    cases.push({ name: this.name, finalValues: values, counters: this.stats });
    totals.cases += 1;
    this.h.destroy();
  }
}

// 1. Reads / Loads: the input revision changes d and its multiplication only.
{
  const h = new Example('Reads / Loads: 72 -> 48', program([
    ...prefix(), load('d', 2), mul('e', 'c', 'd'), storeResult('e'), returnResult('e'),
  ]), [3, 5, 9]);
  const input = h.write(2, 9);
  const call = h.run();
  assert.equal(call.value, 72n);
  h.begin(); h.replace(input, 6); const final = h.repair();
  assert.equal(read32(final.memory, 32), 48n);
  assert.equal(final.results.get(call.id), 48n);
  for (const id of ['a', 'b', 'c']) h.cached(call, id, true);
  for (const id of ['d', 'e']) h.cached(call, id, false);
  assert(h.entry(call, 'd').reads.every((read) => read.source === `write:${input.id}`));
  h.finish({ m2: read32(final.memory, 8), output: read32(final.memory, 32) });
}

// 2. Writes / Stores: an ordinary blind store masks the corrected earlier input.
{
  const h = new Example('Writes / Stores: preceding input is masked, 72 -> 72', program([
    ...prefix(), { id: 'overwrite', op: 'store', addr: 8, width: 4, value: 9 },
    load('d', 2), mul('e', 'c', 'd'), storeResult('e'), returnResult('e'),
  ]), [3, 5, 2]);
  const input = h.write(2, 2);
  const call = h.run();
  assert.equal(call.value, 72n);
  h.begin(); h.replace(input, 6); const final = h.repair();
  assert.equal(read32(final.memory, 8), 9n);
  assert.equal(read32(final.memory, 32), 72n);
  for (const id of ['a', 'b', 'c', 'overwrite', 'd', 'e', 'output', 'return']) h.cached(call, id, true);
  assert.deepEqual(h.stats.cacheMissKeys, [`write:${input.id}`]);
  const source = h.entry(call, 'overwrite').key;
  assert(h.entry(call, 'd').reads.every((read) => read.source === source));
  h.finish({ m2: read32(final.memory, 8), output: read32(final.memory, 32) });
}

// 3. Rewinding & Modification: insert a memory write after c, before d and e.
{
  const h = new Example('Rewinding & Modification: 80 -> 88, unrelated load d is reusable', program([
    ...prefix(), mark('after_sum'), load('d', 2), load('e', 3), add('f', 'd', 'e'),
    mul('g', 'c', 'f'), storeResult('g'), returnResult('g'),
  ]), [3, 5, 9, 1]);
  const call = h.run();
  assert.equal(call.value, 80n);
  const oldD = h.entry(call, 'd');
  h.begin(); const patch = h.insert('after_sum', 3, 2); const final = h.repair();
  assert.equal(read32(final.memory, 32), 88n);
  assert.deepEqual(h.entry(call, 'd'), oldD);
  for (const id of ['a', 'b', 'c', 'd']) h.cached(call, id, true);
  for (const id of ['e', 'f', 'g']) h.cached(call, id, false);
  assert(h.entry(call, 'e').reads.every((read) => read.source === `write:${patch.id}`));
  h.finish({ m3: read32(final.memory, 12), d: h.entry(call, 'd').value, output: read32(final.memory, 32) });
}

// 4. Independence: the separate m[4]+m[5] subtree remains reusable.
{
  const h = new Example('Independence: 800 -> 880, separate sum remains 10', program([
    ...prefix(), mark('after_sum'), load('d', 2), load('e', 3), add('f', 'd', 'e'),
    load('h', 4), load('i', 5), add('j', 'h', 'i'), mul('k', 'c', 'f'),
    mul('product', 'k', 'j'), storeResult('product'), returnResult('product'),
  ]), [3, 5, 9, 1, 3, 7]);
  const call = h.run();
  assert.equal(call.value, 800n);
  const oldJ = h.entry(call, 'j');
  h.begin(); h.insert('after_sum', 3, 2); const final = h.repair();
  assert.equal(read32(final.memory, 32), 880n);
  assert.equal(h.entry(call, 'j').value, 10n);
  assert.deepEqual(h.entry(call, 'j'), oldJ);
  for (const id of ['a', 'b', 'c', 'd', 'h', 'i', 'j']) h.cached(call, id, true);
  for (const id of ['e', 'f', 'k', 'product']) h.cached(call, id, false);
  h.finish({ m3: read32(final.memory, 12), independentSum: h.entry(call, 'j').value,
    output: read32(final.memory, 32) });
}

// 5. Time Point Merging / Equivalence: one batch swaps the two input values.
{
  const h = new Example('Time Point Merging / Equivalence: batch swap preserves c and output', program([
    ...prefix(), load('d', 2), load('e', 3), add('f', 'd', 'e'),
    mul('g', 'c', 'f'), storeResult('g'), returnResult('g'),
  ]), [3, 5, 9, 1]);
  const inputA = h.write(0, 3);
  const inputB = h.write(1, 5);
  const call = h.run();
  assert.equal(call.value, 80n);
  h.begin(); h.replace(inputA, 5); h.replace(inputB, 3); const final = h.repair();
  assert.equal(read32(final.memory, 0), 5n);
  assert.equal(read32(final.memory, 4), 3n);
  assert.equal(h.entry(call, 'c').value, 8n);
  assert.equal(read32(final.memory, 32), 80n);
  for (const id of ['a', 'b', 'c']) h.cached(call, id, false);
  for (const id of ['d', 'e', 'f', 'g', 'output', 'return']) h.cached(call, id, true);
  h.finish({ m0: read32(final.memory, 0), m1: read32(final.memory, 4), c: h.entry(call, 'c').value,
    output: read32(final.memory, 32) });
}

// 6. Adversarial timing: a write after e's load cannot rewrite its SSA temporary.
{
  const h = new Example('Adversarial insertion after load: current m3 becomes 2, output stays 80', program([
    ...prefix(), load('d', 2), load('e', 3), mark('after_load'), add('f', 'd', 'e'),
    mul('g', 'c', 'f'), storeResult('g'), returnResult('g'),
  ]), [3, 5, 9, 1]);
  const call = h.run();
  assert.equal(call.value, 80n);
  const oldE = h.entry(call, 'e');
  h.begin(); const patch = h.insert('after_load', 3, 2); const final = h.repair();
  assert.equal(read32(final.memory, 12), 2n);
  assert.equal(read32(final.memory, 32), 80n);
  assert.equal(h.entry(call, 'e').value, 1n);
  assert.deepEqual(h.entry(call, 'e'), oldE);
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'output', 'return']) h.cached(call, id, true);
  assert.deepEqual(h.stats.cacheMissKeys, [`write:${patch.id}`]);
  h.finish({ m3: read32(final.memory, 12), loadedE: h.entry(call, 'e').value, output: read32(final.memory, 32) });
}

// 7. Adversarial event identity: two input writes to one address are distinct.
{
  const code = program([
    ...prefix(), load('d', 2), mul('e', 'c', 'd'), returnResult('e'),
  ]);
  // Models the ordinary caller assignment `first_result = calculate()`:
  // return dependencies cross a regular call, then a regular store captures
  // the result in tracked memory. No source-visible temporal_call is needed.
  code.functions.capture = { params: ['output_address'], body: [
    { id: 'call', op: 'call', fn: 'calculate', args: [], dst: 'value' },
    { id: 'output', op: 'store', addr: r('output_address'), width: 4, value: r('value') },
    returnResult('value'),
  ] };
  const h = new Example('Adversarial event identity: first correction does not replace later same-address input', code, [3, 5, 0]);
  const first = h.write(2, 9);
  const callA = h.run('capture', [32]);
  const second = h.write(2, 6);
  const callB = h.run('capture', [36]);
  const calleeA = { ...callA, fn: 'capture/call@calculate' };
  const calleeB = { ...callB, fn: 'capture/call@calculate' };
  assert.notEqual(first.id, second.id);
  assert.equal(callA.value, 72n);
  assert.equal(callB.value, 48n);
  assert.equal(read32(h.h.inspect().memory, 32), 72n);
  assert.equal(read32(h.h.inspect().memory, 36), 48n);
  h.begin(); h.replace(first, 3); const final = h.repair();
  assert.equal(read32(final.memory, 8), 6n);
  assert.equal(read32(final.memory, 32), 24n);
  assert.equal(read32(final.memory, 36), 48n);
  assert.equal(final.results.get(callA.id), 24n);
  assert.equal(final.results.get(callB.id), 48n);
  assert(h.entry(calleeA, 'd').reads.every((read) => read.source === `write:${first.id}`));
  assert(h.entry(calleeB, 'd').reads.every((read) => read.source === `write:${second.id}`));
  for (const id of ['d', 'e']) h.cached(calleeA, id, false);
  for (const id of ['a', 'b', 'c', 'd', 'e', 'return']) h.cached(calleeB, id, true);
  for (const id of ['call', 'output', 'return']) {
    h.cached(callA, id, false);
    h.cached(callB, id, true);
  }
  h.finish({ m2: read32(final.memory, 8), firstOutput: read32(final.memory, 32), secondOutput: read32(final.memory, 36) });
}

console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-original-examples-validation', cases, totals,
  assertions: 'Full byte memory, byte-source identities, instruction trace, marks and invocation results match independent forward replay.',
  limits: 'Seven bounded nonoverflowing examples; no native lowering, speed claim or formal proof. Cache reuse does not skip this model full trace scan.',
}, (_, value) => typeof value === 'bigint' ? Number(value) : value, 2));
