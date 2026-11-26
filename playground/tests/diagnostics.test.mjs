import {test} from 'node:test';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openTower, runSelectedTest} from './compiler_test_host.mjs';

const cases = '.tower/compiler/format_diagnostic_cases/';
const parser = await openTower();
const encoder = new TextEncoder();
function copyText(context, text) {
  if (typeof text !== 'string') throw new Error('Missing parser text');
  const bytes = encoder.encode(text);
  const address = context.allocate(bytes.length + 1);
  if (!address) throw new Error('Cannot allocate parser observation');
  const memory = context.memory();
  memory.set(bytes, address);
  memory[address + bytes.length] = 0;
  return address;
}

function numberField(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid numeric parser observation');
  return value;
}

let selected, handle, source, end;
const checks = await openTower({imports:{
  selected_diagnostic_case: context => copyText(context, selected),
  diagnostic_read(context, file, edit) {
    source = fixtureSource(cases + 'inputs/' + guestString(context, file) + '.tower');
    if (edit) parser.reset(handle, source);
    else {
      if (handle) parser.destroy(handle);
      handle = undefined;
      handle = parser.create(source);
    }
    end = runToEnd(parser, handle).end;
    return end.status === 'done';
  },
  diagnostic_text: context => copyText(context, end.error),
  diagnostic_offset: () => numberField(end.errorOffset),
  diagnostic_length: () => end.errorLength === undefined ? -1 : numberField(end.errorLength),
  diagnostic_cache_hits: () => numberField(parser.inspect(handle).grammarCacheHits),
  diagnostic_source_size: () => encoder.encode(source).length,
  diagnostic_foundation_syntax: context => copyText(context, fixtureSource('.tower/foundation_syntax.tower')),
}});

// The assertion reactor only compiles the companion, its fixture imports and text helpers.
checks.configureModules({files:files.filter(({path}) => path.startsWith(cases) ||
  path === '.tower/compiler/format_diagnostic_test.tower' || path === '.tower/backend/text.tower' ||
  path.startsWith('.tower/library/'))});

function check(name) {
  selected = name;
  try { runSelectedTest(checks, cases + 'session_wasm.tower', undefined, {suffix:'_wasm.tower'}); }
  finally {
    if (handle) parser.destroy(handle);
    handle = end = source = selected = undefined;
  }
}

test('missing delimiters are inferred from the active grammar and point at the insertion gap', () => check('delimiters'));

test('an omitted declaration separator reports both type and initializer alternatives', () => check('separator'));

test('line breaks suggest a unique construct boundary without claiming other repairs are impossible', () => check('line_break'));

test('user grammar literals, including keywords, participate without compiler annotations', () => check('literals'));

test('ambiguous or unsuccessful repairs report valid alternatives without claiming a fix', () => check('ambiguous'));

test('conflicts describe both choices, rule definitions and source locations', () => check('conflicts'));

test('cached grammar diagnostics use current source locations after comments move rules', () => check('cache'));

test('contextual lexer rules use the speculative parser state without altering the source', () => check('contextual'));

test('large expected sets and deep invalid input fall back without a definite repair or parser internals', () => check('limits'));

test('statement boundaries never cite an unstarted call or other possible next rule', () => check('boundaries'));
