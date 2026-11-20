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
  assert.deepEqual(labels('var count: u|'), ['u32','u64','u8','usize']);
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

test('enum completion uses the shared type and member declarations', async () => {
  const source = (await read('scaffolding/tests/language_enums.tower')).toString();
  assert.deepEqual(labels(source+'\nState.|'), ['Idle','Busy','Done']);
  assert.ok(labels(source+'\nvar state: St|').includes('State'));
  assert.ok(!labels(source+'\n|').includes('Busy'));
  assert.deepEqual(labels(source+'\nvar state: State = State.Idle; state.|'), []);
});
test('project declarations contribute globals without leaking locals', () => {
  const files = [{path:'lib/helper.tower',text:'import tower; fn helper(secret: i32): void {} struct Point { x: i32; } var shared: i32 = 1;'}];
  const names = labels('import tower; import lib.helper; |', {files});
  for (const name of ['helper','shared']) assert.ok(names.includes(name), name);
  assert.ok(!names.includes('Point'));
  assert.deepEqual(labels('import tower; import lib.helper; var point: Po|', {files}), ['Point']);
  assert.ok(!names.includes('secret'));
  assert.ok(!labels('he|', {files}).includes('helper'));
  assert.deepEqual(labels('import tower; import lib.helper; helper(sh|', {files}), ['shared']);
  assert.deepEqual(labels('import tower; import lib.helper as helpers; helpers.he|', {files}), ['helper']);
  assert.deepEqual(labels('import tower; import lib.helper as helpers; print(helpers.he|);', {files}), []);
  assert.ok(!labels('import tower; import lib.helper; 1 + he|;', {files}).includes('helper'));
});

test('imported generic names use the same module graph and template registry', async () => {
  const files = [{path:'library/vector.tower', text:(await read('scaffolding/library/vector.tower')).toString()}];
  assert.ok(labels('import tower; import library.vector; vector_i|', {files}).includes('vector_init'));
  assert.ok(!labels('import tower; import library.vector; print(vector_i|', {files}).includes('vector_init'));
});

test('LR lookahead excludes declaration keywords inside calls, including the reported print case', () => {
  assert.deepEqual(labels('var value: i32 = 1; print(va|'), ['value']);
  assert.deepEqual(labels('var value: i32 = 1; print(va|lue);'), ['value']);
  const names = labels('var value: i32; print(|');
  for (const name of ['var','fn','struct','return','i32','print','free','fill','copy','label','jump','trap'])
    assert.ok(!names.includes(name), name+': '+names);
  assert.ok(names.includes('value'));
  assert.ok(labels('va|').includes('var'));
});

test('ordinary semantic resolution filters assignments, declarations, arguments, returns and conditions', () => {
  const vars = 'var value: i32 = 1; var valid: bool = true; ';
  for (const tail of ['if va|','var target: bool = va|','var target: bool; target = va|',
    'fn f(): bool { return va|','fn f(first: bool, next: i32): void {} f(va|',
    'fn f(first: i32, next: bool): void {} f(0, va|'])
    assert.deepEqual(labels(vars+tail), ['valid'], tail);
  assert.deepEqual(labels(vars+'fn f(v: i32): void {} f(va|'), ['value']);
  assert.deepEqual(labels(vars+'var va|'), []);
  assert.deepEqual(labels(vars+'fn f(va|'), []);
});

test('semantic field resolution follows inferred receivers, nested records and array elements', () => {
  assert.deepEqual(labels('struct Point { x: i32; y: bool; } var point: Point; var inferred = &point; inferred.|'), ['x','y']);
  assert.deepEqual(labels('struct Inner { inside: i32; } struct Outer { nested: Inner; } var object: Outer; object.nested.|'), ['inside']);
  assert.deepEqual(labels('struct Point { x: i32; y: bool; } var points: Point[2]; points[0].|'), ['x','y']);
  assert.deepEqual(labels('struct Point { x: i32; y: bool; } var point: Point; var flag: bool = point.|'), ['y']);
});

test('new Tower control flow shares the same expected types and lexical scopes', () => {
  const vars = 'import tower; var value: i32 = 1; var valid: bool = true; ';
  assert.deepEqual(labels(vars+'while va|'), ['valid']);
  assert.deepEqual(labels(vars+'match value { 1 => { var flag: bool = va|; } _ => {} }'), ['valid']);
  assert.ok(labels('import tower; while true { var local:i32 = 1; loc|').includes('local'));
});

test('for completion uses header scope, bool conditions and discarded updates', () => {
  assert.deepEqual(labels('import tower; var valid: bool; var value: i32; for (; va|; ) {}'), ['valid']);
  assert.ok(labels('import tower; for (var index = 0; index < 2; ind|) {}').includes('index'));
  assert.ok(labels('import tower; for (var index = 0; index < 2; index++) { ind| }').includes('index'));
  assert.ok(!labels('import tower; for (var index = 0; index < 2; index++) {} ind|').includes('index'));
  assert.ok(!labels('import tower; for (; true; hid|) { var hidden = 0; }').includes('hidden'));
  assert.ok(labels('import tower; fn action(): void {} for (; true; ac|) {}').includes('action'));
  assert.ok(!labels('import tower; fn action(): void {} for (; ac|; ) {}').includes('action'));
});

