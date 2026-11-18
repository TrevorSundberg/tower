import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from '../src/tower-host.mjs';
import {loadLLVM,executeWasm} from '../src/llvm-host.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const library=(await read('scaffolding/library/bytes.tower')).toString();
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
const source=library+`
var b: ByteBuffer; bytes_init(&b);
print(bytes_append(&b, null, 0));
print(bytes_assign_text(&b, "Tower", 5));
print(b.length); print(b.data[5]);
print(bytes_append(&b, b.data, b.length));
print(bytes_append(&b, b.data, b.length));
print(b.length); print(b.data[15]);
var middle = b.data + 3;
print(bytes_assign_text(&b, middle, 7));
print(b.length); print(b.data[0]); print(b.data[7]);
var before = b.data; var capacity = b.capacity;
var maximum: usize = 0; maximum = maximum - 1;
print(bytes_assign_text(&b, null, maximum));
print(bytes_reserve(&b, maximum));
var same = b.data == before; print(same); same = b.capacity == capacity; print(same); print(b.length);
var past = b.data + b.length;
print(bytes_append(&b, past, 1));
print(bytes_push(&b, 0)); print(b.length); print(b.data[7]);
print(bytes_assign_text(&b, null, 0)); print(b.length); print(b.data[0]);
bytes_dispose(&b); bytes_dispose(&b); same = b.data == null; print(same);
`;
const expected='true\ntrue\n5\n0\ntrue\ntrue\n20\n84\ntrue\n7\n101\n0\nfalse\nfalse\ntrue\ntrue\n7\nfalse\ntrue\n8\n0\ntrue\n0\n0\ntrue\n';

test('compiler byte buffers share target layouts and interpreter/LLVM semantics',async()=>{
 let canonical;
 for(const pointerBytes of [4,8]){
  const h=tower.compile(source,{pointerBytes});
  try{
   const result=tower.execute(h,100000);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
   const formatted=tower.foundation(h),type=formatted.types.find(t=>t.name==='ByteBuffer');
   assert.deepEqual([type.size,type.alignment,type.fields.map(f=>f.offset)],[pointerBytes*3,pointerBytes,[0,pointerBytes,pointerBytes*2]]);
   canonical=formatted.source;
  }finally{tower.destroyExecution(h);}
 }
 for(const input of [source,canonical]){
  const compiled=llvm.compile(input);assert.equal(compiled.status,'compiled',compiled.error);
  const result=await executeWasm(compiled);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
 }
});

test('the browser compiler owns its source using the compiled Tower buffer exports',()=>{
 const e=tower.exports,p=e.tw_alloc(12),text=e.tw_alloc(5);
 const view=()=>new DataView(e.memory.buffer),memory=()=>new Uint8Array(e.memory.buffer);
 const snapshot=()=>[0,4,8].map(offset=>view().getUint32(p+offset,true));
 e.bytes_init(p);memory().set([84,111,119,101,114],text);
 try{
  assert.equal(e.bytes_assign_text(p,text,5),1);
  for(let i=0;i<8;i++){const [data,length]=snapshot();assert.equal(e.bytes_append(p,data,length),1);}
  const [data,length,capacity]=snapshot();assert.equal(length,1280);
  assert.equal(e.bytes_assign_text(p,data+3,1000),1);
  assert.equal(memory()[snapshot()[0]],101);assert.equal(memory()[snapshot()[0]+1000],0);
  const unchanged=snapshot();assert.equal(e.bytes_reserve(p,0xffffffff),0);assert.deepEqual(snapshot(),unchanged);
  assert.equal(unchanged[2],capacity);
 }finally{e.bytes_dispose(p);e.tw_free(text);e.tw_free(p);}
});

test('source resets retain grammar provenance and formatting',()=>{
 const original="// 🏰 source owns UTF-8 bytes\nparse Statement |= 'hello' ';' => replace { print(42); };\nhello;\n";
 const h=tower.create(original);
 try{
  for(let i=0;i<100;i++){
   const input=i%2?original:'\n'+original;
   tower.reset(h,input);const result=runToEnd(tower,h);assert.equal(result.end.status,'done',result.end.error);
   const formatted=tower.format(h);assert.equal(formatted.error,undefined);assert.match(formatted.source,/🏰/);
  }
 }finally{tower.destroy(h);}
 // Native tests check allocation ownership and keep source nodes alive after
 // their session is destroyed; this loop exercises the worker-facing reset API.
});
