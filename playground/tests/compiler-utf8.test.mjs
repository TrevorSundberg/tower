import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const utility='import compiler.utf8;\n';
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}),encoder=new TextEncoder();
function decode(bytes){
 const lead=bytes[0],count=lead<128?1:lead>=194&&lead<=223?2:lead>=224&&lead<=239?3:lead>=240&&lead<=244?4:0;
 if(!count||bytes.length<count)return [0,0];
 try{return [count,decoder.decode(Uint8Array.from(bytes.slice(0,count))).codePointAt(0)];}catch{return [0,0];}
}
function validate(bytes,rejectNul){try{decoder.decode(Uint8Array.from(bytes));return rejectNul&&bytes.includes(0)?0:1;}catch{return 0;}}
let random=0x1ba72983;
function next(){random^=random<<13;random^=random>>>17;random^=random<<5;return random>>>0;}
const scalars=[0,1,127,128,2047,2048,55295,55296,56319,56320,57343,57344,65535,65536,1114111,1114112,4294967295];
const cases=[[],[0],[65],[194],[194,32],[192,128],[193,191],[224,128,128],[237,160,128],[244,144,128,128],[245,128,128,128],[255]];
for(const scalar of scalars.filter(n=>n<=1114111&&(n<55296||n>57343))){const bytes=[...encoder.encode(String.fromCodePoint(scalar))];for(let n=0;n<=bytes.length;n++)cases.push(bytes.slice(0,n));}
for(let i=0;i<32;i++)cases.push(Array.from({length:next()%9},()=>next()&255));

function checkExports(e,allocate,free){
 const pointer=allocate(64);
 try{
  const memory=new Uint8Array(e.memory.buffer),view=new DataView(e.memory.buffer);
  for(let i=0;i<10000+cases.length;i++){
   const bytes=i<cases.length?cases[i]:Array.from({length:next()%9},()=>next()&255);
   memory.set(bytes,pointer);view.setUint32(pointer+16,0xdeadbeef,true);
   const count=e.tower_utf8_decode(pointer,bytes.length,pointer+16);
   assert.deepEqual([count,view.getUint32(pointer+16,true)],decode(bytes),bytes.toString());
   for(const reject of [0,1,42])assert.equal(e.tower_utf8_validate(pointer,bytes.length,reject),validate(bytes,reject));
  }
  for(const scalar of [...scalars,...Array.from({length:10000},()=>next()%0x110001)]){
   const valid=scalar<=1114111&&(scalar<55296||scalar>57343),bytes=valid?encoder.encode(String.fromCodePoint(scalar)):[];
   assert.equal(e.tower_utf8_encode(scalar,0,0),bytes.length);
   for(let capacity=0;capacity<=4;capacity++){
    memory.fill(165,pointer+31,pointer+38);
    const fits=valid&&capacity>=bytes.length;
    assert.equal(e.tower_utf8_encode(scalar,pointer+32,capacity),fits?bytes.length:0);
    assert.deepEqual([...memory.slice(pointer+31,pointer+38)],[165,...(fits?[...bytes]:[]),...Array(6-(fits?bytes.length:0)).fill(165)]);
   }
  }
 }finally{free(pointer);}
}

test('the browser compiler links the Tower codec, with Unicode and malformed-input agreement',()=>{
 const e=tower.exports;
 checkExports(e,e.tw_alloc,e.tw_free);
 // Exercise the actual source-loading boundary, not just the exported codec.
 const pointer=e.tw_alloc(8);
 try{
  const memory=new Uint8Array(e.memory.buffer);
  for(const bytes of [[0],[192,128],[237,160,128],[244,144,128,128],[226,130]]){
   memory.set(bytes,pointer);assert.equal(e.tw_create(pointer,bytes.length),0);
   const start=e.tw_last_error(),end=memory.indexOf(0,start);
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
 const memory=new Uint8Array(e.memory.buffer),result=e.tower_allocate(4,4);
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
 let source=utility+`\nvar data: u8[8]; var scalar: u32 = 0; var count: usize = 0;\n`,expected='';
 for(const bytes of cases){
  bytes.forEach((byte,i)=>source+=`data[${i}] = ${byte};\n`);
  source+=`count = tower_utf8_decode(&data[0], ${bytes.length}, &scalar); print(count); print(scalar); print(tower_utf8_validate(&data[0], ${bytes.length}, 0)); print(tower_utf8_validate(&data[0], ${bytes.length}, 1));\n`;
  expected+=[...decode(bytes),validate(bytes,0),validate(bytes,1)].map(n=>n+'\n').join('');
 }
 for(const scalar of scalars){
  const valid=scalar<=1114111&&(scalar<55296||scalar>57343),bytes=valid?[...encoder.encode(String.fromCodePoint(scalar))]:[];
  source+=`fill(&data[0], 165, 8); count = tower_utf8_encode(${scalar}, &data[0], 4); print(count); print(tower_utf8_encode(${scalar}, null, 0)); print(data[0]); print(data[1]); print(data[2]); print(data[3]);\n`;
  expected+=[bytes.length,bytes.length,...bytes,...Array(4-bytes.length).fill(165)].map(n=>n+'\n').join('');
 }
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
