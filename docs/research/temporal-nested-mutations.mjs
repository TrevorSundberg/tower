/**
 * Directed mutation checks against the ACTUAL nested runtime implementation.
 * Every killer must first pass against the unmodified module. Each mutant
 * changes one unique source anchor, imports successfully from an in-memory
 * data URL, and must fail its killer. No repository source is rewritten.
 *
 * This tests six specified defects, not exhaustive mutation coverage or native
 * performance. The byte mutant breaks a real byte read, not a nonexistent
 * incremental scheduler: the nested runtime currently uses full replay.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as correct from './temporal-nested-api.mjs';

const source = await readFile(new URL('./temporal-nested-api.mjs', import.meta.url), 'utf8');
const r = reg => ({reg});
const fn = (body, params = []) => ({params, body});
const load = (id, address, history) => ({id, op: 'load', addr: address, width: 4, dst: id,
  ...(history === undefined ? {} : {history})});
const store = (id, address, value) => ({id, op: 'store', addr: address, width: 4, value});
const command = (id, name, args = []) => ({id, op: 'temporal', name, args, dst: id});
const location = (id, history, address) => ({id, op: 'location', history, addr: address, type: 'u32', dst: id});
const enter = (id, history, name, args = []) => ({id, op: 'enter', history, fn: name, args, dst: id});
const ret = value => ({id: 'return', op: 'return', value});

function amend(runtime, write, value) {
  const edit = runtime.api.temporal_edit(null);
  runtime.api.temporal_replace(edit, write, value);
  return runtime.api.temporal_repair(edit);
}

const killers = {
  rollback(module) {
    const program = {functions: {
      main: fn([
        load('input', 0), command('child', 'temporal_create'),
        enter('updated', r('child'), 'update', [r('input')]),
        {id: 'conditional_trap', op: 'if', cond: r('input'),
          then: [store('out_of_bounds', 64, 99)]}, ret(0),
      ]),
      update: fn([store('save', 8, r('value')), ret(r('value'))], ['value']),
    }};
    const runtime = module.createNestedRuntime(program);
    const input = runtime.api.temporal_write(runtime.location(null, 0), 0);
    runtime.run(null, 'main');
    const child = runtime.inspect(null).children[0];
    const beforeRoot = runtime.inspect(null);
    const beforeChild = runtime.inspect(child);
    assert.equal(amend(runtime, input, 1), module.RepairStatus.TRAP);
    assert.deepEqual(runtime.inspect(child), beforeChild,
      'A parent trap must also roll back already-completed child effects');
    assert.deepEqual(runtime.inspect(null), beforeRoot,
      'A parent trap must roll back its complete published revision');
  },

  ownership(module) {
    const runtime = module.createNestedRuntime({functions: {
      main: fn([command('child', 'temporal_create'), ret(r('child'))]),
    }});
    const child = runtime.run(null, 'main');
    assert.throws(() => runtime.api.temporal_edit(child), error => error.code === 'WRONG_OWNER',
      'The host must not bypass the retained parent to edit its owned child');
  },

  descendants(module) {
    const runtime = module.createNestedRuntime({functions: {
      main: fn([load('enabled', 0), {id: 'branch', op: 'if', cond: r('enabled'),
        then: [command('child', 'temporal_create')]}, ret(0)]),
    }});
    const input = runtime.api.temporal_write(runtime.location(null, 0), 1);
    runtime.run(null, 'main');
    const child = runtime.inspect(null).children[0];
    assert.equal(runtime.inspect(null).children.length, 1);
    assert.equal(amend(runtime, input, 0), module.RepairStatus.OK);
    assert.equal(runtime.inspect(null).children.length, 0,
      'An ancestor correction must remove children whose creation no longer executes');
    assert.throws(() => runtime.inspect(child), error => error.code === 'INVALID_HISTORY');
  },

  writeIdentity(module) {
    const runtime = module.createNestedRuntime({functions: {
      main: fn([
        command('child', 'temporal_create'), location('first', r('child'), 0),
        location('second', r('child'), 4), command('write_first', 'temporal_write', [r('first'), 3]),
        command('write_second', 'temporal_write', [r('second'), 5]), ret(r('write_second')),
      ]),
      change: fn([
        command('edit', 'temporal_edit', [r('child')]),
        command('replace', 'temporal_replace', [r('edit'), r('write'), 9]),
        command('status', 'temporal_repair', [r('edit')]), ret(r('status')),
      ], ['child', 'write']),
    }});
    const second = runtime.run(null, 'main');
    const child = runtime.inspect(null).children[0];
    assert.equal(runtime.api.temporal_repair(runtime.api.temporal_edit(null)), module.RepairStatus.OK);
    assert.equal(runtime.run(null, 'change', [child, second]), module.RepairStatus.OK,
      'A later committed write handle must survive replay of an earlier child prefix');
    assert.equal(runtime.read(runtime.location(child, 4)), 9n);
    assert.equal(runtime.read(runtime.location(child, 0)), 3n);
  },

  retainedPoint(module) {
    const runtime = module.createNestedRuntime({functions: {
      main: fn([command('child', 'temporal_create'), enter('initialize', r('child'), 'marked'), ret(r('child'))]),
      marked: fn([{id: 'gap', op: 'mark', label: 'gap'}, load('value', 0), store('save', 8, r('value')), ret(r('value'))]),
      insert: fn([
        location('destination', r('child'), 0), command('edit', 'temporal_edit', [r('child')]),
        command('patch', 'temporal_store_at', [r('edit'), r('point'), r('destination'), 17]),
        command('status', 'temporal_repair', [r('edit')]), ret(r('status')),
      ], ['child', 'point']),
    }});
    const child = runtime.run(null, 'main');
    const point = runtime.api.temporal_point(child, 'gap', 0);
    assert.equal(runtime.run(null, 'insert', [child, point]), module.RepairStatus.OK,
      'An accepted Point argument must retain its historical occurrence while the entry prefix replays');
    assert.equal(runtime.read(runtime.location(child, 8)), 17n);
  },

  overlappingByte(module) {
    const runtime = module.createNestedRuntime({functions: {
      main: fn([load('word', 0), store('save', 16, r('word')), ret(r('word'))]),
    }});
    runtime.api.temporal_write(runtime.location(null, 0), 0x11220044);
    const byte = runtime.api.temporal_write(runtime.location(null, 1, 'u8'), 0);
    assert.equal(runtime.run(null, 'main'), 0x11220044n);
    assert.equal(amend(runtime, byte, 0xaa), module.RepairStatus.OK);
    assert.equal(runtime.read(runtime.location(null, 16)), 0x1122aa44n,
      'The second overlapping byte must contribute to a later four-byte load');
  },
};

const mutations = [
  {
    name: 'drop transaction rollback after a parent trap', killer: 'rollback',
    before: 'try { return action(); } catch (error) { world = previous; throw error; }',
    after: 'try { return action(); } catch (error) { throw error; }',
  },
  {
    name: 'allow the host to bypass retained child ownership', killer: 'ownership',
    before: "} else check(node.parent === null, 'WRONG_OWNER', 'A retained parent exclusively controls this child');",
    after: '} else { /* Deliberately bypass host ownership. */ }',
  },
  {
    name: 'keep old descendants when rebuilding an ancestor', killer: 'descendants',
    before: 'for (const key of pool.keys()) world.nodes.delete(key);',
    after: '/* Deliberately leave old descendants installed. */',
  },
  {
    name: 'drop original committed write-handle recovery', killer: 'writeIdentity',
    before: 'if (old?.handle === node.handle) handle = old.writeTokens.get(id);',
    after: '/* Deliberately forget later original write handles. */',
  },
  {
    name: 'capture a public Point without retaining its occurrence', killer: 'retainedPoint',
    before: "result.push(token('RetainedPoint', { ownerId: owner.id, key: info.key }));",
    after: 'result.push(value);',
  },
  {
    name: 'ignore the second overlapping byte in a wide load', killer: 'overlappingByte',
    before: 'value = (value << 8n) | BigInt(node.frame.memory[addr + i]);',
    after: 'value = (value << 8n) | BigInt(i === 1 ? 0 : node.frame.memory[addr + i]);',
  },
];

