import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { builtins, files, loadTowerBytes, runToEnd } from './compiler-fixtures.mjs';
import { loadTower as createTower } from '../src/tower-host.mjs';
import { expandedCode } from '../src/expanded-code.mjs';
import { replacementLocations } from '../src/replacement-locations.mjs';
import { fixtureSource, guestString, runSelectedTest } from './compiler_test_host.mjs';
import { copyText, diagnosticFields, numberField } from './parser_observations.mjs';

const cases = '.tower/tests/replacement_cases/';
const assertionFiles = files.filter(({path}) => (path.startsWith(cases) && !path.startsWith(cases + 'inputs/')) ||
  path === '.tower/compiler/format_diagnostic_cases/session.tower' ||
  path === '.tower/backend/text.tower' || path.startsWith('.tower/library/'));

const wasm = await WebAssembly.compile(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url)));
const tower = await loadTowerBytes(wasm, undefined, builtins.foundation);
let checks, parsed, statements, nodes;
after(() => { checks?.close(); tower.close(); });

const observations = {
  diagnostic_read(context, file, edit) {
    if (edit) throw new Error('Replacement fixture requests a fresh parser');
    parsed = analyze(fixtureSource(cases + 'inputs/' + guestString(context, file) + '.tower'));
    statements = parsed.events.filter(event => event.status === 'statement');
    return parsed.end.status === 'done';
  },
  ...diagnosticFields(() => parsed.end),
  replacement_revision: () => numberField(parsed.end.revision),
  replacement_previous_revision: () => numberField(parsed.end.previousRevision),
  statement_count: () => statements.length,
  select_statement(_context, index) { nodes = statements[index].nodes; },
  expanded_code: context => copyText(context, expandedCode(nodes)),
  node_count: () => nodes.length,
  node_label: (context, index) => copyText(context, nodes[index].label),
  node_start: (_context, index) => numberField(nodes[index].start),
  node_end: (_context, index) => numberField(nodes[index].end),
  template_start: (_context, index) => numberField(nodes[index].origin.templateStart),
  template_end: (_context, index) => numberField(nodes[index].origin.templateEnd),
  node_generated: (_context, index) => nodes[index].origin.generated,
};

// Parsing and compiling tests both allocate node IDs. Keep the parser's
// identity sequence intact and reuse the assertion instance across names.
async function checkReplacement(entry) {
  checks ??= await createTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock,
    {tower: builtins.tower, builtins, project: {files: assertionFiles}, imports: observations});
  try { runSelectedTest(checks, cases + entry + '_test.tower', undefined, {suffix:'_browser_test.tower'}); }
  finally { parsed = statements = nodes = undefined; }
}

const example = await readFile(new URL('../../scaffolding/examples/replacements.tower', import.meta.url), 'utf8');
const base = await readFile(new URL('fixtures/numeric_token.tower', import.meta.url), 'utf8') +
  "parse Expression = Identifier | Number;parse Statement = Expression ';';";
function analyze(source) {
  const handle = tower.create(source);
  try { return { ...runToEnd(tower, handle), snapshot: tower.inspect(handle) }; }
  finally { tower.destroy(handle); }
}
function shape(event) {
  return event.nodes.map(({ label, parent, role, production }) => ({ label, parent, role, rule: production !== null }));
}

test('replacement previews attach to nested and repeated subtrees, grouping chain histories', () => {
  const statements = analyze(example).events.filter(event => event.status === 'statement');
  const previews = statements.map(event => [...replacementLocations(event)].map(([index, traces]) => {
    const children = event.nodes.map(() => []);
    event.nodes.forEach((node, i) => { if (node.parent !== null) children[node.parent].push(i); });
    const pending = [index], nodes = [];
    while (pending.length) { const i = pending.pop(); nodes.push(event.nodes[i]); pending.push(...children[i].slice().reverse()); }
    return { text: expandedCode(nodes), steps: traces.length };
  }));
  assert.deepEqual(previews[0], [{ text: '2 * 3 + 1', steps: 1 }]);
  assert.deepEqual(previews[1], [{ text: '4 + 1', steps: 2 }]);
  assert.equal(previews[2].length, 3);
  assert.equal(previews[2][1].text, 'item + 1');
  assert.match(previews[2][2].text, /^loop \(child in children\)/);
  assert.deepEqual(previews[3].slice(1), [{ text: '7 + 1', steps: 2 }, { text: '7 + 1', steps: 2 }]);
});

