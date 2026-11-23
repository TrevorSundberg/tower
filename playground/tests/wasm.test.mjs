import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower, runToEnd } from './compiler-fixtures.mjs';
import { byteOffsets } from '../src/offsets.mjs';
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
test('all native node, parser and syntax tests also pass in WASM without exceptions', () => {
  assert.equal(tower.exports.tw_self_test(), 0);
});
test('real example crosses eight grammar revisions and retains named nested captures', () => {
  const { events, end, snapshot } = analyze(example);
  assert.equal(end.status, 'done'); assert.equal(end.revision, 8);
  assert.deepEqual(events.map(e => e.revision), [1,2,3,4,5,6,7,7,8,8]);
  const first = events[7].nodes;
  assert.equal(first.filter(n => n.role === 'Variable').length, 2);
  assert.equal(first.filter(n => n.role === 'Statement').length, 2);
  assert.deepEqual(snapshot.keywords, [...new Set([...analyze('').snapshot.keywords, 'foreach', 'in'])].sort());
  assert.ok(snapshot.highlights.some(t => t.kind === 'capture'));
});

test('construct lookahead continues shared prefixes, preserves boundaries and reports real conflicts', () => {
  for (const alternatives of ["ForEach | 'for'", "'for' | ForEach"]) {
    const source = example.replace('parse Statement |= ForEach;', `parse Statement |= ${alternatives};`);
    const { events, end } = analyze(source);
    assert.equal(end.status, 'done', end.error);
    assert.equal(events.length, 10);
    assert.equal(events[7].nodes.filter(node => node.label === 'ForEach').length, 2);
  }
  const prefix = base + loop + "parse Statement |= 'for';";
  const source = prefix + 'for /* boundary */ item;for\n' +
    'token Identifier = /@[a-z]+/ as identifier;@item;for';
  const { events, end, snapshot } = analyze(source);
  assert.equal(end.status, 'done', end.error);
  assert.deepEqual(events.filter(e => e.status === 'statement').map(e => source.slice(e.nodes[0].start, e.nodes[0].end)),
    ['for', 'item;', 'for', '@item;', 'for']);
  assert.equal(snapshot.highlights.filter(t => source.slice(t.start, t.end) === '/* boundary */').length, 1);
  for (let i = 1; i < snapshot.highlights.length; i++)
    assert.ok(snapshot.highlights[i - 1].end <= snapshot.highlights[i].start);
  const missing = analyze(prefix + 'for(');
  assert.equal(missing.end.status, 'error');
  assert.equal(missing.events.filter(e => e.status === 'statement').length, 0);
  const conflicting = analyze("parse Statement = 'x';parse Statement |= 'x' 'x';");
  assert.match(conflicting.end.error, /shift\/reduce/);
  assert.equal(conflicting.end.revision, 1);
  const reduce = analyze(base + "parse Statement |= Expression ';';");
  assert.match(reduce.end.error, /reduce\/reduce/);
});
test('keyword classification follows declaration boundaries, including removal and whole words', () => {
  const source = base + 'for;' + loop + 'for(x in xs){}' +
    "parse ForEach = 'walk' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';" +
    'for;forest;walk(x in xs){}';
  const { end, snapshot } = analyze(source);
  assert.equal(end.status, 'done');
  assert.deepEqual(snapshot.highlights.filter(t => source.slice(t.start,t.end) === 'for').map(t => [t.kind,t.revision]),
    [['identifier',4],['keyword',6],['identifier',7]]);
  assert.equal(snapshot.highlights.find(t => source.slice(t.start,t.end) === 'forest').kind, 'identifier');
});

