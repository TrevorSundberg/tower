import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generatedSource} from './compiler-fixtures.mjs';
import {fixtureSource, openTower, runSelectedTest} from './compiler_test_host.mjs';
import {compareResults} from '../src/comparison.mjs';
const read = path => readFile(new URL('../../'+path,import.meta.url));
const tower = await openTower();

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
    let output='',result,turns=0;
    do {result=tower.execute(handle,budget);output+=result.output;assert.ok(++turns<100000,'execution must terminate');} while(result.status==='executing');
    return {...result,output,cache:fast?tower.fastStats(handle):null};
  } finally {tower.destroyExecution(handle);}
}
function agree(source,width=4,budget=7,status='done'){
  const graph=run(source,false,width,budget), fast=run(source,true,width,budget);
  assert.equal(graph.status,status,JSON.stringify({source,graph}));
  assert.equal(fast.status,status,JSON.stringify({source,fast}));
  assert.deepEqual(compareResults(graph,fast),[],JSON.stringify({source,graph,fast}));
  return fast;
}
for(const name of ['execution','functions','increment','inference','templates','structs','memory']) test('fast and graph: '+name,async()=>{
  const source=(await read('scaffolding/examples/'+name+'.tower')).toString();
  for(const width of [4,8])for(const budget of [1,7,100000])agree(source,width,budget);
});
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

test('foundation CFG labels, forward edges and parallel-copy loops round trip',()=>{
  const source=`import foundation;fn exchange(n: u32): u32 {
    var a: u32 = 1; var b: u32 = 2; var temporary: u32;
    label(head);
    var done = n == 0;
    if done { jump(exit); }
    temporary = a; a = b; b = temporary; n = n - 1;
    jump(head);
    label(exit);
    return a;
  }
  print(exchange(9)); print(exchange(10));`;
  for(const width of [4,8]) for(const budget of [1,7,100000]) {
    assert.equal(agree(source,width,budget).output,'2\n1\n');
    const h=tower.compile(source,{pointerBytes:width});
    try { const text=tower.foundation(h);assert.ok(!text.error);assert.equal(agree(text.source,width,budget).output,'2\n1\n'); }
    finally {tower.destroyExecution(h);}
  }
});

test('CFG validation and explicit traps use the shared semantic path',()=>{
  for(const [source,pattern] of [
    ['fn f(): void { label(a); jump(a); label(a); }',/Duplicate/],
    ['fn f(): void { jump(missing); }',/Unknown function label/],
    ['fn f(): void { if true { label(a); } }',/direct statements/],
    ['fn f(): void { label(a); print(1); label(b); }',/must end/],
    ['fn f(): i32 { label(a); }',/return/],
    ['fn f(): void { label(42); }',/identifier/],
  ]) {const input='import foundation;'+source;assert.match(run(input,false).error,pattern);agree(input,4,7,'error');}
  for(const width of [4,8]) {
    const result=agree('import foundation;trap("explicit failure", 17);',width,1,'error');
    assert.equal(result.error,'explicit failure');assert.equal(result.errorOffset,17);
  }
});