test('real replacement example preserves expression grouping and lowers nested foreach trees', () => {
  const result = analyze(example);
  assert.equal(result.end.status, 'done', result.end.error);
  const statements = result.events.filter(event => event.status === 'statement');
  assert.equal(statements.length, 4);
  assert.deepEqual(statements.map(event => event.replacementCount), [1, 2, 3, 3]);
  assert.equal(expandedCode(statements[0].nodes), '2 * 3 + 1;');
  assert.equal(expandedCode(statements[1].nodes), '4 + 1;');
  assert.equal(expandedCode(statements[2].nodes), 'loop (item in items) {\n  item + 1;\n  loop (child in children) {\n    child;\n  }\n}');
  assert.equal(expandedCode(statements[3].nodes), '{\n  7 + 1;\n  7 + 1;\n}');
  const plain = analyze(example.slice(0, example.indexOf('\nincrement(2 * 3);')) + '\n2 * 3 + 1;');
  assert.equal(plain.end.status, 'done', plain.end.error);
  assert.deepEqual(shape(statements[0]), shape(plain.events.at(-1)));
  assert.equal(statements[2].nodes.filter(node => node.label === 'Loop').length, 2);
  assert.equal(statements[2].nodes.some(node => node.label === 'foreach'), false);
  const item = statements[2].nodes.find(node => node.role === 'item');
  assert.equal(item.label, 'item');
  assert.equal(example.slice(item.start, item.end), 'item');
  assert.ok(statements[3].copiedNodes > 0);
  for (const event of statements) {
    assert.equal(new Set(event.nodes.map(node => node.id)).size, event.nodes.length);
    event.nodes.forEach((node, i) => { if (node.parent !== null) assert.ok(node.parent < i); });
  }
  const prefix = example.slice(0, example.indexOf('\nincrement(2 * 3);'));
  const reparsed = analyze(prefix + statements.map(event => expandedCode(event.nodes)).join('\n'));
  assert.equal(reparsed.end.status, 'done', reparsed.end.error);
  assert.deepEqual(reparsed.events.filter(event => event.status === 'statement').map(shape), statements.map(shape));
});

test('generated nodes expose template origins and shared expansion traces; captures retain input spans', () => {
  const source = base + "parse Expression |= 'one' => replace { 1 };" +
    "parse Expression |= 'alias' => replace { one };alias;";
  const { end, events } = analyze(source);
  assert.equal(end.status, 'done', end.error);
  const event = events.at(-1), literal = event.nodes.find(node => node.label === '1');
  assert.equal(source.slice(literal.start, literal.end), 'alias');
  assert.equal(source.slice(literal.origin.templateStart, literal.origin.templateEnd), '1');
  assert.equal(literal.origin.generated, true);
  const trace = event.expansions[literal.origin.expansion];
  assert.equal(source.slice(trace.start, trace.end), 'alias');
  assert.notEqual(trace.previous, null);
  assert.equal(event.expansions.length, 2);
  assert.equal(event.replacementCount, 2);
});

