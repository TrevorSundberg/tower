/** Differential checks with an independently implemented full replay oracle.
 * Run: node docs/research/temporal-api-validation.mjs
 * This is bounded validation, not a native benchmark or a mechanized proof.
 */
import assert from 'node:assert/strict';
import * as api from './temporal-api-model.mjs';
import { referenceRun } from './temporal-api-reference.mjs';

const r = (reg) => ({ reg });
const bytes = (...values) => Uint8Array.from(values);
const clone = (x) => structuredClone(x);
const totals = { comparisons: 0, successfulRepairs: 0, rejectedRepairs: 0,
  visitedInstructionsOnRepair: 0, cachedResultsOnRepair: 0 };

class Harness {
  constructor(program, initial = new Uint8Array(96), options = {}) {
    this.program = clone(program);
    this.history = { initial: initial.slice(), events: [], patches: [],
      maxSteps: options.maxSteps ?? 100000, maxDepth: options.maxDepth ?? 128 };
    this.t = api.temporal_create(program, { initialMemory: initial, ...options });
    this.verify('creation');
  }
  verify(label) {
    const expected = referenceRun(this.program, this.history);
    const actual = api.temporal_inspect(this.t);
    for (const key of ['memory', 'sources', 'trace', 'marks', 'results']) {
      assert.deepEqual(actual[key], expected[key], `${label}: ${key}`);
    }
    totals.comparisons += 1;
    return actual;
  }
  write(addr, data) {
    const captured = data.slice();
    const handle = api.temporal_write(this.t, addr, data);
    this.history.events.push({ kind: 'write', id: handle.id, addr, bytes: captured });
    this.verify('append write');
    return handle;
  }
  call(fn, args = []) {
    const previous = new Set(this.history.events.map((event) => event.id));
    const result = api.temporal_call(this.t, fn, args);
    // Identity is opaque, but all arguments/payloads remain our own input data.
    const id = [...api.temporal_inspect(this.t).results.keys()].find((key) => !previous.has(key));
    assert(id);
    this.history.events.push({ kind: 'call', id, fn, args: args.map(BigInt) });
    assert.equal(this.verify('append call').results.get(id), result);
    return result;
  }
  begin() { this.edit = api.temporal_edit(this.t); this.candidate = clone(this.history); }
  replace(handle, data) {
    const captured = data.slice();
    api.temporal_replace(this.edit, handle, data);
    const event = [...this.candidate.events, ...this.candidate.patches].find((e) => e.id === handle.id);
    assert(event);
    event.bytes = captured;
  }
  insert(point, addr, data) {
    const captured = data.slice();
    const handle = api.temporal_store_at(this.edit, point, addr, data);
    this.candidate.patches.push({ kind: 'write', id: handle.id, at: point.key, addr, bytes: captured });
    return handle;
  }
  remove(handle) {
    api.temporal_remove(this.edit, handle);
    this.candidate.events = this.candidate.events.filter((event) => event.id !== handle.id);
    this.candidate.patches = this.candidate.patches.filter((event) => event.id !== handle.id);
  }
  repair() {
    const published = api.temporal_inspect(this.t);
    let failure;
    try { referenceRun(this.program, this.candidate); } catch (error) { failure = error; }
    if (failure) {
      assert.throws(() => api.temporal_repair(this.edit), (error) => error.code === failure.code,
        `Reference rejected ${failure.code}; model must agree`);
      assert.deepEqual(api.temporal_inspect(this.t), published, 'Failed repair changed published state');
      totals.rejectedRepairs += 1;
    } else {
      const stats = api.temporal_repair(this.edit);
      this.history = this.candidate;
      totals.successfulRepairs += 1;
      totals.visitedInstructionsOnRepair += stats.visitedInstructions;
      totals.cachedResultsOnRepair += stats.resultCacheHits;
    }
    this.verify(failure ? `rejected ${failure.code}` : 'successful repair');
    return failure?.code ?? null;
  }
}

