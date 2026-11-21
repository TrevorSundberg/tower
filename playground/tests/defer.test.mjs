import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';
const read = path => readFile(new URL('../../' + path, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation);
const source = (await read('scaffolding/tests/defer_scopes.tower')).toString();
const expected = (await read('scaffolding/tests/defer_scopes.expected.txt')).toString().replaceAll('\r\n', '\n');
function finish(handle) {
  let output = '', result;
  for (let i = 0; i < 10000; i++) {
    result = tower.execute(handle, 11);
    output += result.output;
    if (result.status !== 'executing') return {...result, output};
  }
  assert.fail('Deferred cleanup did not finish within the fixture budget');
}
test('defer preserves scope, exit order, return snapshots and captured bindings through Foundation', () => {
  const byWidth = new Map();
  for (const pointerBytes of [4, 8]) for (const fast of [false, true]) {
    const handle = tower.compile(source, {pointerBytes});
    try {
      if (fast) tower.useFast(handle);
      const result = finish(handle);
      assert.equal(result.status, 'done', result.error);
      assert.equal(result.output, expected);
      const canonical = tower.foundation(handle).source;
      if (byWidth.has(pointerBytes)) assert.equal(canonical, byWidth.get(pointerBytes));
      else byWidth.set(pointerBytes, canonical);
      assert.doesNotMatch(canonical, /\bdefer\b/);
      const round = tower.compileFoundation(canonical);
      try {
        if (fast) tower.useFast(round);
        const result = finish(round);
        assert.equal(result.status, 'done', result.error);
        assert.equal(result.output, expected);
        assert.equal(tower.foundation(round).source, canonical);
      } finally { tower.destroyExecution(round); }
    } finally { tower.destroyExecution(handle); }
  }
});
test('defer agrees with raw and optimized LLVM/Wasm', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
  const llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);
  for (const optimize of [false, true]) {
    const result = llvm.compile(source, {optimize});
    assert.equal(result.status, 'compiled', result.error);
    const executed = await executeWasm(result);
    assert.equal(executed.status, 'done', executed.error);
    assert.equal(executed.output, expected);
  }
});
test('defer rejects escaping cleanup control flow and unavailable lexical bindings', () => {
  const tooDeep = 'fn deep(): void { defer {' + '{'.repeat(70) + 'print(1);' + '}'.repeat(70)
    + '} ' + '{'.repeat(70) + 'return;' + '}'.repeat(70) + '}';
  for (const [body, error] of [
    ['fn f(): void { defer { return; } }', /cannot return/],
    ['loop { defer { break; } break; }', /requires an enclosing loop/],
    ['loop { defer { continue; } break; }', /requires an enclosing loop/],
    ['fn f(): void { defer print(1); label(end); return; }', /explicit function labels or jumps/],
    ['fn f(): void { defer { jump(end); } label(end); return; }', /labels or jumps|cannot jump/],
    ['fn f(): void { defer print(later); var later = 1; }', /Unknown local/],
    ['fn f(): i32 { defer print(1); }', /without returning/],
    [tooDeep, /defer expansion exceeds Foundation block nesting limit/],
  ]) {
    const handle = tower.compile('import tower; print(123); ' + body);
    try {
      const result = finish(handle);
      assert.equal(result.status, 'error', body);
      assert.match(result.error, error, body);
      assert.equal(result.output, '', body);
    } finally { tower.destroyExecution(handle); }
  }
});
test('traps stop execution without unwinding and deferred traps preserve definite termination', () => {
  for (const text of [
    'defer print(3); { defer print(2); trap("cleanup-stop", 7); }',
    'fn stopped(): i32 { defer print(2); defer trap("cleanup-stop", 7); } stopped();',
  ]) for (const fast of [false, true]) {
    const handle = tower.compile('import tower; ' + text);
    try {
      if (fast) tower.useFast(handle);
      const result = finish(handle);
      assert.equal(result.status, 'error');
      assert.match(result.error, /cleanup-stop/);
      assert.equal(result.output, '');
    } finally { tower.destroyExecution(handle); }
  }
});
test('Foundation retains defer as an ordinary identifier', () => {
  const handle = tower.compile('var defer: i32 = 42; print(defer);');
  try { assert.equal(finish(handle).output, '42\n'); }
  finally { tower.destroyExecution(handle); }
});
test('defer completion retains source bindings and cleanup control-flow scope', () => {
  const labels = text => {
    const at = text.lastIndexOf('|');
    const source = text.slice(0, at) + text.slice(at + 1);
    const result = tower.complete(source, Buffer.byteLength(source.slice(0, at)));
    assert.equal(result.error, undefined);
    return result.options.map(option => option.label);
  };
  assert.ok(labels('import tower; fn cleanup(): void {} defer cle|').includes('cleanup'));
  assert.ok(labels('import tower; fn f(): void { defer { var local = 1; loc| } }').includes('local'));
  assert.ok(!labels('import tower; fn f(): void { defer { var private = 1; } pri| }').includes('private'));
  assert.deepEqual(labels('import tower; fn f(): void { var value: i32 = 1; defer print(value); { var value: bool = true; var result: i32 = val|; } }'), []);
  assert.ok(!labels('import tower; fn f(): void { defer { ret| } }').includes('return'));
  assert.ok(!labels('import tower; loop { defer { br| } break; }').includes('break'));
  assert.ok(labels('import tower; defer { loop { br| } }').includes('break'));
});
