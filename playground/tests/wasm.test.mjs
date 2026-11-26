import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower, runToEnd } from './compiler-fixtures.mjs';
import { byteOffsets } from '../src/offsets.mjs';
import { guestString } from './guest_text.mjs';
import { moduleText, selectedCases } from './module_case_host.mjs';
import { numberField } from './parser_observations.mjs';
const bytes = await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const bootstrap = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const tower = await loadTower(bytes, undefined, bootstrap);
const example = await readFile(new URL('../../scaffolding/examples/foreach.tower', import.meta.url), 'utf8');
const numeric = await readFile(new URL('fixtures/numeric_token.tower', import.meta.url), 'utf8');
const base = numeric + "parse Variable = Identifier;parse Expression = Identifier | Number;parse Statement = Expression ';';";
const loop = "parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';parse Statement |= ForEach;";

function analyze(source) {
  const handle = tower.create(source);
  try { return { ...runToEnd(tower, handle), snapshot: tower.inspect(handle) }; }
  finally { tower.destroy(handle); }
}
test('all native node, parser and syntax tests also pass in WASM without exceptions', () => checkGrammar('self_tests'));
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
let offsets;
const fixtures = new Map(Object.entries({example, base, loop, numeric,
  names:await readFile(new URL('wasm_grammar_cases/highlight_names.tower', import.meta.url), 'utf8'),
}));
const grammarCase = selectedCases('wasm_grammar_cases', {
  grammar_self_test: () => tower.exports.tw_self_test(),
  grammar_open: (c, source) => openSession(guestString(c, source)),
  grammar_step(_, handle) { parsed = {end:tower.step(handle)}; },
  grammar_inspect(_, handle) {
    parsed = {snapshot:tower.inspect(handle), sourceBytes:Buffer.from(sessions.get(handle))};
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
    parsed = { ...analyze(source), sourceBytes:Buffer.from(source) };
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
    return moduleText(c, parsed.sourceBytes.toString('utf8', start, end));
  },
  grammar_highlight_revision: (_, i) => numberField(parsed.snapshot.highlights[i].revision),
  grammar_highlight_kind: (c, i) => moduleText(c, parsed.snapshot.highlights[i].kind),
  grammar_highlight_offset: (c, i, field) => numberField(parsed.snapshot.highlights[i][guestString(c, field)]),
});
async function checkGrammar(name, chunks) {
  try { await grammarCase(name, chunks); }
  finally {
    for (const handle of sessions.keys()) dispose(handle);
    parsed = offsets = undefined;
  }
}
test('real example crosses eight grammar revisions and retains named nested captures', () => checkGrammar('revisions'));
test('construct lookahead continues shared prefixes, preserves boundaries and reports real conflicts', () => checkGrammar('lookahead'));
test('keyword classification follows declaration boundaries, including removal and whole words', () => checkGrammar('keyword_boundaries'));
test('names keep identifier styling while actual keywords, grammar names and captures stay distinct', () => checkGrammar('name_styles'));
test('highlight preview never consumes input or commits future declarations', () => checkGrammar('preview'));
test('invalid grammar returns an error, preserves revision, and does not poison the next session', () => checkGrammar('invalid_grammar'));
test('UTF-8 spans, emoji, strings and comments survive the JSON and editor boundaries', () => checkGrammar('editor_offsets'));
test('new multi-character punctuation and malformed lexical input use the native scanner', () => checkGrammar('scanner'));

