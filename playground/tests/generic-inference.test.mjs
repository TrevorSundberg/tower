import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower();
const llvm = process.env.TOWER_INTERPRETER_ONLY ? null : await openLLVM();
const cases = '.tower/compiler/semantic_call_inference_cases/';
const inputs = 'generic_call_inputs/';
const source = name => fixtureSource('.tower/tests/' + name + '.tower');
const expected = name => readFile(new URL('../../scaffolding/tests/' + name + '.expected', import.meta.url));

function execute(text, pointerBytes = 4, fast = false) {
  const handle = tower.compile(text, {pointerBytes});
  try {
    if (fast) tower.useFast(handle);
    let output = '', result;
    do {
      result = tower.execute(handle, 100_000);
      if (result.outputTruncated) throw new Error('Truncated inference output');
      output += result.output;
    } while (result.status === 'executing');
    return {...result, output, foundation:result.status === 'done' ? tower.foundation(handle).source : undefined};
  } finally { tower.destroyExecution(handle); }
}

// The selected Tower test reads counted observations from a separate compiler instance.
const encoder = new TextEncoder();
let records, current;
const checks = await openTower({threads:{capacity:1}, imports:{
  inference_has_llvm: () => Boolean(llvm),
  inference_select(context, name) { current = records[guestString(context, name)]; },
  inference_read(context, name, dest, capacity) {
    const field = guestString(context, name);
    const value = current[field];
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    if (!(bytes instanceof Uint8Array)) throw new Error('Missing deduction observation ' + field);
    if (dest && bytes.length <= Number(capacity)) context.memory().set(bytes, Number(dest));
    return bytes.length;
  },
  deduction_execute(context, name) {
    current = execute(source(inputs + guestString(context, name)));
    return current.errorOffset ?? 0;
  },
}});
checks.configureModules({files:files.filter(({path}) => path.startsWith(cases) ||
  path === '.tower/compiler/semantic_types_test/observations.tower' ||
  path.startsWith('.tower/library/') || path === '.tower/backend/text.tower')});

function check(name, observations) {
  records = current = observations;
  try { runSelectedTest(checks, cases + name + '_test.tower', 300, {suffix:'_browser_test.tower'}); }
  finally { records = current = undefined; }
}

async function compare(path) {
  const text = source(path), wanted = await expected(path);
  const records = {};
  let canonical;
  for (const width of [4, 8]) for (const fast of [false, true]) {
    const direct = execute(text, width, fast);
    requireStatus(direct, 'done');
    canonical = direct.foundation;
    const replay = execute(canonical, width, fast);
    requireStatus(replay, 'done');
    records[(fast ? 'fast' : 'graph') + width * 8] = {expected:wanted, output:direct.output, Foundation:canonical,
      'replay output':replay.output, 'replay Foundation':replay.foundation};
  }
  if (llvm) {
    const outputs = {'LLVM source':await llvmOutput(llvm, text), 'LLVM Foundation':await llvmOutput(llvm, canonical)};
    for (const record of Object.values(records)) Object.assign(record, outputs);
  }
  check('engines', records);
}

test('generic calls infer collection element types and reuse explicit specializations', async () => {
  await compare('generic_stack_module');
  await compare(inputs + 'collections');
});
test('typed peers constrain literals in either position without narrowing signed minima or u64', () =>
  compare(inputs + 'typed_peers'));
test('deduction preserves argument effect order and exact pointer/array nominal constraints', () =>
  compare(inputs + 'argument_order'));
test('nested specializations and straight-return aliases preserve nominal type identity', async () => {
  await compare('generic_pointer_alias');
  await compare(inputs + 'nested_aliases');
});
test('unresolved or conflicting deductions diagnose and explicit calls remain supported', async () => {
  check('diagnostics', {explicit:{expected:await expected(inputs + 'explicit_call')}});
});
test('inferred calls retain deterministic specializations and typed completion', async () => {
  const text = source(inputs + 'identity');
  const first = execute(text), second = execute(text);
  requireStatus(first, 'done');
  requireStatus(second, 'done');
  const edit = source(inputs + 'completion');
  const completion = tower.complete(edit, Buffer.byteLength(edit.slice(0, edit.lastIndexOf(')'))));
  if (completion.error !== undefined) throw new Error(completion.error);
  const handle = tower.create(text);
  try {
    requireStatus(runToEnd(tower, handle).end, 'done');
    const formatted = tower.format(handle);
    if (formatted.error !== undefined) throw new Error(formatted.error);
    check('specialization', {expected:await expected(inputs + 'identity'), output:first.output, Foundation:first.foundation, 'second Foundation':second.foundation, formatted:formatted.source,
      'completion labels':'\n' + completion.options.map(option => option.label).join('\n') + '\n'});
  } finally { tower.destroy(handle); }
});
test('the shared inferred worker fixture preserves its scalar kernel behavior', () => compare(inputs + 'worker'));
