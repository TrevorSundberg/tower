import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=p=>readFile(new URL('../../'+p,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
const platform='import library.platform;\n';
test('platform writes share byte ordering and UTF-8 decoding across interpreter and Wasm',async()=>{
 const source=platform+`var p: u8* = "hello λ\\n"; var n: i64 = platform_write(1, p, 9); print(n);
 n = platform_write(2, p, 5); n = platform_write(0, p, 5); print(n);
 var q: u8* = "λ"; n = platform_write(1, q, 1); q = q + 1; n = platform_write(1, q, 1);`;
 const handle=tower.compile(source);let output='';
 try {for(;;){const r=tower.execute(handle,1);assert.notEqual(r.status,'error',r.error);output+=r.output;if(r.status==='done')break;}}finally{tower.destroyExecution(handle);}
 assert.equal(output,'hello λ\n9\nhello-1\nλ');
 const compiled=llvm.compile(source);assert.equal(compiled.status,'compiled',compiled.error);
 assert.equal((await executeWasm(compiled)).output,output);
});
test('pure Wasm exports bind directly as external imports, and tables can supply the function',async()=>{
 const provider=llvm.compile('export fn twice(x: i32): i32 { var y: i32 = x + x; return y; }');
 assert.equal(provider.status,'compiled',provider.error);
 const {instance}=await WebAssembly.instantiate(provider.wasm,{});
 const consumer=llvm.compile('extern fn twice(x: i32): i32; var value: i32 = twice(21); print(value);');
 assert.equal(consumer.status,'compiled',consumer.error);
 assert.equal((await executeWasm(consumer,()=>{},{imports:{twice:{wasm:instance.exports.twice}}})).output,'42\n');
 const table=new WebAssembly.Table({element:'anyfunc',initial:1});table.set(0,instance.exports.twice);
 assert.equal((await executeWasm(consumer,()=>{},{imports:{twice:{wasm:table.get(0)}}})).output,'42\n');
});
test('built-ins and ordinary functions share calls and typed argument validation',()=>{
 const source='fn identity(x: usize): usize { return x; } var n: usize = sizeof(i32*[3]); n = identity(n); print(n); var p: i32** = alloc(i32*, 2); free(p);';
 const h=tower.compile(source);try{
  const result=tower.execute(h);assert.equal(result.status,'done',result.error);assert.equal(result.output,'12\n');
  const text=tower.foundation(h).source;assert.match(text,/sizeof\(i32\*\[3\]\)/);
  const second=tower.compile(text);try{assert.equal(tower.execute(second).output,result.output);}finally{tower.destroyExecution(second);}
 }finally{tower.destroyExecution(h);}
 for(const source of ['print();','alloc(i32);','free(1);','var n: i32 = print(1);','fn print(x: i32): void {}']){
  const h=tower.compile(source);try{const r=tower.execute(h);assert.equal(r.status,'error',source);assert.equal(r.steps,0);}finally{tower.destroyExecution(h);}
 }
});
