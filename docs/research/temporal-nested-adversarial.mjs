/**
 * Independent attacks on the bounded closed-owned nested-history prototype.
 * Run: node docs/research/temporal-nested-adversarial.mjs
 *
 * Expectations below are hand-derived; this suite does not use the runtime's
 * trace as an oracle or claim to verify independent live cross-history links.
 */
import assert from 'node:assert/strict';
import { createNestedRuntime, RepairStatus } from './temporal-nested-api.mjs';

const r = reg => ({ reg });
const control = (id, name, args, dst) => ({ op: 'temporal', id, name, args, ...(dst ? { dst } : {}) });
const location = (id, dst, addr, history) => ({ op: 'location', id, dst, addr, type: 'u32',
  ...(history === undefined ? {} : { history }) });
const results = [];
let assertions = 0;
function equal(actual, expected, message) { assert.deepStrictEqual(actual, expected, message); assertions += 1; }
function reject(fn, message, code) {
  let caught;
  try { fn(); } catch (error) { caught = error; }
  assert.ok(caught, `${message}: expected a checked rejection`);
  if (code !== undefined) assert.equal(caught.code, code, message);
  assertions += 1;
  return caught;
}
function test(name, body) {
  const before = assertions;
  body();
  results.push({ name, assertions: assertions - before, status: 'PASS' });
}
const copy = { params: [], body: [
  { op: 'load', id: 'read', dst: 'v', addr: 0, width: 4 },
  { op: 'store', id: 'copy', addr: 4, width: 4, value: r('v') },
  { op: 'mark', id: 'mark', label: 'child_gap' },
  { op: 'return', id: 'return', value: r('v') },
] };
const basic = { functions: {
  copy,
  main: { params: [], body: [{ op: 'return', id: 'done', value: 0 }] },
  use_point: { params: ['child', 'point'], body: [
    location('location', 'p', 0, r('child')),
    control('edit', 'temporal_edit', [r('child')], 'e'),
    control('insert', 'temporal_store_at', [r('e'), r('point'), r('p'), 17], 'w'),
    control('repair', 'temporal_repair', [r('e')], 'status'),
    { op: 'return', id: 'done', value: r('status') },
  ] },
} };
function ownedProgram() {
  return { functions: { ...basic.functions,
    factory: { params: [], body: [
      { op: 'load', id: 'enabled', dst: 'enabled', addr: 0, width: 4 },
      { op: 'if', id: 'branch', cond: r('enabled'), then: [
        control('create', 'temporal_create', [], 'child'),
        location('location', 'p', 0, r('child')),
        control('write', 'temporal_write', [r('p'), 1], 'w'),
        { op: 'enter', id: 'run', history: r('child'), fn: 'copy', args: [], dst: 'value' },
        { op: 'return', id: 'return_child', value: r('child') },
      ], else: [{ op: 'return', id: 'none', value: 0 }] },
    ] },
  } };
}
function enabledOwned(program = ownedProgram()) {
  const h = createNestedRuntime(program, { memorySize: 32 });
  const input = h.api.temporal_write(h.location(null, 0), 1);
  const child = h.run(null, 'factory');
  return { h, input, child };
}

test('null always selects this runtime root; isolated histories may edit concurrently', () => {
  const h = createNestedRuntime(basic, { memorySize: 32 });
  const isolated = h.api.temporal_create();
  const rootWrite = h.api.temporal_write(h.location(null, 0), 3);
  const isolatedWrite = h.api.temporal_write(h.location(isolated, 0), 8);
  const rootEdit = h.api.temporal_edit(null);
  const otherEdit = h.api.temporal_edit(isolated);
  h.api.temporal_replace(rootEdit, rootWrite, 5);
  h.api.temporal_replace(otherEdit, isolatedWrite, 11);
  equal(h.api.temporal_repair(otherEdit), RepairStatus.OK, 'isolated batch can publish while root batch is staged');
  equal(h.read(h.location(null, 0)), 3n, 'root remains at its published value before its own repair');
  equal(h.read(h.location(isolated, 0)), 11n, 'isolated memory has its own revision');
  equal(h.api.temporal_repair(rootEdit), RepairStatus.OK, 'root batch publishes independently');
  equal(h.read(h.location(null, 0)), 5n, 'null selects root memory');
  equal(h.read(h.location(isolated, 0)), 11n, 'root correction does not touch isolated memory');
});

