import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,loadLLVM,executeWasm,runToEnd} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
after(()=>tower.close());
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
 if(llvm)for(const [input,optimize] of [[source,false],[source,true],[canonical,true]]){
  const built=llvm.compile(input,{optimize});assert.equal(built.status,'compiled',built.error);
  const result=await executeWasm(built);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
 }
}
test('foreach copies scalar values, borrows aggregates and evaluates its source once',async()=>{
 await compare(`import tower;import library.vector;
 var values:vector(i32);vector_init(&values);defer vector_dispose(&values);
 foreach(var item in &values){print(99);}
 vector_push(&values,1);vector_push(&values,2);vector_push(&values,3);
 var calls=0;fn source():vector(i32)*{calls++;return &values;}
 foreach(var item in source()){item+=10;print(item);}print(calls);print(values.data[0]);
 foreach(var &item in &values){*item*=2;}foreach(var item in &values){print(item);}
 struct Pair{a:i32;b:i32;}
 var records:vector(Pair);vector_init(&records);defer vector_dispose(&records);
 vector_reserve(&records,2);records.length=2;records.data[0].a=20;records.data[0].b=1;records.data[1].a=21;records.data[1].b=1;
 foreach(var &item in &records){item.a+=item.b;print(item.a);}
 var pointers:vector(Pair*);vector_init(&pointers);defer vector_dispose(&pointers);
 vector_push(&pointers,&records.data[0]);foreach(var item in &pointers){print(item.a);}`,
 '11\n12\n13\n1\n1\n2\n4\n6\n21\n22\n21\n');
});
test('foreach preserves ring FIFO order and aliases inherit nominal iteration',async()=>{
 await compare(`import tower;import library.queue;import library.stack;
 var q:queue(i32);queue_init(&q);defer queue_dispose(&q);var out:i32;
 for(var i=0;i<8;i++){queue_push(&q,i);}for(var i=0;i<6;i++){queue_pop(&q,&out);}
 queue_push(&q,8);queue_push(&q,9);foreach(var item in &q){print(item);}
 foreach(var &item in &q){*item+=10;}foreach(var item in &q){print(item);}
 var s:stack(i32);stack_init(&s);defer stack_dispose(&s);stack_push(&s,4);stack_push(&s,5);
 foreach(var item in &s){print(item);}`, '6\n7\n8\n9\n16\n17\n18\n19\n4\n5\n');
});
const protocol=`import tower;
struct Range{first:i32;count:i32;}struct Cursor{value:i32;remaining:i32;}
var events=0;
fn Range_iterate_begin(source:Range*,state:Cursor*):void{events=events*10+1;state.value=source.first-1;state.remaining=source.count;}
fn Range_iterate_next(source:Range*,state:Cursor*):bool{if state.remaining==0{return false;}state.remaining--;state.value++;return true;}
fn Range_iterate_element(source:Range*,state:Cursor*):i32*{return &state.value;}
fn Range_iterate_end(source:Range*,state:Cursor*):void{events=events*10+2;}
struct Other{value:i32;}
fn Other_iterate_begin(source:Other*,state:bool*):void{*state=false;}
fn Other_iterate_next(source:Other*,state:bool*):bool{if *state{return false;}*state=true;return true;}
fn Other_iterate_element(source:Other*,state:bool*):i32*{return &source.value;}
fn Other_iterate_end(source:Other*,state:bool*):void{}
`;
test('nominal protocols in one module clean up exactly once on break return and nesting',async()=>{
 await compare(protocol+`
 var range:Range;range.first=3;range.count=3;var item=99;
 foreach(var item in &range){defer {events=events*10+3;}if item==3{continue;}print(item);break;}print(events);print(item);
 events=0;fn early(p:Range*):i32{foreach(var item in p){defer {events=events*10+3;}return item;}return 0;}
 print(early(&range));print(events);
 events=0;range.count=1;foreach(var item in &range){foreach(var item in &range){print(item);continue;}}print(events);
 events=0;range.count=0;foreach(var item in &range){print(99);}print(events);
 var other:Other;other.value=42;foreach(var item in &other){print(item);}
 `,'4\n1332\n99\n3\n132\n3\n1122\n12\n42\n');
});
test('foreach inside for and deferred blocks keeps continue targets and cleanup order',async()=>{
 await compare(`import tower;import library.vector;
 var v:vector(i32);vector_init(&v);defer vector_dispose(&v);vector_push(&v,1);vector_push(&v,2);
 var sum=0;for(var i=0;i<3;i++){foreach(var x in &v){if x==1{continue;}sum+=x;}if i==1{continue;}sum+=10;}print(sum);
 {defer {foreach(var x in &v){print(x);}}}
 fn f(p:vector(i32)*):i32{foreach(var x in p){for(var i=0;i<2;i++){if i==0{continue;}return x;}}return 0;}print(f(&v));`, '26\n1\n2\n1\n');
});
test('foreach diagnoses unsupported sources invalid protocols and escaping names',()=>{
 for(const [source,error] of [
 ['import tower;var x=1;foreach(var item in &x){}',/nominal collection/],
 ['import tower;struct Box{x:i32;}var x:Box;foreach(var item in &x){}',/Missing iteration protocol/],
 ['import tower;import library.vector;struct Box{x:i32;}var x:vector(Box);vector_init(&x);foreach(var item in &x){}',/explicit borrow/],
 ['import tower;import library.vector;var x:vector(i32);vector_init(&x);foreach(var item in &x){}print(item);',/Unknown/],
 [protocol.replace('state:Cursor*):bool','state:bool*):bool')+'var r:Range;foreach(var item in &r){}',/parameter types must agree/],
 [protocol.replace('):i32*{return &state.value;','):i32{return state.value;')+'var r:Range;foreach(var item in &r){}',/element: pointer/],
 [protocol.replace('):i32*{return &state.value;','):void*{return bits(void*, &state.value);')+'var r:Range;foreach(var item in &r){}',/element: pointer/],
 ['import tower;import library.vector;fn f():i32{var x:vector(i32);vector_init(&x);foreach(var item in &x){return item;}}',/without returning/],
 ]){const result=execute(source);assert.equal(result.status,'error',source);assert.match(result.error,error);assert.equal(result.output,'');}
});
test('foreach formatting is stable and Foundation retains ordinary identifiers',()=>{
 const source='import tower;import library.vector;var v:vector(i32);vector_init(&v);defer vector_dispose(&v);vector_push(&v,42);foreach(var &x in &v){print(*x);}';
 let formatted;
 for(const text of [source,null]){const handle=tower.create(text??formatted);try{assert.equal(runToEnd(tower,handle).end.status,'done');const result=tower.format(handle);assert.equal(result.error,undefined);if(text===null)assert.equal(result.source,formatted);else formatted=result.source;}finally{tower.destroy(handle);}}
 assert.equal(execute(formatted).output,'42\n');assert.equal(execute('var foreach:i32=42;print(foreach);').output,'42\n');
});

test('the shared iteration worker fixture retains its runtime behavior',async()=>{
 const kernel=(await read('scaffolding/tests/iteration_parallel_unit.tower')).toString().replace('import .library.vector;','import library.vector;');
 await compare(kernel+'\nvar values:u32[3];values[0]=1;values[1]=2;values[2]=3;iteration_transform(&values[0],3);print(iteration_checksum(&values[0],3));','39\n');
});
