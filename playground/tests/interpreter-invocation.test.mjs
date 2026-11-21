import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';

const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
const tower = await loadTower(await readFile(process.env.TOWER_TEST_WASM || 'build/browser-wasi/tower.wasm'), undefined, foundation);
after(() => tower.close());

test('Tower invocation contexts isolate values, strict storage, effects and fuel', async () => {
 for (const width of [4, 8]) {
  assert.equal(tower.exports.interpreter_invocation_tests(width), 0, `target pointer width ${width}`);
 }
});


test('shared semantic/interpreter kernels follow independent compiler worlds', () => {
 for (const width of [4, 8]) assert.equal(tower.exports.semantic_world_tests(width), 0);
});

test('worker entity staging preserves pinned indexes and publishes stable canonical nodes', () => {
 assert.equal(tower.exports.semantic_stage_tests(), 0);
});
