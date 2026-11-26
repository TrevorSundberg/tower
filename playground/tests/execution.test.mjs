import {after, afterEach, test} from 'node:test';
import {readFileSync} from 'node:fs';
import {builtins, loadTowerBytes, runToEnd} from './compiler-fixtures.mjs';
import {guestString} from './guest_text.mjs';
import {moduleText, selectedCases} from './module_case_host.mjs';
import {numberField} from './parser_observations.mjs';

const inputs = new URL('execution_cases/inputs/', import.meta.url);
const example = new URL('../../scaffolding/examples/execution.tower', import.meta.url);
const bytes = readFileSync(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const subject = await loadTowerBytes(bytes, undefined, builtins.foundation);
const machines = new Set(), parsers = new Set();
let result, lowered, inspection;
afterEach(() => {
  for (const handle of machines) subject.destroyExecution(handle);
  for (const handle of parsers) subject.destroy(handle);
  machines.clear();
  parsers.clear();
  result = lowered = inspection = undefined;
});
after(() => subject.close());

const check = selectedCases('execution_cases', {
  execution_file(ctx, ptr) {
    const name = guestString(ctx, ptr);
    if (!/^[a-z0-9_]+\.(tower|expected)$/.test(name)) throw new Error('Invalid execution fixture ' + name);
    return moduleText(ctx, readFileSync(new URL(name, inputs), 'utf8'));
  },
  execution_example: ctx => moduleText(ctx, readFileSync(example, 'utf8')),
  execution_grammar: ctx => moduleText(ctx, builtins.foundation),
  execution_run(ctx, source, fuel) {
    const handle = subject.compile(guestString(ctx, source));
    try {
      result = subject.execute(handle, fuel);
      lowered = subject.foundation(handle).source;
    } finally { subject.destroyExecution(handle); }
  },
  execution_foundation: ctx => moduleText(ctx, lowered),
  execution_compile(ctx, source) {
    const handle = subject.compile(guestString(ctx, source));
    machines.add(handle);
    return handle;
  },
  execution_step: (_ctx, handle, fuel) => { result = subject.execute(handle, fuel); },
  execution_resume: (_ctx, handle) => { result = subject.execute(handle); },
  execution_destroy(_ctx, handle) {
    subject.destroyExecution(handle);
    machines.delete(handle);
  },
  execution_live_nodes: () => subject.exports.tw_live_nodes(),
  execution_text: (ctx, field) => moduleText(ctx, result[guestString(ctx, field)]),
  execution_steps: () => numberField(result.steps),
  execution_offset: () => numberField(result.errorOffset),
  execution_truncated: () => {
    if (typeof result.outputTruncated !== 'boolean') throw new Error('Missing output truncation flag');
    return result.outputTruncated;
  },
  execution_output_length: () => numberField(result.output.length),
  parser_create(ctx, source) {
    const handle = subject.create(guestString(ctx, source));
    parsers.add(handle);
    return handle;
  },
  parser_finish: (_ctx, handle) => { result = runToEnd(subject, handle).end; },
  parser_reset: (ctx, handle, source) => { subject.reset(handle, guestString(ctx, source)); },
  parser_inspect: (_ctx, handle) => { inspection = subject.inspect(handle); },
  parser_count: (ctx, field) => numberField(inspection[guestString(ctx, field)]),
  parser_destroy(_ctx, handle) {
    subject.destroy(handle);
    parsers.delete(handle);
  },
});

test('expanded trees lower to typed operations and execute the actual example', () => check('example', 40));
test('integer semantics are explicit: wrapping, signedness, conversions and traps', () => check('integers'));
test('type errors anywhere prevent all execution, including unreachable code', () => check('unreachable'));
test('typed pointers preserve raw aliasing and indirection', () => check('pointers'));
test('nested structured control flow, scope, and resumable loops', () => check('loops'));
test('output is bounded, drained once, and machines release their parse trees', () => check('bounded_output'));
test('replacement diagnostics retain invocation coordinates, including UTF-8', () => check('diagnostics'));
test('editing the executable example reuses every compiled grammar revision', () => check('retained'));
test('edited semantic rules fail with diagnostics instead of invalid node access', () => check('semantic_rules'));