test('foreign runtime, wrong-history, and consumed edit handles cannot mutate state', () => {
  const a = createNestedRuntime(basic, { memorySize: 32 });
  const b = createNestedRuntime(basic, { memorySize: 32 });
  const ah = a.api.temporal_create();
  const al = a.location(ah, 0);
  const aw = a.api.temporal_write(al, 3);
  const ae = a.api.temporal_edit(ah);
  const be = b.api.temporal_edit(null);
  const beforeA = a.inspect(ah);
  const beforeB = b.inspect(null);
  reject(() => b.location(ah, 0), 'foreign History is rejected');
  reject(() => b.read(al), 'foreign Location is rejected');
  reject(() => b.api.temporal_repair(ae), 'foreign Edit is rejected');
  reject(() => b.api.temporal_replace(be, aw, 9), 'foreign Write is rejected');
  equal(a.inspect(ah), beforeA, 'foreign attacks leave source runtime unchanged');
  equal(b.inspect(null), beforeB, 'foreign attacks leave target runtime unchanged');
  a.api.temporal_replace(ae, aw, 4);
  equal(a.api.temporal_repair(ae), RepairStatus.OK, 'foreign repair attempt does not consume rightful edit');
  b.api.temporal_cancel(be);
  reject(() => a.api.temporal_repair(ae), 'consumed edit cannot repair again', 'INVALID_EDIT');
  reject(() => b.api.temporal_cancel(be), 'cancelled edit cannot cancel again', 'INVALID_EDIT');
});

test('owned descendants reject unrecorded host mutations but permit inspection', () => {
  const { h, child } = enabledOwned();
  const p = h.location(child, 0);
  const before = h.inspect(child);
  equal(h.read(p), 1n, 'host can inspect an owned descendant');
  reject(() => h.api.temporal_write(p, 99), 'host cannot append to owned child', 'WRONG_OWNER');
  reject(() => h.api.temporal_edit(child), 'host cannot edit owned child', 'WRONG_OWNER');
  reject(() => h.run(child, 'copy'), 'host cannot advance owned child', 'WRONG_OWNER');
  reject(() => h.api.temporal_destroy(child), 'host cannot destroy owned child', 'WRONG_OWNER');
  equal(h.inspect(child), before, 'rejected host control leaves child intact');
});

test('ancestor removal permanently expires old child and location handles', () => {
  const { h, child, input } = enabledOwned();
  const oldLocation = h.location(child, 0);
  let edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 0);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'removing creation publishes');
  equal(h.inspect(null).children.length, 0, 'removed creation leaves no live owned child');
  reject(() => h.inspect(child), 'removed History expires', 'INVALID_HISTORY');
  reject(() => h.read(oldLocation), 'removed child Location expires');
  edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 1);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'reintroduced creation publishes');
  const recreated = h.inspect(null).children[0];
  assert.notEqual(recreated, child, 'reintroduction must create a new lifetime'); assertions += 1;
  equal(h.read(h.location(recreated, 0)), 1n, 'new child starts at the defined origin');
  reject(() => h.inspect(child), 'old path-equivalent History never resurrects', 'INVALID_HISTORY');
  reject(() => h.read(oldLocation), 'old path-equivalent Location never resurrects');
});

test('successful ancestor publication expires child Points even if local replay counts match', () => {
  const { h, child } = enabledOwned();
  const oldPoint = h.api.temporal_point(child, 'child_gap', 0);
  const edit = h.api.temporal_edit(null);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'ancestor no-op repair publishes');
  equal(h.inspect(null).children[0], child, 'continuously present creation retains its History identity');
  const before = h.inspect(null);
  reject(() => h.run(null, 'use_point', [child, oldPoint]), 'old descendant Point is not valid after ancestor publication');
  equal(h.inspect(null), before, 'stale child Point cannot publish parent or descendants');
  const currentPoint = h.api.temporal_point(child, 'child_gap', 0);
  equal(h.run(null, 'use_point', [child, currentPoint]), RepairStatus.OK, 'fresh descendant Point works through its owner');
  equal(h.read(h.location(child, 0)), 17n, 'fresh insertion publishes in child');
  const replay = h.api.temporal_edit(null);
  equal(h.api.temporal_repair(replay), RepairStatus.OK,
    'replaying retained owner invocation preserves its historically valid captured Point');
  const afterReplay = h.inspect(null);
  reject(() => h.run(null, 'use_point', [child, currentPoint]),
    'the same old Point is invalid when supplied as a NEW present-day invocation argument');
  equal(h.inspect(null), afterReplay, 'rejected new invocation cannot publish');
});

