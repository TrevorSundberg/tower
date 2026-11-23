import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {loadTower} from './compiler-fixtures.mjs';
import {loadLLVM,executeWasm} from './compiler-fixtures.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const imports={tower_entity_finalize:()=>{throw new Error('Plain components do not need host finalization');},
 abort:()=>{throw new Error('Compiler ownership allocation failed');}};
const tower=await loadTower(process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm'),undefined,foundation,undefined,undefined,{imports});
const source='import library.entities; import tests.entities;';
const expected='true\ntrue\n1\n1\ntrue\ntrue\n42\ntrue\ntrue\n1\n0\n0\ntrue\n';
let compilation=0;
async function compileLLVM(llvm,input,options={}) {
 const name='llvm-'+(++compilation),directory=process.env.TOWER_TEST_ARTIFACTS;
 if(directory)await writeFile(join(directory,name+'.tower'),input);
 const start=performance.now(),cpu=process.cpuUsage();
 const result=llvm.compile(input,options);
 const receipt={name,options,...(result.status==='error'?result:{status:result.status}),
  wallMs:performance.now()-start,cpu:process.cpuUsage(cpu),
  rss:process.memoryUsage().rss,peakRssKiB:process.resourceUsage().maxRSS};
 if(process.env.TOWER_TEST_PHASES)console.error(JSON.stringify(receipt));
 if(directory){
  await writeFile(join(directory,name+'.json'),JSON.stringify(receipt,null,2));
  if(result.foundation)await writeFile(join(directory,name+'_result.tower'),result.foundation);
 }
 return result;
}

test('the shared entity library runs under both interpreter layouts and LLVM',async()=>{
 let canonical;
 for(const pointerBytes of [4,8]){
  const h=tower.compile(source,{pointerBytes});
  try{
   let output='',result;
   do {result=tower.execute(h,100000);output+=result.output;}while(result.status==='executing');
   assert.equal(result.status,'done',result.error);assert.equal(output,expected);
   const formatted=tower.foundation(h).source;
   const round=tower.compile(formatted,{pointerBytes});
   try {
    assert.equal(tower.foundation(round).source,formatted);
   }finally{tower.destroyExecution(round);}
   // Executable LLVM below targets wasm32. Canonical layouts are target-bound.
   if(pointerBytes===4)canonical=formatted;
  }finally{tower.destroyExecution(h);}
 }
 const llvm=await loadLLVM(process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
 for(const input of [source,canonical]){
  const compiled=await compileLLVM(llvm,input);assert.equal(compiled.status,'compiled',compiled.error);
  const result=await executeWasm(compiled,undefined,{imports});
  assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
 }
});

for(const [title,fixture] of [
 ['Tower world views pin query ranges and defer ownership reclamation','entity_views'],
 ['Tower generic registries belong to their programs and reclaim their types','generic_registry'],
])test(title,async()=>{
 // The standalone program owns its allocator; the library only declares its ABI.
 const source=`import host.memory; import tests.${fixture};`;
 const llvm=await loadLLVM(process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
 const run=(source,pointerBytes,fast)=>{
  const h=tower.compile(source,{pointerBytes});
  try{
   if(fast)tower.useFast(h);
   let output='',result;
   do{result=tower.execute(h,100000);output+=result.output;}while(result.status==='executing');
   assert.equal(result.status,'done',result.error);assert.equal(output,'0\n');
   return tower.foundation(h).source;
  }finally{tower.destroyExecution(h);}
 };
 for(const pointerBytes of [4,8]){
  const canonical=run(source,pointerBytes,false);
  assert.equal(run(canonical,pointerBytes,true),canonical);
  for(const optimize of [false,true]){
   const rebuilt=await compileLLVM(llvm,canonical,{emit:'foundation',optimize,
    target:pointerBytes===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
   assert.equal(rebuilt.status,'compiled',rebuilt.error);
   run(rebuilt.foundation,pointerBytes,true);
  }
 }
 for(const optimize of [false,true]){
  const compiled=await compileLLVM(llvm,source,{optimize});assert.equal(compiled.status,'compiled',compiled.error);
  const result=await executeWasm(compiled,undefined,{imports});
  assert.equal(result.status,'done',result.error);assert.equal(result.output,'0\n');
 }
});

test('the browser compiler exposes its real Tower entity store and component query index',()=>{
 const e=tower.exports,world=e.entity_store_create(),type=e.entity_create(world),nodes=[];
 assert.equal(e.entity_register(type,4,64,0),1);
 for(let i=0;i<300;i++){
  const node=e.entity_create(world),component=e.entity_component_add(node,type),data=e.entity_component_data(component);
  assert.equal(data%64,0);new DataView(e.memory.buffer).setUint32(data,i,true);nodes.push({node,component,data});
 }
 assert.equal(e.entity_query_count(type),300);
 for(const {node,component,data} of nodes){
  assert.equal(e.entity_component_get(node,type),component);assert.equal(e.entity_component_data(component),data);
  assert.equal(e.entity_component_from_data(data),component);
 }
 for(let i=0;i<nodes.length;i+=2)assert.equal(e.entity_component_remove(nodes[i].node,type),1);
 for(let i=0;i<150;i++){
  const component=e.entity_query_at(type,i),data=e.entity_component_data(component);
  assert.equal(new DataView(e.memory.buffer).getUint32(data,true)%2,1);
 }
 e.entity_release(type);
 for(const {node} of nodes)e.entity_release(node);
 assert.equal(e.entity_store_count(world),0);assert.equal(e.entity_store_component_count(world),0);
 assert.equal(e.entity_store_dispose(world),1);
});
