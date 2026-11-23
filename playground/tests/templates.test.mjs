import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=process.env.TOWER_INTERPRETER_ONLY?null:await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
function execute(source,pointerBytes=4){
 const h=tower.compile(source,{pointerBytes});
 try{let result,output='';do{result=tower.execute(h,100000);output+=result.output;}while(result.status==='executing');return {...result,output,source:tower.foundation(h).source};}
 finally{tower.destroyExecution(h);}
}
async function compare(source,expected){
 let result;
 for(const width of [4,8]){
  result=execute(source,width);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
  const round=execute(result.source,width);assert.equal(round.status,'done',round.error);assert.equal(round.output,expected);assert.equal(round.source,result.source);
 }
 if(llvm)for(const input of [source,result.source]){
  const built=llvm.compile(input);assert.equal(built.status,'compiled',built.error);
  const actual=await executeWasm(built);assert.equal(actual.status,'done',actual.error);assert.equal(actual.output,expected);
 }
 return result.source;
}
const box='fn box(T: type): type { struct Result { value: T; } return Result; }';
test('compiler scans preserve token ownership and interleaved specialization identities',async()=>{
 const source=(await read('scaffolding/tests/compiler_scans.tower')).toString();
 const text=await compare(source,'17\n23\n31\n47\n59\n61\n71\n17\n');
 assert.equal((text.match(/struct `pair\(i32, u32\)`/g)||[]).length,1);
 assert.equal((text.match(/struct `pair\(u32, i32\)`/g)||[]).length,1);
});

test('the short fixed-size stack example specializes type and integer arguments',async()=>{
 const source=(await read('scaffolding/examples/templates.tower')).toString();
 const text=await compare(source,'20\n10\n');
 assert.equal((text.match(/struct `buffer\(i32, 4\)`/g)||[]).length,1);
 assert.ok(text.includes('data: array_type(integer_type(32, 1), 4);'));
 assert.ok(!text.includes('T: type'));
 assert.ok(!text.includes('fn buffer('));
 const h=tower.create(source);
 try{assert.equal(runToEnd(tower,h).end.status,'done');assert.equal(tower.format(h).source,source);}finally{tower.destroy(h);}
});