function dynamicProgram(salt = 0) {
  const mask = (salt * 17 + 3) & 255;
  return { functions: {
    main: { params: [], body: [
      { id: 'start', op: 'mark', label: 'start' },
      { id: 'flag', op: 'load', dst: 'flag', addr: 0, width: 1 },
      { id: 'count', op: 'load', dst: 'count', addr: 1, width: 1 },
      { id: 'boundCount', op: 'and', dst: 'count', a: r('count'), b: 3 },
      { id: 'pointer', op: 'load', dst: 'pointer', addr: 2, width: 1 },
      { id: 'boundPointer', op: 'and', dst: 'pointer', a: r('pointer'), b: 7 },
      { id: 'offsetPointer', op: 'add', dst: 'pointer', a: r('pointer'), b: 16 },
      { id: 'data', op: 'load', dst: 'data', addr: 3, width: 1 },
      { id: 'target', op: 'load', dst: 'target', addr: 4, width: 1 },
      { id: 'boundTarget', op: 'and', dst: 'target', a: r('target'), b: 1 },
      { id: 'offsetTarget', op: 'add', dst: 'target', a: r('target'), b: 1 },
      { id: 'branch', op: 'if', cond: r('flag'), then: [
        { id: 'inside', op: 'mark', label: 'inside' },
        { id: 'invoke', op: 'call', dst: 'answer', fn: r('target'), args: [r('pointer'), r('data')] },
      ], else: [
        { id: 'blind', op: 'store', addr: 18, width: 2, value: mask },
      ] },
      { id: 'middle', op: 'mark', label: 'middle' },
      { id: 'sum0', op: 'const', dst: 'sum', value: 0 },
      { id: 'loop', op: 'repeat', count: r('count'), index: 'i', body: [
        { id: 'loopMark', op: 'mark', label: 'iteration' },
        { id: 'address', op: 'add', dst: 'address', a: r('pointer'), b: r('i') },
        { id: 'outAddress', op: 'add', dst: 'outAddress', a: r('i'), b: 40 },
        { id: 'leafCall', op: 'call', dst: 'part', fn: 'leaf', args: [r('address'), r('outAddress')] },
        { id: 'sum', op: 'add', dst: 'sum', a: r('sum'), b: r('part') },
      ] },
      { id: 'wide', op: 'load', dst: 'wide', addr: 16, width: 8 },
      { id: 'mix', op: 'xor', dst: 'mix', a: r('sum'), b: r('wide') },
      { id: 'out', op: 'store', addr: 64, width: 8, value: r('mix') },
      { id: 'end', op: 'return', value: r('mix') },
    ] },
    '1': { params: ['p', 'v'], body: [
      { id: 'write', op: 'store', addr: r('p'), width: 2, value: r('v') },
      { id: 'return', op: 'return', value: 0 },
    ] },
    '2': { params: ['p', 'v'], body: [
      { id: 'next', op: 'add', dst: 'q', a: r('p'), b: 1 },
      { id: 'mix', op: 'xor', dst: 'v', a: r('v'), b: mask },
      { id: 'write', op: 'store', addr: r('q'), width: 1, value: r('v') },
      { id: 'return', op: 'return', value: 0 },
    ] },
    leaf: { params: ['p', 'out'], body: [
      { id: 'read', op: 'load', dst: 'value', addr: r('p'), width: 2 },
      { id: 'write', op: 'store', addr: r('out'), width: 1, value: r('value') },
      { id: 'return', op: 'return', value: r('value') },
    ] },
  } };
}

function originalExamples() {
  const program = { functions: { main: { params: [], body: [
    { id: 'a', op: 'load', dst: 'a', addr: 0, width: 4 },
    { id: 'b', op: 'load', dst: 'b', addr: 4, width: 4 },
    { id: 'c', op: 'add', dst: 'c', a: r('a'), b: r('b') },
    { id: 'gap', op: 'mark', label: 'after-sum' },
    { id: 'd', op: 'load', dst: 'd', addr: 8, width: 4 },
    { id: 'e', op: 'load', dst: 'e', addr: 12, width: 4 },
    { id: 'f', op: 'add', dst: 'f', a: r('d'), b: r('e') },
    { id: 'g', op: 'mul', dst: 'g', a: r('c'), b: r('f') },
    { id: 'output', op: 'store', addr: 16, width: 4, value: r('g') },
    { id: 'done', op: 'return', value: r('g') },
  ] } } };
  const input = bytes(3, 0, 0, 0, 5, 0, 0, 0, 9, 0, 0, 0, 1, 0, 0, 0);
  const h = new Harness(program, new Uint8Array(32));
  const w = h.write(0, input);
  const first = h.call('main');
  assert.equal(first, 80n);
  h.begin();
  const point = api.temporal_points(h.t, 'after-sum')[0];
  const inserted = h.insert(point, 12, bytes(2, 0, 0, 0));
  h.repair();
  assert.equal([...h.verify('80 becomes 88').results.values()][0], 88n);
  assert.equal(first, 80n, 'Previously returned host scalar is a copy');
  h.begin(); h.remove(inserted); h.repair();
  h.begin();
  const swapped = input.slice(); swapped[0] = 5; swapped[4] = 3;
  h.replace(w, swapped); h.repair();
  const observed = h.verify('equal sum stops result recomputation');
  assert.equal([...observed.results.values()][0], 80n);
  assert(!observed.stats.cacheMissKeys.some((key) => key.endsWith('/g')));
  return { original: 80, historicalInsertion: 88, swappedOperands: 80,
    note: 'Scalar multiply reused; all trace/memory reconstruction work still performed.' };
}

