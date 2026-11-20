import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const example=(await read('scaffolding/examples/increment.tower')).toString();
const definitions=example.slice(0,example.indexOf('\nvar value:'));
let llvm;
if(!process.env.TOWER_INTERPRETER_ONLY)llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
async function compare(source,output){
 const h=tower.compile(source);
 try{
  let actual='',result;
  for(let i=0;i<20000;i++){
   result=tower.execute(h,1);actual+=result.output;
   if(result.status!=='executing')break;
  }
  assert.equal(result.status,'done',result.error);assert.equal(actual,output);
  const canonical=tower.foundation(h).source;
  const r=tower.compileFoundation(canonical);
  try{assert.equal(tower.foundation(r).source,canonical);}finally{tower.destroyExecution(r);}
  if(llvm){const compiled=llvm.compile(canonical);assert.equal(compiled.status,'compiled',compiled.error);const executed=await executeWasm(compiled);assert.equal(executed.status,'done',executed.error);assert.equal(executed.output,output);}
 }finally{tower.destroyExecution(h);}
}

test('increment example uses ordinary places and standalone calls',async()=>{
 await compare(example,'5\n6\n7\n7\n9\n');
});
test('the same increment rules compose in operands, calls, returns, conditions and indices',async()=>{
 await compare(definitions+`
var value: i32 = 5;
value++; ++value;
print(value++);
print(++value);
var sum: i32 = value++ + ++value;
print(sum); print(value);
fn identity(n: i32): i32 { return n; }
print(identity(identity(value++)));
fn next(): i32 { return value++; }
print(next()); print(value);
var entered: bool = false;
if false { value++; }
fn condition(n: i32): bool { return true; }
if condition(value++) { entered = true; }
print(entered); print(value);
var array: i32[2]; array[0] = 20; array[1] = 30;
var index: i32 = 0;
print(array[index++]++); print(index); print(array[0]);
struct S { field: i32; } var s: S; s.field = 40;
print(s.field++); print(++s.field);
var pointer: S* = &s;
pointer.field++; print(pointer.field);
`, '7\n9\n20\n11\n11\n12\n13\ntrue\n14\n20\n1\n21\n40\n42\n43\n');
});
test('nested operands preserve left-to-right values and capture the assignment target first',async()=>{
 await compare(definitions+`
fn digits(a: i32, b: i32): i32 { var tens: i32 = a * 10; return_value = tens + b; return return_value; }
var return_value: i32;
var value: i32 = 1;
print(digits(value, value++)); print(value);
fn identity(n: i32): i32 { return n; }
var equal: bool = identity(value++) == identity(value++);
print(equal); print(value);
var array: i32[3]; array[0] = 10; array[1] = 20; array[2] = 30;
var index: i32 = 0;
array[index++] = index++;
print(index); print(array[0]); print(array[1]);
`, '11\n2\nfalse\n4\n2\n1\n20\n');
});
test('address operands share checking and lowering for user and builtin calls',async()=>{
 await compare(`
fn set(p: i32*): void { *p = 42; }
var value: i32; set(&value); print(value);
struct S { field: i32; } var s: S; set(&s.field); print(s.field);
var array: i32[2]; set(&array[1]); print(array[1]);
var byte: u8 = 0; fill(&byte, 7, 1); print(byte);
var copy_to: i32; copy(&copy_to, &value, 4); print(copy_to);
var raw: usize = bits(usize, &value); var exists: bool = raw != 0; print(exists);
`, '42\n42\n42\n7\n42\ntrue\n');
});
test('increment and nested calls retain static errors before execution',()=>{
 for(const [source,message] of [
  ['var n: bool = false; ++n;',/integer operands/],
  ['print(post_increment(5));',/integer type|Expected i32\*/],
  ['var x: i32 = 1; print(print(x));',/void call cannot be used as a value/],
  ['post_increment(&missing);',/Unknown local/],
  ['5++;',/addressable location/],
  ['fn identity(x: i32): i32 { return x; } print('+ 'identity('.repeat(140)+'1'+')'.repeat(140)+');',/expression nesting limit/],
 ]){const h=tower.compile(definitions+'\nprint(99);'+source);try{const result=tower.execute(h);assert.equal(result.status,'error');assert.equal(result.steps,0);assert.equal(result.output,'');assert.match(result.error,message);}finally{tower.destroyExecution(h);}}
});
test('an infinite nested call stays resumable with one-step budgets',()=>{
 const h=tower.compile('fn forever(): i32 { loop {} } print(forever());');
 try{for(let i=1;i<=20;i++){const result=tower.execute(h,1);assert.equal(result.status,'executing');assert.equal(result.steps,i);assert.equal(result.output,'');}}finally{tower.destroyExecution(h);}
});