test('cancel invalidates provisional writes and does not expire committed Points', () => {
  const h = createNestedRuntime(basic, { memorySize: 32 });
  const p = h.location(null, 0);
  h.api.temporal_write(p, 2);
  h.run(null, 'copy');
  const point = h.api.temporal_point(null, 'child_gap', 0);
  const before = h.inspect(null);
  let edit = h.api.temporal_edit(null);
  const provisional = h.api.temporal_store_at(edit, point, p, 13);
  h.api.temporal_cancel(edit);
  equal(h.inspect(null), before, 'cancel retains entire previous publication');
  edit = h.api.temporal_edit(null);
  reject(() => h.api.temporal_replace(edit, provisional, 19), 'cancelled provisional Write expires', 'INVALID_WRITE');
  h.api.temporal_store_at(edit, point, p, 7);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'Point survives cancel and can anchor another batch');
  equal(h.read(p), 7n, 'replacement batch publishes its own insertion');
});

test('a parent trap cannot leak an already successful candidate child repair', () => {
  const program = { functions: { ...basic.functions,
    factory: { params: [], body: [
      { op: 'load', id: 'read_input', dst: 'input', addr: 0, width: 4 },
      control('create', 'temporal_create', [], 'child'),
      location('location', 'p', 0, r('child')),
      control('write', 'temporal_write', [r('p'), 1], 'w'),
      { op: 'enter', id: 'copy', history: r('child'), fn: 'copy', args: [], dst: 'first' },
      control('edit', 'temporal_edit', [r('child')], 'e'),
      control('replace', 'temporal_replace', [r('e'), r('w'), r('input')]),
      control('repair', 'temporal_repair', [r('e')], 'status'),
      { op: 'eq', id: 'zero', dst: 'zero', a: r('input'), b: 0 },
      { op: 'if', id: 'trap_if_zero', cond: r('zero'), then: [
        { op: 'load', id: 'trap', dst: 'bad', addr: 32, width: 4 },
      ], else: [] },
      { op: 'return', id: 'done', value: r('child') },
    ] },
  } };
  const { h, child, input } = enabledOwned(program);
  const beforeRoot = h.inspect(null);
  const beforeChild = h.inspect(child);
  const edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 0);
  equal(h.api.temporal_repair(edit), RepairStatus.TRAP, 'candidate reaches parent trap after child repair');
  equal(h.inspect(null), beforeRoot, 'failed ancestor candidate leaves root revision untouched');
  equal(h.inspect(child), beforeChild, 'successful internal child repair stays private on ancestor failure');
  equal(h.read(h.location(child, 4)), 1n, 'published child output did not leak zero from failed candidate');
  reject(() => h.api.temporal_repair(edit), 'failed valid repair consumes its edit', 'INVALID_EDIT');
});

