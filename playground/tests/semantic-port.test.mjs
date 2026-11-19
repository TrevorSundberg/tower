import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {loadLLVM,executeWasm} from '../src/llvm-host.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
const source=(await read('scaffolding/tests/semantics.tower')).toString();
const expected=width=>`0\n42\n7\n42\n${width===4?20:32}\n${width}\n42\n3\n-2147483648\n`;

test('Tower semantic compiler preserves layouts, bindings, templates, and Foundation round trips',async()=>{
 let canonical;
 for(const pointerBytes of [4,8]){
  const h=tower.compile(source,{pointerBytes});
  try{
   const r=tower.execute(h,100000);assert.equal(r.status,'done',r.error);assert.equal(r.output,expected(pointerBytes));
   canonical=tower.foundation(h).source;
  }finally{tower.destroyExecution(h);}
  const h2=tower.compile(canonical,{pointerBytes});
  try{
   assert.equal(tower.execute(h2,100000).output,expected(pointerBytes));
   assert.equal(tower.foundation(h2).source,canonical);
  }finally{tower.destroyExecution(h2);}
 }
 for(const input of [source,canonical]){
  const compiled=llvm.compile(input);assert.equal(compiled.status,'compiled',compiled.error);
  assert.equal((await executeWasm(compiled)).output,expected(4));
 }
});

test('Tower semantic diagnostics agree between interpreter and LLVM entry points',async()=>{
 for(const [name,message] of [
  ['inference-cycle',/initializer dependency cycle/],['layout-cycle',/Recursive by-value layout/],
  ['argument-type',/Expected i32, got bool/],['literal-range',/Integer literal out of range for u8/],
  ['template-origin',/Instantiated by wrong\(i32\)/],['missing-return',/without returning a value/],
 ]){
  const text=(await read(`scaffolding/tests/semantic-invalid/${name}.tower`)).toString();
  let error,offset;
  for(const pointerBytes of [4,8]){
   const h=tower.compile(text,{pointerBytes});
   try{const r=tower.execute(h);assert.equal(r.status,'error',name);assert.match(r.error,message);error=r.error;offset=r.errorOffset;}
   finally{tower.destroyExecution(h);}
  }
  const result=llvm.compile(text);assert.equal(result.status,'error',name);
  assert.equal(result.error,error);assert.equal(result.errorOffset,offset);
 }
});
