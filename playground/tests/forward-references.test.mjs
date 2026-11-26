import {test} from 'node:test';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';

const input = file => fixtureSource('.tower/tests/forward_inputs/' + file);
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

const tower = await openTower();
const sessions = new Set();
let outputs, event;
const observations = {
  parser_open(context, _root, name) {
    const handle = tower.create(input(guestString(context, name)));
    sessions.add(handle);
    return handle;
  },
  parser_close(_context, handle) {
    tower.destroy(handle);
    sessions.delete(handle);
  },
  parser_step(_context, handle) { event = tower.step(handle); },
  parser_pending(context, handle, rule) {
    const name = guestString(context, rule);
    const found = tower.inspect(handle).rules.find(item => item.name === name);
    if (!found) throw new Error("Missing grammar rule " + name);
    return found.pending;
  },
  parser_revision: (_context, handle) => tower.inspect(handle).revision,
  event_text: (context, field) => copyText(context, event[guestString(context, field)]),
  event_offset: () => event.errorOffset,
  observed_text: (context, name) => copyText(context, outputs.get(guestString(context, name))),
  execute_fixture(context, file) {
    const handle = tower.compile(input(guestString(context, file)));
    try { event = tower.execute(handle); }
    finally { tower.destroyExecution(handle); }
  },
};

// Keep the assertion interpreter independent of the parser handles it observes.
const checks = await openTower({imports:observations});
function check(name, observed = new Map()) {
  try {
    outputs = observed;
    outputs.set('foundation_syntax.tower', fixtureSource('.tower/foundation_syntax.tower'));
    runSelectedTest(checks, `.tower/tests/forward_browser/${name}.tower`);
  } finally {
    for (const open of sessions) tower.destroy(open);
    sessions.clear();
    outputs = undefined;
    event = undefined;
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
  const llvm = await openLLVM();
  const handle = tower.compile(source);
  try {
    const result = tower.execute(handle);
    if (result.status !== 'done') throw new Error(result.error);
    const observed = new Map([['interpreter', result.output]]);
    const canonical = tower.foundation(handle);
    for (const [engine, text] of [['LLVM source', source], ['LLVM Foundation', canonical.source]]) {
      observed.set(engine, await llvmOutput(llvm, text));
    }
    check('module', observed);
  } finally { tower.destroyExecution(handle); }
});
