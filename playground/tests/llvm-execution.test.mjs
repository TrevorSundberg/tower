import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower, generatedSource } from './compiler-fixtures.mjs';
import { loadLLVM, executeWasm } from './compiler-fixtures.mjs';
import { originalDiagnostic } from '../src/foundation-source.mjs';
const read = path => readFile(new URL('../../' + path, import.meta.url));
const grammar = (await read('scaffolding/foundation.tower')).toString();
// The shared loaders own override reads; do not eagerly require an unused
// default artifact. This differential gate requires LLVM, including filtered runs.
const towerBytes = process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm');
const llvmBytes = process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm');
const tower = await loadTower(towerBytes, undefined, grammar, grammar);
const llvm = await loadLLVM(llvmBytes, undefined, grammar, grammar);

const cases = [
  ['type objects', (await read('scaffolding/tests/type_object_values.tower')).toString(), '0\n', null, 0],
  ['computed type arguments', (await read('scaffolding/tests/computed_type_arguments.tower')).toString(), '0\n'],
  ['function values', (await read('scaffolding/tests/function_values.tower')).toString(), '0\n'],
  ['integer negation', (await read('scaffolding/tests/integer_negation.tower')).toString(), '0\n'],
  ['floating values', (await read('scaffolding/tests/floating_point.tower')).toString(), '0\n'],
  ['narrow integers', (await read('scaffolding/tests/narrow_integers.tower')).toString(), '0\n'],
  ['narrow floating conversions', (await read('scaffolding/tests/narrow_floats.tower')).toString(), '0\n'],
  ['narrow output', (await read('scaffolding/tests/narrow_output.tower')).toString(), '-128\n-32768\n65535\n32768\n-32768\n32768\ntrue\n-1\n-1\n1\n1\n-128\n'],
  ['floating output', (await read('scaffolding/tests/floating_output.tower')).toString(), '1.00000001e-1\n1.0000000000000001e-1\n1.5\n-0.0\ninf\n-inf\nnan\n4.9406564584124654e-324\n1.7976931348623157e308\n'],
  ['named field initialization', (await read('scaffolding/tests/named_initialization.tower')).toString(), '0\n'],
  ['resumable control bodies', (await read('scaffolding/tests/body_continuation.tower')).toString(), '0\n'],
  ['struct values', (await read('scaffolding/tests/struct_values.tower')).toString(), '0\n'],
  ['known bindings', (await read('scaffolding/tests/known_bindings.tower')).toString(), '0\n'],
  ...JSON.parse((await read('scaffolding/tests/llvm-scalar-idioms.json')).toString()).map(([name,source,expected])=>[name,source,expected]),
  ['more than 256 functions', await generatedSource(tower,new URL('../../scaffolding/tests/stress/llvm_functions.tower',import.meta.url)), '299\n0\n'],
  ['quoted names preserve bindings', 'import foundation; fn `add-one`(`odd name`: i32): i32 { var `var`: i32 = `odd name` + 1; return `var`; } var `x-y`: i32 = `add-one`(41); var p: i32* = &`x-y`; var equal: bool = p == p; print(equal); print(`x-y`);', 'true\n42\n'],
  ['escaped quoted names', 'import foundation; var `back\\\\tick\\`line\\n`: i32 = 5; print(`back\\\\tick\\`line\\n`);', '5\n'],
  ['forward calls and recursion', (await read('scaffolding/examples/functions.tower')).toString(), '720\n721\n'],
  ['replacements and loops', (await read('scaffolding/examples/execution.tower')).toString(), '15\n16\n'],
  ['prefix and postfix increment replacements', (await read('scaffolding/examples/increment.tower')).toString(), '5\n6\n7\n7\n9\n'],
  ['mutual recursion', `import foundation; fn even(n: i32): bool { var b: bool; b = n == 0; if b { return true; } var p: i32; p = n - 1; b = odd(p); return b; }
    fn odd(n: i32): bool { var b: bool; b = n == 0; if b { return false; } var p: i32; p = n - 1; b = even(p); return b; }
    var a: bool; a = even(8); print(a); a = odd(8); print(a);`, 'true\nfalse\n'],
  ['unsigned result and wrapping', 'import foundation; fn f(x: u32): u32 { x = x + 1; return x; } var x: u32; x = f(4294967295); print(x);', '0\n'],
  ['live caller pointer return', 'import foundation; fn identity(x: i32*): i32* { return x; } var x: i32; var p: i32*; p = &x; p = identity(p); *p = 42; print(x);', '42\n'],
  ['capture call destination before effects', `import foundation; fn change(pp: i32**, q: i32*): i32 { *pp = q; return 42; }
    var a: i32; var b: i32; a = 1; b = 2; var p: i32*; var q: i32*; var pp: i32**; p = &a; q = &b; pp = &p;
    *p = change(pp, q); print(a); print(b); var equal: bool = p == q; print(equal);`, '42\n2\ntrue\n'],
  ['division zero', 'import foundation; var a: i32; a = 7 / 0;', '', /Division by zero/],
  ['division overflow', 'import foundation; var a: i32; a = -2147483648 / -1;', '', /overflow/],
  ['remainder overflow', 'import foundation; var a: i32; a = -2147483648 % -1;', '', /overflow/],
  ['checked conversion', 'import foundation; var a: i32; var b: u32; a = -1; b = convert(u32, a);', '', /out of range/],
  ['reinterpretation and signed arithmetic', 'import foundation; var a: u32; var b: i32; a = 4294967295; b = bits(i32, a); print(b); b = -5 / 2; print(b); b = -5 % 2; print(b);', '-1\n-2\n-1\n'],
  ['continue and break', 'import foundation; var n: i32; var b: bool; n = 0; loop { n = n + 1; b = n < 3; if b { continue; } print(n); break; }', '3\n'],
  ['break skips unentered sibling loops', 'import foundation; loop { print(1); break; loop { print(99); break; } print(2); } print(3);', '1\n3\n'],
  ['continue skips unentered sibling loops', 'import foundation; var n: i32 = 0; var stop: bool; loop { n = n + 1; stop = n == 3; if stop { break; } continue; loop { break; } print(99); } print(n);', '3\n'],
  ['initializers, type names and shadowing', 'import foundation; var i32: i32 = 4; { var i32: i32 = 9; print(i32); } print(i32);', '9\n4\n'],
  ['bare calls and call as an ordinary name', 'import foundation; fn call(value: i32): i32 { return value; } var call: i32 = call(4); print(call);', '4\n'],
  ['replacement trap source mapping', "import foundation; parse Statement |= 'bad' => replace { var a: i32 = 1 / 0; };\n// λ雪\nbad", '', /Division by zero/],
  ['bounded output', 'import foundation; var n: i32; var b: bool; n = 0; loop { print(123456789); n = n + 1; b = n == 7000; if b { break; } }', '123456789\n'.repeat(6553)],
];
for (const [name, source, expected, failure, canonicalProfile] of cases) test(`LLVM matches interpreter: ${name}`, async () => {
  const phase = label => {
    if (process.env.TOWER_TEST_PHASES) console.log(JSON.stringify({case:name, phase:label,
      milliseconds:performance.now(), rss:process.memoryUsage().rss}));
  };
  const executionBatches = 1000, batchSteps = 10000;
  phase('Graph compile');
  const handle = tower.compile(source);
  try {
    phase('Graph execute');
    let reference, output = '';
    for (let i = 0; i < executionBatches; ++i) {
      reference = tower.execute(handle, batchSteps); output += reference.output;
      if (reference.status !== 'executing') break;
    }
    assert.notEqual(reference.status, 'executing');
    assert.equal(reference.status, failure ? 'error' : 'done', 'Graph: '+reference.error);
    if (failure) assert.match(reference.error, failure);
    phase('Fast compile');
    const fastHandle = tower.compile(source);
    try {
      phase('Fast select');
      tower.useFast(fastHandle);
      phase('Fast execute');
      let fast, fastOutput = '';
      for (let i = 0; i < executionBatches; ++i) {
        fast = tower.execute(fastHandle, batchSteps); fastOutput += fast.output;
        if (fast.status !== 'executing') break;
      }
      assert.notEqual(fast.status, 'executing', 'Fast exceeded the Graph execution budget');
      for (const key of ['status','error','errorOffset','outputTruncated']) assert.equal(fast[key], reference[key], 'fast '+key);
      assert.equal(fastOutput, output, 'fast output');
    } finally { tower.destroyExecution(fastHandle); }
    phase('Foundation format');
    const formatted = tower.foundation(handle);
    for(const optimize of [false,true]) {
      phase(`LLVM Foundation ${optimize}`);
      const optimized=llvm.compile(formatted.source,{emit:'foundation',optimize});
      assert.equal(optimized.status,'compiled',optimized.error);
      phase(`LLVM Foundation ${optimize} guest compile`);
      const guest=tower.compile(optimized.foundation);
      try {
        phase(`LLVM Foundation ${optimize} Fast select`);
        tower.useFast(guest);
        phase(`LLVM Foundation ${optimize} Fast execute`);
        let state, text='';
        for (let i = 0; i < executionBatches; ++i) {
          state=tower.execute(guest,batchSteps);text+=state.output;
          if (state.status !== 'executing') break;
        }
        assert.notEqual(state.status, 'executing', `LLVM Foundation ${optimize} exceeded the Graph execution budget`);
        state=originalDiagnostic(state,formatted.spans,formatted.sourceMap);
        for(const key of ['status','error','errorOffset','outputTruncated'])assert.equal(state[key],reference[key],`LLVM bytecode ${optimize} ${key}`);
        assert.equal(text,output,`LLVM bytecode ${optimize} output`);
        phase(`LLVM Foundation ${optimize} package`);
        const packageBytes=tower.bytecode(guest,{optimizationProfile:optimized.optimizationProfile});
        assert.equal(new DataView(packageBytes.buffer).getUint32(24,true),canonicalProfile??(optimize?1:2));
      } finally {tower.destroyExecution(guest);}
    }
    phase('canonical roundtrip');
    const roundtrip = tower.compileFoundation(formatted.source);
    try { assert.equal(tower.foundation(roundtrip).source, formatted.source); }
    finally { tower.destroyExecution(roundtrip); }
    phase('LLVM Wasm compile');
    const compiled = llvm.compile(formatted.source);
    assert.equal(compiled.status, 'compiled', compiled.error || reference.error);
    assert.match(compiled.before, /define void @tower_main/);
    assert.match(compiled.disassembly, /func\[\d+\] <tower_main>:/);
    assert.match(compiled.disassembly, /end/);
    assert.doesNotMatch(compiled.disassembly, /\.byte/, 'every emitted Wasm instruction decodes');
    phase('LLVM Wasm execute');
    const executed = await executeWasm(compiled);
    if (failure) phase(`LLVM Wasm diagnostic: reference ${reference.errorOffset}, returned ${executed.errorOffset}`);
    const actual = originalDiagnostic(executed, formatted.spans, formatted.sourceMap);
    for (const key of ['status', 'error', 'errorOffset', 'outputTruncated']) assert.equal(actual[key], reference[key], key);
    assert.equal(actual.output, output); assert.equal(actual.output, expected);
    if (failure) assert.match(actual.error, failure); else assert.equal(actual.status, 'done');
    phase('complete');
  } finally { tower.destroyExecution(handle); }
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
  for(const width of [4,8])for(const optimize of [false,true]){
    let called=0;
    const host=await loadTower(towerBytes,undefined,grammar,undefined,undefined,{imports:{
      host_check(context,a,b,count,flag,p){
        assert.equal(a,-9);assert.equal(b,-5000000000n);
        assert.equal(count,width===8?4n:4);assert.equal(flag,1);
        assert.equal(new DataView(context.memory().buffer,context.memory().byteOffset+Number(p)).getInt32(0,true),-7);
        called++;return -42;
      }
    }});
    const result=llvm.compile(source,{emit:'foundation',optimize,target:width===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
    assert.equal(result.status,'compiled',result.error);
    assert.match(result.foundation,/extern fn host_check\(\w+: integer_type\(32, 1\), \w+: integer_type\(64, 1\), \w+: address_type\(\), \w+: boolean_type\(\), \w+: pointer_type\(Pair\)\): integer_type\(32, 1\);/);
    const handle=host.compile(result.foundation,{pointerBytes:width});
    try{
      host.useFast(handle);let state,output='';
      do{state=host.execute(handle,10000);output+=state.output;}while(state.status==='executing');
      assert.equal(state.status,'done',state.error);assert.equal(output,'-42\n');assert.equal(called,1);
    }finally{host.destroyExecution(handle);}
  }
});
