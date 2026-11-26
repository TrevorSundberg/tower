import {after, test} from 'node:test';
import {readFileSync} from 'node:fs';
import {loadTower, runToEnd} from '../src/tower-host.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {numberField} from './parser_observations.mjs';
import {requireStatus, runSelectedTest} from './selected_test.mjs';

const library = new URL('../../scaffolding/', import.meta.url);
const cases = new URL('./fixtures/formatter_port/', import.meta.url);
const read = (root, path) => readFileSync(new URL(path, root), 'utf8');
const builtins = Object.fromEntries(['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower']
  .map(name => [name, read(library, name + '.tower')]));
const wasm = await WebAssembly.compile(readFileSync(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url)));
const open = imports => loadTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock,
  {builtins, tower:builtins.tower, imports});

const subject = await open({});
let response;
function sourceText(context, result) {
  if (result.error !== undefined) throw new Error(result.error);
  response = result;
  return copyText(context, result.source);
}

const checks = await open({
  formatter_file(context, path) {
    const name = guestString(context, path);
    if (!['mappings.tower', 'mappings.expected', 'boundaries.tower'].includes(name))
      throw new Error('Unknown formatter fixture ' + name);
    return copyText(context, read(cases, name));
  },
  formatted_source(context, input) {
    const handle = subject.create(guestString(context, input));
    try {
      requireStatus(runToEnd(subject, handle).end, 'done');
      return sourceText(context, subject.format(handle));
    } finally { subject.destroy(handle); }
  },
  canonical_foundation(context, input) {
    const handle = subject.compile(guestString(context, input));
    try { return sourceText(context, subject.foundation(handle)); }
    finally { subject.destroyExecution(handle); }
  },
  formatter_response: context => copyText(context, JSON.stringify(response)),
  formatter_span_count: () => response.spans.length,
  formatter_span_field: (context, index, field) => numberField(response.spans[index][guestString(context, field)]),
});
after(() => { checks.close(); subject.close(); });

function check(name) {
  const suffix = '_' + name + '_test.tower';
  const files = ['library/testing', 'backend/text', 'library/vector']
    .map(path => ({path:'.tower/' + path + '.tower', text:read(library, path + '.tower')}));
  for (const path of ['formatter.tower', 'formatter' + suffix]) {
    files.push({path, text:read(cases, path)});
  }
  try { runSelectedTest(checks, 'formatter.tower', 100, {files, suffix}); }
  finally { response = undefined; }
}

test('formatter preserves exact UTF-8 source token mappings through comments and blank lines', () => check('mappings'));
test('formatter round trips signed minima, unsigned maxima, pointer/array types and builtins', () => check('boundaries'));
test('deterministic spacing trials preserve source and foundation round trips', () => check('spacing'));
