import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower, runToEnd } from './compiler-fixtures.mjs';
import { expandedCode } from '../src/expanded-code.mjs';
import { replacementLocations } from '../src/replacement-locations.mjs';
const tower = await loadTower(await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url)), undefined,
  await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8'));
const example = await readFile(new URL('../../scaffolding/examples/replacements.tower', import.meta.url), 'utf8');
const base = "parse Expression = Identifier | Number;parse Statement = Expression ';';";
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
  assert.equal(lexical.end.revision, 4);
  assert.match(lexical.end.error, /Replacement/);
});

test('invalid captures, wrong categories and unclosed bodies fail atomically at their source', () => {
  for (const rhs of ['$missing', '1;', '']) {
    const source = base + `parse Expression |= 'bad' => replace { ${rhs} };`;
    const { end } = analyze(source);
    assert.equal(end.status, 'error', rhs);
    assert.equal(end.revision, 2);
    assert.ok(end.errorOffset >= source.indexOf('replace {') + 'replace {'.length);
  }
  const broken = analyze(base + "parse Expression |= 'bad' => replace { 1;");
  assert.equal(broken.end.status, 'error'); assert.match(broken.end.error, /Unexpected end of input/);
  const missing = analyze(base + "parse Expression |= 'x' '(' $value:Expression ')' => replace { $value $value };");
  assert.equal(missing.end.status, 'error');
  assert.equal(missing.end.revision, 2);
});

test('invalid replacement diagnostics identify the required syntax and template without losing the error location', () => {
  const source = "// \u03bb\nparse Statement |= 'fart' $name:Identifier ';'\n    => replace { $name - $name; };";
  const { end } = analyze(source);
  assert.equal(end.status, 'error');
  assert.match(end.error, /Replacement for Statement must produce a valid Statement\./);
  assert.ok(end.error.includes('"$name - $name;" is not a valid Statement.'));
  assert.equal(end.errorOffset, Buffer.byteLength(source.slice(0, source.indexOf(' - ') + 1)));
  assert.equal(end.revision, 0);
  assert.equal(analyze(source.replace('$name - $name;', '$name = $name - $name;')).end.status, 'done');

  const expression = analyze(base + "parse Expression |= 'bad' => replace { 1; };").end;
  assert.ok(expression.error.includes('"1;" is not a valid Expression.'));
  const empty = analyze(base + "parse Expression |= 'bad' => replace { }; ").end;
  assert.ok(empty.error.includes('<empty> is not a valid Expression.'));
  const unknown = analyze(base + "parse Expression |= 'bad' => replace { $missing };").end;
  assert.match(unknown.error, /Unknown replacement capture: \$missing/);

  // A helper can replace into a unit-rule parent: don't falsely claim that its
  // own rule is the only permitted destination when none of the candidates fit.
  const helper = analyze(base + "parse Alias = 'bad' => replace { 1; };parse Expression |= Alias;").end;
  assert.equal(helper.status, 'error');
  assert.match(helper.error, /syntax categories: Alias, Expression/);
  assert.match(helper.error, /"1;" is not valid in any of these categories/);
});

test('template scanner respects strings, comments, nested braces, optional and repeated captures', () => {
  const source = base + "parse Expression |= String;" +
    "parse Block = '{' $Statement* '}';parse Statement |= Block;" +
    "parse Statement |= 'wrap' '{' $body:Statement* '}' => replace { { /* } */ $body \"}\"; } };" +
    "wrap { x; }wrap {}";
  const { end, events } = analyze(source);
  assert.equal(end.status, 'done', end.error);
  assert.ok(events.at(-1).nodes.some(node => node.label === '"}"'));
  assert.equal(expandedCode(events.at(-1).nodes), '{\n  "}";\n}');
  const optional = analyze(base + "parse Statement |= 'maybe' $value:Expression? ';' => replace { $value; };maybe;");
  assert.equal(optional.end.status, 'error'); // Optional syntax cannot fill a required expression.
  const validOptional = analyze(base + "parse Statement |= 'show' Expression? ';';" +
    "parse Statement |= 'maybe' $value:Expression? ';' => replace { show $value; };maybe;maybe x;");
  assert.equal(validOptional.end.status, 'done', validOptional.end.error);
  assert.equal(validOptional.events.at(-2).nodes.filter(node => node.label === 'show').length, 1);
  assert.equal(validOptional.events.at(-1).nodes.filter(node => node.label === 'x').length, 1);
  const plus = analyze(base + "parse Block = '{' $Statement* '}';parse Statement |= Block;" +
    "parse Statement |= 'copy' '{' $body:Statement+ '}' => replace { { $body $body } };copy { x; }");
  assert.equal(plus.end.status, 'done', plus.end.error);
  assert.equal(plus.events.at(-1).nodes.filter(node => node.label === 'x').length, 2);
});

test('named helper inference never silently leaves a replacement unexpanded in an incompatible context', () => {
  const source = base + "parse Alias = 'named' => replace { 9 };parse Expression |= Alias;" +
    "parse Statement |= 'use' Alias ';';use named;";
  const { end } = analyze(source);
  assert.equal(end.status, 'error');
  assert.match(end.error, /requires a Expression destination/);
  assert.equal(end.errorOffset, source.lastIndexOf('named'));
});

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