test('root and child captures resist input-array, program, and Buffer aliases', () => {
  const initial = Buffer.alloc(32);
  initial[8] = 6;
  const program = { functions: { ...structuredClone(basic.functions),
    from_argument: { params: ['value'], body: [
      control('create', 'temporal_create', [], 'child'),
      location('location', 'p', 0, r('child')),
      control('write', 'temporal_write', [r('p'), r('value')], 'w'),
      { op: 'enter', id: 'copy', history: r('child'), fn: 'copy', args: [], dst: 'copied' },
      { op: 'return', id: 'done', value: r('child') },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32, initialMemory: initial });
  class HostileArgs extends Array { map() { return this; } }
  const args = new HostileArgs(1); args[0] = 5;
  const child = h.run(null, 'from_argument', args);
  args[0] = 99;
  initial[8] = 77;
  program.functions.copy.body[1].value = 123;
  const edit = h.api.temporal_edit(null);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'repair uses captured inputs rather than host aliases');
  equal(h.read(h.location(child, 0)), 5n, 'retained child input preserved captured root argument');
  equal(h.read(h.location(child, 4)), 5n, 'retained child program was captured by value');
  equal(h.read(h.location(null, 8)), 6n, 'root origin does not alias caller Buffer');
  equal(h.read(h.location(child, 8)), 6n, 'child origin does not alias caller Buffer');
});

test('destroying an isolated history permanently invalidates its handles only', () => {
  const h = createNestedRuntime(basic, { memorySize: 32 });
  const isolated = h.api.temporal_create();
  const p = h.location(isolated, 0);
  h.api.temporal_write(p, 9);
  h.api.temporal_destroy(isolated);
  reject(() => h.inspect(isolated), 'destroyed isolated History expires', 'INVALID_HISTORY');
  reject(() => h.read(p), 'destroyed isolated Location expires');
  reject(() => h.api.temporal_destroy(isolated), 'destroy is not repeated on expired History', 'INVALID_HISTORY');
  equal(h.read(h.location(null, 0)), 0n, 'isolated destruction leaves default root intact');
});

test('orphan status is atomic; removing the intervention in the same batch resolves it', () => {
  const program = { functions: { main: { params: [], body: [
    { op: 'load', id: 'input', dst: 'input', addr: 0, width: 4 },
    { op: 'if', id: 'branch', cond: r('input'), then: [
      { op: 'mark', id: 'mark', label: 'conditional' },
    ], else: [] },
    { op: 'return', id: 'done', value: 0 },
  ] } } };
  const h = createNestedRuntime(program, { memorySize: 32 });
  const input = h.api.temporal_write(h.location(null, 0), 1);
  h.run(null, 'main');
  let edit = h.api.temporal_edit(null);
  const patch = h.api.temporal_store_at(edit, h.api.temporal_point(null, 'conditional', 0), h.location(null, 4), 17);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'initial intervention publishes');
  const before = h.inspect(null);
  edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 0);
  equal(h.api.temporal_repair(edit), RepairStatus.ORPHANED_POINT, 'disappearing anchored occurrence produces explicit orphan status');
  equal(h.inspect(null), before, 'orphan candidate cannot publish partial memory or trace');
  reject(() => h.api.temporal_cancel(edit), 'orphan failure consumed its batch', 'INVALID_EDIT');
  edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 0);
  h.api.temporal_remove(edit, patch);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'joint intervention removal and branch correction publish');
  equal(h.read(h.location(null, 4)), 0n, 'removed intervention no longer contributes bytes');
  edit = h.api.temporal_edit(null);
  reject(() => h.api.temporal_replace(edit, patch, 99), 'removed committed Write cannot be revived', 'INVALID_WRITE');
  h.api.temporal_cancel(edit);
});

