import {after, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {loadTower as createTower} from '../src/tower-host.mjs';
import {builtins, files, generatedSource, loadTowerBytes} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openTower, runSelectedTest} from './compiler_test_host.mjs';
import {compareResults} from '../src/comparison.mjs';
import {compare_results} from './comparison_host.mjs';
import {copyText} from './guest_text.mjs';
const read = path => readFile(new URL('../../'+path,import.meta.url));
const wasm = await WebAssembly.compile(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url)));
const tower = await loadTowerBytes(wasm, undefined, builtins.foundation);
after(() => tower.close());

// Return the terminal response with every output slice, or the last response
// at the caller's limit. Both the JS and Tower callers check the turn count.
function executeSlices(handle, budget, limit) {
  let result, output = '', turns = 0;
  do {
    result = tower.execute(handle, budget);
    output += result.output;
    ++turns;
  } while (turns < limit && result.status === 'executing');
  return {result:{...result, output}, turns};
}

function run(source,fast,width=4,budget=100000) {
  const handle=tower.compile(source,{pointerBytes:width});
  try {
    const initial=tower.execute(handle,0);
    assert.equal(initial.steps,0);
    if(initial.status==='error') {
      // Semantic/CFG rejection precedes interpreter selection. Preserve its
      // diagnostic instead of replacing it with the host's selection error.
      if(fast)assert.throws(()=>tower.useFast(handle),/before executing/);
      return {...initial,cache:null};
    }
    if(fast)tower.useFast(handle);
    assert.equal(tower.execute(handle,0).steps,0);
    const {result, turns} = executeSlices(handle, budget, 100000);
    assert.ok(turns < 100000, 'execution must terminate');
    return {...result,cache:fast?tower.fastStats(handle):null};
  } finally {tower.destroyExecution(handle);}
}
function agree(source,width=4,budget=7,status='done'){
  const graph=run(source,false,width,budget), fast=run(source,true,width,budget);
  assert.equal(graph.status,status,JSON.stringify({source,graph}));
  assert.equal(fast.status,status,JSON.stringify({source,fast}));
  assert.deepEqual(compareResults(graph,fast),[],JSON.stringify({source,graph,fast}));
  return fast;
}
async function openExampleChecks() {
  let handle, step, fast;
  function closeExample() {
    if (handle !== undefined) tower.destroyExecution(handle);
    handle = step = undefined;
  }
  const imports = {
    compare_results,
    example_open(context, path, width) {
      handle = tower.compile(fixtureSource(guestString(context, path)), {pointerBytes:width});
      fast = false;
    },
    example_close:closeExample,
    example_fast() { tower.useFast(handle); fast = true; },
    example_step(_context, budget) {
      step = tower.execute(handle, budget);
      return step.steps;
    },
    example_slices(_context, budget, limit) {
      const {result, turns} = executeSlices(handle, budget, limit);
      step = result;
      return turns;
    },
    example_status_is: (context, status) => step.status === guestString(context, status),
    example_result(context) {
      const cache = fast ? tower.fastStats(handle) : null;
      return copyText(context, JSON.stringify({...step, cache}));
    },
  };
  const assertionFiles = files.filter(({path}) => path.endsWith('_fast_graph_test.tower') ||
    ['.tower/tests/fast_graph_examples.tower', '.tower/tests/browser_comparison.tower',
      '.tower/library/testing.tower', '.tower/backend/text.tower', '.tower/library/vector.tower'].includes(path));
  const host = await createTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock,
    {tower:builtins.tower, builtins, imports, project:{files:assertionFiles}, threads:{capacity:1}});
  return {host, closeExample};
}

let exampleChecks;
after(async () => (await exampleChecks)?.host.close());
function registerExample(name) {
  test('fast and graph: ' + name, async () => {
    const {host, closeExample} = await (exampleChecks ??= openExampleChecks());
    try {
      runSelectedTest(host, '.tower/examples/' + name + '_fast_graph_test.tower',
        undefined, {suffix:'_browser_test.tower'});
    } finally { closeExample(); } // A guest assertion can bypass defer.
  });
}
registerExample('execution');
registerExample('functions');
registerExample('increment');
registerExample('inference');
registerExample('templates');
registerExample('structs');
registerExample('memory');

