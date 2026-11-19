import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {compareResults} from '../src/comparison.mjs';
const read = path => readFile(new URL('../../'+path,import.meta.url));
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,(await read('scaffolding/foundation.tower')).toString());

function run(source,fast,width=4,budget=100000) {
  const handle=tower.compile(source,{pointerBytes:width});
  try {
    if(fast)tower.useFast(handle);
    assert.equal(tower.execute(handle,0).steps,0);
    let output='',result,turns=0;
    do {result=tower.execute(handle,budget);output+=result.output;assert.ok(++turns<100000,'execution must terminate');} while(result.status==='executing');
    return {...result,output,cache:fast?tower.fastStats(handle):null};
  } finally {tower.destroyExecution(handle);}
}
function agree(source,width=4,budget=7){
  const graph=run(source,false,width,budget), fast=run(source,true,width,budget);
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
      agree(`var a: ${type} = ${a}; var b: ${type} = ${b}; var c = a ${op} b; print(c);`);
  for(const source of ['var a = 1 / 0;','var a = -2147483648 / -1;','var a: i64 = -9223372036854775808; var b = a % -1;',
    'var a: i32 = -1; print(convert(u32,a));','var a: u64 = 18446744073709551615; print(convert(i64,a));',
    'var a: i64 = -9223372036854775808; print(convert(i64,a)); print(convert(bool,a));',
    'var p = bits(u8*, convert(usize, 268435456)); print(*p);',
    'fn recurse(): void { recurse(); } recurse();'])for(const width of [4,8])agree(source,width,1);
});
test('effects, aliasing, negative indices, copies, strings and empty modules',()=>{
  for(const source of ['', 'fn never(): void {}',
    'fn change(pp: i32**, q: i32*): i32 { *pp = q; return 42; } var a = 1; var b = 2; var p = &a; *p = change(&p, &b); print(a); print(b);',
    'var a: i32[4]; a[0] = 11; a[1] = 22; var p = &a[1]; print(p[-1]); p = p - 1; print(*p);',
    'var p = alloc(u8, 6); fill(p, 1, 6); p[0] = 7; p[1] = 8; var q = p + 1; copy(q,p,5); print(p[2]); p = realloc(u8,p,100); print(p[2]); free(p);',
    'var p = "A\\n雪"; print(p[0]); print(p[2]); print(p[5]);',
    'var i = 0; var total = 0; loop { i = i + 1; var end = i == 9; if end { break; } var skip = i == 3; if skip { continue; } var j = 0; loop { j = j + 1; var end = j == 3; if end { break; } total = total + i; } } print(total);'])
    for(const width of [4,8])agree(source,width,1);
});
test('wide operands do not impose byte-sized program limits',()=>{
  const declarations=Array.from({length:350},(_,i)=>`var value${i} = ${i};`).join('\n');
  const result=agree(declarations+'\nprint(value349);',8);
  assert.equal(result.output,'349\n');assert.ok(result.cache.wideInstructions>0);
  const functions=Array.from({length:300},(_,i)=>`fn f${i}(): i32 { return ${i}; }`).join('\n');
  const calls=Array.from({length:300},(_,i)=>`f${i}();`).join('\n');
  assert.equal(agree(functions+'\n'+calls+'\nprint(f299());').output,'299\n');
  const parameters=Array.from({length:64},(_,i)=>`a${i}: i32`).join(',');
  const arguments64=Array.from({length:64},(_,i)=>i).join(',');
  const nested=Array.from({length:64},()=>`f(${arguments64})`).join(',');
  const wideRegisters=agree(`fn f(${parameters}): i32 { return a63; } print(f(${nested}));`,4,100000);
  assert.equal(wideRegisters.output,'63\n');
  assert.ok(wideRegisters.cache.registerCapacityBytes>256*8);
});
test('cancellation slices, cache lifetime, invalid programs and output limits',()=>{
  const nodes=tower.exports.tw_live_nodes(), allocations=tower.exports.tw_live_allocations();
  for(let i=0;i<30;i++){
    const handle=tower.compile('loop { print(1234567890); }');
    tower.useFast(handle);
    assert.equal(tower.execute(handle,0).steps,0);
    const result=tower.execute(handle,100000);
    assert.equal(result.status,'executing');assert.equal(result.steps,100000);assert.equal(result.outputTruncated,true);
    assert.throws(()=>tower.useFast(handle),/before executing/);
    tower.destroyExecution(handle);
  }
  assert.equal(tower.exports.tw_live_nodes(),nodes);
  assert.equal(tower.exports.tw_live_allocations(),allocations);
  agree('print(99); var a: Unknown;');
});
