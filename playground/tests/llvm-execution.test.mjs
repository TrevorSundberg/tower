import {after, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {builtins, files, loadTower, loadTowerBytes, generatedSource, loadLLVM, executeWasm} from './compiler-fixtures.mjs';
import {loadTower as createTower} from '../src/tower-host.mjs';
import {platformImports} from '../src/platform.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {runSelectedTest} from './selected_test.mjs';
import {originalDiagnostic} from '../src/foundation-source.mjs';

const read = path => readFile(new URL('../../' + path, import.meta.url));
const grammar = (await read('scaffolding/foundation.tower')).toString();
const towerBytes = await readFile(process.env.TOWER_TEST_WASM || new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const llvmBytes = process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm');
const fixtures = 'playground/tests/fixtures/llvm_execution/';
// Select the two assertion files as entries. Neither has a same-stem owner.
const assertionOptions = {suffix:'_browser_test.tower'};
const idioms = JSON.parse(await read('scaffolding/tests/llvm-scalar-idioms.json'));

// Forward the real ABI operation and retain its arguments and return separately
// from program stdout. Reconstructed packages can also call the platform.
let writes;
function traceWrites(sink) {
  const platform = platformImports(sink);
  return {platform_write(context, stream, pointer, length) {
    const result = platform.platform_write(context, stream, pointer, length);
    writes?.push({stream, length:Number(length), result:Number(result)});
    return result;
  }};
}
const tower = await loadTowerBytes(towerBytes, undefined, grammar, grammar, undefined, {
  imports:traceWrites((_stream, bytes, context) => context.output(bytes)),
});
after(() => tower.close());
const llvm = await loadLLVM(llvmBytes, undefined, grammar, grammar);

function fixture(name, file, golden, generate = false) {
  const stem = name.replaceAll(' ', '_').replaceAll(',', '');
  return {name, file:file ?? fixtures + 'inputs/' + stem + '.tower', golden:golden ?? stem, generate};
}

const cases = [
  fixture('type objects', 'scaffolding/tests/type_object_values.tower', 'zero'),
  fixture('computed type arguments', 'scaffolding/tests/computed_type_arguments.tower', 'zero'),
  fixture('function values', 'scaffolding/tests/function_values.tower', 'zero'),
  fixture('integer negation', 'scaffolding/tests/integer_negation.tower', 'zero'),
  fixture('floating values', 'scaffolding/tests/floating_point.tower', 'zero'),
  fixture('narrow integers', 'scaffolding/tests/narrow_integers.tower', 'zero'),
  fixture('narrow floating conversions', 'scaffolding/tests/narrow_floats.tower', 'zero'),
  fixture('narrow output', 'scaffolding/tests/narrow_output.tower'),
  fixture('floating output', 'scaffolding/tests/floating_output.tower'),
  fixture('named field initialization', 'scaffolding/tests/named_initialization.tower', 'zero'),
  fixture('resumable control bodies', 'scaffolding/tests/body_continuation.tower', 'zero'),
  fixture('struct values', 'scaffolding/tests/struct_values.tower', 'zero'),
  fixture('known bindings', 'scaffolding/tests/known_bindings.tower', 'zero'),
  ...idioms.map(([name, source, expected]) => ({name, source, expected, scalar:true})),
  fixture('more than 256 functions', 'scaffolding/tests/stress/llvm_functions.tower', undefined, true),
  fixture('quoted names preserve bindings'),
  fixture('escaped quoted names'),
  fixture('forward calls and recursion', 'scaffolding/examples/functions.tower'),
  fixture('replacements and loops', 'scaffolding/examples/execution.tower'),
  fixture('prefix and postfix increment replacements', 'scaffolding/examples/increment.tower'),
  fixture('mutual recursion'),
  fixture('unsigned result and wrapping', undefined, 'zero'),
  fixture('live caller pointer return'),
  fixture('capture call destination before effects'),
  fixture('division zero', undefined, 'empty'),
  fixture('division overflow', undefined, 'empty'),
  fixture('remainder overflow', undefined, 'empty'),
  fixture('checked conversion', undefined, 'empty'),
  fixture('reinterpretation and signed arithmetic'),
  fixture('continue and break'),
  fixture('break skips unentered sibling loops'),
  fixture('continue skips unentered sibling loops'),
  fixture('initializers, type names and shadowing'),
  fixture('bare calls and call as an ordinary name'),
  fixture('replacement trap source mapping', undefined, 'empty'),
  fixture('bounded output'),
];

function execute(handle, scalar) {
  let result, output = '';
  writes = scalar ? [] : undefined;
  try {
    for (let batch = 0; batch < 1000; ++batch) {
      result = tower.execute(handle, 10000);
      output += result.output;
      if (result.status !== 'executing') break;
    }
    return {result, output, writes};
  } finally { writes = undefined; }
}

function* pipeline(row, source, sample, phase, save) {
  phase('Graph compile');
  const handle = tower.compile(source);
  try {
    phase('Graph execute');
    const graph = execute(handle, row.scalar);
    sample.graph = {...graph.result, output:graph.output};
    yield ['Graph', {...sample.graph, writes:graph.writes}];
    phase('Graph result', graph);
    phase('Fast compile');
    const fast = tower.compile(source);
    try {
      phase('Fast select');
      tower.useFast(fast);
      phase('Fast execute');
      const run = execute(fast, row.scalar);
      yield ['Fast', {...run.result, output:run.output, writes:run.writes}];
      phase('Fast result', run);
    } finally { tower.destroyExecution(fast); }

    phase('Foundation format');
    const formatted = tower.foundation(handle);
    sample.formatted = formatted;
    save('foundation_input.tower', formatted.source);
    for (const optimize of [false,true]) {
      const label = 'LLVM Foundation ' + optimize;
      phase(label);
      const {foundation, before, after, ...response} = llvm.compile(formatted.source, {emit:'foundation', optimize});
      save(`profile_${optimize}_response.json`, JSON.stringify(response,null,2)+'\n');
      if (foundation !== undefined) save(`profile_${optimize}_emitted.tower`, foundation);
      phase(label + ' result', {result:response});
      yield ['LLVM Foundation', {...response, optimize}];
      phase(label + ' package prepare');
      const prepared = tower.prepareFoundationPackage(foundation, {optimizationProfile:response.optimizationProfile});
      try {
        phase(label + ' Fast select');
        tower.useFast(prepared.handle);
        phase(label + ' Fast execute');
        const run = execute(prepared.handle, row.scalar);
        run.result = originalDiagnostic(run.result, formatted.spans, formatted.sourceMap);
        yield ['prepared execution', {...run.result, output:run.output, writes:run.writes}];
        phase(label + ' Fast result', run);
        phase(label + ' package bytes');
        const {buffer, byteOffset, byteLength} = prepared.bytecode;
        yield ['package profile', {profile:new DataView(buffer, byteOffset, byteLength).getUint32(24, true)}];
      } finally { tower.destroyExecution(prepared.handle); }
      // Release the prepared guest before independently reconstructing the cache.
      phase(label + ' package load');
      const restored = tower.loadBytecode(prepared.bytecode);
      try {
        phase(label + ' loaded execute');
        const run = execute(restored, row.scalar);
        run.result = originalDiagnostic(run.result, formatted.spans, formatted.sourceMap);
        yield ['loaded execution', {...run.result, output:run.output, writes:run.writes}];
        phase(label + ' loaded result', run);
      } finally { tower.destroyExecution(restored); }
    }
    phase('canonical roundtrip');
    const roundtrip = tower.compileFoundation(formatted.source);
    try {
      yield ['canonical roundtrip', {canonical:formatted.source, reformatted:tower.foundation(roundtrip).source}];
    } finally { tower.destroyExecution(roundtrip); }
    phase('LLVM Wasm compile');
    sample.compiled = llvm.compile(formatted.source);
    yield ['LLVM Wasm', sample.compiled];
  } finally { tower.destroyExecution(handle); }
}

let sample, assertionHost;
async function openAssertions() {
  const inputs = files.filter(({path}) => ['.tower/library/testing.tower', '.tower/library/test_fixtures.tower',
    '.tower/backend/text.tower', '.tower/library/vector.tower'].includes(path));
  for (const path of ['observations.tower', 'pipeline_test.tower', 'wasm_result_test.tower'])
    inputs.push({path, text:(await read(fixtures + path)).toString()});

  function field(context, key) {
    const name = guestString(context, key);
    if (name === 'case') return sample.row.name;
    if (name === 'expected') return sample.expected;
    if (name === 'scalar') return !!sample.row.scalar;
    if (name === 'traced') return sample.current.writes !== undefined;
    if (name === 'write count') return sample.current.writes.length;
    if (name.startsWith('write ')) return sample.current.writes[0][name.slice(6)];
    if (name === 'compiler diagnostic') return sample.current.error ?? '';
    return name.startsWith('graph ') ? sample.graph[name.slice(6)] : sample.current[name];
  }
  return createTower(towerBytes, undefined, grammar, undefined, builtins.bedrock, {
    builtins, tower:builtins.tower, project:{files:inputs}, threads:{capacity:1}, imports:{
      llvm_next(context, stage) {
        const next = sample.steps.next();
        assert.equal(next.done, false, 'Missing host observation');
        assert.equal(next.value[0], guestString(context, stage), 'Unexpected host operation');
        sample.current = next.value[1];
      },
      llvm_text: (context, key) => copyText(context, field(context, key)),
      llvm_number(context, key) {
        const value = field(context, key);
        if (typeof value !== 'boolean' && !Number.isInteger(value)) throw new Error('Expected numeric observation');
        return Number(value);
      },
      llvm_bytes(context, key, length) {
        const value = field(context, key);
        if (typeof value !== 'string' && !Buffer.isBuffer(value)) throw new Error('Missing byte observation');
        const bytes = Buffer.from(value);
        const address = context.allocate(bytes.length || 1);
        if (!address) throw new Error('Cannot copy observed bytes');
        const memory = context.memory();
        memory.set(bytes, address);
        const view = new DataView(memory.buffer, memory.byteOffset, memory.byteLength);
        if (context.pointerBytes === 8) view.setBigUint64(Number(length), BigInt(bytes.length), true);
        else view.setUint32(Number(length), bytes.length, true);
        return address;
      },
      llvm_matches(context, key, pattern) {
        const text = field(context, key);
        if (typeof text !== 'string') throw new Error('Missing backend text');
        return new RegExp(guestString(context, pattern)).test(text);
      },
    },
  });
}
after(() => assertionHost?.close());

for (const row of cases) test(`LLVM matches interpreter: ${row.name}`, async () => {
  const phase = (label, details = {}) => {
    if (process.env.TOWER_TEST_PHASES) console.log(JSON.stringify({case:row.name, phase:label,
      milliseconds:performance.now(), cpu:process.cpuUsage(), rss:process.memoryUsage().rss,
      maxRssKiB:process.resourceUsage().maxRSS, portableCapacityBytes:tower.exports.memory.buffer.byteLength,
      portableLiveNodes:tower.exports.tw_live_nodes(), portableLegacyAllocations:tower.exports.tw_live_allocations(),
      packageBytes:tower.exports.tw_exec_bytecode_size(), ...details}));
  };
  const save = (suffix, value) => {
    if (process.env.TOWER_TEST_ARTIFACTS) writeFileSync(join(process.env.TOWER_TEST_ARTIFACTS,
      row.name.replaceAll(' ', '_') + '_' + suffix), value);
  };
  const source = row.generate ? await generatedSource(tower, new URL('../../' + row.file, import.meta.url))
    : row.source ?? (await read(row.file)).toString();
  save('source.tower', source);
  assertionHost ??= await openAssertions();
  sample = {row, expected:row.expected ?? await read(fixtures + 'expected/' + row.golden + '.expected')};
  sample.steps = pipeline(row, source, sample, phase, save);
  try {
    runSelectedTest(assertionHost, 'pipeline_test.tower', 300, assertionOptions);
    phase('LLVM Wasm execute');
    const actual = await executeWasm(sample.compiled);
    if (sample.graph.status === 'error')
      phase(`LLVM Wasm diagnostic: reference ${sample.graph.errorOffset}, returned ${actual.errorOffset}`);
    sample.current = originalDiagnostic(actual, sample.formatted.spans, sample.formatted.sourceMap);
    phase('LLVM Wasm result', {result:sample.current});
    runSelectedTest(assertionHost, 'wasm_result_test.tower', 300, assertionOptions);
    if (row.scalar) {
      // Keep the default linked execution above. Observe an independent call
      // through the real platform implementation with a separate byte sink.
      writes = [];
      try {
        const probe = await executeWasm(sample.compiled, undefined, {imports:traceWrites(() => {})});
        sample.current = {...originalDiagnostic(probe, sample.formatted.spans, sample.formatted.sourceMap), writes};
        phase('LLVM Wasm platform calls', {result:sample.current});
        runSelectedTest(assertionHost, 'wasm_result_test.tower', 300, assertionOptions);
      } finally { writes = undefined; }
    }
    assert.ok(sample.steps.next().done, 'Unconsumed host operation');
    phase('complete');
  } finally {
    sample.steps.return();
    sample = undefined;
    phase('released');
  }
});

test('increment helper calls inline with a runtime pointer argument', () => {
  const source = `
import foundation;
fn post(p: i32*): i32 { var old: i32 = *p; *p = old + 1; return old; }
fn pre(p: i32*): i32 { var next: i32 = *p; next = next + 1; *p = next; return next; }
parse CoreCall |= $target:CoreLocation '++' => replace { post(&$target) };
parse CoreCall |= '++' $target:CoreLocation => replace { pre(&$target) };
export fn increment_pair(p: i32*): i32 {
    var old: i32 = p[0]++;
    var next: i32 = ++p[0];
    var sum: i32 = old + next;
    return sum;
}`;
  const handle = tower.compile(source);
  try {
    const compiled = llvm.compile(tower.foundation(handle).source);
    assert.equal(compiled.status, 'compiled', compiled.error);
    const body = compiled.after.match(/define[^\n]*@increment_pair\([^]*?^}/m)?.[0];
    assert.ok(body, compiled.after);
    assert.doesNotMatch(body, /\bcall\b|\balloca\b/);
    assert.equal((body.match(/\bload\b/g) || []).length, 1);
    assert.equal((body.match(/\bstore\b/g) || []).length, 1);
    assert.match(body, /add i32 [^\n]*, 2/);
  } finally { tower.destroyExecution(handle); }
});

test('functions are fully checked before effects', () => {
  for (const source of [
    'fn f(a: i32): void {} f(true);',
    'fn f(a: i32): void {} f();',
    'fn f(): i32 { return true; }',
    'fn f(b: bool): i32 { if b { return 1; } }',
    'fn f(): void {} var a: i32; a = f();',
    'fn f(): void {} fn f(): void {}',
    'fn f(a: i32, a: i32): void {}',
    '{ var a: i32; } fn f(): i32 { return a; }',
    'fn f(): void { fn nested(): void {} }',
    'return 1;', 'var x: void;',
  ]) {
    const handle = tower.compile(grammar + '\nprint(99);\n' + source);
    const result = tower.execute(handle); tower.destroyExecution(handle);
    assert.equal(result.status, 'error', source); assert.equal(result.steps, 0, source); assert.equal(result.output, '', source);
  }
});

test('LLVM checks canonical foundation source before running passes', () => {
  for (const quotes of ["''", '""']) {
    // Define a seed rule: extending an absent Statement fails before its literal.
    const source = 'parse Empty = ' + quotes + ';';
    const result = llvm.compile(source);
    assert.equal(result.status, 'error');
    assert.match(result.error, /Token literal is empty/);
    assert.equal(result.errorOffset, source.indexOf(quotes));
  }
  for (const source of ['import foundation; var a: i32 = ;', 'import foundation; var a: Unknown;', 'import foundation; print(missing);',
    'import foundation; fn f(): i32 {}', 'import foundation; var a: i32; a = true;', '\0',
    'import foundation; i32 a;', 'import foundation; fn f() -> void {}', 'import foundation; fn f(): void {} call f();'])
    assert.equal(llvm.compile(source).status, 'error', source);
  assert.equal(llvm.compile('').status, 'compiled', 'empty programs are valid');
});

test('scalar idioms exercise LLVM intrinsic legalization with runtime inputs', async()=>{
  for(const [name,source,,intrinsic] of JSON.parse((await read('scaffolding/tests/llvm-scalar-idioms.json')).toString())){
    const result=llvm.compile(source,{emit:'foundation'});
    assert.equal(result.status,'compiled',name+': '+result.error);
    if(intrinsic)assert.ok(result.after.includes(intrinsic),name+' must exercise '+intrinsic);
  }
});

test('LLVM bytecode preserves imported effects and original module diagnostics', ()=>{
  for(const failing of [false,true])for(const width of [4,8])for(const optimize of [false,true]){
    const source='import foundation; import helper; print(answer());';
    tower.configureModules({entry:'main.tower',files:[{path:'helper.tower',text:failing?
      'import foundation;\nfn answer(): i32 {\nvar zero = 0;\nvar result = 42 / zero;\nreturn result;\n}':
      'import foundation;\nfn answer(): i32 { return 42; }'}]});
    const original=tower.compile(source,{pointerBytes:width});
    try{
      const formatted=tower.foundation(original);
      const reference=tower.execute(original,100000);
      const compiled=llvm.compile(formatted.source,{emit:'foundation',optimize,target:width===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
      assert.equal(compiled.status,'compiled',compiled.error);
      const guest=tower.compile(compiled.foundation,{pointerBytes:width});
      try{
        tower.useFast(guest);let result,output='';
        do{result=tower.execute(guest,100000);output+=result.output;}while(result.status==='executing');
        result=originalDiagnostic({...result,output},formatted.spans,formatted.sourceMap);
        for(const key of ['status','output','error','errorOffset','errorFile'])assert.equal(result[key],reference[key],key);
      }finally{tower.destroyExecution(guest);}
    }finally{tower.destroyExecution(original);}
  }
});

test('LLVM bytecode preserves host signatures, nominal pointer types and public names', async()=>{
  const source=`import foundation; struct Pair { value: i32; }
    extern fn host_check(a: i32, b: i64, count: usize, flag: bool, p: Pair*): i32;
    export fn tower_user(flag: bool): bool { return flag; }
    fn function0(): i32 { return -9; }
    var pair: Pair; pair.value = -7;
    print(host_check(function0(), -5000000000, 4, tower_user(true), &pair));`;
  const wrongPointer=source.replace('var pair: Pair;', 'struct Other { value: i32; } var pair: Other;');
  const rejected=llvm.compile(wrongPointer,{emit:'foundation'});
  assert.equal(rejected.status,'error');
  assert.match(rejected.error,/Expected Pair\*, got Other\*/);
  for(const width of [4,8])for(const optimize of [false,true]){
    let called=0;
    const host=await loadTower(towerBytes,undefined,grammar,undefined,undefined,{imports:{
      host_check(context,a,b,count,flag,p){
        assert.equal(context.pointerBytes,width);
        assert.equal(a,-9);assert.equal(b,-5000000000n);
        assert.equal(count,width===8?4n:4);assert.equal(flag,1);
        assert.equal(new DataView(context.memory().buffer,context.memory().byteOffset+Number(p)).getInt32(0,true),-7);
        called++;return -42;
      }
    }});
    const result=llvm.compile(source,{emit:'foundation',optimize,target:width===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
    assert.equal(result.status,'compiled',result.error);
    assert.match(result.foundation,/^extern fn host_check\(\w+: i32, \w+: i64, \w+: usize, \w+: bool, \w+: Pair\*\): i32;$/m);
    assert.match(result.foundation,/^export fn tower_user\(\w+: bool\): bool \{/m);
    function checkCall(handle) {
      const before=called;
      try {
        host.useFast(handle);let state,output='';
        do{state=host.execute(handle,10000);output+=state.output;}while(state.status==='executing');
        assert.equal(state.status,'done',state.error);assert.equal(output,'-42\n');assert.equal(called,before+1);
      } finally { host.destroyExecution(handle); }
    }
    try {
      checkCall(host.compile(result.foundation,{pointerBytes:width}));
      const prepared=host.prepareFoundationPackage(result.foundation,{pointerBytes:width,optimizationProfile:result.optimizationProfile});
      host.destroyExecution(prepared.handle);
      checkCall(host.loadBytecode(prepared.bytecode));
    } finally { host.close(); }
  }
});