test('all integer operations, widths, signed comparisons, conversions and traps',()=>{
  for(const [type,a,b] of [['u8','250','3'],['u32','4294967294','3'],['i32','-17','3'],['u64','18446744073709551614','3'],['i64','-5000000000','3']])
    for(const op of ['+','-','*','/','%','&','|','^','==','!=','<','<=','>','>='])
      agree(`import foundation; var a: ${type} = ${a}; var b: ${type} = ${b}; var c = a ${op} b; print(c);`);
  for(const source of ['var a = 1 / 0;','var a = -2147483648 / -1;','var a: i64 = -9223372036854775808; var b = a % -1;',
    'var a: i32 = -1; print(convert(u32,a));','var a: u64 = 18446744073709551615; print(convert(i64,a));',
    'var p = bits(u8*, convert(usize, 268435456)); print(*p);',
    'fn recurse(): void { recurse(); } recurse();'])for(const width of [4,8])agree('import foundation;'+source,width,1,'error');
  for(const width of [4,8])assert.equal(agree('import foundation;var a:i64=-9223372036854775808;print(convert(i64,a));print(convert(bool,a));',width,1).output,'-9223372036854775808\ntrue\n');
});
test('effects, aliasing, negative indices, copies, strings and empty modules',async()=>{
  for(const source of ['', 'fn never(): void {}',
    'fn change(pp: i32**, q: i32*): i32 { *pp = q; return 42; } var a = 1; var b = 2; var p = &a; *p = change(&p, &b); print(a); print(b);',
    'var p = alloc(u8, 6); fill(p, 1, 6); p[0] = 7; p[1] = 8; var q = p + 1; copy(q,p,5); print(p[2]); p = realloc(u8,p,100); print(p[2]); free(p);',
    'var p = "A\\n雪"; print(p[0]); print(p[2]); print(p[5]);',
    'var i = 0; var total = 0; loop { i = i + 1; var end = i == 9; if end { break; } var omitted = i == 3; if omitted { continue; } var j = 0; loop { j = j + 1; var end = j == 3; if end { break; } total = total + i; } } print(total);'])
    for(const width of [4,8])agree(source===''?source:'import foundation;'+source,width,1);
  const indexed=(await read('scaffolding/tests/interpreter_signed_index.tower')).toString();
  for(const width of [4,8]) {
    assert.equal(agree(indexed,width,1).output,'11\n11\n');
    const rejected=agree('import foundation;var a:i32[4];var p=&a[1];print(p[-1]);',width,1,'error');
    assert.equal(rejected.error,'Integer literal out of range for usize');
    assert.equal(rejected.steps,0);
  }
});
test('wide operands do not impose byte-sized program limits',async()=>{
  const result=agree('import foundation;'+await generatedSource(tower,new URL('../../scaffolding/tests/stress/wide_declarations.tower',import.meta.url)),8);
  assert.equal(result.output,'349\n');assert.ok(result.cache.wideInstructions>0);
  assert.equal(agree('import foundation;'+await generatedSource(tower,new URL('../../scaffolding/tests/stress/wide_functions.tower',import.meta.url))).output,'299\n');
  const wideRegisters=agree('import foundation;'+await generatedSource(tower,new URL('../../scaffolding/tests/stress/wide_registers.tower',import.meta.url)),4,100000);
  assert.equal(wideRegisters.output,'63\n');
  assert.ok(wideRegisters.cache.registerCapacityBytes>256*8);
});
test('cancellation slices, cache lifetime, invalid programs and output limits', async () => {
  const owner = '.tower/tests/fast_cancellation.tower';
  const source = fixtureSource(owner);
  const subject = await openTower();
  let handle, result;
  const checks = await openTower({threads:{capacity:1}, imports:{
    cancel_nodes: () => subject.exports.tw_live_nodes(),
    cancel_components: () => subject.exports.tower_component_get_allocated_count(),
    cancel_allocations: () => subject.exports.tw_live_allocations(),
    cancel_open() { handle = subject.compile(source); },
    cancel_destroy() { subject.destroyExecution(handle); handle = undefined; },
    cancel_fast() {
      try { subject.useFast(handle); return true; }
      catch (error) {
        if (/before executing/.test(error.message)) return false;
        throw error;
      }
    },
    cancel_step(_context, budget) {
      result = subject.execute(handle, budget);
      return result.steps;
    },
    cancel_executing: () => result.status === 'executing',
    cancel_truncated: () => result.outputTruncated,
  }});
  try { runSelectedTest(checks, owner); }
  finally { if (handle !== undefined) subject.destroyExecution(handle); }
  agree(fixtureSource('.tower/tests/fast_cancellation_invalid.tower'),4,7,'error');
});