test('names keep identifier styling while actual keywords, grammar names and captures stay distinct', () => {
  const source = 'import tower; import library.vector;\n' +
    'token Label = /@[a-z]+/ as identifier;\n' +
    "parse Name = $value:Identifier;\n" +
    'struct Record { field: i32; }\n' +
    'fn identity(parameter: i32): i32 { return parameter; }\n' +
    'var local: i32 = identity(42); print(local);';
  const {end,snapshot} = analyze(source);
  assert.equal(end.status,'done',end.error);
  const kinds = text => snapshot.highlights.filter(span=>source.slice(span.start,span.end)===text).map(span=>span.kind);
  for (const name of ['tower','library','vector','identifier','Record','field','i32','identity','parameter','local','print'])
    assert.ok(kinds(name).length && kinds(name).every(kind=>kind==='identifier'),name+': '+kinds(name));
  for (const word of ['import','token','as','parse','struct','fn','return','var'])
    assert.ok(kinds(word).length && kinds(word).every(kind=>kind==='keyword'),word+': '+kinds(word));
  assert.deepEqual(kinds('Label'),['rule']);
  assert.deepEqual(kinds('Name'),['rule']);
  assert.deepEqual(kinds('Identifier'),['rule']);
  assert.deepEqual(kinds('value'),['capture']);
  const incomplete = analyze('import tower; import missing.path');
  assert.equal(incomplete.end.status,'error');
  for (const span of incomplete.snapshot.highlights)
    if (['tower','missing','path'].includes('import tower; import missing.path'.slice(span.start,span.end)))
      assert.equal(span.kind,'identifier');
});
test('highlight preview never consumes input or commits future declarations', () => {
  const handle = tower.create(base + loop + 'for(x in xs){}');
  try {
    assert.equal(tower.inspect(handle).revision, 0);
    assert.equal(tower.inspect(handle).offset, 0);
    for (let revision = 1; revision <= 6; revision++) {
      assert.equal(tower.step(handle).revision, revision);
      const preview = tower.inspect(handle);
      assert.equal(tower.inspect(handle).offset, preview.offset);
    }
    assert.equal(tower.step(handle).status, 'statement');
  } finally { tower.destroy(handle); }
});
test('invalid grammar returns an error, preserves revision, and does not poison the next session', () => {
  for (const quotes of ["''", '""']) {
    const source = base + '\nparse Statement |= ' + quotes + ';';
    const { end } = analyze(source);
    assert.equal(end.status, 'error');
    assert.equal(end.revision, 4);
    assert.match(end.error, /Token literal is empty/);
    assert.equal(end.errorOffset, source.indexOf(quotes));
  }
  for (const bad of ["parse Statement |= Expression ';';", 'parse Statement = Missing;', 'parse Bad = Bad;',
    "parse Bad = 'a b';", 'parse Bad = $Expression $Expression;', 'parse Statement = ;']) {
    const { end } = analyze(base + bad);
    assert.equal(end.status, 'error', bad); assert.equal(end.revision, 4, bad); assert.ok(end.error);
  }
  assert.equal(analyze(base + '42;').end.status, 'done');
});
test('UTF-8 spans, emoji, strings and comments survive the JSON and editor boundaries', () => {
  const source = '// 🚀 café\nparse Statement = String \';\';"雪🚀 ; // }";';
  const { events, end, snapshot } = analyze(source);
  assert.equal(end.status, 'done');
  const offsets = byteOffsets(source), token = events.at(-1).nodes.find(n => n.production === null && n.label.startsWith('"'));
  assert.equal(source.slice(offsets[token.start], offsets[token.end]), '"雪🚀 ; // }"');
  assert.equal(snapshot.highlights[0].kind, 'comment');
  assert.equal(offsets.length, new TextEncoder().encode(source).length + 1);
  assert.equal(offsets.at(-1), source.length);
});
test('new multi-character punctuation and malformed lexical input use the native scanner', () => {
  const source = numeric + "parse Statement = Identifier '=>' Number ';';x=>42;";
  const good = analyze(source);
  assert.equal(good.end.status, 'done');
  assert.ok(good.snapshot.highlights.some(t => t.kind === 'operator' && source.slice(t.start,t.end) === '=>'));
  for (const bad of ['/* unfinished', '"unterminated', "parse Statement = '#';☃", "parse Statement = 'a\\q';"]) {
    const result = analyze(bad);
    assert.equal(result.end.status, 'error');
    // With foundation arithmetic installed, '/' is a legal token even when
    // an incomplete block comment fails to match the user-defined skip rule.
    assert.ok(result.snapshot.highlights.some(t => t.kind === 'invalid' || (bad.startsWith('/*') && t.kind === 'operator')));
  }
});

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
