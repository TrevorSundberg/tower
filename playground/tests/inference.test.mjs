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
 try{const result=tower.execute(h,100000);return {...result,source:tower.foundation(h).source};}
 finally{tower.destroyExecution(h);}
}
async function compare(source,output,spellings=[]){
 const result=execute(source);assert.equal(result.status,'done',result.error);assert.equal(result.output,output);
 for(const spelling of spellings)assert.ok(result.source.includes(spelling),spelling+'\n'+result.source);
 const round=execute(result.source);assert.equal(round.status,'done',round.error);assert.equal(round.source,result.source);assert.equal(round.output,output);
 if(llvm)for(const input of [source,result.source]){
  const compiled=llvm.compile(input);assert.equal(compiled.status,'compiled',compiled.error);
  const actual=await executeWasm(compiled);assert.equal(actual.status,'done',actual.error);assert.equal(actual.output,output);
 }
 return result.source;
}

test('initializer inference supports literals, calls, comparisons and raw locations',async()=>{
 const source=(await read('scaffolding/tests/inference_bindings.tower')).toString();
 await compare(source,'42\ntrue\n43\n42\n',[
  'var answer: integer_type(32, 1) =', 'var correct: boolean_type() =',
  'var pointer: pointer_type(integer_type(32, 1)) =', 'var unsigned_result: integer_type(32, 0) =',
  'var result: integer_type(32, 0) ='
 ]);
 await compare(`import foundation;
var low = -2147483648; var high = 2147483647;
var none = null; var empty = none == null; var text = "hi";
var bytes = alloc(u8, 2); bytes[1] = 9; var byte = bytes[1];
var second = bytes + 1; var loaded = *second;
var count = sizeof(i32); var alignment = alignof(i32);
print(low); print(high); print(empty); print(text[1]); print(byte); print(loaded); print(count); print(alignment);
free(bytes);`, '-2147483648\n2147483647\ntrue\n105\n9\n9\n4\n4\n',[
  'var none: pointer_type(empty_type()) = null;', "var text: pointer_type(integer_type(8, 0)) = 'hi';", 'var second: pointer_type(integer_type(8, 0)) = bytes + 1;',
  'var loaded: integer_type(8, 0) = *second;', 'var count: address_type() = sizeof(integer_type(32, 1));'
 ]);
});

test('typed operands constrain literal peers without silently widening typed values',async()=>{
 await compare(`import foundation;
var wide: u64 = 4294967296;
var sum = 4294967296 + wide; var reverse = wide + 4294967296;
var comparison = 4294967296 == wide; var small: u8 = 254; var byte = small + 1;
var wrap = byte + 1; var converted = convert(u32, 7);
print(sum); print(reverse); print(comparison); print(byte); print(wrap); print(converted);`,
 '8589934592\n8589934592\ntrue\n255\n0\n7\n',[
  'var sum: integer_type(64, 0) =', 'var reverse: integer_type(64, 0) =', 'var comparison: boolean_type() =', 'var byte: integer_type(8, 0) =', 'var converted: integer_type(32, 0) ='
 ]);
});

test('module inference follows forward dependencies without changing effect order or storage order',async()=>{
 await compare(`import foundation;
later = 40;
var early = later + 2;
var later = get_seed();
var observed = read_early();
print(early); print(later); print(observed);
fn get_seed(): i32 { print(1); return 7; }
fn read_early(): i32 { return early; }
var calls = 0;
fn next(): i32 { calls = calls + 1; return calls; }
var first = next(); var second = next();
print(first); print(second); print(calls);
{ var early = 9; print(early); } print(early);`,
 '1\n42\n7\n42\n1\n2\n2\n9\n42\n');
 // An explicit annotation breaks a type dependency cycle. Initialize the
 // forward storage before reading it; raw uninitialized reads are not tested.
 await compare('import foundation;\nb = 8; var a = b; var b: i32 = a; print(a); print(b);','8\n8\n');
});

