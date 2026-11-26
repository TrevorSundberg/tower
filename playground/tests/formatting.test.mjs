import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';

const owner = '.tower/compiler/syntax_session_format';
const inputs = 'compiler/syntax_session_format_inputs/';
const root = new URL('../../scaffolding/', import.meta.url);
const oracles = new Map();
for (const name of ['declarations', 'declarations_foundation', 'comments', 'refusal', 'increment', 'affixes']) {
  const path = inputs + name + '.expected';
  oracles.set(path, await readFile(new URL(path, root)));
}

const encoder = new TextEncoder();
function copyBytes(context, bytes, size) {
  const data = typeof bytes === 'string' ? encoder.encode(bytes) : bytes;
  const pointer = context.allocate(data.length + 1);
  if (!pointer) throw new Error('Unable to allocate formatted text');
  const memory = context.memory();
  memory.set(data, pointer);
  memory[pointer + data.length] = 0;
  new DataView(memory.buffer, memory.byteOffset).setUint32(size, data.length, true);
  return pointer;
}

const checks = await openTower({imports:{
  format_case_read(context, path, size) {
    const name = guestString(context, path);
    return copyBytes(context, oracles.get(name) ?? fixtureSource('.tower/' + name), size);
  },
  format_case_apply(context, text, refusal, size) {
    checks.configureModules({entry:'input.tower'});
    const handle = checks.create(guestString(context, text));
    try {
      requireStatus(runToEnd(checks, handle).end, 'done');
      const result = checks.format(handle);
      if (refusal ? typeof result.error !== 'string' : result.error !== undefined)
        throw new Error(result.error ?? 'Formatter accepted a layout that changes the parse');
      return copyBytes(context, refusal ? result.error : result.source, size);
    } finally { checks.destroy(handle); }
  },
  format_case_foundation(context, text, size) {
    const handle = checks.compile(guestString(context, text));
    try {
      const canonical = checks.foundation(handle);
      if (canonical.error !== undefined) throw new Error(canonical.error);
      return copyBytes(context, canonical.source, size);
    } finally { checks.destroyExecution(handle); }
  },
}});

// The public API provides the compiler services to these same assertion bodies.
// Select their checked-in helper as the browser owner to avoid compiling a
// second copy of the production parser inside the assertion interpreter.
const cases = owner + '_cases';
checks.configureModules({files:files.filter(({path}) => path.startsWith(cases) ||
  path === '.tower/library/testing.tower' || path === '.tower/library/test_fixtures.tower')});
function check(name) {
  runSelectedTest(checks, cases + '.tower', undefined, {suffix:'_' + name + '_test.tower'});
}

test('source and foundation formatting share declaration spacing and indentation', () => check('declarations'));
test('comments, strings and replacement invocations retain their original meaning', () => check('comments'));
test('formatting refuses a layout that changes custom lexical meaning', () => {
  const pending = checks.create(fixtureSource('.tower/' + inputs + 'declarations.tower'));
  try {
    const step = checks.step(pending);
    assert.ok(step.status === 'statement' || step.status === 'declaration', step.status);
  } finally { checks.destroy(pending); }
  assert.equal(checks.inspect(pending).error, 'Invalid session handle');
  check('refusal');
});
test('custom prefix and postfix operators attach to their operand, including increment', () => check('increment'));
test('affix spacing follows rule shape, keeps infix spacing and separates adjacent operators', () => check('affixes'));
