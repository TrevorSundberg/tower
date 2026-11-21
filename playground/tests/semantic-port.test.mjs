import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
const source=(await read('scaffolding/tests/semantics.tower')).toString();
const expected=width=>`0\n42\n7\n42\n${width===4?20:32}\n${width}\n42\n3\n-2147483648\n`;

test('Tower semantic compiler preserves layouts, bindings, templates, and Foundation round trips',async()=>{
 let canonical, canonical32;
 for(const pointerBytes of [4,8]){
  const h=tower.compile(source,{pointerBytes});
  try{
   const r=tower.execute(h,100000);assert.equal(r.status,'done',r.error);assert.equal(r.output,expected(pointerBytes));
   canonical=tower.foundation(h).source;
   if(pointerBytes===4)canonical32=canonical;
  }finally{tower.destroyExecution(h);}
  const h2=tower.compile(canonical,{pointerBytes});
  try{
   assert.equal(tower.execute(h2,100000).output,expected(pointerBytes));
   assert.equal(tower.foundation(h2).source,canonical);
  }finally{tower.destroyExecution(h2);}
 }
 for(const input of [source,canonical32]){
  const compiled=llvm.compile(input);assert.equal(compiled.status,'compiled',compiled.error);
  assert.equal((await executeWasm(compiled)).output,expected(4));
 }
});

// Behavioral checks live in Tower; this adapter runs the same fixtures through
// the browser transports and checks their failure-code output and round trips.
for(const [name,output] of [['language_control','42\n0\n'],['language_collections','0\n'],['language_enums','0\n'],['entity_pages','0\n'],['work_graph','0\n'],['work_access','0\n'],['work_resume','0\n'],['compiler_work','0\n'],['compiler_batch','0\n'],['backend_popcount','0\n'],['backend_stack','0\n'],['backend_import_constants','0\n']]) {
 test(`Tower ${name} agrees across graph, fast, LLVM and Foundation text`,async()=>{
  const source=(await read(`scaffolding/tests/${name}.tower`)).toString();
  tower.configureModules({entry:`.tower/tests/${name}.tower`});
  llvm.configureModules({entry:`.tower/tests/${name}.tower`});
  let canonical, canonical32;
  for(const pointerBytes of [4,8]) for(const fast of [false,true]) {
   const h=tower.compile(source,{pointerBytes});
   try {
    if(fast)tower.useFast(h);
    let result;
    do { result=tower.execute(h,100000); } while(result.status==='executing');
    assert.equal(result.status,'done',result.error);
    assert.equal(result.output,output);
    canonical=tower.foundation(h).source;
    if(pointerBytes===4)canonical32=canonical;
   } finally { tower.destroyExecution(h); }
   const h2=tower.compile(canonical,{pointerBytes});
   try {
    let result;
    do { result=tower.execute(h2,100000); } while(result.status==='executing');
    assert.equal(result.status,'done',result.error);
    assert.equal(result.output,output);
    assert.equal(tower.foundation(h2).source,canonical);
   } finally { tower.destroyExecution(h2); }
   if(fast) for(const optimize of [false,true]) {
    const rebuilt=llvm.compile(canonical,{emit:'foundation',optimize,
     target:pointerBytes===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
    assert.equal(rebuilt.status,'compiled',rebuilt.error);
    if(name==='backend_popcount' && optimize)assert.match(rebuilt.after,/llvm\.ctpop\.i(?:8|32|64)/);
    const optimized=tower.compile(rebuilt.foundation,{pointerBytes});
    try {
     tower.useFast(optimized);
     let result, text='';
     do { result=tower.execute(optimized,100000);text+=result.output; } while(result.status==='executing');
     assert.equal(result.status,'done',result.error);
     assert.equal(text,output);
    } finally { tower.destroyExecution(optimized); }
   }
  }
  // Executable Wasm is wasm32. A wasm64 Foundation result can contain explicit
  // target-sized constants/layouts; retain its separate same-profile checks above.
  for(const text of [source,canonical32]) {
   const compiled=llvm.compile(text);
   assert.equal(compiled.status,'compiled',compiled.error);
   assert.equal((await executeWasm(compiled)).output,output);
  }
 });
}

test('Tower semantic diagnostics agree between interpreter and LLVM entry points',async()=>{
 for(const [name,message] of [
  ['inference_cycle',/initializer dependency cycle/],['layout_cycle',/Recursive by-value layout/],
  ['argument_type',/Expected i32, got bool/],['literal_range',/Integer literal out of range for u8/],
  ['template_origin',/Instantiated by wrong\(i32\)/],['missing_return',/without returning a value/],
  ['match_duplicate',/Duplicate match pattern/],['match_range',/Integer literal out of range for u8/],
  ['match_type',/An integer literal needs an integer type/],['match_scope',/Unknown local 'local'/],
  ['match_break',/CoreBreak requires an enclosing loop/],['while_type',/Expected bool, got i32/],
  ['enum_mix',/Expected Left, got Right/],['enum_number',/Enum values require a named member/],
  ['enum_overflow',/Enum discriminant overflow/],['enum_duplicate',/Duplicate enum discriminant/],
  ['enum_operation',/Enum operations require equality/],
  ['enum_address',/not an addressable location/],['enum_index',/index must be an integer/],
 ]){
  const text=(await read(`scaffolding/tests/semantic_invalid/${name}.tower`)).toString();
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

test('Tower-generated deep layout dependencies compile without recursive traversal',async()=>{
 const generator=(await read('scaffolding/tests/layout_depth_source.tower')).toString();
 tower.configureModules({entry:'.tower/tests/layout_depth_source.tower'});
 const generated=tower.compile(generator);
 let source;
 try {
  tower.useFast(generated);
  let result;
  do { result=tower.execute(generated,100000); } while(result.status==='executing');
  assert.equal(result.status,'done',result.error);
  source=result.output;
 } finally { tower.destroyExecution(generated); }
 for(const pointerBytes of [4,8]) {
  const h=tower.compile(source,{pointerBytes});
  try {
   const result=tower.execute(h,100000);
   assert.equal(result.status,'done',result.error);
   assert.equal(result.output,'0\n');
  } finally { tower.destroyExecution(h); }
 }
 const result=llvm.compile(source);
 assert.equal(result.status,'compiled',result.error);
 assert.equal((await executeWasm(result)).output,'0\n');
});

test('Tower control-flow parser rejects incomplete and unbraced bodies',async()=>{
 for(const name of ['match_default','while_braces']) {
  const text=(await read(`scaffolding/tests/syntax_invalid/${name}.tower`)).toString();
  const h=tower.compile(text);
  try { assert.equal(tower.execute(h).status,'error',name); }
  finally { tower.destroyExecution(h); }
  assert.equal(llvm.compile(text).status,'error',name);
 }
});
