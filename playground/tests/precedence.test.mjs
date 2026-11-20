import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, runToEnd} from './compiler-fixtures.mjs';
const tower = await loadTower(await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url)),
  undefined, await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8'));
const grammar = direction => `parse E = Number | '(' $value:E ')';
parse E |= $left:E '-' $right:E @ 10 ${direction};
parse E |= $left:E '+' $right:E @ 10 ${direction};
parse E |= $left:E '*' $right:E @ 20 left;
parse Statement = $value:E ';';`;
function evaluate(nodes, source, index = 0) {
  const children = nodes.map((node, i) => ({...node, index:i})).filter(node => node.parent === index);
  const role = name => children.find(node => node.role === name);
  const left = role('left'), right = role('right');
  if (left && right) {
    const a = evaluate(nodes, source, left.index), b = evaluate(nodes, source, right.index);
    const op = source.slice(left.end, right.start).trim();
    return op === '+' ? a + b : op === '-' ? a - b : a * b;
  }
  const child = role('value') || children.find(node => !['(',')',';'].includes(node.label));
  if (child) return evaluate(nodes, source, child.index);
  return Number(source.slice(nodes[index].start, nodes[index].end));
}
function parsed(source) {
  const handle = tower.create(source);
  try {
    const result = runToEnd(tower, handle);
    return {...result, formatted:result.end.status === 'done' ? tower.format(handle) : null};
  } finally { tower.destroy(handle); }
}
function values(result, source) {
  assert.equal(result.end.status, 'done', result.end.error);
  return result.events.filter(event => event.status === 'statement').map(event => evaluate(event.nodes, source));
}
test('numeric levels and directional aliases preserve left and right associativity', () => {
  for (const [direction, expected] of [['left',4],['L>R',4],['right',6],['R<L',6]]) {
    const source = grammar(direction) + '8-3-1; 2+3*4; (2+3)*4;';
    const result = parsed(source);
    assert.deepEqual(values(result, source), [expected,14,20]);
    assert.match(result.formatted.source, /@ 10 (left|right)/);
    const roundtrip = parsed(result.formatted.source);
    assert.deepEqual(values(roundtrip, result.formatted.source), [expected,14,20]);
    assert.equal(roundtrip.formatted.source, result.formatted.source);
  }
});
test('ordinary chained rules remain an equivalent way to express precedence', () => {
  const source = `parse Atom = Number | '(' $value:E ')';
parse Product = Atom | $left:Product '*' $right:Atom;
parse E = Product | $left:E '+' $right:Product | $left:E '-' $right:Product;
parse Statement = $value:E ';'; 8-3-1; 2+3*4; (2+3)*4;`;
  assert.deepEqual(values(parsed(source), source), [4,14,20]);
});
test('nonassociative operators reject unparenthesized chains', () => {
  assert.equal(parsed(grammar('nonassoc') + '8-3-1;').end.status, 'error');
  const source = grammar('nonassoc') + '(8-3)-1; 8-(3-1);';
  assert.deepEqual(values(parsed(source), source), [4,6]);
});
test('precedence never silently resolves unannotated or reduce/reduce ambiguities', () => {
  for (const source of [
    "parse E = Number | E '+' E; parse Statement = E ';';",
    "parse E = Number; parse E |= E '+' E @ 10 left; parse E |= E '*' E; parse Statement = E ';';",
  ]) assert.match(parsed(source).end.error, /shift\/reduce/);
  assert.match(parsed("parse A = Number @ 10 left; parse B = Number @ 20 right; parse E = A | B; parse Statement = E ';';").end.error, /reduce\/reduce/);
  for (const number of ['0','4294967296']) assert.match(parsed(`parse E = Number @ ${number} left;`).end.error, /precedence/);
});
test('editing metadata invalidates cached tables and restores old grouping correctly', () => {
  const handle = tower.create(grammar('left') + '8-3-1;');
  try {
    for (const [direction, expected] of [['left',4],['right',6],['left',4]]) {
      const source = grammar(direction) + '8-3-1;';
      tower.reset(handle, source);
      assert.deepEqual(values(runToEnd(tower, handle), source), [expected]);
    }
    assert.ok(tower.inspect(handle).grammarCacheHits > 0);
  } finally { tower.destroy(handle); }
});

test('annotated captures and replacements compose with the Tower expression grammar', () => {
  const source = `import tower;
parse TowerExpression |= 'twice' $value:TowerExpression @ 140 right => replace { $value + $value };
print(twice 3 * 4 + 1);`;
  const handle = tower.compile(source);
  try {
    const result = tower.execute(handle, 100000);
    assert.equal(result.status, 'done', result.error);
    assert.equal(result.output, '25\n');
  } finally { tower.destroyExecution(handle); }
});
