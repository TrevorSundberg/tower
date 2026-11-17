import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { node as n, hole as h, Rules, Expander } from './replacement-shortcuts.mjs';

// Independent, deliberately unspecialized oracle. This has no dependency on the
// optimizer, certificate, instantiation helper, cache, or normal-node memoization.
function reference(registry, input, fuel = 10_000) {
  const { rules } = registry.snapshot();
  const trace = [], effects = [];
  function copy(template, captures) {
    return Object.hasOwn(template, 'hole') ? captures[template.hole]
      : n(template.tag, ...template.children.map(child => copy(child, captures)));
  }
  function walk(tree) {
    const children = tree.children.map(walk);
    const rule = rules.get(tree.tag);
    if (!rule) return children.every((child, i) => child === tree.children[i]) ? tree : n(tree.tag, ...children);
    if (rule.arity !== children.length) throw new Error('arity');
    if (trace.length >= fuel) throw new Error('rewrite budget exhausted');
    trace.push(tree.tag);
    return walk(typeof rule.body === 'function' ? rule.body(children, { effects }) : copy(rule.body, children));
  }
  let result, error;
  try { result = walk(input); } catch (caught) { error = caught.message; }
  return { result, error, trace, effects };
}
function equivalent(registry, expander, input, fuel) {
  const expected = reference(registry, input, fuel);
  const actual = expander.run(input, { fuel });
  assert.deepEqual({ result: actual.result, error: actual.error, trace: actual.trace(), effects: actual.effects }, expected);
  return actual;
}
const chainRules = () => new Rules().set('C', 1, n('B', n('Wrap', h(0)))).set('B', 1, n('A', h(0)));

test('C -> B -> A composes while retaining capture identity and the logical trace', () => {
  const rules = chainRules(), expander = new Expander(rules), capture = n('Value');
  assert.deepEqual(expander.plan('C').recipe, n('A', n('Wrap', h(0))));
  const result = equivalent(rules, expander, n('C', capture));
  assert.equal(result.result.children[0].children[0], capture);
  assert.deepEqual(result.trace(), ['C', 'B']);
  assert.equal(result.stats.dispatches, 0);
  assert.equal(result.stats.planUses, 1);
});

test('722 bounded trees agree before and after changing a previously absent rule', () => {
  const rules = chainRules().set('Identity', 1, h(0)).set('Swap', 2, n('Pair', h(1), h(0)));
  const expander = new Expander(rules);
  const leaves = [n('Left'), n('Right')];
  let trees = leaves;
  for (let depth = 0; depth < 2; ++depth) {
    const previous = trees;
    trees = [...leaves];
    for (const tag of ['C', 'B', 'Wrap', 'Identity'])
      for (const child of previous) trees.push(n(tag, child));
    for (const tag of ['Swap', 'Pair'])
      for (const left of previous) for (const right of previous) trees.push(n(tag, left, right));
  }
  assert.equal(trees.length, 722);
  for (const tree of trees) equivalent(rules, expander, tree);
  const old = expander.plan('C');
  rules.set('A', 1, n('Final', h(0))); // Absence of A's rule was a dependency!
  for (const tree of trees) equivalent(rules, expander, tree);
  assert.notEqual(expander.plan('C').epoch, old.epoch);
  assert.equal(expander.plan('C').recipe.tag, 'Final');
  rules.set('B', 1, n('Other', h(0)));
  equivalent(rules, expander, n('C', n('Left')));
  assert.equal(expander.plan('C').recipe.tag, 'Other');
});

test('conditional and effectful handlers remain dynamic and execute child-first', () => {
  const rules = new Rules().set('C', 1, n('Choose', h(0)))
    .set('Choose', 1, ([value], context) => {
      context.effects.push(value.tag);
      return n(value.tag === 'Zero' ? 'A' : 'B', value);
    }).set('Input', 0, (_, context) => { context.effects.push('input'); return n('Zero'); });
  const expander = new Expander(rules);
  assert.match(expander.plan('C').refusal, /dynamic handler/);
  const result = equivalent(rules, expander, n('C', n('Input')));
  assert.deepEqual(result.effects, ['input', 'Zero']);
  assert.equal(result.result.tag, 'A');
  assert.equal(equivalent(rules, expander, n('C', n('One'))).result.tag, 'B');
});