test('one foundation module bootstraps itself, installs idempotently and pins existing sessions', () => {
  const module = tower.createFoundation(bootstrap), pinned = tower.create('import foundation; print(3);');
  try {
    assert.equal(tower.step(pinned).revision, 1); // Freeze the imported grammar before editing its source.
    const initial = runToEnd(tower, module);
    assert.equal(initial.end.status, 'done', initial.end.error);
    assert.ok(tower.inspect(module).rules.some(rule => rule.name === 'CoreFunction'));
    tower.reset(module, bootstrap);
    assert.equal(runToEnd(tower, module).end.status, 'done');
    assert.equal(tower.inspect(module).grammarBuilds, 0);
    tower.configure(bootstrap); tower.configure(bootstrap);
    assert.equal(analyze('import foundation; fn answer(): i32 { return 42; } var x: i32 = answer(); print(x);').end.status, 'done');
    const edited = bootstrap + "\nparse CoreCall = 'invoke' $name:CoreLocation '(' $args:CoreArguments? ')';";
    assert.notEqual(edited, bootstrap);
    tower.configure(edited); tower.configure(edited);
    assert.equal(analyze('import foundation; invoke print(4);').end.status, 'done');
    assert.equal(analyze('import foundation; print(4);').end.status, 'error');
    assert.equal(runToEnd(tower, pinned).end.status, 'done');
    assert.throws(() => tower.configure(edited + '\nprint(5);'), /only token, skip and parse/);
    assert.equal(analyze('import foundation; invoke print(4);').end.status, 'done');
    tower.reset(module, bootstrap + '\nvar forbidden: i32;');
    assert.match(runToEnd(tower, module).end.error, /only token, skip and parse/);
  } finally { tower.configure(bootstrap); tower.destroy(module); tower.destroy(pinned); }
});
test('ABI rejects unsupported input and handles; repeated analysis releases native nodes', () => {
  assert.throws(() => tower.create('a\0b'), /UTF-8/);
  assert.throws(() => tower.create('a'.repeat(8 * 1024 * 1024 + 1)), /8 MiB/);
  const pointer = tower.exports.tw_alloc(2);
  new Uint8Array(tower.exports.memory.buffer).set([0xc0,0x80], pointer);
  assert.equal(tower.exports.tw_create(pointer, 2), 0); tower.exports.tw_free(pointer);
  assert.equal(tower.step(0).status, 'error');
  analyze(example);
  const nodes = tower.exports.tw_live_nodes(), allocations = tower.exports.tw_live_allocations();
  for (let i = 0; i < 30; i++) {
    analyze(i % 2 ? example : base + "parse Statement |= Expression ';';");
    assert.equal(tower.exports.tw_live_nodes(), nodes);
    assert.equal(tower.exports.tw_live_allocations(), allocations);
  }
});

test('edits reuse compiled grammars while matching fresh parsing, including changed syntax and recovery', () => {
  const normalize = result => JSON.parse(JSON.stringify(result, (key, value) =>
    ['id', 'grammarBuilds', 'grammarCacheHits', 'cachedGrammars'].includes(key) ? undefined : value));
  analyze(example); // Populate the retained import cache before measuring session ownership.
  const nodes = tower.exports.tw_live_nodes(), allocations = tower.exports.tw_live_allocations();
  const handle = tower.create(example);
  const parse = () => ({ ...runToEnd(tower, handle), snapshot: tower.inspect(handle) });
  try {
    assert.equal(parse().snapshot.grammarBuilds, 9); // Import transition, token and grammar declarations.
    tower.reset(handle, example.replace('item;', 'another;'));
    const edited = parse();
    assert.equal(edited.snapshot.grammarBuilds, 0);
    assert.equal(edited.snapshot.grammarCacheHits, 9); // The import boundary and eight local reader states.
    assert.deepEqual(normalize(edited), normalize(analyze(example.replace('item;', 'another;'))));
    for (const input of [
      base + 'for;' + loop + 'for(x in xs){}', // Cached future keywords must not activate early.
      example.replaceAll('foreach', 'walk'),
      base + "parse Statement |= Expression ';';", // Failed candidate never replaces a cached table.
      base + '42;',
      '// snow 雪🚀\n' + example, // New byte offsets, no grammar rebuild.
      "parse Statement = String ';';\"hello\";",
      example,
    ]) {
      tower.reset(handle, input);
      assert.equal(tower.inspect(handle).revision, 0);
      assert.equal(tower.inspect(handle).offset, 0);
      assert.deepEqual(normalize(parse()), normalize(analyze(input)));
    }
    const before = tower.inspect(handle);
    assert.throws(() => tower.reset(handle, 'a\0b'), /UTF-8/);
    assert.deepEqual(tower.inspect(handle), before); // Rejected ABI input leaves the session intact.
    assert.throws(() => tower.reset(0, ''), /Invalid session/);
    // Evict old versions rather than retaining every grammar ever typed.
    for (let i = 0; i < 32; i++) {
      tower.reset(handle, `parse Statement = 'word${i}' ';';word${i};`);
      assert.equal(parse().end.status, 'done');
      assert.ok(tower.inspect(handle).cachedGrammars <= 64);
    }
    tower.reset(handle, example);
    assert.deepEqual(normalize(parse()), normalize(analyze(example)));
  } finally { tower.destroy(handle); }
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
});

