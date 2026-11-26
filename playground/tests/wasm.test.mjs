import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadTower, runToEnd } from './compiler-fixtures.mjs';
import { byteOffsets } from '../src/offsets.mjs';
import { guestString } from './guest_text.mjs';
import { moduleText, selectedCases } from './module_case_host.mjs';
import { numberField } from './parser_observations.mjs';
const bytes = await readFile(process.env.TOWER_TEST_WASM || new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const bootstrap = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const tower = await loadTower(bytes, undefined, bootstrap);
const example = await readFile(new URL('../../scaffolding/examples/foreach.tower', import.meta.url), 'utf8');
const numeric = await readFile(new URL('fixtures/numeric_token.tower', import.meta.url), 'utf8');
const base = numeric + await readFile(new URL('wasm_grammar_cases/base_rules.tower', import.meta.url), 'utf8');
const loop = await readFile(new URL('wasm_grammar_cases/loop_rules.tower', import.meta.url), 'utf8');

function analyze(source) {
  const handle = tower.create(source);
  try { return { ...runToEnd(tower, handle), snapshot: tower.inspect(handle) }; }
  finally { tower.destroy(handle); }
}
// The assertion VM reads the same public parser records as the other Wasm
// tests in this file. Parsing another input replaces the current record.
let parsed;
const sessions = new Map();
function openSession(source, create = tower.create) {
  const handle = create(source);
  sessions.set(handle, source);
  return handle;
}
function dispose(handle) {
  tower.destroy(handle);
  sessions.delete(handle);
}
// A counted ABI input may contain embedded NULs.
function countedString(context, pointer, length) {
  return new TextDecoder('utf-8', {fatal:true}).decode(context.memory().slice(pointer, pointer + length));
}
let offsets, sourceBytes;
let restoreFoundation = false;
function configure(source) {
  restoreFoundation = true;
  tower.configure(source);
}
function errorMessage(action) {
  try { action(); return ''; }
  catch (error) { return error.message; }
}
const fixtures = new Map(Object.entries({example, base, loop, numeric, bootstrap,
  tokens:await readFile(new URL('../../scaffolding/examples/tokens.tower', import.meta.url), 'utf8'),
  names:await readFile(new URL('wasm_grammar_cases/highlight_names.tower', import.meta.url), 'utf8'),
}));
const grammarCase = selectedCases('wasm_grammar_cases', {
  live_nodes: () => tower.exports.tw_live_nodes(),
  live_allocations: () => tower.exports.tw_live_allocations(),
  abi_create_error(c, input, length) {
    const source = countedString(c, input, length);
    return moduleText(c, errorMessage(() => openSession(source)));
  },
  abi_repeated_source_error(c, input, count) {
    const source = guestString(c, input).repeat(count);
    return moduleText(c, errorMessage(() => openSession(source)));
  },
  abi_reset_error(c, handle, input, length) {
    const source = countedString(c, input, length);
    return moduleText(c, errorMessage(() => tower.reset(handle, source)));
  },
  abi_create_bytes(c, input, length) {
    const pointer = tower.exports.tw_alloc(length);
    if (!pointer) throw new Error('Cannot allocate ABI input');
    try {
      new Uint8Array(tower.exports.memory.buffer).set(c.memory().subarray(input, input + length), pointer);
      const handle = tower.exports.tw_create(pointer, length);
      if (handle) sessions.set(handle, '');
      return handle;
    } finally { tower.exports.tw_free(pointer); }
  },
  grammar_parse_live(_, handle) {
    parsed = {...runToEnd(tower, handle), snapshot:tower.inspect(handle)};
  },
  grammar_record(c, omitted) {
    const exclude = new Set(guestString(c, omitted).split(' ').filter(Boolean));
    // Object key order is immaterial to deep equality. Preserve array order and all values.
    const json = JSON.stringify(parsed, (key, value) => {
      if (exclude.has(key)) return undefined;
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
      return Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]]));
    });
    return moduleText(c, json);
  },
  grammar_self_test: () => tower.exports.tw_self_test(),
  grammar_open: (c, source) => openSession(guestString(c, source)),
  foundation_open: (c, source) => openSession(guestString(c, source), tower.createFoundation),
  foundation_install: (c, source) => configure(guestString(c, source)),
  foundation_install_error: (c, input) => {
    const source = guestString(c, input);
    return moduleText(c, errorMessage(() => configure(source)));
  },
  grammar_dispose: (_, handle) => dispose(handle),
  grammar_reset(c, handle, input) {
    const source = guestString(c, input);
    tower.reset(handle, source);
    sessions.set(handle, source);
  },
  grammar_finish(_, handle) { parsed = runToEnd(tower, handle); },
  grammar_rows: (c, table) => parsed.snapshot[guestString(c, table)].length,
  grammar_field: (c, table, i, field) => moduleText(c, parsed.snapshot[guestString(c, table)][i][guestString(c, field)]),
  grammar_step(_, handle) { parsed = {end:tower.step(handle)}; },
  grammar_inspect(_, handle) {
    parsed = {snapshot:tower.inspect(handle)};
    sourceBytes = Buffer.from(sessions.get(handle));
  },
  grammar_number: (c, field) => numberField(parsed.snapshot[guestString(c, field)]),
  grammar_end_offset: () => numberField(parsed.end.errorOffset),
  grammar_node_terminal: (_, i, j) => parsed.events[i].nodes[j].production === null,
  editor_offsets(c, input) { offsets = byteOffsets(guestString(c, input)); },
  editor_slice: (c, input, start, end) =>
    moduleText(c, guestString(c, input).slice(offsets[start], offsets[end])),
  editor_offsets_count: () => offsets.length,
  editor_offset: (_, i) => numberField(offsets[i]),
  editor_source_units: (c, input) => guestString(c, input).length,
  editor_encoded_bytes: (c, input) => new TextEncoder().encode(guestString(c, input)).length,
  grammar_fixture: (c, name) => moduleText(c, fixtures.get(guestString(c, name))),
  grammar_parse(c, input) {
    const source = guestString(c, input);
    parsed = analyze(source);
    sourceBytes = Buffer.from(source);
  },
  grammar_end_text: (c, field) => moduleText(c, parsed.end[guestString(c, field)]),
  grammar_end_revision: () => numberField(parsed.end.revision),
  grammar_events: () => parsed.events.length,
  grammar_event_revision: (_, i) => numberField(parsed.events[i].revision),
  grammar_event_status: (c, i) => moduleText(c, parsed.events[i].status),
  grammar_nodes: (_, i) => parsed.events[i].nodes.length,
  grammar_node_text: (c, i, j, field) => moduleText(c, parsed.events[i].nodes[j][guestString(c, field)]),
  grammar_node_offset: (c, i, j, field) => numberField(parsed.events[i].nodes[j][guestString(c, field)]),
  grammar_keywords: () => parsed.snapshot.keywords.length,
  grammar_keyword: (c, i) => moduleText(c, parsed.snapshot.keywords[i]),
  grammar_highlights: () => parsed.snapshot.highlights.length,
  grammar_highlight_text(c, i) {
    const {start, end} = parsed.snapshot.highlights[i];
    return moduleText(c, sourceBytes.toString('utf8', start, end));
  },
  grammar_highlight_revision: (_, i) => numberField(parsed.snapshot.highlights[i].revision),
  grammar_highlight_kind: (c, i) => moduleText(c, parsed.snapshot.highlights[i].kind),
  grammar_highlight_offset: (c, i, field) => numberField(parsed.snapshot.highlights[i][guestString(c, field)]),
});
async function checkGrammar(name, chunks) {
  try { await grammarCase(name, chunks); }
  finally {
    try { if (restoreFoundation) tower.configure(bootstrap); }
    finally {
      restoreFoundation = false;
      for (const handle of sessions.keys()) dispose(handle);
    }
    parsed = sourceBytes = offsets = undefined;
  }
}
test('all native node, parser and syntax tests also pass in WASM without exceptions', () => checkGrammar('self_tests'));
test('real example crosses eight grammar revisions and retains named nested captures', () => checkGrammar('revisions'));
test('construct lookahead continues shared prefixes, preserves boundaries and reports real conflicts', () => checkGrammar('lookahead'));
test('keyword classification follows declaration boundaries, including removal and whole words', () => checkGrammar('keyword_boundaries'));
test('names keep identifier styling while actual keywords, grammar names and captures stay distinct', () => checkGrammar('name_styles'));
test('highlight preview never consumes input or commits future declarations', () => checkGrammar('preview'));
test('invalid grammar returns an error, preserves revision, and does not poison the next session', () => checkGrammar('invalid_grammar'));
test('UTF-8 spans, emoji, strings and comments survive the JSON and editor boundaries', () => checkGrammar('editor_offsets'));
test('new multi-character punctuation and malformed lexical input use the native scanner', () => checkGrammar('scanner'));

test('one foundation module bootstraps itself, installs idempotently and pins existing sessions', () => checkGrammar('foundation_install'));
test('ABI rejects unsupported input and handles; repeated analysis releases native nodes', () => checkGrammar('abi_disposal'));

test('edits reuse compiled grammars while matching fresh parsing, including changed syntax and recovery', () => checkGrammar('parse_reuse', 448));

test('Tower token declarations redefine all three default terminals and introduce new tokens and comments', () => checkGrammar('token_declarations'));

test('lexical replacements activate at declaration boundaries; failures preserve the previous token rules', () => checkGrammar('lexical_replacement'));

test('foundation inherits bedrock tokens, adds its own tokens and installs atomically', () => checkGrammar('foundation_tokens'));