test('nested execution-limit failure leaves published descendant revisions untouched', () => {
  const program = { functions: {
    factory: { params: [], body: [
      { op: 'load', id: 'input', dst: 'n', addr: 0, width: 4 },
      control('create', 'temporal_create', [], 'child'),
      { op: 'enter', id: 'work', history: r('child'), fn: 'work', args: [r('n')], dst: 'value' },
      { op: 'return', id: 'done', value: r('child') },
    ] },
    work: { params: ['n'], body: [
      { op: 'repeat', id: 'loop', count: r('n'), index: 'i', body: [
        { op: 'load', id: 'read', dst: 'old', addr: 4, width: 4 },
        { op: 'add', id: 'increment', dst: 'next', a: r('old'), b: 1 },
        { op: 'store', id: 'write', addr: 4, width: 4, value: r('next') },
      ] },
      { op: 'return', id: 'done', value: 0 },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32, maxSteps: 40 });
  const input = h.api.temporal_write(h.location(null, 0), 1);
  const child = h.run(null, 'factory');
  const beforeRoot = h.inspect(null);
  const beforeChild = h.inspect(child);
  const edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 1000);
  equal(h.api.temporal_repair(edit), RepairStatus.LIMIT, 'descendant instruction exhaustion returns limit status');
  equal(h.inspect(null), beforeRoot, 'limit failure preserves published root');
  equal(h.inspect(child), beforeChild, 'limit failure preserves published child');
});

test('null inside a child still means root; self and ancestor edits reject atomically', () => {
  const program = { functions: {
    root_attempt: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      { op: 'enter', id: 'enter', history: r('child'), fn: 'edit_root', args: [], dst: 'ignored' },
    ] },
    edit_root: { params: [], body: [
      control('edit', 'temporal_edit', [null], 'e'),
    ] },
    self_attempt: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      { op: 'enter', id: 'enter', history: r('child'), fn: 'edit_self', args: [r('child')], dst: 'ignored' },
    ] },
    edit_self: { params: ['self'], body: [
      control('edit', 'temporal_edit', [r('self')], 'e'),
    ] },
    ancestor_attempt: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      { op: 'enter', id: 'enter', history: r('child'), fn: 'spawn_grandchild', args: [r('child')], dst: 'ignored' },
    ] },
    spawn_grandchild: { params: ['self'], body: [
      control('create', 'temporal_create', [], 'grandchild'),
      { op: 'enter', id: 'enter', history: r('grandchild'), fn: 'edit_parent', args: [r('self')], dst: 'ignored' },
    ] },
    edit_parent: { params: ['parent'], body: [
      control('edit', 'temporal_edit', [r('parent')], 'e'),
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32 });
  for (const fn of ['root_attempt', 'self_attempt', 'ancestor_attempt']) {
    const before = h.inspect(null);
    reject(() => h.run(null, fn), `${fn} cannot amend an active frame`);
    equal(h.inspect(null), before, `${fn} cannot leak its candidate child creation`);
    equal(h.inspect(null).children.length, 0, `${fn} leaves no unpublished descendants`);
  }
});

test('ordinary recursive depth exhaustion is a LIMIT status, not a partial publication', () => {
  const program = { functions: {
    main: { params: [], body: [
      { op: 'load', id: 'input', dst: 'n', addr: 0, width: 4 },
      { op: 'call', id: 'recurse', fn: 'recurse', args: [r('n')], dst: 'result' },
      { op: 'store', id: 'copy', addr: 4, width: 4, value: r('result') },
    ] },
    recurse: { params: ['n'], body: [
      { op: 'if', id: 'branch', cond: r('n'), then: [
        { op: 'sub', id: 'decrement', dst: 'next', a: r('n'), b: 1 },
        { op: 'call', id: 'recurse', fn: 'recurse', args: [r('next')], dst: 'result' },
        { op: 'return', id: 'return', value: r('result') },
      ], else: [{ op: 'return', id: 'base', value: 7 }] },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32, maxDepth: 4, maxSteps: 10000 });
  const input = h.api.temporal_write(h.location(null, 0), 1);
  h.run(null, 'main');
  const before = h.inspect(null);
  const edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 10);
  equal(h.api.temporal_repair(edit), RepairStatus.LIMIT, 'depth exhaustion maps to explicit LIMIT outcome');
  equal(h.inspect(null), before, 'depth failure preserves complete prior publication');
});

test('parent can branch on child orphan status and consume the unchanged child revision', () => {
  const program = { functions: {
    child: { params: [], body: [
      { op: 'load', id: 'read', dst: 'enabled', addr: 0, width: 4 },
      { op: 'store', id: 'copy', addr: 4, width: 4, value: r('enabled') },
      { op: 'if', id: 'branch', cond: r('enabled'), then: [
        { op: 'mark', id: 'mark', label: 'child_gap' },
      ], else: [] },
    ] },
    main: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      location('input_location', 'input', 0, r('child')),
      location('output_location', 'output', 4, r('child')),
      control('input', 'temporal_write', [r('input'), 1], 'w'),
      { op: 'enter', id: 'execute', history: r('child'), fn: 'child', args: [], dst: 'ignored' },
      control('point', 'temporal_point', [r('child'), 'child_gap', 0], 'point'),
      control('edit_insert', 'temporal_edit', [r('child')], 'insert'),
      control('insert', 'temporal_store_at', [r('insert'), r('point'), r('output'), 17], 'patch'),
      control('publish_insert', 'temporal_repair', [r('insert')], 'first_status'),
      control('edit_input', 'temporal_edit', [r('child')], 'edit'),
      control('replace', 'temporal_replace', [r('edit'), r('w'), 0]),
      control('fail_repair', 'temporal_repair', [r('edit')], 'status'),
      { op: 'eq', id: 'check_status', dst: 'orphan', a: r('status'), b: RepairStatus.ORPHANED_POINT },
      { op: 'if', id: 'branch_status', cond: r('orphan'), then: [
        { op: 'store', id: 'correct', addr: 16, width: 4, value: 1 },
      ], else: [{ op: 'store', id: 'unexpected', addr: 16, width: 4, value: 99 }] },
      { op: 'load', id: 'read_child', dst: 'value', history: r('child'), addr: 4, width: 4 },
      { op: 'store', id: 'copy_child', addr: 20, width: 4, value: r('value') },
      { op: 'return', id: 'done', value: r('child') },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32 });
  const child = h.run(null, 'main');
  equal(h.read(h.location(null, 16)), 1n, 'parent sees and branches on exact child failure status');
  equal(h.read(h.location(null, 20)), 17n, 'parent continues by reading child last successful revision');
  equal(h.read(h.location(child, 0)), 1n, 'failed child correction did not publish zero input');
  equal(h.read(h.location(child, 4)), 17n, 'failed child correction retains prior inserted bytes');
  const edit = h.api.temporal_edit(null);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'child non-OK status is ordinary replayable parent data');
  equal(h.read(h.location(null, 20)), 17n, 'ancestor replay retains child failure and old published observation');
});

