import {test} from 'node:test';
import {openTower, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower({imports: {
  interpreter_invocation_tests: (_, width) => tower.exports.interpreter_invocation_tests(width),
  semantic_world_tests: (_, width) => tower.exports.semantic_world_tests(width),
  semantic_stage_tests: () => tower.exports.semantic_stage_tests(),
}});

test('Tower invocation contexts isolate values, strict storage, effects and fuel', () => {
  runSelectedTest(tower, '.tower/compiler/interpreter_kernel_tests.tower');
});

test('shared semantic/interpreter kernels follow independent compiler worlds', () => {
  runSelectedTest(tower, '.tower/compiler/world_kernel_tests.tower');
});

test('worker entity staging preserves pinned indexes and publishes stable canonical nodes', () => {
  runSelectedTest(tower, '.tower/library/entity_stage_kernel_tests.tower');
});
