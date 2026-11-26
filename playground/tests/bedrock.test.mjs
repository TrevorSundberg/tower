import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { loadTower as createTower, runToEnd } from '../src/tower-host.mjs';
import { guestString } from './guest_text.mjs';
import { requireStatus, runSelectedTest } from './selected_test.mjs';
import { copyText, diagnosticFields, numberField } from './parser_observations.mjs';
const root = new URL('../../scaffolding/', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
const builtins = Object.fromEntries(['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower']
  .map(name => [name, source(name + '.tower')]));
const {foundation, foundation_syntax:foundationSyntax, bedrock} = builtins;
const caseRoot = 'tests/bedrock_cases/';
const inputs = new URL(caseRoot + 'inputs/', root);
const fixtures = new Set(['bedrock.tower', 'foundation.tower',
  ...readdirSync(inputs, {withFileTypes:true}).filter(file => file.isFile() && file.name.endsWith('.tower'))
    .map(file => caseRoot + 'inputs/' + file.name)]);
function fixtureSource(path) {
  if (!fixtures.has(path)) throw new Error('Missing Tower fixture ' + path);
  return source(path);
}

const wasm = await WebAssembly.compile(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url)));
const tower = await createTower(wasm, undefined, foundation, undefined, bedrock, {builtins, tower:builtins.tower});
function inspect(source, kind = '') {
  const handle = kind === 'bedrock' ? tower.createBedrock(source) : kind === 'foundation' ? tower.createFoundation(source) : tower.create(source);
  try { const result = runToEnd(tower, handle); return { ...result, formatted: tower.format(handle), snapshot: tower.inspect(handle) }; }
  finally { tower.destroy(handle); }
}
function restore() { tower.configureModules({builtins:{foundation_syntax:foundationSyntax}}); tower.configureBedrock(bedrock); tower.configure(foundation); }

const input = name => fixtureSource(caseRoot + 'inputs/' + name + '.tower');
const entries = ['', 'foundation', 'bedrock'];
let checks, last, inspections, currentSource, pinned;
after(() => { checks?.close(); tower.close(); });

function parse(source, entry) {
  const kind = entries[entry];
  if (kind === undefined) throw new Error('Unknown parser entry ' + entry);
  currentSource = source;
  last = inspections[kind] = inspect(source, kind);
  return last.end.status === 'done';
}

function countedText(context, text, size) {
  if (context.pointerBytes !== 4) throw new Error('Bedrock observations require the four-byte guest');
  const pointer = copyText(context, text);
  const memory = context.memory();
  new DataView(memory.buffer, memory.byteOffset).setUint32(size, Buffer.byteLength(text), true);
  return pointer;
}

const observations = {
  diagnostic_read(context, file, edit) {
    if (edit) throw new Error('Expected a fresh Bedrock parser session');
    return parse(input(guestString(context, file)), 0);
  },
  ...diagnosticFields(() => last.end),
  grammar_file(context, path) {
    return copyText(context, fixtureSource(guestString(context, path)));
  },
  grammar_parse: (context, source, entry) => parse(guestString(context, source), entry),
  grammar_pin(context, file) {
    if (pinned !== undefined) throw new Error('Bedrock session already pinned');
    pinned = tower.create(input(guestString(context, file)));
  },
  grammar_reset_pinned: (context, source) => tower.reset(pinned, guestString(context, source)),
  grammar_finish_pinned() {
    last = inspections[''] = {...runToEnd(tower, pinned), snapshot:tower.inspect(pinned)};
    return last.end.status === 'done';
  },
  grammar_formatted: context => copyText(context, last.formatted.source),
  grammar_event_count: (_context, entry) => inspections[entries[entry]].events.length,
  grammar_event_status: (context, event) => copyText(context, last.events[event].status),
  grammar_event_number: (context, event, field) => numberField(last.events[event][guestString(context, field)]),
  grammar_node_count: (_context, entry, event) => inspections[entries[entry]].events[event].nodes.length,
  grammar_node_parent: (_context, entry, event, node) => inspections[entries[entry]].events[event].nodes[node].parent ?? -1,
  grammar_node_text: (context, entry, event, node, field) =>
    copyText(context, inspections[entries[entry]].events[event].nodes[node][guestString(context, field)]),
  grammar_node_number: (context, event, node, field) => numberField(last.events[event].nodes[node][guestString(context, field)]),
  grammar_symbol_index(context, entry, table, key) {
    const name = guestString(context, key);
    return inspections[entries[entry]].snapshot[guestString(context, table)].findIndex(row => row.name === name);
  },
  bedrock_token_count: () => inspections.bedrock.snapshot.tokens.length,
  bedrock_token_name: (context, index) => copyText(context, inspections.bedrock.snapshot.tokens[index].name),
  grammar_token_record(context, entry, index) {
    const token = inspections[entries[entry]].snapshot.tokens[index];
    return copyText(context, JSON.stringify(token));
  },
  grammar_install(context, source) {
    tower.configureBedrock(guestString(context, source));
    tower.configure(foundation);
  },
  highlight_count: () => last.snapshot.highlights.length,
  highlight_field(context, index, field) {
    const item = last.snapshot.highlights[index], key = guestString(context, field);
    return copyText(context, key === 'text' ? currentSource.slice(item.start, item.end) : item[key]);
  },
  grammar_expected(context, file, size) {
    const name = guestString(context, file);
    if (!/^[a-z_]+$/.test(name)) throw new Error('Invalid Bedrock oracle name');
    return countedText(context, readFileSync(new URL(name + '.expected', inputs), 'utf8'), size);
  },
  grammar_output(context, source, size) {
    const execution = tower.compile(guestString(context, source));
    try {
      const result = tower.execute(execution);
      requireStatus(result, 'done');
      return countedText(context, result.output, size);
    } finally { tower.destroyExecution(execution); }
  },
};

