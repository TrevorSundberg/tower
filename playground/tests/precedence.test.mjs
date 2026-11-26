import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, runToEnd} from './compiler-fixtures.mjs';

const tower = await loadTower(await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url)),
  undefined, await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8'));
tower.configureModules({entry:'.tower/tests/precedence_inputs/input.tower'});
const fixture = name => readFile(new URL(`../../scaffolding/tests/precedence_inputs/${name}.tower`, import.meta.url), 'utf8');

function parse(source) {
  const handle = tower.create(source);
  try {
    const result = runToEnd(tower, handle);
    return {...result, formatted:result.end.status === 'done' ? tower.format(handle).source : null};
  } finally { tower.destroy(handle); }
}

// Read roles and original byte spans from the live parser's statement events.
function captures(result, source) {
  assert.equal(result.end.status, 'done', result.end.error);
  return result.events.filter(event => event.status === 'statement').map(({nodes}) =>
    nodes.filter(node => ['value', 'left', 'right'].includes(node.role)).map(node =>
      node.role + '=' + source.slice(node.start, node.end).replace(/\s+/g, '')).join(' '));
}
const subtraction = {
  left: 'value=8-3-1 left=8-3 left=8 right=3 right=1',
  right: 'value=8-3-1 left=8 right=3-1 left=3 right=1',
};
function trees(direction) {
  return [subtraction[direction], 'value=2+3*4 left=2 right=3*4 left=3 right=4',
    'value=(2+3)*4 left=(2+3) value=2+3 left=2 right=3 right=4'];
}

test('formatted annotations retain their direction and captured trees on reparse', async () => {
  for (const direction of ['left', 'right']) {
    for (const name of [direction, direction + '_alias']) {
      const source = await fixture(name);
      const result = parse(source);
      assert.deepEqual(captures(result, source), trees(direction));
      assert.ok(result.formatted.includes('@ 10 ' + direction));
      const roundtrip = parse(result.formatted);
      assert.deepEqual(captures(roundtrip, result.formatted), trees(direction));
      assert.equal(roundtrip.formatted, result.formatted);
    }
  }
});

test('the linked parser reports conflicting grammars and invalid precedence', async () => {
  for (const [name, diagnostic] of [
    ['nonassoc_chain', /Unexpected '-'/],
    ['shift_reduce', /shift\/reduce/], ['mixed_shift_reduce', /shift\/reduce/],
    ['reduce_reduce', /reduce\/reduce/],
    ['zero_level', /precedence must be positive/], ['overflowing_level', /precedence exceeds u32/],
  ]) {
    const {end} = parse(await fixture(name));
    assert.equal(end.status, 'error', name);
    assert.match(end.error, diagnostic, name);
  }
});

test('editing metadata on one parser invalidates and reuses cached tables', async () => {
  const left = await fixture('left'), right = await fixture('right');
  const handle = tower.create(left);
  try {
    for (const [source, direction] of [[left, 'left'], [right, 'right'], [left, 'left']]) {
      tower.reset(handle, source);
      assert.deepEqual(captures(runToEnd(tower, handle), source), trees(direction));
    }
    assert.ok(tower.inspect(handle).grammarCacheHits > 0);
  } finally { tower.destroy(handle); }
});

test('annotated replacement output reaches the execution host', async () => {
  const handle = tower.compile(await fixture('replacement'));
  try {
    const result = tower.execute(handle, 100000);
    assert.equal(result.status, 'done', result.error);
    assert.equal(result.output, '25\n');
  } finally { tower.destroyExecution(handle); }
});