test('later child input handles survive the earlier input prefixes of ancestor replay', () => {
  const program = { functions: {
    factory: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      location('first_location', 'p1', 0, r('child')),
      location('second_location', 'p2', 4, r('child')),
      control('first', 'temporal_write', [r('p1'), 1], 'w1'),
      control('second', 'temporal_write', [r('p2'), 2], 'w2'),
      { op: 'return', id: 'done', value: r('w2') },
    ] },
    correct: { params: ['child', 'write'], body: [
      control('edit', 'temporal_edit', [r('child')], 'e'),
      control('replace', 'temporal_replace', [r('e'), r('write'), 9]),
      control('repair', 'temporal_repair', [r('e')], 'status'),
      { op: 'return', id: 'done', value: r('status') },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32 });
  const secondWrite = h.run(null, 'factory');
  const child = h.inspect(null).children[0];
  let edit = h.api.temporal_edit(null);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'ancestor reconstructs both child input events');
  equal(h.run(null, 'correct', [child, secondWrite]), RepairStatus.OK,
    'second committed Write retains identity despite the temporary one-input replay prefix');
  equal(h.read(h.location(child, 0)), 1n, 'correcting second event preserves first event');
  equal(h.read(h.location(child, 4)), 9n, 'correcting surviving second event changes the intended bytes');
  edit = h.api.temporal_edit(null);
  equal(h.api.temporal_repair(edit), RepairStatus.OK, 'retained correction also replays with stable second-event identity');
  equal(h.read(h.location(child, 4)), 9n, 'retained second-event correction remains applied');
});

test('parent publication rejects unfinished child and grandchild batches without leaking them', () => {
  const program = { functions: {
    direct: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      control('edit', 'temporal_edit', [r('child')], 'edit'),
      { op: 'return', id: 'done', value: r('edit') },
    ] },
    nested: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      { op: 'enter', id: 'enter', history: r('child'), fn: 'direct', args: [], dst: 'edit' },
      { op: 'return', id: 'done', value: r('edit') },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32 });
  for (const fn of ['direct', 'nested']) {
    const before = h.inspect(null);
    reject(() => h.run(null, fn), `${fn} cannot publish an unfinished owned batch`, 'EDIT_OPEN');
    equal(h.inspect(null), before, `${fn} failure does not leak descendants or pending edits`);
    const edit = h.api.temporal_edit(null);
    equal(h.api.temporal_repair(edit), RepairStatus.OK, `${fn} failed batch leaves no hidden edit lock`);
  }
});