async function check(entry) {
  checks ??= await createTower(wasm, undefined, foundation, undefined, bedrock, {
    tower:builtins.tower, builtins, imports:observations,
  });
  // The collector starts at the owner and loads its selected companion.
  const modules = ['library/testing', 'library/vector', 'backend/text',
    'compiler/format_diagnostic_cases/session', caseRoot + 'grammar'];
  if (entry !== 'grammar') modules.push(caseRoot + entry);
  if (['lexicon', 'local_override', 'quoted_capture'].includes(entry)) modules.push('library/test_fixtures');
  if (['local_override', 'quoted_capture'].includes(entry)) modules.push(caseRoot + 'round_trip');
  const companion = caseRoot + entry + '_test';
  const files = [...modules, companion].map(name => ({path:'.tower/' + name + '.tower', text:source(name + '.tower')}));
  inspections = {};
  try { runSelectedTest(checks, '.tower/' + companion + '.tower', 10, {files}); }
  finally {
    if (pinned !== undefined) tower.destroy(pinned);
    pinned = last = currentSource = inspections = undefined;
  }
}

test('foundation inherits bedrock without redeclaring any of its definitions', () => check('inheritance'));

test('shared bedrock whitespace, comments and identifiers affect declarations and ordinary code', async () => {
  try { await check('lexicon'); } finally { restore(); }
});

test('shared grammar rules can be referenced, extended and replaced without a reserved prefix', () => check('grammar'));

test('local overrides preserve inherited bindings in other sessions and canonical grammar names round trip', () => check('local_override'));

test('quoted capture names use shared Identifier decoding and survive template formatting', () => check('quoted_capture'));

test('bedrock extends the immutable native seed and round trips through the common formatter', () => {
  const seed = tower.bedrockSeed();
  assert.equal(inspect(seed, 'bedrock').end.status, 'done');
  assert.doesNotMatch(seed, /GrammarPrecedence/);
  const first = inspect(bedrock, 'bedrock');
  assert.equal(first.end.status, 'done', first.end.error);
  assert.deepEqual(first.events.slice(0, 4).map(event => event.nodes[0].semantic), ['skip', 'skip', 'skip', 'token']);
  const declaration = first.events.find(event => event.nodes[0].semantic === 'parse');
  assert.ok(declaration.nodes.some(node => node.semantic === 'alternative' && node.production !== null));
  assert.ok(declaration.nodes.some(node => node.semantic === 'term' && node.production !== null));
  const second = inspect(first.formatted.source, 'bedrock');
  assert.equal(second.formatted.source, first.formatted.source);
  assert.deepEqual(second.snapshot.rules, first.snapshot.rules);
  assert.deepEqual(second.snapshot.tokens, first.snapshot.tokens);
});