test('integer type arguments preserve identity, forward through constructors and resolve array lengths',async()=>{
 const source=(await read('scaffolding/tests/type_numeric_composition.tower')).toString();
 const text=await compare(source,'42\n7\n8\n12\n9\n');
 assert.equal((text.match(/struct `buffer\(i32, 2\)`/g)||[]).length,1);
});
for(const [name,program,error] of [
 ['zero length','var x: buffer(i32,0);',/Array length/],
 ['excessive length','var x: buffer(i32,1048577);',/Array length/],
 // Unsigned negation wraps; the resulting extent must fail the array bound.
 ['negative unsigned argument','var x: buffer(i32,-1);',/Array length must be between 1 and 1,048,576/],
 ['type instead of integer','var x: buffer(i32,i32);',/^Expected usize, got type; use an explicit conversion$/],
 ['boolean argument type','fn bad(n: bool): type { return i32; } var x: bad(1);',/require an integer type/],
]) {
 test('invalid integer type argument: '+name,()=>{
  const result=execute('import tower; print(123); fn buffer(T: type, size: usize): type { struct R { data: T[size]; } return R; } '+program);
  assert.equal(result.status,'error',program);
  assert.equal(result.output,'');assert.equal(result.steps,0);
  assert.match(result.error,error);
 });
}
test('invalid integer type argument: mutable storage',async()=>{
 const result=execute((await read('scaffolding/tests/semantic_invalid/type_numeric_mutable.tower')).toString());
 assert.equal(result.status,'error');
 assert.equal(result.output,'');assert.equal(result.steps,0);
 assert.match(result.error,/^Compile-time expression cannot capture runtime storage: binding is mutable, escaped or lacks an initializer/);
});
test('immutable known storage supplies an integer type argument',async()=>{
 await compare((await read('scaffolding/tests/type_numeric_known.tower')).toString(),'8\n');
});
test('nested integer negation supplies a valid array extent',async()=>{
 await compare((await read('scaffolding/tests/type_numeric_negation.tower')).toString(),'8\n');
});
test('generic calls bind types without replacing value identifiers or duplicating effects',async()=>{
 await compare(`import tower;
parse CoreTypeArguments = CoreType | CoreTypeArguments ',' CoreType;
${box} var x: box(i32); x.value = 42; print(x.value);`,'42\n');
 await compare(`import tower;
fn id(T: type, value: T): T { var T: i32 = 99; print(T); return value; }
var calls = 0; fn next(): i32 { calls = calls + 1; return calls; }
print(id(i32, next())); print(id(i32, next())); print(calls);`,'99\n1\n99\n2\n2\n');
 await compare((await read('scaffolding/tests/type_identity_composition.tower')).toString(),'42\n7\n8\n');
});
test('template names bind forward and recursion reuses concrete nodes',async()=>{
 await compare(`import tower;
var p: list(i32); p.next = null; p.value = factorial(i32, 5); print(p.value);
fn list(T: type): type { struct Node { value: T; next: list(T)*; self: Node*; } return Node; }
fn factorial(T: type, n: T): T { var done = n <= 1; if done { return 1; } var previous = n - 1; var rest = factorial(T, previous); var result = n * rest; return result; }
fn alias(T: type): type { return list(T); }
var pointer: alias(i32)* = &p; print(pointer.value);`,'120\n120\n');
});
test('nominal identities, type-argument shapes and generated name collisions stay distinct',async()=>{
 const text=await compare(`import tower;
${box}
struct \`box(i32)\` { other: i32; }
struct \`i32[2]\` { other: i32; }
struct Left { value: i32; } struct Right { value: i32; }
var a: box(i32); a.value = 42; print(a.value);
var b: box(Left); b.value.value = 3; print(b.value.value);
var c: box(Right); c.value.value = 4; print(c.value.value);
var d: box(i32[2]); d.value[1] = 7; print(d.value[1]);
var e: box(\`i32[2]\`); e.value.other = 8; print(e.value.other);`,'42\n3\n4\n7\n8\n');
 assert.ok(text.includes('struct `box(i32)_2`'));
 assert.ok(text.includes('struct `box(Left)`'));assert.ok(text.includes('struct `box(Right)`'));
});
test('the typed vector grows scalar and pointer storage with target layouts',async()=>{
 const vector='import library.vector;\n';
 await compare(vector+`
var values: vector(i32); vector_init(i32, &values);
var i: i32 = 0; loop { var done = i == 40; if done { break; } var ok = vector_push(i32, &values, i); if ok {} else { print(999); break; } i = i + 1; }
print(values.length); print(values.data[39]);
var maximum: usize = 0; maximum = maximum - 1; print(vector_reserve(i32, &values, maximum)); print(values.data[0]);
var pointers: vector(i32*); vector_init(i32*, &pointers); var value = 42;
print(vector_push(i32*, &pointers, &value)); var p = pointers.data[0]; print(*p);
vector_dispose(i32, &values); vector_dispose(i32*, &pointers); print(values.length);`,'40\n39\nfalse\n0\ntrue\n42\n0\n');
});
test('invalid templates fail before effects and retain instantiation context',()=>{
 for(const [source,expected] of [
  [box+'var a: box();',/Wrong argument count/],
  [box+'var a: box(Missing);',/Unknown type 'Missing'/],
  [box+'var a: i32 = box(i32);',/Expected i32, got type/],
  ['fn f(T: type, v: T): T { return v; } var x = f(5, 1);',/Unknown type '5'/],
  ['fn f(T: type, v: T): T { return v; } var x: u32 = 1; f(i32,x);',/Expected i32, got u32/],
  ['fn f(T: type, T: i32): T { return T; }',/Duplicate template parameter/],
  ['fn f(T: type): type { struct S { value: f(T); } return S; } var x: f(i32);',/Recursive by-value/],
  ['fn f(T: type): type { return f(T); } var x: f(i32);',/Tower call stack limit exceeded/],
  ['fn f(T: type): type { struct S { value: f(T*)*; } return S; } var x: f(i32);',/nesting|specialization limit/],
  ['fn f(T: type): type { print(9); return T; } var x: f(i32);',/Compile-time output requires an explicit effect capability/],
  ['fn f(T: type): type { struct S { value: T; } return i32; } var x: f(i32);',/Struct types must be declared at top level/],
  ['export fn f(T: type, v: T): T { return v; }',/export a concrete wrapper/],
  ['fn f(T: type, v: T): void {} struct S { x: i32; } struct R { x: i32; } var s: R; f(S,s);',/Expected S, got R/],
  ['fn f(T: type): void {} fn f(): void {}',/duplicate function/],
  ['struct type { value: i32; } struct type {}',/duplicate type/],
 ]){
  const result=execute('import tower; print(123); '+source);assert.equal(result.status,'error',source);assert.match(result.error,expected,source);assert.equal(result.output,'');assert.equal(result.steps,0);
 }
 const bad=execute('import tower; fn broken(T: type, value: T): T { return absent; }\nprint(broken(i32, 1));');
 assert.match(bad.error,/Unknown local 'absent'/);assert.match(bad.error,/Instantiated by broken\(i32,1\) at line 2/);
});
