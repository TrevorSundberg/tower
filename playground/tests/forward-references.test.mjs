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

const encoder = new TextEncoder();
function copyText(context, value) {
  if (typeof value !== 'string') throw new Error('Missing text observation');
  const bytes = encoder.encode(value);
  const pointer = context.allocate(bytes.length + 1);
  if (!pointer) throw new Error('Unable to copy observation into Tower');
  const memory = context.memory();
  memory.set(bytes, pointer);
  memory[pointer + bytes.length] = 0;
  return pointer;
}

const bytes = process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm');
const tower = await loadTower(bytes, undefined, foundation);
after(() => tower.close());
const sessions = new Set();
const outputs = new Map([['foundation_syntax.tower', sources.get('.tower/foundation_syntax.tower')]]);
let selection, event;
const observations = {
  selected: (context, name) => selection === string(context, name),
  parser_open(context, _root, name) {
    const handle = tower.create(input(string(context, name)));
    sessions.add(handle);
    return handle;
  },
  parser_close(_context, handle) {
    tower.destroy(handle);
    sessions.delete(handle);
  },
  parser_step(_context, handle) { event = tower.step(handle); },
  parser_pending(context, handle, rule) {
    const name = string(context, rule);
    const found = tower.inspect(handle).rules.find(item => item.name === name);
    if (!found) throw new Error("Missing grammar rule " + name);
    return found.pending;
  },
  parser_revision: (_context, handle) => tower.inspect(handle).revision,
  event_text: (context, field) => copyText(context, event[string(context, field)]),
  event_offset: () => event.errorOffset,
  observed_text: (context, name) => copyText(context, outputs.get(string(context, name))),
  execute_fixture(context, file) {
    const handle = tower.compile(input(string(context, file)));
    try { event = tower.execute(handle); }
    finally { tower.destroyExecution(handle); }
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
    checks.useFast(handle);
    for (let chunk = 0; chunk < 10; chunk++) {
      const result = checks.execute(handle, 100_000);
      if (result.status === "done") return;
      if (result.status !== "executing") throw new Error(result.error || result.status);
    }
    throw new Error("Forward-reference assertions exceeded one million steps");
  } finally {
    checks.destroyExecution(handle);
    for (const open of sessions) tower.destroy(open);
    sessions.clear();
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
