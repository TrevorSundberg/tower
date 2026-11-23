import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';

const read = path => readFile(new URL('../../' + path, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation);
const source = (await read('scaffolding/tests/for_loops.tower')).toString();
const expected = (await read('scaffolding/tests/for_loops.expected.txt')).toString().replaceAll('\r\n', '\n');

function execute(handle) {
  let output = '', result;
  for (let i = 0; i < 100000; i++) {
    result = tower.execute(handle, 7);
    output += result.output;
    if (result.status !== 'executing') break;
  }
  assert.equal(result.status, 'done', result.error);
  return output;
}

test('for clauses, scopes and effects survive both interpreters and Foundation round trips', () => {
  for (const pointerBytes of [4, 8]) for (const fast of [false, true]) {
    const handle = tower.compile(source, {pointerBytes});
    try {
      if (fast) tower.useFast(handle);
      assert.equal(execute(handle), expected);
      const canonical = tower.foundation(handle).source;
      const rebuilt = tower.compileFoundation(canonical);
      try {
        if (fast) tower.useFast(rebuilt);
        assert.equal(execute(rebuilt), expected);
        assert.equal(tower.foundation(rebuilt).source, canonical);
      } finally { tower.destroyExecution(rebuilt); }
    } finally { tower.destroyExecution(handle); }
  }
});

test('for agrees with raw and optimized LLVM/Wasm', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
  const llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);
  for (const optimize of [false, true]) {
    const result = llvm.compile(source, {optimize});
    assert.equal(result.status, 'compiled', result.error);
    const executed = await executeWasm(result);
    assert.equal(executed.status, 'done', executed.error);
    assert.equal(executed.output, expected);
  }
});

test('for diagnoses invalid headers and keeps its binding private', () => {
  for (const [body, error] of [
    ['for (var i = 0; i; i++) {}', /Expected bool/],
    ['for (var i = 0; true; missing++) {}', /Unknown|Unresolved|unknown|unresolved/],
    ['for (var i = 0; false; i++) {} print(i);', /Unknown|Unresolved|unknown|unresolved/],
    ['for (var i = 0; i < 1; body_local++) { var body_local = 0; }', /Unknown|Unresolved|unknown|unresolved/],
    ['for (var i = 0; i < 1; i++) print(i);', /Missing '\{'/],
    ['fn f(): i32 { for (; false;) { return 1; } }', /return/],
  ]) {
    const handle = tower.compile('import tower; print(123); ' + body);
    try {
      const result = tower.execute(handle, 100000);
      assert.equal(result.status, 'error', body);
      assert.match(result.error, error, body);
      assert.equal(result.output, '', body);
    } finally { tower.destroyExecution(handle); }
  }
});

test('for leaves Foundation grammar and ordinary user identifiers alone', () => {
  const handle = tower.compile('import foundation; var for: i32 = 12; print(for);');
  try { assert.equal(execute(handle), '12\n'); }
  finally { tower.destroyExecution(handle); }
});

test('for source formatting preserves header separators and empty clauses', () => {
  const input = 'import tower; for(var i=0;i<3;i++){print(i);}for(;;){break;}';
  let formatted;
  for (const text of [input, null]) {
    const handle = tower.create(text ?? formatted);
    try {
      let result;
      do { result = tower.step(handle); } while (result.status !== 'done' && result.status !== 'error');
      assert.equal(result.status, 'done', result.error);
      const output = tower.format(handle);
      assert.equal(output.error, undefined);
      if (text === null) assert.equal(output.source, formatted);
      else formatted = output.source;
    } finally { tower.destroy(handle); }
  }
  const handle = tower.compile(formatted);
  try { assert.equal(execute(handle), '0\n1\n2\n'); }
  finally { tower.destroyExecution(handle); }
});
