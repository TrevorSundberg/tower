/**
 * Correctness experiment: a selectively repaired, integer-addressed memory trace.
 * Run: node docs/research/temporal-memory-validation.mjs
 *
 * This is a fixed instruction universe in a deterministic logical order. Arithmetic
 * uses exact BigInt values; memory addresses are nonnegative safe integers. Loads
 * and stores can compute their addresses. Stores can be enabled/disabled. Register
 * references always point backwards. Initial memory is zero outside supplied cells.
 *
 * The incremental engine has a real ordered dirty queue, register subscribers,
 * per-address ordered stores, and per-address ordered load subscribers. It does
 * not scan the instruction trace to discover dirty instructions. The separate
 * reference and comparison code deliberately do scan/reexecute the whole trace.
 * Ordered per-address lists use arrays, so inserting/removing metadata can shift
 * entries. Selective instruction execution does not imply free bookkeeping.
 *
 * Limits: no insertion of arbitrary instruction instances, general branches/loops,
 * allocation, foreign effects, concurrent execution, byte-overlapping wide loads,
 * LLVM lowering, or machine overflow semantics. Disabled stores model conditional
 * effects, not an entire dynamically skipped branch. Static register subscriptions
 * can conservatively schedule a disabled store whose unused operand changed.
 * This JavaScript diagnostic establishes no native-performance claim.
 */

import assert from 'node:assert/strict';

const ref = (id) => ({ ref: id });
const big = (value) => typeof value === 'bigint' ? value : BigInt(value);
const memory = (entries) => new Map(Object.entries(entries).map(([a, v]) => [Number(a), big(v)]));
const addressOf = (value) => {
  const address = Number(value);
  assert(Number.isSafeInteger(address) && address >= 0 && BigInt(address) === value,
    `Invalid address: ${value}`);
  return address;
};

