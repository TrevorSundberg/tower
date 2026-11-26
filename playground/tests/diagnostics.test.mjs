import {test} from 'node:test';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openTower, runSelectedTest} from './compiler_test_host.mjs';
import {copyText, diagnosticFields, numberField} from './parser_observations.mjs';

const cases = '.tower/compiler/format_diagnostic_cases/';
const encoder = new TextEncoder();

let parser, source, end;
const compiler = await openTower({imports:{
  diagnostic_read(context, file, edit) {
    source = fixtureSource(cases + 'inputs/' + guestString(context, file) + '.tower');
    // Compilation saved the assertion handle's source map. Give the parser
    // its own entry path before opening this case's first subject handle.
    if (!parser) compiler.configureModules({entry:'input.tower'});
    if (edit) compiler.reset(parser, source);
    else {
      if (parser) compiler.destroy(parser);
      parser = undefined;
      parser = compiler.create(source);
    }
    end = runToEnd(compiler, parser).end;
    return end.status === 'done';
  },
  ...diagnosticFields(() => end),
  diagnostic_cache_hits: () => numberField(compiler.inspect(parser).grammarCacheHits),
  diagnostic_source_size: () => encoder.encode(source).length,
  diagnostic_foundation_syntax: context => copyText(context, fixtureSource('.tower/foundation_syntax.tower')),
}});

compiler.configureModules({files:files.filter(({path}) => path.startsWith(cases) ||
  path === '.tower/backend/text.tower' || path.startsWith('.tower/library/'))});

function check(name) {
  try { runSelectedTest(compiler, cases + name + '.tower'); }
  finally {
    if (parser) compiler.destroy(parser);
    parser = source = end = undefined;
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