test('cycles and specialization budgets fall back; logical fuel errors agree', () => {
  const cyclic = new Rules().set('C', 1, n('B', h(0))).set('B', 1, n('C', h(0)));
  const expander = new Expander(cyclic);
  assert.match(expander.plan('C').refusal, /recursive dependency/);
  assert.equal(equivalent(cyclic, expander, n('C', n('Value')), 15).error, 'rewrite budget exhausted');
  const rules = chainRules(), limited = new Expander(rules, 1);
  assert.match(limited.plan('C').refusal, /specialization budget/);
  assert.equal(equivalent(rules, limited, n('C', n('Value'))).error, undefined);
  for (let fuel = 0; fuel <= 8; ++fuel)
    equivalent(rules, new Expander(rules), n('C', n('C', n('Value'))), fuel);
});

test('duplication/erasure are conservatively refused; discarding does not skip a child effect', () => {
  const rules = new Rules().set('Duplicate', 1, n('Pair', h(0), h(0)))
    .set('Discard', 1, n('Nothing'))
    .set('Effect', 0, (_, context) => { context.effects.push('ran'); return n('Value'); });
  const expander = new Expander(rules);
  for (const tag of ['Duplicate', 'Discard']) {
    assert.match(expander.plan(tag).refusal, /nonlinear or erased capture/);
    const result = equivalent(rules, expander, n(tag, n('Effect')));
    assert.deepEqual(result.effects, ['ran']);
  }
});

test('dynamic ordered alternatives and handler failures preserve the chosen strategy', () => {
  const choose = order => ([value]) => {
    // Both alternatives match Zero; source priority is semantically observable.
    const candidates = { specific: () => value.tag === 'Zero' ? n('A') : null,
      general: () => n('B') };
    for (const key of order) { const result = candidates[key](); if (result) return result; }
  };
  const rules = new Rules().set('C', 1, n('Choose', h(0)))
    .set('Choose', 1, choose(['specific', 'general']));
  const expander = new Expander(rules), input = n('C', n('Zero'));
  assert.equal(equivalent(rules, expander, input).result.tag, 'A');
  rules.set('Choose', 1, choose(['general', 'specific']));
  assert.equal(equivalent(rules, expander, input).result.tag, 'B');
  rules.set('Choose', 1, (_, context) => {
    context.effects.push('before error');
    throw new Error('replacement failed');
  });
  const failed = equivalent(rules, expander, input);
  assert.equal(failed.error, 'replacement failed');
  assert.deepEqual(failed.effects, ['before error']);
});

test('the independent oracle detects a deliberately stale shortcut and a lost trace', () => {
  const rules = chainRules(), expander = new Expander(rules), input = n('C', n('Value'));
  const stale = expander.plan('C');
  rules.set('B', 1, n('Changed', h(0)));
  expander.plan = () => stale; // Deliberately bypass the real epoch guard.
  assert.throws(() => equivalent(rules, expander, input), { name: 'AssertionError' });
  const sound = new Expander(rules), plan = sound.plan('C');
  sound.plan = () => ({ ...plan, trace: ['C'] }); // Deliberately erase B's expansion.
  assert.throws(() => equivalent(rules, sound, input), { name: 'AssertionError' });
});

test('64-stage chain eliminates intermediate construction and dispatch, with shared trace storage', () => {
  const rules = new Rules();
  for (let i = 0; i < 64; ++i) rules.set(`R${i}`, 1, n(i === 63 ? 'A' : `R${i + 1}`, h(0)));
  const expander = new Expander(rules), input = n('R0', n('Value'));
  equivalent(rules, expander, input);
  let slowAllocations = 0, fastAllocations = 0, slowDispatches = 0, fastDispatches = 0;
  for (let i = 0; i < 1000; ++i) {
    const slow = expander.run(input, { optimized: false }), fast = expander.run(input);
    assert.deepEqual(fast.result, slow.result);
    assert.equal(fast.traceChunks[0], expander.plan('R0').trace);
    slowAllocations += slow.stats.allocations; fastAllocations += fast.stats.allocations;
    slowDispatches += slow.stats.dispatches; fastDispatches += fast.stats.dispatches;
  }
  assert.deepEqual({ slowAllocations, fastAllocations, slowDispatches, fastDispatches },
    { slowAllocations: 64_000, fastAllocations: 1000, slowDispatches: 64_000, fastDispatches: 0 });
});

