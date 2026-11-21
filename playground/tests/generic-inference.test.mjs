import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,loadLLVM,executeWasm,runToEnd} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=process.env.TOWER_INTERPRETER_ONLY?null:await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
function execute(source,width=4,fast=false){
 const handle=tower.compile(source,{pointerBytes:width});
 try{
  if(fast)tower.useFast(handle);
  let result,output='';do{result=tower.execute(handle,100000);output+=result.output;}while(result.status==='executing');
  return {...result,output,foundation:result.status==='done'?tower.foundation(handle).source:''};
 }finally{tower.destroyExecution(handle);}
}
async function compare(source,expected){
 let canonical;
 for(const width of [4,8])for(const fast of [false,true]){
  const result=execute(source,width,fast);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
  const round=execute(result.foundation,width,fast);assert.equal(round.status,'done',round.error);assert.equal(round.output,expected);
  assert.equal(round.foundation,result.foundation);canonical=result.foundation;
 }
 if(llvm)for(const input of [source,canonical]){
  const built=llvm.compile(input);assert.equal(built.status,'compiled',built.error);
  const result=await executeWasm(built);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
 }
}
test('generic calls infer collection element types and reuse explicit specializations',async()=>{
 await compare(`import tower; import library.vector; import library.stack; import library.queue;
 var values:vector(i32); vector_init(&values); defer vector_dispose(&values);
 print(vector_push(&values,41)); print(vector_push(i32,&values,42));
 var out:i32; print(vector_pop(&values,&out)); print(out);
 var s:stack(i32); stack_init(&s); defer stack_dispose(&s);
 print(stack_push(&s,7)); print(stack_pop(&s,&out)); print(out);
 var q:queue(i32); queue_init(&q); defer queue_dispose(&q);
 print(queue_push(&q,9)); print(queue_pop(&q,&out)); print(out);`,
 'true\ntrue\ntrue\n42\ntrue\ntrue\n7\ntrue\ntrue\n9\n');
});
test('typed peers constrain literals in either position without narrowing signed minima or u64',async()=>{
 await compare(`import tower;
 fn first(T:type,a:T,b:T):T{return a;} fn last(T:type,a:T,b:T):T{return b;}
 var wide:i64=7; var unsigned:u64=7;
 print(first(-9223372036854775808,wide)); print(last(wide,-9223372036854775808));
 print(first(18446744073709551615,unsigned)); print(last(unsigned,18446744073709551615));
 print(first(1,2)); print(first(true,false)); print(first("a","b")[0] == 97);
 var pointer:i32* = null; print(first((null),pointer)==null);`,
 '-9223372036854775808\n-9223372036854775808\n18446744073709551615\n18446744073709551615\n1\ntrue\ntrue\ntrue\n');
});
test('deduction preserves argument effect order and exact pointer/array nominal constraints',async()=>{
 await compare(`import tower;
 fn box(T:type):type {struct Result{value:T;}return Result;}
 fn read(T:type,p:box(T)*):T{return p.value;}
 fn choose(T:type,a:T,b:T):T{return a;}
 var state=0; fn next():i32{state++;return state;}
 print(choose(next(),next())); print(state);
 var value:box(i32);value.value=42;print(read(&value));
 fn element(T:type,p:T[2]*):T{return (*p)[1];}
 var array:i32[2];array[1]=17;print(element(&array));`, '1\n2\n42\n17\n');
});
test('nested specializations and straight-return aliases preserve nominal type identity',async()=>{
 await compare(`import tower;
 fn box(U:type):type{struct Result{value:U;}return Result;}
 fn alias(V:type):type{return box(V);}
 fn pointer(V:type):type{return V*;}
 fn load(T:type,p:alias(T)*):T{return p.value;}
 fn indirect(T:type,p:pointer(T)):T{return *p;}
 fn nested(T:type,p:box(box(T)*)*):T{return p.value.value;}
 var value:i64=42;var inner:box(i64);inner.value=value;
 var outer:box(box(i64)*);outer.value=&inner;
 print(load(&inner));print(indirect(&value));print(nested(&outer));`, '42\n42\n42\n');
});
test('unresolved or conflicting deductions diagnose and explicit calls remain supported',()=>{
 for(const [body,error] of [
  ['fn pick(T:type,a:T,b:T):T{return a;} var a:i32=1; var b:u32=2; print(pick(a,b));',/Conflicting inferred types/],
  ['fn make(T:type):T{var v:T=0;return v;} print(make());',/Cannot infer type argument/],
  ['fn id(T:type,x:T):T{return x;} id(null);',/Cannot infer type argument/],
  ['fn id(T:type,x:T):T{return x;} id();',/Wrong argument count/],
  ['fn pick(T:type,a:T,b:T):T{return a;} var byte:u8=0; pick(byte,256);',/range/],
  ['fn a(T:type):type{struct R{x:T;}return R;} fn b(T:type):type{struct R{x:T;}return R;} fn get(T:type,p:a(T)*):T{return p.x;} var value:b(i32);get(&value);',/Cannot infer type argument/],
  ['fn buffer(T:type,n:usize):type{struct R{data:T[n];}return R;} fn get(T:type,p:buffer(T,2)*):T{return p.data[0];} var value:buffer(i32,3);get(&value);',/Expected/],
 ]){
  const result=execute('import tower; '+body);assert.equal(result.status,'error');assert.match(result.error,error);
 }
 assert.equal(execute('import tower; fn make(T:type):T{var v:T=42;return v;} print(make(i32));').output,'42\n');
});
test('inferred calls retain deterministic specializations and typed completion',()=>{
 const source='import tower; fn id(T:type,value:T):T{return value;} var wide:i64=42; print(id(wide)); print(id(i64,wide));';
 const first=execute(source),second=execute(source);
 assert.equal(first.status,'done',first.error);assert.equal(second.foundation,first.foundation);
 assert.equal((first.foundation.match(/fn `id\(i64\)`/g)||[]).length,1);
 const text='import tower; fn choose(T:type,a:T,b:T):T{return a;} var wide:i64=42; var narrow:i32=1; choose(wide, );';
 const offset=Buffer.byteLength(text.slice(0,text.lastIndexOf(')')));
 const result=tower.complete(text,offset);assert.equal(result.error,undefined);
 const names=result.options.map(option=>option.label);
 assert.ok(names.includes('wide'));assert.ok(!names.includes('narrow'));
 const handle=tower.create(source);
 try{assert.equal(runToEnd(tower,handle).end.status,'done');assert.equal(tower.format(handle).error,undefined);}finally{tower.destroy(handle);}
});
test('the shared inferred worker fixture preserves its scalar kernel behavior',async()=>{
 const kernel=(await read('scaffolding/tests/inferred_parallel_unit.tower')).toString();
 await compare(kernel+'\nvar values:u32[3];values[0]=1;values[1]=2;values[2]=3;inferred_transform(&values[0],3);print(inferred_checksum(&values[0],3));', '39\n');
});