test('history creation recursion shares the global depth limit across enter operations', () => {
  const program = { functions: {
    main: { params: [], body: [
      { op: 'load', id: 'input', dst: 'enabled', addr: 0, width: 4 },
      { op: 'if', id: 'branch', cond: r('enabled'), then: [
        control('create', 'temporal_create', [], 'child'),
        { op: 'enter', id: 'enter', history: r('child'), fn: 'forever', args: [], dst: 'ignored' },
      ], else: [] },
      { op: 'store', id: 'output', addr: 4, width: 4, value: 7 },
    ] },
    forever: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      { op: 'enter', id: 'enter', history: r('child'), fn: 'forever', args: [], dst: 'ignored' },
    ] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32, maxDepth: 4, maxSteps: 10000 });
  const input = h.api.temporal_write(h.location(null, 0), 0);
  h.run(null, 'main');
  const before = h.inspect(null);
  const edit = h.api.temporal_edit(null);
  h.api.temporal_replace(edit, input, 1);
  equal(h.api.temporal_repair(edit), RepairStatus.LIMIT, 'unbounded owned-history recursion terminates with a checked limit');
  equal(h.inspect(null), before, 'history-depth failure leaves prior published root untouched');
  equal(h.inspect(null).children.length, 0, 'history-depth failure cannot leak partial descendant chain');
});

test('retained child destruction replays repeatedly without reviving public handles', () => {
  const program = ownedProgram();
  program.functions.destroy_child = { params: ['child'], body: [
    control('destroy', 'temporal_destroy', [r('child')]),
    { op: 'return', id: 'done', value: 0 },
  ] };
  const { h, child } = enabledOwned(program);
  h.run(null, 'destroy_child', [child]);
  equal(h.inspect(null).children.length, 0, 'recorded destruction removes the owned child');
  reject(() => h.inspect(child), 'destroyed public child handle expires', 'INVALID_HISTORY');
  const eventCount = h.inspect(null).events.length;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const edit = h.api.temporal_edit(null);
    equal(h.api.temporal_repair(edit), RepairStatus.OK,
      `replay ${iteration} rebinds the retained destruction argument at its historical occurrence`);
    equal(h.inspect(null).children.length, 0, `replay ${iteration} preserves the recorded destruction`);
    equal(h.inspect(null).events.length, eventCount, `replay ${iteration} does not append duplicate interactions`);
    reject(() => h.inspect(child), `replay ${iteration} does not resurrect the old public handle`, 'INVALID_HISTORY');
  }
  const before = h.inspect(null);
  reject(() => h.run(null, 'destroy_child', [child]),
    'a NEW invocation cannot submit the destroyed public child handle', 'INVALID_HISTORY');
  equal(h.inspect(null), before, 'rejected stale public argument leaves published history intact');
});

test('diagnostic retained argument anchors cannot be resubmitted as public capabilities', () => {
  const program = { functions: { ...basic.functions,
    factory: { params: [], body: [
      control('create', 'temporal_create', [], 'child'),
      location('location', 'p', 0, r('child')),
      control('write', 'temporal_write', [r('p'), 1], 'w'),
      { op: 'enter', id: 'run', history: r('child'), fn: 'copy', args: [], dst: 'ignored' },
      { op: 'return', id: 'done', value: r('w') },
    ] },
    accept: { params: ['history', 'location', 'write', 'point'], body: [
      { op: 'return', id: 'done', value: 0 },
    ] },
    identity: { params: ['value'], body: [{ op: 'return', id: 'done', value: r('value') }] },
  } };
  const h = createNestedRuntime(program, { memorySize: 32 });
  const write = h.run(null, 'factory');
  const child = h.inspect(null).children[0];
  const p = h.location(child, 0);
  const point = h.api.temporal_point(child, 'child_gap', 0);
  h.run(null, 'accept', [child, p, write, point]);
  const retained = h.inspect(null).events.find(event => event.kind === 'call' && event.fn === 'accept').args;
  equal(retained.map(value => value.kind),
    ['RetainedHistory', 'RetainedLocation', 'RetainedWrite', 'RetainedPoint'],
    'attack fixture obtains all four private retained anchor kinds from diagnostic copies');
  for (const anchor of retained) {
    const before = h.inspect(null);
    reject(() => h.run(null, 'identity', [anchor]),
      `${anchor.kind} cannot bypass public capability validation through a new argument`, 'INVALID_POINT');
    equal(h.inspect(null), before, `${anchor.kind} rejection cannot publish an invocation`);
  }
});

console.log(JSON.stringify({ suite: 'nested-adversarial', status: 'PASS',
  cases: results.length, assertions, results }, null, 2));
