import {test} from 'node:test';
import {Text} from '@codemirror/state';
import {documentLocation, sourceLocation} from '../src/source-location.mjs';
import {sourceDiagnostic} from '../src/diagnostics.mjs';
import {byteOffsets} from '../src/offsets.mjs';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openTower, runSelectedTest} from './compiler_test_host.mjs';
import {copyText, diagnosticFields, numberField} from './parser_observations.mjs';

const cases = '.tower/compiler/format_diagnostic_cases/';
const encoder = new TextEncoder();

const editorCases = '.tower/compiler/syntax_source_cases/';
let parser, source, end, points;
const compiler = await openTower({imports:{
  observe_editor(context, text, file, cursorOffset, errorOffset) {
    const source = guestString(context, text), path = guestString(context, file);
    const doc = Text.of(source.split('\n'));
    points = {
      cursor: documentLocation(doc, cursorOffset, path),
      diagnostic: sourceDiagnostic(doc, byteOffsets(source), {errorOffset, error:'Unexpected ?'}, [], path),
    };
  },
  editor_number: (context, point, field) => numberField(points[guestString(context, point)][guestString(context, field)]),
  editor_text(context, point, field) {
    const location = points[guestString(context, point)], key = guestString(context, field);
    return copyText(context, key === 'label' ? sourceLocation(location.file, location.line, location.column) : location[key]);
  },
  editor_display_label: (context, file, line, column) => copyText(context,
    sourceLocation(guestString(context, file), line, column)),
  editor_default_label: (context, line) => copyText(context, sourceLocation(undefined, line)),
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

compiler.configureModules({files:files.filter(({path}) => path.startsWith(cases) || path.startsWith(editorCases) ||
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

test('cursor and diagnostic locations share filenames and Unicode scalar columns', () => {
  try { runSelectedTest(compiler, editorCases + 'editor.tower'); }
  finally { points = undefined; }
});
