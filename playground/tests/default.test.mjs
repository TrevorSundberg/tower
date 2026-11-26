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
const inputs = 'scaffolding/tests/default_inputs/';
const source = name => read(inputs + name + '.tower').then(bytes => bytes.toString());
async function compareFile(stem) {
 const program = (await read(stem + '.tower')).toString();
 const expected = (await read(stem + '.expected.txt')).toString().replaceAll('\r\n', '\n');
 return compare(program, expected);
}

test('default uses exact contextual and explicit scalar types', async () => {
 await compareFile(inputs + 'scalars');
});
test('aggregate defaults initialize complete target storage including padding and nested arrays', async () => {
 const canonical = await compareFile(inputs + 'aggregate');
 assert.match(canonical, /fill\(/);
 assert.doesNotMatch(canonical, /\bdefault\b/);
});
test('reset evaluates a destination once and preserves surrounding effects and deferred cleanup', async () => {
 await compareFile(inputs + 'reset');
});
test('generic inference and ordinary compile-time execution share default semantics', async () => {
 await compareFile(inputs + 'generics');
});
test('default values support ordinary struct copies and staged scalar results', async () => {
 await compareFile('scaffolding/tests/default_struct_values');
});
test('default diagnoses missing types and incompatible conversions', async () => {
 for (const [name, offset, message] of [
  ['missing_type', 19, /requires a target type/],
  ['void_type', 19, /non-void/],
  ['scalar_mismatch', 23, /Expected i32/],
  ['nominal_mismatch', 53, /Expected A/],
  ['print_aggregate', 35, /^print requires a scalar or pointer value$/],
  ['consumed_reset', 45, /void/],
  ['missing_argument_type', 49, /Cannot infer type argument/],
  ['compound_reset', 45, /integer|aggregate/i],
 ]) {
  const result = execute(await source('invalid/' + name));
  assert.equal(result.status, 'error', name);
  assert.match(result.error, message, name);
  assert.equal(result.errorOffset, offset, name);
 }
});
test('formatting preserves default syntax and Foundation keeps its ordinary identifier',async()=>{
 const input=await source('format');
 const handle=tower.create(input);
 let formatted;
 try{const result=runToEnd(tower,handle);assert.equal(result.end.status,'done',result.end.error);formatted=tower.format(handle);assert.equal(formatted.error,undefined);}
 finally{tower.destroy(handle);}
 const again=tower.create(formatted.source);
 try{assert.equal(runToEnd(tower,again).end.status,'done');assert.equal(tower.format(again).source,formatted.source);}
 finally{tower.destroy(again);}
 assert.equal(execute(formatted.source).output,'0\n');
 assert.equal(execute(await source('identifier')).output,'42\n');
});