const results = [];
for (const mutation of mutations) {
  const killer = killers[mutation.killer];
  killer(correct);
  assert.equal(source.split(mutation.before).length - 1, 1,
    `Mutation anchor must occur exactly once: ${mutation.name}`);
  const variant = source.replace(mutation.before, mutation.after);
  // An import/syntax failure is a broken mutation harness, not a killed defect.
  const mutant = await import(`data:text/javascript;base64,${Buffer.from(variant).toString('base64')}`);
  let failure;
  try { killer(mutant); }
  catch (error) {
    const assertion = error instanceof assert.AssertionError;
    assert(assertion || error instanceof mutant.TemporalError,
      `Unexpected non-modeled exception for ${mutation.name}: ${error.stack}`);
    failure = {type: assertion ? 'assertion' : 'checked-runtime-error',
      code: error.code, message: error.message.split('\n')[0]};
  }
  assert(failure, `SURVIVING MUTANT: ${mutation.name}`);
  results.push({mutation: mutation.name, status: 'DETECTED', failure});
}

console.log(JSON.stringify({status: 'PASS', suite: 'temporal-nested-mutations',
  baselineKillersPassed: results.length, detectedMutations: results.length, survivingMutations: 0,
  scope: 'Six directed semantic defects; in-memory variants only; not exhaustive proof', results}, null, 2));
