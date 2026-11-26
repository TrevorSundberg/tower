import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {fixtureSource, guestString, openTower, runSelectedTest} from './compiler_test_host.mjs';

const cases = '.tower/compiler/bytecode_package_cases/';
const source = name => fixtureSource(cases + name + '.tower');
const expected = name => readFile(new URL('../../scaffolding/compiler/bytecode_package_cases/' + name + '.expected', import.meta.url));
const tower = await openTower();
const encoder = new TextEncoder();
let sample, handles;

// The assertion interpreter and the compiler whose packages it opens have
// separate memories. Only counted buffers and scalar observations cross here.
function copyBytes(context, bytes) {
  const address = context.allocate(bytes.length + 1);
  if (!address) throw new Error('Cannot allocate package observation');
  const memory = context.memory();
  memory.set(bytes, address);
  memory[address + bytes.length] = 0;
  return address;
}

const checks = await openTower({imports:{
  package_read(context, group, field, size) {
    const value = sample[guestString(context, group)][guestString(context, field)];
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    if (!(bytes instanceof Uint8Array)) throw new Error('Missing package text or bytes');
    const address = copyBytes(context, bytes);
    const memory = context.memory();
    const view = new DataView(memory.buffer, memory.byteOffset, memory.byteLength);
    if (context.pointerBytes === 8) view.setBigUint64(Number(size), BigInt(bytes.length), true);
    else view.setUint32(Number(size), bytes.length, true);
    return address;
  },
  package_collect_source_map(_context, width) {
    const input = sample.case.source;
    const original = tower.compile(input, {pointerBytes:width});
    try { sample.direct = tower.execute(original, 10000); }
    finally { tower.destroyExecution(original); }
    const prepared = tower.prepareFoundationPackage(input, {pointerBytes:width});
    let loaded;
    try {
      loaded = tower.loadBytecode(prepared.bytecode);
      // Replace the environment's current map while both earlier handles are live.
      const later = tower.compile(source('later'), {pointerBytes:width});
      tower.destroyExecution(later);
      sample.prepared = tower.execute(prepared.handle, 10000);
      sample.loaded = tower.execute(loaded, 10000);
    } finally {
      tower.destroyExecution(prepared.handle);
      if (loaded) tower.destroyExecution(loaded);
    }
  },
  package_number(context, group, field) {
    const value = sample[guestString(context, group)][guestString(context, field)];
    if (typeof value !== 'number' && typeof value !== 'boolean') throw new Error('Missing package scalar');
    return Number(value);
  },
  package_step(context, name, budget) {
    sample.step = tower.execute(handles[guestString(context, name)], budget);
  },
  package_load_error(context, data, length) {
    const bytes = context.memory().slice(Number(data), Number(data) + Number(length));
    let handle;
    try { handle = tower.loadBytecode(bytes); }
    catch (error) { return copyBytes(context, encoder.encode(error.message)); }
    tower.destroyExecution(handle);
    return 0;
  },
  package_live_nodes: () => tower.exports.tw_live_nodes(),
  package_live_allocations: () => tower.exports.tw_live_allocations(),
}});

function check(name, observations, sessions = {}) {
  sample = observations;
  handles = sessions;
  try { runSelectedTest(checks, cases + name + '_checks.tower'); }
  finally { sample = handles = undefined; }
}

test('Tower package preparation owns independent verified execution sessions', {
  skip: !tower.exports.ide_package_tests && 'Build with TOWER_IDE_PACKAGE_TESTS=ON to export ide_package_tests',
}, () => {
  assert.equal(tower.exports.ide_package_tests(), 0);
});

test('prepared and loaded package handles retain their own diagnostic source map', async () => {
  check('source_map', {case:{source:source('runtime_error'), expected:await expected('runtime_error')}});
});

for (const width of [4, 8]) test('.towerbc v1 round trip, target layout and deterministic cache ' + width, async () => {
  const direct = tower.compile(source('round_trip'), {pointerBytes:width});
  let loaded, round;
  try {
    const packet = tower.bytecode(direct);
    loaded = tower.loadBytecode(packet);
    round = tower.compile(tower.foundation(loaded).source, {pointerBytes:width});
    check('round_trip', {case:{packet, width, expected:await expected('round_trip_' + width)},
      rebuilt:{packet:tower.bytecode(round)}}, {direct, loaded, round});
    await writeFile(new URL('../../build/bytecode-cross-' + width + '.towerbc', import.meta.url), packet);
  } finally {
    for (const handle of [direct, loaded, round]) if (handle) tower.destroyExecution(handle);
  }
});

test('untrusted packages validate bounds, versions, checksums and actual code before executing', () => {
  const direct = tower.compile(source('valid'));
  let packet;
  try { packet = tower.bytecode(direct); }
  finally { tower.destroyExecution(direct); }
  check('rejection', {case:{packet}});
});

test('canonical packages preserve checked handles across custom grammar installation', async () => {
  const foundation = fixtureSource('.tower/foundation.tower');
  let direct, loaded;
  try {
    tower.configure(foundation + '\n' + source('identifier_grammar'));
    direct = tower.compile(source('custom_identifier'));
    tower.useFast(direct);
    tower.configure(foundation);
    loaded = tower.loadBytecode(tower.bytecode(direct));
    check('grammar', {case:{foundation:tower.foundation(loaded).source, expected:await expected('custom_identifier')}},
      {direct, loaded});
  } finally {
    tower.configure(foundation);
    for (const handle of [direct, loaded]) if (handle) tower.destroyExecution(handle);
  }
});
