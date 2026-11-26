import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {loadLLVM, executeWasm} from '../src/llvm-host.mjs';
import {guestString} from './guest_text.mjs';
import {runSelectedTest} from './selected_test.mjs';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root));
const source = path => readFile(new URL(path + '.tower', root), 'utf8');
const wasm = await WebAssembly.compile(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('build/browser-wasi/tower.wasm', root)));
const builtins = Object.fromEntries(await Promise.all(
  ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower'].map(async name =>
    [name, await source('scaffolding/' + name)])));
const language = {builtins, tower:builtins.tower};
const subjectFiles = [{path:'.tower/library/platform.tower', text:await source('scaffolding/library/platform')}];
function openTower(options) {
  return loadTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock,
    {...language, project:{files:subjectFiles}, ...options});
}
const tower = await openTower();
test.after(() => tower.close());
const llvm = await loadLLVM(await readFile(process.env.TOWER_TEST_LLVM_WASM ||
  new URL('build/browser-wasi-llvm/tower-llvm.wasm', root)), undefined, builtins.foundation, undefined,
  builtins.bedrock, language);
llvm.configureModules({files:subjectFiles});
if(process.env.TOWER_TEST_PHASES){
 const phase=(label,context)=>console.log(JSON.stringify({case:context.name,phase:label,pid:process.pid,
  milliseconds:performance.now(),cpu:process.cpuUsage(),maxRssKiB:process.resourceUsage().maxRSS,
  portableCapacityBytes:tower.exports.memory.buffer.byteLength,llvmCapacityBytes:llvm.memoryCapacityBytes()}));
 test.beforeEach(context=>phase('start',context));test.afterEach(context=>phase('released',context));
}
// Interpreter observations are synchronous. Collect the asynchronous Wasm
// instantiations before entering the selected Tower assertion.
async function observeLLVM(source) {
  const compiled = llvm.compile(source);
  const fields = {compilation:compiled.status, diagnostic:compiled.error};
  if (compiled.status !== 'compiled') return fields;
  fields.imports = WebAssembly.Module.imports(await WebAssembly.compile(compiled.wasm));
  try { return {...fields, ...await executeWasm(compiled)}; }
  catch (error) { return {...fields, status:'rejected', error:error.message, linkError:error instanceof WebAssembly.LinkError}; }
}

async function checkPlatform(entry, fixtures, expected) {
  const programs = new Map();
  for (const name of fixtures) {
    const text = await source('scaffolding/tests/' + name);
    programs.set(name, {source:text, llvm:await observeLLVM(text)});
  }

  return runPlatformChecks(entry, programs, expected);
}

async function runPlatformChecks(entry, programs, expected) {
  let result;
  function program(context, name) {
    const key = guestString(context, name);
    if (!programs.has(key)) throw new Error('Missing platform fixture ' + key);
    return programs.get(key);
  }
  let handle;
  function closeExecution() {
    if (handle !== undefined) tower.destroyExecution(handle);
    handle = undefined;
  }
  const imports = {
    platform_open(context, name, width, fast) {
      if (handle !== undefined) throw new Error('Platform execution is still open');
      handle = tower.compile(program(context, name).source, {pointerBytes:width});
      if (fast) tower.useFast(handle);
    },
    platform_step(_context, budget) {
      result = tower.execute(handle, budget);
      return result.status === 'executing';
    },
    platform_close: closeExecution,
    platform_llvm(context, name) { result = program(context, name).llvm; },
    platform_link_error: () => result.linkError === true,
    platform_has_import(context, mod, name) {
      const moduleName = guestString(context, mod), importName = guestString(context, name);
      return result.imports.some(item => item.module === moduleName && item.name === importName);
    },
    platform_observation(context, field, length) {
      const key = guestString(context, field);
      const value = key === 'expected' ? expected : result[key];
      const bytes = typeof value === 'string' ? Buffer.from(value) : value;
      if (!Buffer.isBuffer(bytes)) throw new Error('Missing platform field ' + key);
      const pointer = context.allocate(bytes.length + 1);
      if (!pointer) throw new Error('Cannot allocate platform field ' + key);
      const memory = context.memory();
      memory.set(bytes, pointer);
      memory[pointer + bytes.length] = 0;
      new DataView(memory.buffer, memory.byteOffset).setUint32(Number(length), bytes.length, true);
      return pointer;
    },
  };
  const modules = ['library/testing', 'library/test_fixtures', 'library/vector', 'backend/text'];
  const files = await Promise.all(modules.map(async name => ({
    path:'.tower/' + name + '.tower', text:await source('scaffolding/' + name),
  })));
  for (const name of ['platform_observations', entry]) {
    files.push({path:name + '.tower', text:await source('playground/src/' + name)});
  }
  const checks = await openTower({project:{files}, threads:{capacity:1}, imports});
  try { runSelectedTest(checks, entry + '.tower', 10, {suffix:'_browser_test.tower'}); }
  finally { closeExecution(); checks.close(); }
}

