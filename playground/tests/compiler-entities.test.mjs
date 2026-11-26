import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {executeWasm} from './compiler-fixtures.mjs';
import {openLLVM,openTower,runSelectedTest} from './compiler_test_host.mjs';

const imports = {
  tower_entity_finalize() { throw new Error('Plain components do not need host finalization'); },
  abort() { throw new Error('Compiler ownership allocation failed'); },
};
const tower = await openTower({imports});
const store = tower.exports;
const storeCalls = Object.fromEntries([
  'entity_store_create', 'entity_store_dispose', 'entity_store_count', 'entity_store_component_count',
  'entity_create', 'entity_release', 'entity_register', 'entity_query_at',
  'entity_component_add', 'entity_component_remove', 'entity_component_get',
  'entity_component_data', 'entity_component_from_data',
].map(name => [name, {wasm:store[name]}]));

// The probe's own pointers and the compiler store's payload pointers refer to
// different Wasm memories. Only the two payload operations access compiler memory.
let observations, rebuildsFoundation;
const exportedQueryCounts = [];
const probes = await openTower({threads:{capacity:1}, imports:{
  ...storeCalls,
  entity_query_count(_context, type) {
    const count = store.entity_query_count(type);
    exportedQueryCounts.push(count);
    return count;
  },
  entity_payload_write(_context, data, value) { new DataView(store.memory.buffer).setUint32(data, value, true); },
  entity_payload_read(_context, data) { return new DataView(store.memory.buffer).getUint32(data, true); },
  entity_output_count() { return observations.length - 1; },
  entity_rebuilds_foundation() { return rebuildsFoundation; },
  entity_read_output(context, slot, destination, capacity) {
    const bytes = observations[slot];
    if (destination && bytes.length <= capacity) context.memory().set(bytes, destination);
    return bytes.length;
  },
}});
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

function interpret(source, pointerBytes, outputs, {fast = false, execute = true} = {}) {
 const handle = tower.compile(source, {pointerBytes});
 try {
  if (fast) tower.useFast(handle);
  if (execute) {
   let output = '', result;
   do {
    result = tower.execute(handle, 100000);
    assert.ok(!result.outputTruncated, 'Truncated interpreter output');
    output += result.output;
   } while (result.status === 'executing');
   assert.equal(result.status, 'done', result.error);
   outputs.push(Buffer.from(output));
  }
  const formatted = tower.foundation(handle);
  assert.equal(typeof formatted.source, 'string', formatted.error);
  return formatted.source;
 } finally { tower.destroyExecution(handle); }
}

for (const [title, fixture] of [
 ['the shared entity library runs under both interpreter layouts and LLVM', 'entities'],
 ['Tower world views pin query ranges and defer ownership reclamation', 'entity_views'],
 ['Tower generic registries belong to their programs and reclaim their types', 'generic_registry'],
]) test(title, async () => {
 const rebuild = fixture !== 'entities';
 const source = `import ${rebuild ? 'host.memory' : 'library.entities'}; import tests.${fixture};`;
 const outputs = [await readFile(new URL(`../../scaffolding/tests/${fixture}.expected`, import.meta.url))];
 const llvm = await openLLVM();
 let wasm32;
 for (const pointerBytes of [4, 8]) {
  const canonical = interpret(source, pointerBytes, outputs);
  assert.equal(interpret(canonical, pointerBytes, outputs, {fast:rebuild, execute:rebuild}), canonical);
  if (pointerBytes === 4) wasm32 = canonical;
  if (rebuild) for (const optimize of [false, true]) {
   const result = await compileLLVM(llvm, canonical, {emit:'foundation', optimize,
    target:pointerBytes === 8 ? 'wasm64-unknown-unknown' : 'wasm32-unknown-unknown'});
   assert.equal(result.status, 'compiled', result.error);
   interpret(result.foundation, pointerBytes, outputs, {fast:true});
  }
 }
 const requests = rebuild ? [[source, {optimize:false}], [source, {optimize:true}]] : [[source, {}], [wasm32, {}]];
 for (const [input, options] of requests) {
  const compiled = await compileLLVM(llvm, input, options);
  assert.equal(compiled.status, 'compiled', compiled.error);
  const result = await executeWasm(compiled, undefined, {imports});
  assert.equal(result.status, 'done', result.error);
  assert.ok(!result.outputTruncated, 'Truncated compiled output');
  outputs.push(Buffer.from(result.output));
 }
 observations = outputs;
 rebuildsFoundation = rebuild;
 try { runSelectedTest(probes, '.tower/tests/entity_engine_outputs.tower', 32); }
 finally { observations = undefined; }
});

test('the browser compiler exposes its real Tower entity store and component query index', () => {
 // Use the ABI declarations alone. Default companion discovery also loads
 // the native owner, whose definitions would shadow the compiler exports.
 exportedQueryCounts.length = 0;
 runSelectedTest(probes, '.tower/tests/entity_store_test.tower', 5000, {suffix:'_browser_test.tower'});
 assert.deepEqual(exportedQueryCounts, [300, 150]);
});