test('foundation declaration formatting preserves grammar and is stable', () => {
  const first = inspect(foundationSyntax, 'foundation');
  assert.equal(first.end.status, 'done', first.end.error);
  assert.ok(first.formatted.source.includes('parse CoreFunction'));
  const second = inspect(first.formatted.source, 'foundation');
  assert.equal(second.end.status, 'done', second.end.error);
  assert.equal(second.formatted.source, first.formatted.source);
  assert.deepEqual(second.snapshot.rules, first.snapshot.rules);
  assert.deepEqual(second.snapshot.tokens, first.snapshot.tokens);
  assert.ok(first.formatted.spans.every(span => span.source >= 0 && span.source < Buffer.byteLength(foundationSyntax)));
});

test('formatting retains declaration order, replace versus extend, holes and comments', () => {
  const source = "import foundation;\n// before\nparse Expression = Identifier | Number;\nparse Statement = Expression ';';\n" +
    "parse Expression |= 'one' => replace { /* template */ 1 };\n" +
    "parse /* inside */ Expression = Identifier | Number;\n" +
    "parse Expression |= 'two' => replace { 2 };\n// after\n";
  const first = inspect(source);
  assert.equal(first.end.status, 'done', first.end.error);
  const formatted = first.formatted.source;
  for (const comment of ['// before', '/* template */', '/* inside */', '// after']) assert.equal(formatted.split(comment).length, 2);
  assert.equal((formatted.match(/parse Expression = /g) ?? []).length, 2);
  assert.equal((formatted.match(/parse Expression \|=/g) ?? []).length, 2);
  const second = inspect(formatted);
  assert.equal(second.end.status, 'done', second.end.error);
  assert.equal(second.formatted.source, formatted);
  assert.deepEqual(second.snapshot.rules, first.snapshot.rules);
  const use = inspect(formatted + 'two;');
  assert.equal(use.end.status, 'done', use.end.error);
  assert.ok(use.events.at(-1).nodes.some(node => node.label === '2'));
  assert.equal(use.formatted.error, undefined);
  assert.match(use.formatted.source, /\ntwo;\n$/);
});

test('bedrock keyword edits affect following declarations, foundation and source without mutating the seed', () => {
  const seed = tower.bedrockSeed();
  let declarationSeen = false, tokenSeen = false, skipSeen = false;
  const edited = bedrock.replaceAll("'parse'", "'rule'").replaceAll("'token'", "'lex'").replaceAll("'skip'", "'ignore'")
    .split('\n').map(line => {
      let result = line;
      if (declarationSeen) result = result.replace(/^parse /, 'rule ');
      if (tokenSeen) result = result.replace(/^((?:\[[^\]]+\]\s*)*)token /, '$1lex ');
      if (skipSeen) result = result.replace(/^((?:\[[^\]]+\]\s*)*)skip /, '$1ignore ');
      if (line.startsWith('parse GrammarDeclaration ')) declarationSeen = true;
      if (line.startsWith('parse GrammarTokenDeclaration ')) tokenSeen = true;
      if (line.startsWith('parse GrammarSkipDeclaration ')) skipSeen = true;
      return result;
    }).join('\n');
  const pinned = tower.create('import foundation;\nprint(7);');
  try {
    tower.configureBedrock(edited);
    assert.equal(inspect(edited, 'bedrock').end.status, 'done');
    assert.throws(() => tower.configure(foundation), /Unexpected 'token'/);
    const adapted = foundationSyntax.replace(/^parse /gm, 'rule ').replace(/^((?:\[[^\]]+\]\s*)*)token /gm, '$1lex ').replace(/^((?:\[[^\]]+\]\s*)*)skip /gm, '$1ignore ');
    tower.configureModules({builtins:{foundation_syntax:adapted}});
    tower.configure(foundation);
    const result = inspect("import foundation;\nrule Statement |= 'show' $value:CoreOperand ';' => replace { print($value); };show 42;");
    assert.equal(result.end.status, 'done', result.end.error);
    assert.ok(result.events.at(-1).nodes.some(node => node.label === 'CoreCall'));
    const exec = tower.compile("import foundation;\nrule Statement |= 'show' $value:CoreOperand ';' => replace { print($value); };show 42;");
    try { assert.equal(tower.execute(exec).output, '42\n'); } finally { tower.destroyExecution(exec); }
    // Reset rebuilds the owned module from the current explicit import inputs.
    tower.reset(pinned, "import foundation;\nparse Extra = Number;print(7);");
    assert.equal(runToEnd(tower, pinned).end.status, 'error');
    tower.reset(pinned, "import foundation;\nrule Extra = Number;print(7);");
    const reset = runToEnd(tower, pinned);
    assert.equal(reset.end.status, 'done', reset.end.error);
    assert.notEqual(inspect(edited.replace(/^parse /gm, 'rule '), 'bedrock').end.status, 'done');
    assert.equal(tower.bedrockSeed(), seed);
  } finally { tower.destroy(pinned); restore(); }
});