function cLikeInputExample() {
  // Opcode equivalent of the small C-facing input/twice/output example.
  const program = { functions: {
    main: { params: [], body: [
      { id: 'read', op: 'load', dst: 'input', addr: 0, width: 4 },
      { id: 'call', op: 'call', dst: 'answer', fn: 'twice', args: [r('input')] },
      { id: 'write', op: 'store', addr: 4, width: 4, value: r('answer') },
    ] },
    twice: { params: ['x'], body: [
      { id: 'multiply', op: 'mul', dst: 'result', a: r('x'), b: 2 },
      { id: 'return', op: 'return', value: r('result') },
    ] },
  } };
  const h = new Harness(program, new Uint8Array(8));
  const input = h.write(0, bytes(4, 0, 0, 0));
  h.call('main');
  const oldCopy = api.temporal_inspect(h.t).memory[4];
  assert.equal(oldCopy, 8);
  h.begin(); h.replace(input, bytes(7, 0, 0, 0)); h.repair();
  const corrected = h.verify('C-like automatic call coverage').memory;
  assert.deepEqual([...corrected], [7, 0, 0, 0, 14, 0, 0, 0]);
  assert.equal(oldCopy, 8);
  return { input: [4, 7], output: [8, 14], ordinaryCalleeTracked: true,
    caveat: 'Opcode-equivalent example, not a test of an implemented C compiler.' };
}

function exhaustive() {
  const program = dynamicProgram();
  const states = Array.from({ length: 8 }, (_, state) =>
    bytes(state & 1, (state >>> 1) & 3, (state >>> 1) & 1, (state >>> 2) & 1, state & 1));
  let sequences = 0;
  for (let pattern = 0; pattern < 2; pattern += 1) {
    const initial = new Uint8Array(96);
    for (let i = 16; i < 24; i += 1) initial[i] = (i + pattern) & 1;
    for (const first of states) for (const second of states) for (const third of states) {
      const h = new Harness(program, initial);
      const w = h.write(0, first); h.call('main');
      h.begin(); h.replace(w, second); h.repair();
      h.begin(); h.replace(w, third); h.repair();
      sequences += 1;
    }
  }
  return { programs: 1, initialBytePatterns: 2, inputStates: 8, statesPerSequence: 3,
    sequences, caveat: 'Exhaustive only over this specified finite family, not all programs.' };
}

function randomized() {
  const seed = 0x74e4cafe;
  let state = seed;
  const random = (bound) => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) % bound;
  };
  const programs = 16, actions = 120;
  const counts = { replacements: 0, insertions: 0, removals: 0, appends: 0 };
  for (let p = 0; p < programs; p += 1) {
    const initial = Uint8Array.from({ length: 96 }, () => random(256));
    const h = new Harness(dynamicProgram(p), initial);
    const input = h.write(0, bytes(1, 3, 0, 1, 0));
    h.call('main');
    const retained = new Map();
    for (let step = 0; step < actions; step += 1) {
      const kind = random(8);
      if (kind === 7 && counts.appends < 80) {
        h.write(16 + random(8), bytes(random(256)));
        h.call('main'); counts.appends += 1;
        continue;
      }
      h.begin();
      const deleted = [];
      let added;
      if (kind <= 2) {
        h.replace(input, bytes(random(2), random(4), random(8), random(256), random(2)));
        counts.replacements += 1;
      } else if (kind <= 4) {
        const marks = api.temporal_points(h.t);
        const point = marks[random(marks.length)];
        const width = [1, 2, 4, 8][random(4)];
        added = h.insert(point, 16 + random(8), Uint8Array.from({ length: width }, () => random(256)));
        counts.insertions += 1;
      } else if (retained.size) {
        const token = [...retained.values()][random(retained.size)];
        h.remove(token); deleted.push(token.id); counts.removals += 1;
      } else h.replace(input, bytes(1, 3, 0, random(256), 0));
      const error = h.repair();
      if (!error) {
        if (added) retained.set(added.id, added);
        for (const id of deleted) retained.delete(id);
      } else assert.equal(error, 'ORPHANED_POINT');
    }
  }
  return { seed: `0x${seed.toString(16)}`, programs, actionsPerProgram: actions, ...counts };
}

function trapCases() {
  const program = { functions: { main: { params: [], body: [
    { id: 'pointer', op: 'load', dst: 'p', addr: 0, width: 1 },
    { id: 'gap', op: 'mark', label: 'gap' },
    { id: 'read', op: 'load', dst: 'v', addr: r('p'), width: 8 },
    { id: 'result', op: 'return', value: r('v') },
  ] } } };
  const h = new Harness(program, new Uint8Array(32));
  const input = h.write(0, bytes(8)); h.call('main');
  const point = api.temporal_points(h.t)[0];
  h.begin(); h.replace(input, bytes(30));
  assert.equal(h.repair(), 'BOUNDS');
  h.begin(); h.insert(point, 8, bytes(5)); assert.equal(h.repair(), null);
  return ['bounds failure is atomic', 'failed publication preserves old Point generation'];
}

const originals = originalExamples();
const cLikeExample = cLikeInputExample();
const finite = exhaustive();
const random = randomized();
const traps = trapCases();
console.log(JSON.stringify({ status: 'PASS', runtime: process.version,
  correctnessScope: 'Dynamic structured U64 opcodes; raw overlapping byte loads/stores; external event edit API.',
  oracle: 'Independent full interpreter and separately maintained program/input/intervention data.',
  performanceClaim: 'None. This model scans/reconstructs the trace and memory, even on cache hits.',
  originals, cLikeExample, exhaustive: finite, randomized: random, traps, totals }, null, 2));