test('platform abort preserves its exact foreign signature and terminates on invocation', () =>
  checkPlatform('platform_abort_test', ['platform_abort_unused', 'platform_abort', 'platform_abort_parameter',
    'platform_abort_result', 'platform_unknown_external', 'platform_abort_staged']));

test('platform writes share byte ordering and UTF-8 decoding across interpreter and Wasm', async () =>
  checkPlatform('platform_writes_test', ['platform_writes'], await read('scaffolding/tests/platform_writes.expected')));
test('pure Wasm exports bind directly as external imports, and tables can supply the function', async () => {
  const programs = new Map();
  async function compileFixture(name, fixture) {
    const result = llvm.compile(await source('scaffolding/tests/' + fixture));
    programs.set(name, {llvm:{compilation:result.status, diagnostic:result.error}});
    return result;
  }

  const provider = await compileFixture('provider', 'platform_twice_provider');
  if (provider.status === 'compiled') {
    const {instance} = await WebAssembly.instantiate(provider.wasm, {});
    const consumer = await compileFixture('consumer', 'platform_twice_consumer');
    if (consumer.status === 'compiled') {
      const runWith = twice => executeWasm(consumer, () => {}, {imports:{twice:{wasm:twice}}});
      programs.set('direct', {llvm:await runWith(instance.exports.twice)});
      const table = new WebAssembly.Table({element:'anyfunc', initial:1});
      table.set(0, instance.exports.twice);
      programs.set('table', {llvm:await runWith(table.get(0))});
    }
  }
  await runPlatformChecks('platform_wasm_imports_test', programs);
});
test('built-ins and ordinary functions share calls and typed argument validation',async()=>{
 const source=(await read('scaffolding/tests/platform_calls.tower')).toString();
 const independent=await openTower();
 test.after(() => independent.close());
 const canonical=new Map();
 for(const pointerBytes of [4,8])for(const fast of [false,true]){
  const expected=`${pointerBytes * 3}\n`;
  const h=tower.compile(source,{pointerBytes});let text;
  try{
   if(fast)tower.useFast(h);
   const result=tower.execute(h);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
   text=tower.foundation(h).source;
   assert.ok(text.startsWith('import foundation_syntax;\n'));
   assert.match(text,/^var i32: type = integer_type\(32, 1\);$/m);
   assert.match(text,/^var usize: type = address_type\(\);$/m);
   assert.ok(text.includes('fn identity(x: usize): usize {\n    return x;\n}'));
   assert.match(text,/^var n: usize = sizeof\(array_type\(i32\*, 3\)\);$/m);
   assert.ok(text.includes('\nn = identity(n);\nprint(n);\nvar p: i32** = alloc(i32*, 2);\nfree(p);\n'));
  }finally{tower.destroyExecution(h);}
  if(fast)assert.equal(text,canonical.get(pointerBytes));else canonical.set(pointerBytes,text);
  // Recheck only copied Foundation in another host after the source handle retires.
  const second=independent.compile(text,{pointerBytes});
  try{
   if(fast)independent.useFast(second);
   const result=independent.execute(second);assert.equal(result.status,'done',result.error);assert.equal(result.output,expected);
   assert.equal(independent.foundation(second).source,text);
  }finally{independent.destroyExecution(second);}
 }
 for(const text of [source,canonical.get(4)]){
  const compiled=llvm.compile(text);assert.equal(compiled.status,'compiled',compiled.error);
  const result=await executeWasm(compiled);assert.equal(result.status,'done',result.error);assert.equal(result.output,'12\n');
 }
 if(process.env.TOWER_TEST_ARTIFACTS){
  await mkdir(process.env.TOWER_TEST_ARTIFACTS,{recursive:true});
  for(const [width,text] of canonical)await writeFile(`${process.env.TOWER_TEST_ARTIFACTS}/platform_calls_${width*8}.tower`,text);
 }
 for(const source of ['print();','alloc(i32);','free(1);','var n: i32 = print(1);','fn print(x: i32): void {}']){
  const h=tower.compile('import foundation; '+source);try{const r=tower.execute(h);assert.equal(r.status,'error',source);assert.equal(r.steps,0);}finally{tower.destroyExecution(h);}
 }
});
