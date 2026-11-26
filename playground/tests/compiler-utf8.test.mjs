import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const utility='import compiler.utf8;\n';
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}),encoder=new TextEncoder();
function decode(bytes){
 const lead=bytes[0],count=lead<128?1:lead>=194&&lead<=223?2:lead>=224&&lead<=239?3:lead>=240&&lead<=244?4:0;
 if(!count||bytes.length<count)return [0,0];
 try{return [count,decoder.decode(Uint8Array.from(bytes.slice(0,count))).codePointAt(0)];}catch{return [0,0];}
}
function validate(bytes,rejectNul){try{decoder.decode(Uint8Array.from(bytes));return rejectNul&&bytes.includes(0)?0:1;}catch{return 0;}}
const caseSource=(await read('scaffolding/tests/utf8_wasm_cases.tower')).toString();
let caseModule,state=0;
function visitCases(input,scalar){
 if(!caseModule){
  const fixture=llvm.compile(caseSource);
  assert.equal(fixture.status,'compiled',fixture.error);
  caseModule=new WebAssembly.Module(fixture.wasm);
 }
 const e=new WebAssembly.Instance(caseModule,{env:{
  record_utf8_input(pointer,length){input(new Uint8Array(e.memory.buffer,pointer,length));},
  record_utf8_scalar(value){scalar(value>>>0);},
 }}).exports;
 state=e.all_utf8_inputs(state);
}

function checkExports(e,allocate,free){
 const pointer=allocate(64);
 try{
  const memory=new Uint8Array(e.memory.buffer),view=new DataView(e.memory.buffer);
  function checkInput(bytes){
   memory.set(bytes,pointer);view.setUint32(pointer+16,0xdeadbeef,true);
   const count=e.tower_utf8_decode(pointer,bytes.length,pointer+16);
   assert.deepEqual([count,view.getUint32(pointer+16,true)],decode(bytes),bytes.toString());
   for(const reject of [0,1,42])assert.equal(e.tower_utf8_validate(pointer,bytes.length,reject),validate(bytes,reject));
  }
  function checkScalar(scalar){
   const valid=scalar<=1114111&&(scalar<55296||scalar>57343),bytes=valid?encoder.encode(String.fromCodePoint(scalar)):[];
   assert.equal(e.tower_utf8_encode(scalar,0,0),bytes.length);
   for(let capacity=0;capacity<=4;capacity++){
    memory.fill(165,pointer+31,pointer+38);
    const fits=valid&&capacity>=bytes.length;
    assert.equal(e.tower_utf8_encode(scalar,pointer+32,capacity),fits?bytes.length:0);
    assert.deepEqual([...memory.slice(pointer+31,pointer+38)],[165,...(fits?[...bytes]:[]),...Array(6-(fits?bytes.length:0)).fill(165)]);
   }
  }
  visitCases(checkInput,checkScalar);
 }finally{free(pointer);}
}

test('the browser compiler links the Tower codec, with Unicode and malformed-input agreement',()=>{
 const e=tower.exports;
 checkExports(e,e.tw_alloc,e.tw_free);
 // Exercise the actual source-loading boundary, not just the exported codec.
 const pointer=e.tw_alloc(8);
 try{
  for(const bytes of [[0],[192,128],[237,160,128],[244,144,128,128],[226,130]]){
   new Uint8Array(e.memory.buffer).set(bytes,pointer);
   assert.equal(e.tw_create(pointer,bytes.length),0);
   // Reporting the error can grow Wasm memory and detach earlier views.
   const start=e.tw_last_error();
   const memory=new Uint8Array(e.memory.buffer);
   const end=memory.indexOf(0,start);
   assert.notEqual(end,-1,'Expected a NUL-terminated diagnostic');
   assert.match(decoder.decode(memory.slice(start,end)),/valid UTF-8 without NUL/);
  }
 }finally{e.tw_free(pointer);}
 const h=tower.create("token Letter = /[é🏰]/; parse Statement = Letter ';'; é; 🏰;");
 try{assert.equal(runToEnd(tower,h).end.status,'done');}finally{tower.destroy(h);}
});

test('the compiler can recompile its own codec into standalone Wasm without runtime imports',async()=>{
 const compiled=llvm.compile(utility);
 assert.equal(compiled.status,'compiled',compiled.error);
 const module=await WebAssembly.compile(compiled.wasm);
 // LLD also exports the utility allocator, but this module needs no host callbacks.
 assert.deepEqual(WebAssembly.Module.imports(module),[]);
 const instance=await WebAssembly.instantiate(module,{}),e=instance.exports;
 checkExports(e,size=>e.tower_allocate(size,1),e.tower_deallocate);
 // Truncated input exactly at the Wasm memory boundary must never read beyond it.
 const result=e.tower_allocate(4,4);
 const memory=new Uint8Array(e.memory.buffer);
 for(const bytes of [[194],[224,128],[240,128,128]]){
  const start=memory.length-bytes.length;memory.set(bytes,start);
  assert.equal(e.tower_utf8_decode(start,bytes.length,result),0);
 }
 assert.equal(e.tower_utf8_decode(memory.length,0,result),0);
 e.tower_deallocate(result);
 const repeated=llvm.compile(utility);
 assert.deepEqual(repeated.wasm,compiled.wasm);
});

test('the same Tower utility executes in the interpreter and LLVM, including canonical round trips',async()=>{
 const source=(await read('scaffolding/tests/utf8_roundtrip.tower')).toString();
 const expected=(await read('scaffolding/tests/utf8_roundtrip.expected')).toString();
 const h=tower.compile(source);
 let canonical;
 try{
  const result=tower.execute(h,1000000);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
  canonical=tower.foundation(h).source;
 }finally{tower.destroyExecution(h);}
 const h2=tower.compile(canonical,{pointerBytes:8});
 try{const result=tower.execute(h2,1000000);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);}
 finally{tower.destroyExecution(h2);}
 for(const text of [source,canonical]){
  const compiled=llvm.compile(text);assert.equal(compiled.status,'compiled',compiled.error);
  const result=await executeWasm(compiled);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
 }
});
