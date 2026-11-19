import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
const read = name => readFile(new URL('../../'+name, import.meta.url));
const foundation = (await read('scaffolding/foundation.tower')).toString();
const bedrock = (await read('scaffolding/bedrock.tower')).toString();
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, foundation, undefined, bedrock);
function complete(text, options) {
  const pos = text.lastIndexOf('|'); assert.notEqual(pos, -1);
  const source = text.slice(0,pos)+text.slice(pos+1);
  const result = tower.complete(source, Buffer.byteLength(source.slice(0,pos)), options);
  assert.equal(result.error, undefined);
  return result;
}
const labels = (source, options) => complete(source,options).options.map(item=>item.label);

test('completes builtins and types from shared semantic definitions', () => {
  assert.ok(labels('pri|').includes('print'));
  assert.deepEqual(labels('var count: u|'), ['u32','u8','u64','usize']);
  assert.ok(!labels('var count: p|').includes('print'));
});
test('recovered ECS nodes supply function parameters, local scope and forward globals', () => {
  const source = 'fn demo(parameter: i32): i32 { var local: i32 = 1; { var hidden: i32 = 0; } | }\nfn later(): i32 { return 1; }\nvar global: i32 = 2;';
  const result = labels(source);
  for (const name of ['parameter','local','later','global']) assert.ok(result.includes(name), name+': '+result);
  assert.ok(!result.includes('hidden'));
  assert.ok(!labels('fn other(secret: i32): void { var private: i32 = 1; } |').includes('secret'));
  assert.ok(labels('fn demo(parameter: i32): void { var local: i32 = 1; loc|').includes('local'));
});
test('member completion follows typed declarations to shared struct fields', () => {
  assert.deepEqual(labels('struct Point { x: i32; y: i32; } var point: Point; point.|'), ['x','y']);
  assert.deepEqual(labels('fn f(point: Point*): void { point.x| } struct Point { x: i32; y: i32; }'), ['x']);
  assert.deepEqual(labels('struct A { first: i32; } struct B { second: i32; } fn f(point: A*): void { point.| } var point: B;'), ['first']);
});
test('project declarations contribute globals without leaking locals', () => {
  const files = [{path:'lib/helper.tower',text:'import tower; fn helper(secret: i32): void {} struct Point { x: i32; } var shared: i32 = 1;'}];
  const names = labels('import tower; import "lib/helper"; |', {files});
  for (const name of ['helper','Point','shared']) assert.ok(names.includes(name), name);
  assert.ok(!names.includes('secret'));
});
test('comments, strings and unfinished comments suppress suggestions', () => {
  for (const source of ['// pri|', '/* pri| */', '/* pri|', 'print("pri|");', 'print("pri|'])
    assert.deepEqual(labels(source), [], source);
});
test('presentation overrides do not change lexical completion eligibility', () => {
  assert.ok(labels('token Identifier = /[A-Za-z_][A-Za-z0-9_]*/ as string; pri|').includes('print'));
  assert.ok(labels('token Identifier = /[A-Za-z_][A-Za-z0-9_]*/ as pattern; pri|').includes('print'));
  assert.deepEqual(labels('token String = /"[^"]*"/ as identifier; print("pri|");'), []);
  assert.deepEqual(labels(String.raw`skip LineComment = /\/\/[^\n]*/; // pri|`), []);
});
test('uses active grammar declarations and handles Unicode byte offsets', () => {
  assert.ok(labels("parse Greeting = 'greet'; parse Statement |= Greeting ';'; gre|").includes('greet'));
  assert.ok(labels('parse Something = CoreO|;').includes('CoreOperand'));
  assert.ok(labels('parse Something = Id|;', {editingModule:'bedrock'}).includes('Identifier'));
  const result = complete('// 🙂\npri|nt');
  assert.deepEqual([result.from,result.to], [8,13]);
  assert.ok(result.options.some(item=>item.label==='print'));
});
test('completion queries release temporary shared entities and reject invalid byte positions', () => {
  complete('pri|');
  const nodes = tower.exports.tw_live_nodes();
  for (let i=0;i<30;i++) complete('fn demo(a: i32): void { var local: i32 = 1; loc|');
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.match(tower.complete('// 🙂', 5).error, /UTF-8/);
});