function lowerBound(values, target) {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (values[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function insertOrdered(values, id) {
  const at = lowerBound(values, id);
  assert(values[at] !== id);
  values.splice(at, 0, id);
}

function removeOrdered(values, id) {
  const at = lowerBound(values, id);
  assert.equal(values[at], id);
  values.splice(at, 1);
}

class MinQueue {
  heap = [];
  push(value) {
    const heap = this.heap;
    let at = heap.length;
    heap.push(value);
    while (at > 0) {
      const parent = (at - 1) >>> 1;
      if (heap[parent] <= value) break;
      heap[at] = heap[parent];
      at = parent;
    }
    heap[at] = value;
  }
  pop() {
    const heap = this.heap;
    const first = heap[0];
    const last = heap.pop();
    if (heap.length === 0) return first;
    let at = 0;
    while (at * 2 + 1 < heap.length) {
      let child = at * 2 + 1;
      if (child + 1 < heap.length && heap[child + 1] < heap[child]) child += 1;
      if (heap[child] >= last) break;
      heap[at] = heap[child];
      at = child;
    }
    heap[at] = last;
    return first;
  }
}

function operands(node) {
  if (node.op === 'load') return [node.addr];
  if (node.op === 'store') return [node.addr, node.value, node.enabled ?? 1];
  return [node.a, node.b];
}

class IncrementalTrace {
  constructor(nodes, initial) {
    this.nodes = nodes;
    this.initial = new Map(initial);
    this.values = Array(nodes.length);
    this.effects = Array(nodes.length).fill(null);
    this.loadSources = Array(nodes.length).fill(null);
    this.registerReaders = nodes.map(() => new Set());
    this.stores = new Map();
    this.readers = new Map();
    this.queue = new MinQueue();
    this.dirty = new Set();
    this.stats = null;
    nodes.forEach((node, id) => {
      assert(['load', 'store', 'add', 'sub', 'mul', 'eq', 'lt'].includes(node.op));
      for (const operand of operands(node)) {
        if (typeof operand === 'object') {
          assert(Number.isInteger(operand.ref) && operand.ref >= 0 && operand.ref < id);
          assert.notEqual(nodes[operand.ref].op, 'store', 'Stores have no consumable register result');
          this.registerReaders[operand.ref].add(id);
        } else big(operand);
      }
    });
    for (let id = 0; id < nodes.length; id += 1) this.evaluate(id);
  }

  list(map, address) {
    if (!map.has(address)) map.set(address, []);
    return map.get(address);
  }

  enqueue(id) {
    if (!this.stats || this.dirty.has(id)) return;
    this.dirty.add(id);
    this.queue.push(id);
    this.stats.enqueued += 1;
  }

  // Only subscribers after this write and before the next overwrite are affected.
  // after = -1 denotes a change to initial memory, before every instruction.
  notifyAddress(address, after) {
    if (!this.stats) return;
    const writers = this.stores.get(address) ?? [];
    const nextAt = lowerBound(writers, after + 1);
    const before = writers[nextAt] ?? Infinity;
    const readers = this.readers.get(address) ?? [];
    for (let at = lowerBound(readers, after + 1); at < readers.length && readers[at] < before; at += 1) {
      this.stats.readerNotifications += 1;
      this.enqueue(readers[at]);
    }
  }

  evaluate(id) {
    const node = this.nodes[id];
    const arg = (value) => typeof value === 'object' ? this.values[value.ref] : big(value);
    let value;
    if (this.stats) {
      this.stats.evaluated.push(id);
      this.stats.byOp[node.op] = (this.stats.byOp[node.op] ?? 0) + 1;
    }
    switch (node.op) {
      case 'load': {
        const address = addressOf(arg(node.addr));
        const previous = this.loadSources[id];
        if (previous?.address !== address) {
          if (previous) removeOrdered(this.list(this.readers, previous.address), id);
          insertOrdered(this.list(this.readers, address), id);
        }
        const writers = this.stores.get(address) ?? [];
        const at = lowerBound(writers, id) - 1;
        const writer = at >= 0 ? writers[at] : -1;
        value = writer >= 0 ? this.effects[writer].value : (this.initial.get(address) ?? 0n);
        // Refresh identity even if the loaded numeric value stays equal.
        this.loadSources[id] = { address, writer };
        break;
      }
      case 'store': {
        const previous = this.effects[id];
        const next = arg(node.enabled ?? 1) === 0n ? null : {
          address: addressOf(arg(node.addr)), value: arg(node.value),
        };
        const changed = previous?.address !== next?.address || previous?.value !== next?.value;
        if (changed) {
          if (previous) removeOrdered(this.list(this.stores, previous.address), id);
          this.effects[id] = next;
          if (next) insertOrdered(this.list(this.stores, next.address), id);
          for (const address of new Set([previous?.address, next?.address])) {
            if (address !== undefined) this.notifyAddress(address, id);
          }
          if (this.stats) this.stats.changedEffects += 1;
        }
        value = 0n; // Store instructions have an effect but no usable register result.
        break;
      }
      case 'add': value = arg(node.a) + arg(node.b); break;
      case 'sub': value = arg(node.a) - arg(node.b); break;
      case 'mul': value = arg(node.a) * arg(node.b); break;
      case 'eq': value = arg(node.a) === arg(node.b) ? 1n : 0n; break;
      case 'lt': value = arg(node.a) < arg(node.b) ? 1n : 0n; break;
      default: throw new Error(`Unsupported operation ${node.op}`);
    }
    const changed = this.values[id] !== value;
    this.values[id] = value;
    if (changed) {
      if (this.stats) this.stats.changedRegisters += 1;
      for (const reader of this.registerReaders[id]) this.enqueue(reader);
    }
  }

  update(changes) {
    assert.equal(this.queue.heap.length, 0);
    this.stats = {
      evaluated: [], byOp: {}, enqueued: 0, readerNotifications: 0,
      changedRegisters: 0, changedEffects: 0,
    };
    for (const [address, raw] of changes) {
      const value = big(raw);
      if ((this.initial.get(address) ?? 0n) === value) continue;
      this.initial.set(address, value);
      this.notifyAddress(address, -1);
    }
    let last = -1;
    while (this.queue.heap.length) {
      const id = this.queue.pop();
      assert(id > last, 'A forward dependency scheduler must not reevaluate an instruction twice');
      last = id;
      this.dirty.delete(id);
      this.evaluate(id);
    }
    const result = this.stats;
    this.stats = null;
    return result;
  }

  finalMemory() {
    const result = new Map(this.initial);
    for (const [address, writers] of this.stores) {
      if (writers.length) result.set(address, this.effects[writers.at(-1)].value);
    }
    return result;
  }
}

// Independent conventional interpreter: one forward pass over mutable memory.
// It does not use histories, subscriptions, the dirty queue, or cached results.
function referenceRun(nodes, initial) {
  const ram = new Map(initial);
  const lastWriter = new Map();
  const values = [];
  const loadSources = [];
  const read = (operand) => typeof operand === 'object' ? values[operand.ref] : BigInt(operand);
  for (let id = 0; id < nodes.length; id += 1) {
    const node = nodes[id];
    loadSources.push(null);
    switch (node.op) {
      case 'load': {
        const address = addressOf(read(node.addr));
        values.push(ram.get(address) ?? 0n);
        loadSources[id] = { address, writer: lastWriter.get(address) ?? -1 };
        break;
      }
      case 'store': {
        if (read(node.enabled ?? 1) !== 0n) {
          const address = addressOf(read(node.addr));
          ram.set(address, read(node.value));
          lastWriter.set(address, id);
        }
        values.push(0n);
        break;
      }
      case 'add': values.push(read(node.a) + read(node.b)); break;
      case 'sub': values.push(read(node.a) - read(node.b)); break;
      case 'mul': values.push(read(node.a) * read(node.b)); break;
      case 'eq': values.push(read(node.a) === read(node.b) ? 1n : 0n); break;
      case 'lt': values.push(read(node.a) < read(node.b) ? 1n : 0n); break;
      default: throw new Error(`Reference cannot execute ${node.op}`);
    }
  }
  return { values, loadSources, ram };
}

const totals = { referenceComparisons: 0, updateBatches: 0, queuedInstructionEvaluations: 0, referenceInstructionEvaluations: 0 };
const referenceInputs = new WeakMap();

// Keep oracle inputs outside the engine so input-application bugs cannot silently
// change the reference's starting state as well as the incremental state.
function createTrace(nodes, initial) {
  const expectedInput = new Map(initial);
  const engine = new IncrementalTrace(nodes, initial);
  referenceInputs.set(engine, expectedInput);
  return engine;
}

function verify(engine, label) {
  const input = referenceInputs.get(engine);
  assert(input, `${label}: missing independent reference inputs`);
  for (const address of new Set([...input.keys(), ...engine.initial.keys()])) {
    assert.equal(engine.initial.get(address) ?? 0n, input.get(address) ?? 0n, `${label}: input[${address}]`);
  }
  const expected = referenceRun(engine.nodes, input);
  assert.deepEqual(engine.values, expected.values, `${label}: instruction values`);
  assert.deepEqual(engine.loadSources, expected.loadSources, `${label}: load address/producer identities`);
  const actual = engine.finalMemory();
  for (const address of new Set([...actual.keys(), ...expected.ram.keys()])) {
    assert.equal(actual.get(address) ?? 0n, expected.ram.get(address) ?? 0n, `${label}: memory[${address}]`);
  }
  totals.referenceComparisons += 1;
  totals.referenceInstructionEvaluations += engine.nodes.length;
}

function change(engine, updates, label) {
  const batch = Array.from(updates);
  const input = referenceInputs.get(engine);
  for (const [address, value] of batch) input.set(address, BigInt(value));
  const stats = engine.update(batch);
  verify(engine, label);
  totals.updateBatches += 1;
  totals.queuedInstructionEvaluations += stats.evaluated.length;
  return stats;
}

function directedCases() {
  const cases = [];
  const start = (name, nodes, initial) => {
    cases.push(name);
    const engine = createTrace(nodes, memory(initial));
    verify(engine, `${name}: initial`);
    return engine;
  };

  // A raw empty bucket pointer is sufficient evidence. No semantic query API exists.
  let engine = start('empty bucket insertion discovers a previously unread address', [
    { op: 'load', addr: 10 },
    { op: 'load', addr: ref(0) },
    { op: 'eq', a: ref(1), b: 99 },
  ], { 0: 0, 10: 0, 30: 99 });
  assert.equal(engine.values[2], 0n);
  change(engine, [[10, 30]], 'empty slot becomes pointer to another memory cell');
  assert.equal(engine.values[2], 1n);
  assert.deepEqual(engine.loadSources[1], { address: 30, writer: -1 });

  engine = start('intervening blind overwrite cuts memory propagation', [
    { op: 'load', addr: 0 },
    { op: 'store', addr: 10, value: ref(0) },
    { op: 'store', addr: 10, value: 9 },
    { op: 'load', addr: 10 },
  ], { 0: 1 });
  assert.deepEqual(change(engine, [[0, 2]], 'overwritten write changes').evaluated, [0, 1]);

  engine = start('conditional store insertion and deletion', [
    { op: 'load', addr: 0 },
    { op: 'store', addr: 10, value: 7, enabled: ref(0) },
    { op: 'load', addr: 10 },
    { op: 'add', a: ref(2), b: 1 },
  ], { 0: 0, 10: 2 });
  change(engine, [[0, 1]], 'insert store');
  assert.equal(engine.values[3], 8n);
  change(engine, [[0, 0]], 'delete store');
  assert.equal(engine.values[3], 3n);

  engine = start('equal-valued pointer retarget refreshes subscriptions', [
    { op: 'load', addr: 0 },
    { op: 'load', addr: ref(0) },
    { op: 'add', a: ref(1), b: 1 },
  ], { 0: 10, 10: 7, 11: 7 });
  assert.deepEqual(change(engine, [[0, 11]], 'same value at new target').evaluated, [0, 1]);
  assert.deepEqual(change(engine, [[10, 99]], 'old target no longer subscribed').evaluated, []);
  assert.deepEqual(change(engine, [[11, 8]], 'new target changes').evaluated, [1, 2]);

  engine = start('moving store address repairs both address histories', [
    { op: 'load', addr: 0 },
    { op: 'load', addr: 1 },
    { op: 'store', addr: ref(0), value: ref(1) },
    { op: 'load', addr: 10 },
    { op: 'load', addr: 11 },
  ], { 0: 10, 1: 7, 10: 1, 11: 2 });
  assert.deepEqual(change(engine, [[0, 11]], 'move write to second address').evaluated, [0, 2, 3, 4]);
  change(engine, [[1, 8]], 'change moved write value');
  change(engine, [[0, 10]], 'move write back');

  engine = start('historical writes affect later reads only', [
    { op: 'load', addr: 10 },
    { op: 'load', addr: 0 },
    { op: 'store', addr: 10, value: ref(1) },
    { op: 'load', addr: 10 },
  ], { 0: 5, 10: 3 });
  assert.deepEqual(change(engine, [[0, 6]], 'write changes between two reads').evaluated, [1, 2, 3]);
  assert.equal(engine.values[0], 3n);
  assert.equal(engine.values[3], 6n);
  assert.deepEqual(change(engine, [[10, 4]], 'initial memory changes before overwrite').evaluated, [0]);

  engine = start('same-valued inserted producer refreshes writer identity', [
    { op: 'load', addr: 0 },
    { op: 'load', addr: 1 },
    { op: 'store', addr: 10, value: ref(1), enabled: ref(0) },
    { op: 'load', addr: 10 },
    { op: 'add', a: ref(3), b: 1 },
  ], { 0: 0, 1: 7, 10: 7 });
  assert.deepEqual(change(engine, [[0, 1]], 'insert equal-valued write').evaluated, [0, 2, 3]);
  assert.equal(engine.loadSources[3].writer, 2);
  change(engine, [[1, 8]], 'new producer now changes');

  engine = start('batched operand changes preserve their sum and stop propagation', [
    { op: 'load', addr: 0 },
    { op: 'load', addr: 1 },
    { op: 'add', a: ref(0), b: ref(1) },
    { op: 'mul', a: ref(2), b: 9 },
    { op: 'store', addr: 10, value: ref(3) },
    { op: 'load', addr: 10 },
  ], { 0: 3, 1: 5 });
  const sumStats = change(engine, [[0, 5], [1, 3]], '(3 + 5) becomes (5 + 3) in one batch');
  assert.deepEqual(sumStats.evaluated, [0, 1, 2]);
  assert.equal(sumStats.byOp.add, 1);
  assert.equal(sumStats.byOp.store ?? 0, 0);
  assert.equal(engine.values[2], 8n);
  assert.equal(engine.values[5], 72n);
  return cases;
}

function rawCrossProduct() {
  const rows = 9;
  const columns = 13;
  const changedColumn = 6;
  const nodes = [];
  const initial = new Map();
  for (let column = 0; column < columns; column += 1) {
    initial.set(100 + column, BigInt(100 + 10 * column));
    nodes.push({ op: 'load', addr: 100 + column });
  }
  const tests = new Set();
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const subtract = nodes.length;
      nodes.push({ op: 'sub', a: ref(column), b: row });
      nodes.push({ op: 'mul', a: ref(subtract), b: ref(subtract) });
      tests.add(nodes.length);
      nodes.push({ op: 'lt', a: ref(subtract + 1), b: 16 });
      nodes.push({ op: 'store', addr: 1000 + row * columns + column, value: ref(subtract + 2) });
    }
  }
  const engine = createTrace(nodes, initial);
  verify(engine, 'raw cross-product initial');
  const stats = change(engine, [[100 + changedColumn, 161]], 'one array element changes; all predicates remain false');
  const recomputedPairPredicates = stats.evaluated.filter((id) => tests.has(id)).length;
  assert.equal(recomputedPairPredicates, rows);
  assert.equal(stats.evaluated.length, 1 + 3 * rows);
  assert.equal(stats.byOp.store ?? 0, 0);
  return {
    rows, columns, changedColumn, originalPairPredicates: rows * columns, recomputedPairPredicates,
    totalTraceInstructions: nodes.length, queuedInstructions: stats.evaluated.length,
    downstreamStoresReevaluated: stats.byOp.store ?? 0,
  };
}

function exhaustiveSequences() {
  const nodes = [
    { op: 'load', addr: 20 },
    { op: 'load', addr: 0 },
    { op: 'load', addr: 1 },
    { op: 'add', a: ref(2), b: 20 },
    { op: 'load', addr: 2 },
    { op: 'store', addr: ref(3), value: ref(4), enabled: ref(1) },
    { op: 'load', addr: ref(3) },
    { op: 'load', addr: 20 },
    { op: 'load', addr: 21 },
    { op: 'add', a: ref(7), b: ref(8) },
    { op: 'eq', a: ref(6), b: 1 },
    { op: 'store', addr: 22, value: ref(9) },
  ];
  const state = (bits) => [[0, bits & 1], [1, (bits >>> 1) & 1], [2, (bits >>> 2) & 1]];
  let sequences = 0;
  for (let cells = 0; cells < 4; cells += 1) {
    for (let a = 0; a < 8; a += 1) {
      for (let b = 0; b < 8; b += 1) {
        for (let c = 0; c < 8; c += 1) {
          const initial = memory({ 20: cells & 1, 21: (cells >>> 1) & 1 });
          for (const [address, value] of state(a)) initial.set(address, big(value));
          const engine = createTrace(nodes, initial);
          const label = `exhaustive ${cells}/${a}/${b}/${c}`;
          verify(engine, `${label} initial`);
          change(engine, state(b), `${label} middle`);
          change(engine, state(c), `${label} final`);
          sequences += 1;
        }
      }
    }
  }
  return { controlBits: 3, initialCellConfigurations: 4, statesPerSequence: 3, sequences, updateBatches: 2 * sequences };
}

function randomizedSequences() {
  const seed = 0x5eedc0de;
  let rngState = seed;
  const random = (bound) => {
    rngState ^= rngState << 13;
    rngState ^= rngState >>> 17;
    rngState ^= rngState << 5;
    return (rngState >>> 0) % bound;
  };
  const programs = 32;
  const updatesPerProgram = 300;
  for (let program = 0; program < programs; program += 1) {
    const nodes = [];
    const initial = new Map();
    const registers = [];
    for (let a = 0; a < 8; a += 1) {
      initial.set(a, BigInt(random(4)));
      registers.push(nodes.length);
      nodes.push({ op: 'load', addr: a });
    }
    const pointers = [];
    for (let a = 0; a < 4; a += 1) {
      pointers.push(nodes.length);
      registers.push(nodes.length);
      nodes.push({ op: 'add', a: ref(a), b: 20 });
      initial.set(20 + a, BigInt(random(4)));
    }
    for (let step = 0; step < 48; step += 1) {
      const kind = random(7);
      const a = ref(registers[random(registers.length)]);
      const b = ref(registers[random(registers.length)]);
      const addr = ref(pointers[random(pointers.length)]);
      if (kind <= 3) {
        registers.push(nodes.length);
        nodes.push({ op: ['add', 'sub', 'eq', 'lt'][kind], a, b });
      } else if (kind === 4) {
        registers.push(nodes.length);
        nodes.push({ op: 'load', addr });
      } else {
        nodes.push({ op: 'store', addr, value: a, enabled: kind === 5 ? ref(random(8)) : 1 });
      }
    }
    for (let a = 20; a < 24; a += 1) nodes.push({ op: 'load', addr: a });
    const engine = createTrace(nodes, initial);
    verify(engine, `random ${program} initial`);
    for (let update = 0; update < updatesPerProgram; update += 1) {
      const changes = new Map();
      const count = 1 + random(4);
      for (let i = 0; i < count; i += 1) {
        const slot = random(12);
        changes.set(slot < 8 ? slot : 20 + slot - 8, random(4));
      }
      change(engine, changes, `random ${program}/${update}`);
    }
  }
  return { seed: `0x${seed.toString(16)}`, programs, updatesPerProgram, updateBatches: programs * updatesPerProgram };
}

const directed = directedCases();
const crossProduct = rawCrossProduct();
const exhaustive = exhaustiveSequences();
const randomized = randomizedSequences();
console.log(JSON.stringify({
  status: 'PASS',
  runtime: process.version,
  scope: 'Fixed instruction instances; dynamic load/store addresses and conditional store effects; exact integer values.',
  performanceClaim: 'None. Operation counts describe this diagnostic, not native runtime speed.',
  scheduling: 'Ordered dirty queue; no whole-trace instruction-discovery scan during updates. Verification performs separate full scans.',
  accounting: 'Reference instruction counts include initial checks; queued counts cover updates only. Update batches include no-ops.',
  directedCases: directed,
  rawCrossProduct: crossProduct,
  exhaustive,
  randomized,
  totals,
}, null, 2));
