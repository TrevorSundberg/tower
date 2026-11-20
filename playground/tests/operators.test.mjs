import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';
const read = path => readFile(new URL('../../' + path, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation);
function execute(handle) {
  let output = '', result;
  for (let i = 0; i < 100000; ++i) {
    result = tower.execute(handle, 7); output += result.output;
    if (result.status !== 'executing') break;
  }
  assert.equal(result.status, 'done', result.error);
  return output;
}
for (const fixture of ['operators', 'null-operators']) {
const source = (await read('scaffolding/tests/' + fixture + '.tower')).toString();
const expected = (await read('scaffolding/tests/' + fixture + '.expected.txt')).toString().replaceAll('\r\n', '\n');
test(fixture + ' preserve values, grouping and effects through Foundation', () => {
 for (const pointerBytes of [4,8]) for (const fast of [false,true]) {
  const handle = tower.compile(source, {pointerBytes});
  try {
    if (fast) tower.useFast(handle);
    assert.equal(execute(handle), expected);
    const canonical = tower.foundation(handle).source;
    const rebuilt = tower.compileFoundation(canonical);
    try {
      assert.equal(execute(rebuilt), expected);
      assert.equal(tower.foundation(rebuilt).source, canonical);
    } finally { tower.destroyExecution(rebuilt); }
  } finally { tower.destroyExecution(handle); }
 }
});
test(fixture + ' agree with LLVM/Wasm', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
  const llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, foundation);
  const result = llvm.compile(source);
  assert.equal(result.status, 'compiled', result.error);
  const executed = await executeWasm(result);
  assert.equal(executed.status, 'done', executed.error);
  assert.equal(executed.output, expected);
});
}

test('every compound operator reuses its binary operation semantics', () => {
  const cases = ['+', '-', '*', '/', '%', '<<', '>>', '>>>', '&', '^', '|'].map(op => [op, 'i32', '-17', '3']);
  cases.push(['&&','bool','true','false'], ['||','bool','false','true'], ['??','i32*','null','&number']);
  const source = 'import tower; var number = 42;\n' + cases.map(([op,type,a,b], index) =>
    `{ var a: ${type} = ${a}; var b: ${type} = ${b}; var expected_value = a ${op} b; a ${op}= b; print(a == expected_value); }`).join('\n');
  const handle = tower.compile(source);
  try { assert.equal(execute(handle), 'true\n'.repeat(cases.length)); }
  finally { tower.destroyExecution(handle); }
});

test('invalid operator operands are rejected before execution', () => {
  for (const [body, error] of [
    ['var a = true; a++;', /integer operands/],
    ['5++;', /addressable location/],
    ['var a = 1; print(!a);', /Expected bool/],
    ['var a: u8 = 1; var b: u32 = 2; a += b;', /Expected u8/],
    ['var a = 1; a <<= false;', /integer operands/],
    ['var p: void* = null; p++;', /void pointer/],
    ['var p: void* = null; p += 1;', /void pointer/],
    ['var p: void* = null; print(*p);', /void pointer/],
    ['var a = 1; var p = &a; p *= 2;', /Only \+= and -=/],
    ['var a = true ? print(1) : print(2);', /void call/],
    ['struct S { x: i32; } var a: S; var p = &a; var b = *p;', /aggregate copies/],
    ['var a = 1; print(a -> value);', /parse|Unexpected|Expected|unexpected/i],
    ['var a: i32 = 2147483648;', /out of range/],
    ['var a: i32 = -2147483649;', /out of range/],
    ['var a: i64 = 9223372036854775808;', /out of range/],
    ['var a: i64 = -9223372036854775809;', /out of range/],
    ['var a: i64 = -18446744073709551616;', /out of range/],
    ['var a = 1; a ||= true;', /bool operands/],
    ['var a = true; a &&= 1;', /integer type|Expected bool/],
    ['var a = 1; a ??= 2;', /pointer location/],
    ['print(1 ?? 2);', /pointer or null-conditional/],
    ['struct S { x: i32; } var p: S* = null; var x = p?.x;', /nullable scalar storage/],
    ['struct S { x: i32; } var p: S; print(p?.x ?? 0);', /pointer receiver/],
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