test('inference works through replacements and preserves local lexical scope',async()=>{
 const example=(await read('scaffolding/tests/increment_rules.tower')).toString();
 const definitions=example.slice(0,example.indexOf('\nvar value:'));
 await compare(definitions+'\nvar value = 5; var old = value++; var next = ++value; print(old); print(next); print(value);',
  '5\n7\n7\n',['var old: integer_type(32, 1) = post_increment(&value);','var next: integer_type(32, 1) = pre_increment(&value);']);
 await compare('import foundation;\nfn f(a: u32): u32 { var result = a + 1; { var result = true; print(result); } return result; } var result = f(41); print(result);',
  'true\n42\n',['var result: integer_type(32, 0) = a + 1;','var result: boolean_type() = true;']);
});

test('inferred address and storage widths follow the selected target',()=>{
 for(const pointerBytes of [4,8]){
  const result=execute('import foundation;\nvar value = 41; var flag = value == 41; var p = &value; var pp = &p; var bp = &flag; *p = 42; *bp = false; var address = bits(usize, p); var copy = bits(i32*, address); print(*copy); print(flag); var width = sizeof(i32*); print(width);',pointerBytes);
  assert.equal(result.status,'done',result.error);assert.equal(result.output,`42\nfalse\n${pointerBytes}\n`);
 }
});

test('unresolved inference, incompatible types and literal range errors prevent every effect',async()=>{
 const nominal=(await read('scaffolding/tests/semantic_invalid/aggregate_inferred_copy.tower')).toString();
 const language='import tower;\n';
 assert.ok(nominal.startsWith(language));
 for(const [source,message] of [
  ['var x = x;',/initializer dependency cycle x -> x/],
  ['var a = b; var b = a;',/initializer dependency cycle a -> b -> a/],
  ['var a = &b; var b = &a;',/initializer dependency cycle/],
  ['var x: i32 = 1; { var x = x; }',/initializer dependency cycle x -> x/],
  ['fn f(): i32 { var x = later; var later = 1; return x; }',/Unknown local 'later'/],
  ['var x = 2147483648;',/out of range/],
  ['var x = -2147483649;',/out of range/],
  ['var x = 2147483648 + 1;',/out of range/],
  ['var u: u32 = 1; var s: i32 = 2; var result = u + s;',/Expected u32, got i32/],
  ['var x = true + false;',/requires integer operands/],
  ['var x = print(1);',/void call cannot be used as a value/],
  ['var x = 1; x = true;',/Expected i32, got bool/],
  ['var x = 1; var x = 2;',/Duplicate module variable/],
  ['var x: u8 = 256;',/out of range/],
  ['var x: u32 = true;',/Expected u32, got bool/],
  [nominal.slice(language.length),/Expected Other, got Item/],
  ['var x;',/Unexpected/],
 ]){
  const result=execute('import foundation;\nprint(99); '+source);
  assert.equal(result.status,'error',source);assert.match(result.error,message,source);
  assert.equal(result.steps,0);assert.equal(result.output,'');
  if(llvm){const compiled=llvm.compile('import foundation;\n'+source);assert.equal(compiled.status,'error',source);assert.match(compiled.error,message,source);}
 }
 const deep=Array.from({length:150},(_,i)=>`var x${i} = ${i===149?'1':`x${i+1}`};`).join('\n');
 const handle=tower.compile('import foundation;\n'+deep);
 try {
  // The query graph resolves this chain without recursive inference. Do not
  // execute its deliberately forward reads of uninitialized runtime storage.
  const canonical=tower.foundation(handle);
  assert.equal(typeof canonical.source,'string',canonical.error);
  assert.match(canonical.source,/var x0: integer_type\(32, 1\) =/);
 } finally { tower.destroyExecution(handle); }
});

test('source formatting preserves inference while canonical output spells the checked types',()=>{
 const source='import foundation;\n// infer this\nvar answer=42; fn f():bool{var result=answer==42;return result;}';
 const handle=tower.create(source);
 try{
  assert.equal(runToEnd(tower,handle).end.status,'done');
  const formatted=tower.format(handle);assert.equal(formatted.error,undefined);
  assert.ok(formatted.source.includes('// infer this\nvar answer = 42;'));
  assert.ok(formatted.source.includes('var result = answer == 42;'));
  const result=execute(formatted.source);assert.equal(result.status,'done',result.error);
  assert.ok(result.source.includes('var answer: integer_type(32, 1) = 42;'));assert.ok(result.source.includes('var result: boolean_type() = answer == 42;'));
 }finally{tower.destroy(handle);}
});