test('bedrock name tokens affect its following grammar names and downstream source', () => {
  const edited = bedrock.replace('[A-Za-z_][A-Za-z0-9_]*', '[A-Za-z_][A-Za-z0-9_-]*');
  try {
    tower.configureBedrock(edited); tower.configure(foundation);
    assert.equal(inspect('import foundation;\nparse extra-rule = Number;').end.status, 'done');
    assert.equal(inspect(edited + 'parse extra-rule = Identifier;', 'bedrock').end.status, 'done');
  } finally { restore(); }
});

test('every file installs token, trivia and declaration-reader edits at the same boundary', () => {
  for (const kind of ['bedrock', 'foundation', '']) {
    const identifier = 'token Identifier = /ffff[A-Za-z_][A-Za-z0-9_]*/ as identifier;';
    const source = identifier + '\ntoken String = /[a-z]+/;';
    const result = inspect(source, kind);
    assert.equal(result.events.length, 1, kind);
    assert.equal(result.end.status, 'error', kind);
    assert.equal(result.end.revision, 1, kind);
    assert.equal(result.end.errorOffset, source.indexOf('String'), kind);
    assert.equal(result.snapshot.tokens.find(t => t.name === 'Identifier').pattern, 'ffff[A-Za-z_][A-Za-z0-9_]*');
    assert.equal(inspect('skip Whitespace = /[ ~\\t\\r\\n]+/;parse~Extra~=~Identifier;', kind).end.status, 'done', kind);
    const strings = 'token String = /~[^~]*~/ as string;';
    assert.equal(inspect(strings + "parse Extra = 'x';", kind).end.status, 'error', kind);
    assert.equal(inspect(strings + 'parse Extra = ~x~;', kind).end.status, 'done', kind);
  }
});

test('bedrock installation is atomic, validates semantic captures and is idempotent', () => {
  const invalid = bedrock.replace('$name:Identifier', '$wrong:Identifier');
  assert.throws(() => tower.configureBedrock(invalid), /missing capture 'name'/);
  const retained = inspect('import foundation;\nprint(1);');
  assert.equal(retained.end.status, 'done', retained.end.error);
  const nodes = tower.exports.tw_live_nodes(), allocations = tower.exports.tw_live_allocations();
  tower.configureBedrock(bedrock); tower.configureBedrock(bedrock);
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
  const handle = tower.createBedrock(bedrock);
  try {
    assert.equal(runToEnd(tower, handle).end.status, 'done');
    tower.reset(handle, invalid); assert.equal(runToEnd(tower, handle).end.status, 'error');
    assert.match(tower.format(handle).error, /valid source/);
    tower.reset(handle, bedrock); assert.equal(runToEnd(tower, handle).end.status, 'done');
  } finally { tower.destroy(handle); }
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
});

test('import grammar edits must preserve path segments, prefixes and declaration names', () => {
  for (const [before,after,capture] of [
    ['$segment:Identifier','Identifier','segment'],
    ['$previous:ImportPath','ImportPath','previous'],
    ['$name:ImportName','ImportName','name'],
  ]) {
    assert.throws(()=>tower.configureBedrock(bedrock.replaceAll(before,after)),new RegExp("preserve capture '"+capture+"'"));
    const retained = inspect('import foundation;\nprint(1);');
    assert.equal(retained.end.status,'done',retained.end.error);
  }
});

test('parent import grammar cannot drop the parent/segments roles',()=>{
  for(const capture of ['parent','segments']) {
    const changed=bedrock.replace('$'+capture+':','');
    assert.throws(()=>tower.configureBedrock(changed),/ImportName.*capture/);
  }
});
