import {after, test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {executeWasm, files, loadLLVM, loadTower} from './compiler-fixtures.mjs';

const read = path => readFile(new URL('../../' + path, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const sources = new Map(files.map(({path, text}) => [path, text]));
function input(file) {
  const source = sources.get('.tower/tests/forward_inputs/' + file);
  if (source === undefined) throw new Error('Missing forward reference fixture ' + file);
  return source;
}

const decoder = new TextDecoder('utf-8', {fatal:true});
function string(context, pointer) {
  const memory = context.memory();
  const end = memory.indexOf(0, pointer);
  if (!pointer || end < 0) throw new Error('Invalid fixture string');
  return decoder.decode(memory.subarray(pointer, end));
}

const bytes = process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm');
const tower = await loadTower(bytes, undefined, foundation);
after(() => tower.close());
const steps = new Map();
const outputs = new Map();
let selection;
const observations = {
  selected: (context, name) => selection === string(context, name),
  parser_open(context, _root, name) {
    const handle = tower.create(input(string(context, name)));
    steps.set(handle, undefined);
    return handle;
  },
  parser_close(_context, handle) {
    tower.destroy(handle);
    steps.delete(handle);
  },
  parser_step_is(context, handle, wanted) {
    const event = tower.step(handle);
    steps.set(handle, event);
    return event.status === string(context, wanted);
  },
  parser_pending(context, handle, rule) {
    const name = string(context, rule);
    return steps.get(handle).rules.find(item => item.name === name)?.pending ?? false;
  },
  parser_revision: (_context, handle) => tower.inspect(handle).revision,
  parser_diagnostic(context, handle, message, offset) {
    const event = steps.get(handle);
    return event.errorOffset === offset && event.error.includes(string(context, message));
  },
  foundation_contains: (context, _root, rule) =>
    sources.get('.tower/foundation_syntax.tower').includes(string(context, rule)),
  output_equals: (context, engine, wanted) =>
    outputs.get(string(context, engine)) === string(context, wanted),
  compile_rejected(context, file, message, offset) {
    const handle = tower.compile(input(string(context, file)));
    try {
      const result = tower.execute(handle);
      return result.status === 'error' && result.errorOffset === offset && result.error === string(context, message);
    } finally { tower.destroyExecution(handle); }
  },
};

// Keep the assertion interpreter independent of the parser handles it observes.
const checks = await loadTower(bytes, undefined, foundation, undefined, undefined, {imports:observations});
after(() => checks.close());
const entry = '.tower/tests/forward_browser.tower';
function check(name) {
  selection = name;
  const handle = checks.compile(sources.get(entry));
  try {
    const result = checks.execute(handle);
    if (result.status !== 'done') throw new Error(result.error || result.status);
  } finally {
    checks.destroyExecution(handle);
    for (const handle of steps.keys()) tower.destroy(handle);
    steps.clear();
  }
}

test('forward rule and token dependencies resolve before root activation', () => {
  check('graph');
});
test('incomplete active grammars fail at activation; unresolved module references fail at EOF', () => {
  check('activation');
});
test('forward rules follow declaration grammar changes without prescanning or changing pinned sessions', () => {
  check('pinned');
});
test('module functions, types and variables resolve forward, preserving initialization order and local scopes', async () => {
  const source = input('module.tower');
  const llvm = await loadLLVM(process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);
  const handle = tower.compile(source);
  try {
    const result = tower.execute(handle);
    if (result.status !== 'done') throw new Error(result.error);
    outputs.set('interpreter', result.output);
    const canonical = tower.foundation(handle);
    for (const [engine, text] of [['LLVM source', source], ['LLVM Foundation', canonical.source]]) {
      const compiled = llvm.compile(text);
      if (compiled.status !== 'compiled') throw new Error(compiled.error);
      outputs.set(engine, (await executeWasm(compiled)).output);
    }
    check('module');
  } finally { tower.destroyExecution(handle); }
});