test('materialized output can grow exponentially even for a finite acyclic rule set', () => {
  const rules = new Rules().set('D0', 0, n('Leaf'));
  for (let i = 1; i <= 10; ++i) rules.set(`D${i}`, 0, n('Pair', n(`D${i - 1}`), n(`D${i - 1}`)));
  const expander = new Expander(rules);
  const result = equivalent(rules, expander, n('D10'));
  const countLeaves = tree => tree.tag === 'Leaf' ? 1 : tree.children.reduce((sum, child) => sum + countLeaves(child), 0);
  assert.equal(countLeaves(result.result), 1024);
  assert.equal(result.stats.allocations, 2047);
});

// Real Tower parser checks. This is NOT a replacement-language implementation:
// @x is an ordinary test terminal, then a test adapter extracts arithmetic trees.
const { loadTower, runToEnd } = await import('../../playground/src/tower-host.mjs');
const bytes = await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const bootstrap = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const tower = await loadTower(bytes, undefined, bootstrap);
function parse(source) {
  const handle = tower.create(source);
  try { return runToEnd(tower, handle); } finally { tower.destroy(handle); }
}
function grammar(add = '+', multiply = '*') {
  return `token Hole = /@[a-z]+/;` +
    `parse Atom = Number | Hole;parse Term = Atom;parse Expr = Term;` +
    `parse Atom |= '(' Expr ')';` +
    `parse Term = Term '${multiply}' Atom | Atom;` +
    `parse Expr = Expr '${add}' Term | Term;` +
    `parse Statement = Expr ';';`;
}
function arithmetic(source, prefix = grammar()) {
  const parsed = parse(prefix + source);
  assert.equal(parsed.end.status, 'done', parsed.end.error);
  const flat = parsed.events.filter(event => event.status === 'statement').at(-1).nodes;
  const children = flat.map(() => []);
  flat.forEach((entry, index) => { if (entry.parent !== null) children[entry.parent].push(index); });
  function convert(index) {
    const entry = flat[index], kids = children[index];
    if (entry.label === 'Statement') return convert(kids[0]);
    if (entry.label === 'Expr' || entry.label === 'Term') {
      if (kids.length === 1) return convert(kids[0]);
      return n(flat[kids[1]].label === '+' ? 'Add' : 'Multiply', convert(kids[0]), convert(kids[2]));
    }
    if (entry.label === 'Atom') return convert(kids.length === 3 ? kids[1] : kids[0]);
    if (entry.label === '@x') return h(0);
    assert.match(entry.label, /^\d+$/);
    return n(entry.label);
  }
  return convert(0);
}
test('real WASM: tree holes preserve grouping; raw token splicing changes precedence', () => {
  const template = arithmetic('@x * 2;'), capture = arithmetic('1 + 2;');
  const rules = new Rules().set('Template', 1, template), expander = new Expander(rules);
  const result = equivalent(rules, expander, n('Template', capture)).result;
  assert.deepEqual(result, arithmetic('(1 + 2) * 2;'));
  assert.notDeepEqual(result, arithmetic('1 + 2 * 2;'));
  assert.deepEqual(result, n('Multiply', n('Add', n('1'), n('2')), n('2')));
});

test('real WASM: the same replacement text parses differently after a grammar change', () => {
  const ordinary = arithmetic('1 + 2 * 3;');
  const changed = arithmetic('1 + 2 * 3;', grammar('*', '+'));
  assert.notDeepEqual(ordinary, changed);
  assert.equal(ordinary.tag, 'Add');
  assert.equal(changed.tag, 'Multiply');
});

test('real WASM: shift/reduce and reduce/reduce conflicts remain errors', () => {
  const shift = parse("parse Statement = 'x';parse Statement |= 'x' 'x';");
  assert.match(shift.end.error, /shift\/reduce/);
  assert.equal(shift.end.revision, 1);
  const reduce = parse("parse Atom = Number;parse Statement = Atom ';';parse Statement |= Atom ';';");
  assert.match(reduce.end.error, /reduce\/reduce/);
  assert.equal(reduce.end.revision, 2);
});
