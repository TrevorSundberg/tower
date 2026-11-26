import {test} from 'node:test';
import {fixtureSource, openTower, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower({imports: {
  interpreter_invocation_tests: (_, width) => tower.exports.interpreter_invocation_tests(width),
  semantic_world_tests: (_, width) => tower.exports.semantic_world_tests(width),
  semantic_stage_tests: () => tower.exports.semantic_stage_tests(),
}});

for (const [name, owner] of [
  ['Tower invocation contexts isolate values, strict storage, effects and fuel', 'compiler/interpreter'],
  ['shared semantic/interpreter kernels follow independent compiler worlds', 'compiler/world'],
  ['worker entity staging preserves pinned indexes and publishes stable canonical nodes', 'library/entity_stage'],
]) {
  test(name, () => {
    const entry = '.tower/' + owner + '_kernel_tests.tower';
    const files = [entry, '.tower/library/testing.tower'].map(path => ({path, text:fixtureSource(path)}));
    runSelectedTest(tower, entry, 1, {files});
  });
}
