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
 return canonical;
}
test('default uses exact contextual and explicit scalar types',async()=>{
 await compare(`import tower;
 var a:i32=default;var b:i64=default;var c:u64=default;var d:usize=default;
 var e:u8=default;var f:bool=default;var p:i32* =default;
 print(a);print(b);print(c);print(d);print(e);print(f);print(p==null);
 var inferred=default(u64);print(inferred);print(!default);var negative:i32=-default;print(negative);
 fn zero():u32{return default;}fn take(v:u64):u64{return v;}print(zero());print(take(default));
 var choice:u64=true?default:7;print(choice);print(default==inferred);
 enum Kind:u32{Ready=7}var tag:Kind=default;print(convert(u32,tag));`,
 '0\n0\n0\n0\n0\nfalse\ntrue\n0\ntrue\n0\n0\n0\n0\ntrue\n0\n');
});
test('aggregate defaults initialize complete target storage including padding and nested arrays',async()=>{
 const canonical=await compare(`import tower;
 struct Inner{small:u8;wide:u64;}struct Outer{items:Inner[3];pointer:i32*;}
 var value:Outer=default;var bytes=bits(u8*,&value);var total:u64=0;
 for(var i:usize=0;i<sizeof(Outer);i++){total+=convert(u64,bytes[i]);}print(total);
 fill(&value,255,sizeof(Outer));value=default;total=0;
 for(var i:usize=0;i<sizeof(Outer);i++){total+=convert(u64,bytes[i]);}print(total);print(value.pointer==null);
 var inferred=default(Inner);print(inferred.wide);var array:i32[3]=default;print(array[2]);
 value.items[1].wide=42;value.items[1]=default;print(value.items[1].wide);`, '0\n0\ntrue\n0\n0\n0\n');
 assert.match(canonical,/fill\(/);assert.doesNotMatch(canonical,/\bdefault\b/);
});
test('reset evaluates a destination once and preserves surrounding effects and deferred cleanup',async()=>{
 await compare(`import tower;struct Pair{x:i32;y:i32;}
 var pairs:Pair[2]=default;var calls=0;var index=0;
 fn source():Pair*{calls++;return &pairs[0];}
 pairs[0].x=9;pairs[1].x=8;source()[index++]=default;
 print(calls);print(index);print(pairs[0].x);print(pairs[1].x);
 fn reset(p:Pair*):void{defer *p=default;p.x=7;}
 reset(&pairs[1]);print(pairs[1].x);
 for(var i=0;i<2;i++,pairs[0]=default){pairs[0].x=17;}print(pairs[0].x);`, '1\n1\n0\n8\n0\n0\n');
});
test('generic inference and ordinary compile-time execution share default semantics',async()=>{
 await compare(`import tower;import library.vector;
 fn same(T:type,a:T,b:T):T{return a;}
 fn clear(T:type,p:T*):void{*p=default;}
 var typed:u64=42;print(same(default,typed));print(same(default(u64),42));
 var values:vector(i32)=default;defer vector_dispose(&values);vector_push(&values,42);print(values.data[0]);
 var explicit=default(vector(i32));vector_push(&explicit,7);vector_dispose(&explicit);
 var forward=default(decltype(later));var later:u64=9;if forward!=0{print(99);}
 struct Cell{n:i32;flag:bool;}var cell:Cell=default;cell.n=9;clear(&cell);print(cell.n);
 fn stage():i32{var n:i32=default;n=17;n=default;return n;}
 print(comptime(stage()));`, '0\n0\n42\n0\n0\n');
});
test('default values support ordinary struct copies and staged scalar results',async()=>{
 await compare((await read('scaffolding/tests/default_struct_values.tower')).toString(),'0\n7\n0\n');
});
test('default diagnoses missing types and incompatible conversions',()=>{
 for(const [source,message] of [
  ['var n=default;',/requires a target type/],
  ['var n=default(void);',/non-void/],
  ['var n:i32=default(u32);',/Expected i32/],
  ['struct A{x:i32;}struct B{x:i32;}var a:A=default(B);',/Expected A/],
  ['struct A{x:i32;}print(default(A));',/^print requires a scalar or pointer value$/],
  ['struct A{x:i32;}var a:A=default;var b=(a=default);',/void/],
  ['fn id(T:type,x:T):T{return x;}print(id(default));',/Cannot infer type argument/],
  ['struct A{x:i32;}var a:A=default;a+=default;',/integer|aggregate/i],
 ]){const result=execute('import tower;'+source);assert.equal(result.status,'error',source);assert.match(result.error,message,source);}
});
test('formatting preserves default syntax and Foundation keeps its ordinary identifier',()=>{
 const source='import tower;struct Item{x:i32;}var item:Item=(default);item=default(Item);print(item.x);';
 const handle=tower.create(source);
 let formatted;
 try{const result=runToEnd(tower,handle);assert.equal(result.end.status,'done',result.end.error);formatted=tower.format(handle);assert.equal(formatted.error,undefined);}
 finally{tower.destroy(handle);}
 const again=tower.create(formatted.source);
 try{assert.equal(runToEnd(tower,again).end.status,'done');assert.equal(tower.format(again).source,formatted.source);}
 finally{tower.destroy(again);}
 assert.equal(execute(formatted.source).output,'0\n');
 assert.equal(execute('import foundation;var default:i32=42;print(default);').output,'42\n');
});
