import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower();
const fixtures = new URL('./fixtures/formatting/', import.meta.url);
const utf8 = new TextDecoder('utf-8', {fatal:true, ignoreBOM:true});
const read = async path => utf8.decode(await readFile(new URL(path, fixtures)));

const library = ['testing', 'test_fixtures'].map(stem => {
  const path = '.tower/library/' + stem + '.tower';
  return {path, text:fixtureSource(path)};
});

function parseAndFormat(source) {
  const handle = tower.create(source);
  try {
    requireStatus(runToEnd(tower, handle).end, 'done');
    return tower.format(handle);
  } finally { tower.destroy(handle); }
}

function format(source) {
  const result = parseAndFormat(source);
  if (result.error !== undefined) throw new Error(result.error);
  return result.source;
}

async function twice(name, source) {
  const formatted = format(source);
  return {formatted, second:format(formatted), wanted:await read(name + '.expected')};
}

// Supply a read-only owner module of measured byte strings to each companion.
// This same project can be materialized for the installed towerc --test entry.
async function check(name, fields) {
  let owner = 'import library.test_fixtures;\n';
  for (const [field, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || /[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value))
      throw new Error('Unrepresentable formatting observation ' + field);
    owner += `var ${field}: FixtureBytes = {data: ${JSON.stringify(value)}, length: ${Buffer.byteLength(value)}};\n`;
  }
  const entry = name + '.tower', companion = name + '_test.tower';
  const files = [...library, {path:entry, text:owner}, {path:companion, text:await read('checks/' + companion)}];
  try { runSelectedTest(tower, entry, undefined, {files}); }
  finally { tower.configureModules({entry:'input.tower', files:[]}); }
}

test('source and foundation formatting share declaration spacing and indentation', async () => {
  const rows = await twice('declarations', await read('declarations.tower'));
  const handle = tower.compile(rows.formatted);
  let canonical;
  try { canonical = tower.foundation(handle); }
  finally { tower.destroyExecution(handle); }
  if (canonical.error !== undefined) throw new Error(canonical.error);
  await check('declarations', {...rows, canonical:canonical.source, canonical_format:format(canonical.source)});
});

test('comments, strings and replacement invocations retain their original meaning', async () => {
  const rows = await twice('comments', await read('comments.tower'));
  const literal = await read('literal.tower');
  await check('comments', {...rows, literal, literal_format:format(literal)});
});

test('formatting refuses a layout that changes custom lexical meaning', async () => {
  const result = parseAndFormat(await read('refusal.tower'));
  const literal = await read('literal.tower');
  await check('refusal', {diagnostic:result.error ?? '', wanted:await read('refusal.expected'),
    literal, recovered:format(literal)});
});

test('custom prefix and postfix operators attach to their operand, including increment', async () => {
  const definitions = fixtureSource('.tower/tests/increment_builtin.tower');
  const rows = await twice('increment', definitions + await read('increment_suffix.tower'));
  const example = fixtureSource('.tower/examples/increment.tower');
  await check('increment', {...rows, example, example_format:format(example)});
});

test('affix spacing follows rule shape, keeps infix spacing and separates adjacent operators', async () => {
  await check('affixes', await twice('affixes', await read('affixes.tower')));
});