test('changed bodies, grammar and lexical rules invalidate templates without poisoning the last revision', () => {
  const live = analyze(base + "parse Leaf = 'b';parse Expression |= Leaf;" +
    "parse Leaf = 'b' => replace { 1 };parse Expression |= 'c' => replace { b };c;" +
    "parse Leaf = 'b' => replace { 2 };c;");
  assert.equal(live.end.status, 'done', live.end.error);
  const uses = live.events.filter(event => event.status === 'statement');
  assert.ok(uses[0].nodes.some(node => node.label === '1'));
  assert.ok(uses[1].nodes.some(node => node.label === '2'));
  const prefix = base + "parse Expression |= 'one' => replace { 1 };" +
    "parse Expression |= 'alias' => replace { one };";
  const source = prefix + "alias;parse Expression = Identifier | Number | 'one' => replace { 2 };alias;";
  // A handler after an alternation applies to every alternative. This example
  // is recursive through Number and must stop with a source-positioned error.
  const recursive = analyze(source);
  assert.equal(recursive.end.status, 'error');
  assert.match(recursive.end.error, /limit exceeded/);
  assert.equal(recursive.end.errorOffset, source.lastIndexOf('alias;'));

  const handle = tower.create(prefix + 'alias;');
  try {
    const first = runToEnd(tower, handle); assert.equal(first.end.status, 'done');
    tower.reset(handle, prefix.replace('replace { 1 }', 'replace { 2 }') + 'alias;');
    const second = runToEnd(tower, handle); assert.equal(second.end.status, 'done', second.end.error);
    assert.ok(second.events.at(-1).nodes.some(node => node.label === '2'));
    tower.reset(handle, '\n\n' + prefix + 'alias;');
    const moved = runToEnd(tower, handle); assert.equal(moved.end.status, 'done');
    const literal = moved.events.at(-1).nodes.find(node => node.label === '1');
    assert.equal(literal.origin.templateStart, ('\n\n' + prefix).indexOf('1 }'));
    tower.reset(handle, prefix + 'alias;');
    assert.equal(runToEnd(tower, handle).end.status, 'done');
    assert.ok(tower.inspect(handle).grammarCacheHits > 0);
  } finally { tower.destroy(handle); }
  const lexical = analyze(prefix + 'token Number = /@[0-9]+/ as number;');
  assert.equal(lexical.end.status, 'error');
  assert.equal(lexical.end.revision, 5); // Number, Expression, Statement, one, alias.
  assert.match(lexical.end.error, /Replacement/);
});

test('invalid captures, wrong categories and unclosed bodies fail atomically at their source', () => checkReplacement('invalid_captures'));

test('invalid replacement diagnostics identify the required syntax and template without losing the error location', () => checkReplacement('diagnostics'));

test('template scanner respects strings, comments, nested braces, optional and repeated captures', () => checkReplacement('scanner'));

test('named helper inference never silently leaves a replacement unexpanded in an incompatible context', () => checkReplacement('helper'));

test('long identity nesting moves normalized captures without copying or recursive expansion calls', () => {
  const depth = 400;
  const source = base + "parse Expression |= 'keep' '(' $value:Expression ')' => replace { $value };" +
    'keep('.repeat(depth) + '42' + ')'.repeat(depth) + ';';
  const { end, events } = analyze(source);
  assert.equal(end.status, 'done', end.error);
  const event = events.at(-1);
  assert.equal(event.replacementCount, depth);
  assert.equal(event.copiedNodes, 0);
  assert.equal(event.generatedNodes, 0);
  assert.equal(event.nodes.filter(node => node.label === '42').length, 1);
});

test('expansion and copying limits fail cleanly and release partially constructed trees', () => {
  const nodes = tower.exports.tw_live_nodes(), allocations = tower.exports.tw_live_allocations();
  const discarded = analyze(base + "parse Expression |= 'again' => replace { again };" +
    "parse Expression |= 'drop' '(' $value:Expression ')' => replace { 1 };drop(again);");
  assert.equal(discarded.end.status, 'error'); assert.match(discarded.end.error, /recursion limit exceeded/);
  const duplication = base + "parse Expression |= 'pair' '(' Expression ',' Expression ')';" +
    "parse Expression |= 'dup' '(' $value:Expression ')' => replace { pair($value, $value) };" +
    'dup('.repeat(16) + '1' + ')'.repeat(16) + ';';
  const copied = analyze(duplication);
  assert.equal(copied.end.status, 'error'); assert.match(copied.end.error, /output limit exceeded/);
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
  const broad = base + "parse Block = '{' Statement* '}';parse Statement |= Block;" +
    "parse Expression |= 'leaf' => replace { 1 };{" + 'leaf;'.repeat(4100) + '}';
  const expanded = analyze(broad);
  assert.equal(expanded.end.status, 'error'); assert.match(expanded.end.error, /step limit exceeded/);
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
});