async function openCfgChecks() {
  const assertionFiles = files.filter(({path}) => path.startsWith('.tower/compiler/semantic_statements_cfg_') ||
    ['.tower/backend/text.tower', '.tower/library/testing.tower', '.tower/library/test_fixtures.tower',
      '.tower/library/vector.tower'].includes(path));
  const inputs = new URL('../../scaffolding/tests/semantic_statements_cfg_inputs/', import.meta.url);
  const handles = new Set();
  const encoder = new TextEncoder();
  let step;

  // Returned buffers live in the assertion guest. Never retain a memory view
  // across an allocation. All subject executions use the original input entry.
  function copy(context, data, size) {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    const pointer = context.allocate(bytes.length + 1);
    if (!pointer) throw new Error('Cannot allocate CFG observation');
    const memory = context.memory();
    memory.set(bytes, pointer);
    memory[pointer + bytes.length] = 0;
    if (size) {
      const view = new DataView(memory.buffer, memory.byteOffset, memory.byteLength);
      if (context.pointerBytes === 8) view.setBigUint64(Number(size), BigInt(bytes.length), true);
      else view.setUint32(Number(size), bytes.length, true);
    }
    return pointer;
  }

  const imports = {
    cfg_file(context, path, size) {
      const file = guestString(context, path);
      if (!/^[a-z_]+\.(tower|expected)$/.test(file)) throw new Error('Invalid CFG fixture name');
      return copy(context, readFileSync(new URL(file, inputs)), size);
    },
    cfg_open(context, source, width) {
      const handle = tower.compile(guestString(context, source), {pointerBytes:width});
      handles.add(handle);
      return handle;
    },
    cfg_close(_context, handle) {
      tower.destroyExecution(handle);
      handles.delete(handle);
    },
    cfg_fast(context, handle) {
      let message = '';
      try { tower.useFast(handle); }
      catch (error) { message = error.message; }
      return copy(context, message);
    },
    cfg_foundation(context, handle, size) {
      const result = tower.foundation(handle);
      if (result.error) throw new Error(result.error);
      return copy(context, result.source, size);
    },
    cfg_step(_context, handle, budget) {
      step = tower.execute(handle, budget);
      return step.output.length !== 0;
    },
    cfg_steps: () => step.steps,
    cfg_executing: () => step.status === 'executing',
    cfg_truncated: () => step.outputTruncated,
    cfg_offset: () => step.errorOffset,
    cfg_field: (context, name, size) => copy(context, step[guestString(context, name)], size),
  };
  const host = await createTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock,
    {tower:builtins.tower, builtins, imports, project:{files:assertionFiles}, threads:{capacity:1}});
  function run(name) {
    try {
      runSelectedTest(host, '.tower/compiler/semantic_statements_cfg_' + name + '_test.tower',
        undefined, {suffix:'_browser_test.tower'});
    } finally {
      for (const handle of handles) tower.destroyExecution(handle);
      handles.clear();
      step = undefined;
    }
  }
  return {run, close:host.close};
}

// Both names share one assertion worker only when a CFG registration runs.
let cfgChecks;
after(async () => (await cfgChecks)?.close());
async function checkCfg(name) {
  const checks = await (cfgChecks ??= openCfgChecks());
  checks.run(name);
}

test('foundation CFG labels, forward edges and parallel-copy loops round trip', () => checkCfg('roundtrip'));
test('CFG validation and explicit traps use the shared semantic path', () => checkCfg('validation'));
