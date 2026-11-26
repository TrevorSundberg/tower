import {after, test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {runSelectedTest} from './selected_test.mjs';

// The registration owners import only the assertions. The reactor supplies the three kernel implementations.
const cases = [
  ['Tower invocation contexts isolate values, strict storage, effects and fuel', 'invocation'],
  ['shared semantic/interpreter kernels follow independent compiler worlds', 'worlds'],
  ['worker entity staging preserves pinned indexes and publishes stable canonical nodes', 'stage'],
];
const source = name => readFile(new URL('../../scaffolding/' + name + '.tower', import.meta.url), 'utf8');
const builtins = Object.fromEntries(await Promise.all(['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower']
  .map(async name => [name, await source(name)])));
const root = 'tests/kernel_checks/';
const files = await Promise.all(['library/testing', 'tests/interpreter_invocation_test', 'tests/semantic_world_test',
  ...cases.flatMap(([, name]) => [root + name, root + name + '_test']),
].map(async name => ({path:'.tower/' + name + '.tower', text:await source(name)})));

const bytes = await readFile(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const tower = await loadTower(bytes, undefined, builtins.foundation, undefined, builtins.bedrock, {
  tower:builtins.tower, builtins, project:{files}, imports:{
    interpreter_invocation_tests: (_, width) => tower.exports.interpreter_invocation_tests(width),
    semantic_world_tests: (_, width) => tower.exports.semantic_world_tests(width),
    semantic_stage_tests: () => tower.exports.semantic_stage_tests(),
  },
});
after(() => tower.close());

for (const [name, selection] of cases) {
  test(name, () => runSelectedTest(tower, '.tower/' + root + selection + '_test.tower', 1));
}
