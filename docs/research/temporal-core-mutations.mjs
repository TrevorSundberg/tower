/** Mutation sensitivity checks for the actual minimal temporal interpreter.
 * Runtime variants are imported from data URLs, never written over the source.
 * Each baseline probe must pass; a mutant counts only when import succeeds and
 * the probe fails a behavioral assertion. Parser/import failures are not kills.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./temporal-core-runtime.mjs', import.meta.url), 'utf8');
const R = reg => ({ reg });
const F = body => ({ params: ['args'], body });
const ret = value => ({ id: 'return', op: 'return', value });
const load = (id, addr, width = 4) => ({ id, op: 'load', dst: id, addr, width });
const store = (id, addr, value, width = 4) => ({ id, op: 'store', addr, value, width });
const bytes = value => new Uint8Array([Number(value) & 255, 0, 0, 0]);
const make = (module, functions = {}) => module.createTemporalRuntime({ functions });
const global = (rt, addr, value = 0) => rt.builtins.builtin_temporal_global(addr, bytes(value), 4);
const word = (rt, addr) => [...rt.debug.read(addr, 4)].reduceRight((value, byte) => (value << 8n) | BigInt(byte), 0n);
const append = (rt, Status, point, destination, value) => {
  const edit = rt.api.temporal_edit(null);
  const write = rt.api.temporal_store_at(edit, point, destination, bytes(value), 4);
  assert.equal(rt.api.temporal_repair(edit), Status.OK);
  return write;
};

const mutations = [
  {
    name: 'ordinary store is omitted',
    from: '      putBytes(p, bytes, context.path);',
    to: '      // Mutant: ordinary memory write omitted.',
    probe(module) {
      const rt = make(module, { main: F([store('save', 1000, 37), ret(0)]) });
      global(rt, 1000);
      rt.api.temporal_run(null, 'main', null, 0);
      assert.equal(word(rt, 1000), 37n);
    },
  },
  {
    name: 'ordinary addition uses the wrong operand operation',
    from: "          case 'add': set(u64(u64(get(ins.a)) + u64(get(ins.b)))); break;",
    to: "          case 'add': set(u64(u64(get(ins.a)) - u64(get(ins.b)))); break;",
    probe(module) {
      const rt = make(module, { main: F([
        load('a', 1000),
        { id: 'sum', op: 'add', dst: 'sum', a: R('a'), b: 5 },
        { id: 'product', op: 'mul', dst: 'product', a: R('sum'), b: 9 },
        store('save', 2000, R('product')), ret(R('product')),
      ]) });
      global(rt, 1000, 3); global(rt, 2000);
      assert.equal(rt.api.temporal_run(null, 'main', null, 0), 72n);
      assert.equal(word(rt, 2000), 72n);
    },
  },
  {
    name: 'source snapshot aliases the caller Buffer',
    from: '  const result = new Uint8Array(n);',
    to: '  const result = source.subarray(0, n);',
    probe(module) {
      const rt = make(module); global(rt, 1000);
      const point = rt.api.temporal_point(null), edit = rt.api.temporal_edit(null);
      const sourceBytes = Buffer.from([7, 0, 0, 0]);
      rt.api.temporal_store_at(edit, point, 1000, sourceBytes, 4);
      sourceBytes[0] = 99;
      assert.equal(rt.api.temporal_repair(edit), module.Status.OK);
      assert.equal(word(rt, 1000), 7n, 'capture must not borrow caller storage until repair');
    },
  },
  {
    name: 'failed candidate is published instead of rolling back',
    from: '    try { return fn(); } catch (error) { world = before; throw error; }',
    to: '    try { return fn(); } catch (error) { throw error; }',
    probe(module) {
      const rt = make(module, { main: F([
        load('input', 1000),
        { id: 'branch', op: 'if', cond: R('input'), then: [
          store('partial', 2000, 99), load('trap', 999999),
        ], else: [store('ordinary', 2000, 17)] }, ret(0),
      ]) });
      global(rt, 1000); global(rt, 2000);
      const point = rt.api.temporal_point(null);
      rt.api.temporal_run(null, 'main', null, 0);
      const old = rt.debug.inspect(null), edit = rt.api.temporal_edit(null);
      rt.api.temporal_store_at(edit, point, 1000, bytes(1), 4);
      assert.equal(rt.api.temporal_repair(edit), module.Status.TRAP);
      assert.equal(word(rt, 2000), 17n, 'candidate writes must not escape failure');
      assert.deepEqual(rt.debug.inspect(null), old);
    },
  },
  {
    name: 'ordinary writes bypass allocation ownership',
    from: '          check(a.owner === context.history || (!write && node(a.owner).parent === context.history),',
    to: '          check(true,',
    probe(module) {
      const rt = make(module, { child: F([store('foreign', 1000, 99), ret(0)]) });
      global(rt, 1000, 7);
      const child = rt.api.temporal_create();
      assert.throws(() => rt.api.temporal_run(child, 'child', null, 0),
        error => error instanceof module.TemporalError && error.code === 'OWNERSHIP');
      assert.equal(word(rt, 1000), 7n);
    },
  },
  {
    name: 'new allocation starts with an incorrect baseline',
    from: '    const data = bytes ? new Uint8Array(bytes) : new Uint8Array(width);',
    to: '    const data = bytes ? new Uint8Array(bytes) : new Uint8Array(width).fill(1);',
    probe(module) {
      const rt = make(module, { main: F([
        { id: 'allocation', op: 'alloc', dst: 'pointer', size: 4 },
        load('initial', R('pointer')), ret(R('initial')),
      ]) });
      assert.equal(rt.api.temporal_run(null, 'main', null, 0), 0n);
    },
  },
  {
    name: 'replacement reorders the original insertion',
    from: "      check(p, 'BAD_WRITE', 'Write is foreign, removed, or not in this edit'); p.bytes = sourceBytes(source, p.bytes.length);",
    to: "      check(p, 'BAD_WRITE', 'Write is foreign, removed, or not in this edit'); p.bytes = sourceBytes(source, p.bytes.length); info.patches.splice(info.patches.indexOf(p), 1); info.patches.push(p);",
    probe(module) {
      const rt = make(module); global(rt, 1000);
      const point = rt.api.temporal_point(null), first = append(rt, module.Status, point, 1000, 3);
      append(rt, module.Status, point, 1000, 5);
      const edit = rt.api.temporal_edit(null);
      rt.api.temporal_replace(edit, first, bytes(7));
      assert.equal(rt.api.temporal_repair(edit), module.Status.OK);
      assert.equal(word(rt, 1000), 5n, 'the later overlapping insertion must remain later');
    },
  },
  {
    name: 'an orphaned dependent insertion is silently discarded',
    from: "    for (const p of n.patches) check(n.reached.has(p.anchor), 'ORPHANED_POINT', 'An intervention point disappeared');",
    to: '    // Mutant: unreachable intervention anchor accepted.',
    probe(module) {
      const rt = make(module); global(rt, 1000);
      const first = append(rt, module.Status, rt.api.temporal_point(null), 1000, 3);
      append(rt, module.Status, rt.api.temporal_point(null), 1000, 5);
      const edit = rt.api.temporal_edit(null);
      rt.api.temporal_remove(edit, first);
      assert.equal(rt.api.temporal_repair(edit), module.Status.ORPHANED_POINT);
      assert.equal(word(rt, 1000), 5n, 'orphan failure must retain the old publication');
    },
  },
];

const importSource = async (text, suffix) => import(`data:text/javascript;base64,${Buffer.from(`${text}\n// ${suffix}\n`).toString('base64')}`);
const baseline = await importSource(source, 'unmodified baseline');
for (const mutation of mutations) mutation.probe(baseline);
const results = [];
for (const [number, mutation] of mutations.entries()) {
  assert.equal(source.split(mutation.from).length - 1, 1, `mutation anchor must be unique: ${mutation.name}`);
  // Import is outside the behavioral-failure catcher: bad syntax never counts.
  const mutant = await importSource(source.replace(mutation.from, mutation.to), `mutant ${number}`);
  let failure = null;
  try { mutation.probe(mutant); } catch (error) { failure = error; }
  assert.ok(failure instanceof assert.AssertionError,
    `mutant must fail a behavioral assertion, not survive or crash unexpectedly: ${mutation.name}`);
  results.push({ name: mutation.name, detected: true, assertion: failure.message.split('\n')[0] });
}
console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-core-mutations',
  baselineProbes: mutations.length, detected: results.length, survivors: 0, results }, null, 2));