test('foundation control operations respect function scope and trap argument types', () => {
  assert.ok(!labels('la|').includes('label'));
  assert.ok(!labels('ju|').includes('jump'));
  assert.ok(labels('fn f():void { la|').includes('label'));
  assert.ok(!labels('fn f():void { { la|').includes('label'));
  const vars = 'var value:u32; var valid:bool; var message:u8*; var mistake:i32*; ';
  assert.deepEqual(labels(vars+'trap(m|'), ['message']);
  assert.deepEqual(labels(vars+'trap(message, va|'), ['value']);
});

test('shadowing is applied before expected-type filtering; address and load preserve pointer types', () => {
  assert.deepEqual(labels('var value:i32; fn f():void { var value:bool; var target:i32 = va|'), []);
  assert.deepEqual(labels('var value:i32; var pointer:i32* = &va|'), ['value']);
  assert.deepEqual(labels('var pointer:i32*; var plain:i32; var value:i32 = *p|'), ['pointer']);
});

test('builtin argument roles resolve types, sizes, bytes and pointers before the call is complete', () => {
  const vars = 'var count: usize; var byte: u8; var number: i32; var pointer: i32*; ';
  assert.ok(labels(vars+'alloc(i|').includes('i32'));
  assert.deepEqual(labels(vars+'alloc(i32, c|'), ['count','convert']);
  assert.deepEqual(labels(vars+'sizeof(n|'), []);
  const types = labels(vars+'sizeof(|');
  assert.ok(types.includes('i32'));
  for (const name of ['false','true','null','pointer']) assert.ok(!types.includes(name), name);
  assert.deepEqual(labels(vars+'free(p|'), ['pointer']);
  assert.deepEqual(labels(vars+'fill(pointer, b|'), ['byte','bits']);
});

test('active grammar overrides and extensions change the actual next-token set', () => {
  assert.deepEqual(labels("parse Statement = 'only' ';'; va|"), []);
  const grammar = "parse Choice = 'alpha' 'omega'; parse Statement |= Choice ';'; ";
  assert.ok(labels(grammar+'al|').includes('alpha'));
  assert.ok(!labels(grammar+'al|').includes('omega'));
  assert.deepEqual(labels(grammar+'alpha om|'), ['omega']);
  assert.deepEqual(labels(grammar+'alpha va|'), []);
  assert.deepEqual(labels("parse CoreOperand |= 'special'; print(sp|"), ['special']);
  assert.ok(!labels("print(sp|); parse CoreOperand |= 'special';").includes('special'));
});

test('identifier candidates and the semantic hole use the active lexer', () => {
  assert.deepEqual(labels('token Identifier = /[A-Z][A-Za-z]*/; var Value: I32; print(V|'), []); // unresolved I32 is not guessed
  assert.deepEqual(labels('token Identifier = /[a-z][a-z]+/; var value: i32; print(va|'), []); // i32 no longer lexes as a type name
  assert.deepEqual(labels('token Identifier = /[a-z][a-z0-9]+/; var value: i32; print(va|'), ['value']);
});

test('a valid suffix is retained for semantic resolution and forward declarations', () => {
  const source = 'fn target(flag: bool): void {} var value:i32; var valid:bool; target(va|); fn later():void {}';
  assert.deepEqual(labels(source), ['valid']);
  assert.ok(labels('fn broken():void { unknown(); } var value:i32; print(va|);').includes('value'));
});

test('unfinished nested blocks close before recovery explores additional statements', () => {
  for (const depth of [1,3,6]) {
    const source = 'fn f(local:i32): void { '+'{ '.repeat(depth)+'loc|';
    assert.deepEqual(labels(source), ['local'], 'nested blocks: '+depth);
  }
});

test('an unfinished function signature still completes parameter and return types', () => {
  assert.deepEqual(labels('fn f(value: i|'), ['i32','i64']);
  assert.deepEqual(labels('fn f(): i|'), ['i32','i64']);
  assert.deepEqual(labels('struct Point { x: i|'), ['i32','i64']);
});

test('function return types and loop context constrain suggestions', () => {
  const prefix = 'fn good(): bool { return true; } fn gone(): void {} fn amount(): i32 { return 1; } ';
  assert.deepEqual(labels(prefix+'var flag: bool = g|'), ['good']);
  assert.deepEqual(labels(prefix+'print(go|'), ['good']);
  assert.ok(!labels('br|').includes('break'));
  assert.ok(labels('loop { br|').includes('break'));
  assert.ok(!labels('fn f(): void { st|').includes('struct'));
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
  const allocations = tower.exports.tw_live_allocations();
  for (let i=0;i<30;i++) complete('fn demo(a: i32): void { var local: i32 = 1; loc|');
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
  assert.match(tower.complete('// 🙂', 5).error, /UTF-8/);
});
