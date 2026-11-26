import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {openRokuTests} from './test_host.mjs';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
// Decode the literal fragments of the shipped emitter for the simulator.
const emitter = await read('../../../scaffolding/compiler/roku_runtime.tower');
const runtime = [...emitter.matchAll(/re_text\(r, ("(?:\\.|[^"\\])*")\);/g)].map(m => JSON.parse(m[1])).join('');
const inputs = new Map([['runtime.brs', runtime]]);
for (const width of [32, 64]) inputs.set('i' + width + '.wast', await read('fixtures/i' + width + '.wast'));
const check = await openRokuTests('integers.tower', {}, inputs);

for (const width of [32, 64]) test(`wasm2brs pinned i${width} numeric corpus`,
  {timeout:180000}, () => check('i' + width));
test('seeded full-width random arithmetic and bitwise differential checks', {timeout:180000}, () => check('random'));
test('prepare the same integer corpus for later physical-device execution', () => check('device', 16_384));