test('Tower token declarations redefine all three default terminals and introduce new tokens and comments', async () => {
  const source = await readFile(new URL('../../scaffolding/examples/tokens.tower', import.meta.url), 'utf8');
  const { events, end, snapshot } = analyze(source);
  assert.equal(end.status, 'done', end.error);
  assert.equal(end.revision, 11); assert.equal(events.length, 18);
  const bytes = new TextEncoder().encode(source), decode = t => new TextDecoder().decode(bytes.slice(t.start, t.end));
  for (const [text, kind] of [['player-name', 'identifier'], ['café', 'identifier'], ['3.14', 'number'],
    ['`hello from Tower`', 'string'], ['0xff', 'number'], ['@player', 'identifier'], ['@score', 'identifier']])
    assert.ok(snapshot.highlights.some(t => decode(t) === text && t.kind === kind), text);
  assert.ok(snapshot.highlights.some(t => t.kind === 'pattern'));
  assert.ok(snapshot.highlights.some(t => t.kind === 'comment' && decode(t).startsWith('#')));
  assert.equal(snapshot.tokens.find(t => t.name === 'Identifier').pattern, '@[A-Za-z_][A-Za-z_0-9]*');
  const handle = tower.create(source);
  try {
    runToEnd(tower, handle);
    tower.reset(handle, source.replace('3.14;', '6.28;'));
    assert.equal(runToEnd(tower, handle).end.status, 'done');
    assert.equal(tower.inspect(handle).grammarBuilds, 0);
    tower.reset(handle, source.replace('0x[0-9A-Fa-f]+', '0y[0-9A-Fa-f]+'));
    assert.equal(runToEnd(tower, handle).end.status, 'error'); // Cached old Hex must not match 0xff.
    tower.reset(handle, source.replaceAll('0x', '0y'));
    assert.equal(runToEnd(tower, handle).end.status, 'done');
  } finally { tower.destroy(handle); }
});

test('lexical replacements activate at declaration boundaries; failures preserve the previous token rules', () => {
  const start = "parse Statement = Identifier ';';plain;";
  const edit = "token Identifier = /@[a-z]+/ as identifier;";
  const handle = tower.create(start + edit + '@plain;');
  try {
    tower.step(handle); tower.step(handle);
    const preview = tower.inspect(handle);
    assert.equal(preview.revision, 1);
    assert.equal(preview.tokens.find(t => t.name === 'Identifier').pattern,
      analyze('').snapshot.tokens.find(t => t.name === 'Identifier').pattern);
    assert.ok(preview.highlights.some(t => t.kind === 'invalid')); // @ is not installed by inspection.
    assert.equal(tower.step(handle).revision, 2);
    assert.equal(tower.step(handle).status, 'statement');
    for (const bad of ['/[a-z]*/', '/[z-a]/', '/(abc/', '/\\d+/', '/a**/']) {
      tower.reset(handle, start + `token Identifier = ${bad};`);
      assert.equal(runToEnd(tower, handle).end.status, 'error');
      assert.equal(tower.inspect(handle).revision, 1);
      assert.equal(tower.inspect(handle).tokens.find(t => t.name === 'Identifier').pattern,
        analyze('').snapshot.tokens.find(t => t.name === 'Identifier').pattern);
    }
  } finally { tower.destroy(handle); }
  assert.equal(analyze(start + edit + 'plain;').end.status, 'error');
  assert.equal(analyze(start + edit + "parse Other = Identifier ':' Identifier ';';parse Statement |= Other;@a:@b;").end.status, 'error');
  assert.equal(analyze(start + "parse Other = Identifier ':' Identifier ';';parse Statement |= Other;" + edit + '@a:@b;').end.status, 'done');
  // Longest match and then declaration order; grammar literals win equal ties.
  assert.equal(analyze("token Foo = /foo/;parse Statement = Foo ';';foo;").end.status, 'error'); // Identifier was declared first.
  assert.equal(analyze("parse Statement = 'foo' ';';foo;").end.status, 'done');
});

test('foundation inherits bedrock tokens, adds its own tokens and installs atomically', () => {
  const handle = tower.create("parse Statement = Identifier ';';original;");
  try {
    tower.configure(String.raw`token Word = /@[a-z]+/ as string;`);
    assert.equal(analyze("import foundation; parse Statement = Word ';';@hello;").end.status, 'done');
    assert.equal(analyze("parse Statement = Identifier ';';hello;").end.status, 'done');
    assert.throws(() => tower.configure('token Bad = /a*/;'), /empty input/);
    assert.equal(analyze("import foundation; parse Statement = Word ';';@hello;").end.status, 'done');
    assert.equal(runToEnd(tower, handle).end.status, 'done'); // Existing session's seed is pinned.
    tower.reset(handle, "parse Statement = Identifier ';';original;");
    assert.equal(runToEnd(tower, handle).end.status, 'done');
  } finally { tower.configure(bootstrap); tower.destroy(handle); }
});
