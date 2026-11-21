import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {loadTower,loadLLVM} from '../compiler-fixtures.mjs';
import {runBrightScript} from './harness.mjs';
const root=new URL('../../../',import.meta.url);
const bytes=path=>readFile(new URL(path,root));
const text=async path=>(await bytes(path)).toString();
const foundation=await text('scaffolding/foundation.tower');
const tower=await loadTower(await bytes('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await bytes('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);

function compile(source,optimize) {
  const h=tower.compile(source,{pointerBytes:4});
  try {
    const checked=tower.execute(h,0);
    assert.notEqual(checked.status,'error',checked.error);
    const canonical=tower.foundation(h).source;
    if(optimize===undefined) return tower.rokuSource(h);
    const result=llvm.compile(canonical,{emit:'foundation',target:'wasm32-unknown-unknown',optimize});
    assert.equal(result.status,'compiled',result.error);
    const optimized=tower.compile(result.foundation,{pointerBytes:4});
    try { return tower.rokuSource(optimized); } finally { tower.destroyExecution(optimized); }
  } finally { tower.destroyExecution(h); }
}
function reference(source) {
  const h=tower.compile(source,{pointerBytes:4});
  try { const result=tower.execute(h,2000000); assert.equal(result.status,'done',result.error); return result.output; }
  finally { tower.destroyExecution(h); }
}

for(const optimize of [false,true]) test(`optimized foundation to Roku (${optimize?'O2':'O0'}) executes shared semantics`,{timeout:180000},async()=>{
  for(const file of ['tests/backend_semantics.tower','tests/narrow_integers.tower','tests/narrow_output.tower','examples/functions.tower','examples/structs.tower','examples/memory.tower','examples/collections.tower','examples/match.tower']) {
    const source=await text('scaffolding/'+file);
    const emitted=compile(source,optimize);
    const expected=reference(source);
    assert.equal(await runBrightScript(emitted),expected,`${file} O${optimize?2:0}`);
  }
});

test('Roku source uses selected layout, preserves comments, is deterministic and rejects foreign ABIs',async()=>{
  const source='// roku comment\nvar p:u8* = null; print(p); print(sizeof(usize)); print(alignof(u64)); print(true);';
  const h=tower.compile(source,{pointerBytes:4});
  const before=tower.exports.tw_live_nodes();
  try {
    const emitted=tower.rokuSource(h);
    assert.equal(tower.rokuSource(h),emitted);
    assert.match(emitted,/roku comment/);
    assert.doesNotMatch(tower.rokuSource(h,{comments:false}),/roku comment/);
    assert.equal(await runBrightScript(emitted),reference(source));
    assert.equal(tower.exports.tw_live_nodes(),before);
  } finally { tower.destroyExecution(h); }
  const wide=tower.compile('print(sizeof(usize));',{pointerBytes:8});
  try { assert.throws(()=>tower.rokuSource(wide),/32-bit/); } finally { tower.destroyExecution(wide); }
  assert.throws(()=>compile('extern fn missing():void; missing();'),/foreign function/);
  assert.throws(()=>compile('extern fn platform_write():void; platform_write();'),/platform_write requires/);
});

test('recursion, simultaneous phi copies, many arguments, unsigned arithmetic and text output',async()=>{
  const params=Array.from({length:40},(_,i)=>`a${i}:i32`).join(',');
  const args=Array.from({length:40},(_,i)=>String(i)).join(',');
  const source=`import tower;
    import library.platform;
    fn many(${params}):i32 { return a39; }
    fn recur(n:i32):i32 { if n == 0 { return 1; } var next=n-1; var sub=recur(next); var result=n*sub; return result; }
    print(many(${args})); print(recur(7));
    var a:u64=9223372036854775809; var b:u64=18446744073709551615;
    var i:i32=0;
    loop { var stop=i==9; if stop {break;} var temp=a; a=b; b=temp; i=i+1; }
    print(a); print(b); var mixed=a^b; print(mixed);
    var message="Roku ✓\\n"; var wrote=platform_write(1,message,9); print(wrote);
  `.replace('if n == 0','var zero=n==0; if zero');
  for(const optimize of [false,true]) assert.equal(await runBrightScript(compile(source,optimize)),reference(source));
});

test('runtime traps unwind instead of continuing with a fabricated result',async()=>{
  for(const source of [
    'var a:i32=1; var b:i32=0; var c=a/b; print(c);',
    'var a:i64=-9223372036854775808; var b:i64=-1; var c=a/b; print(c);',
    'var a:u64=18446744073709551615; var b=convert(i64,a); print(b);',
  ]) for(const optimize of [false,true]) {
    const main='sub Main()\ntry\nTowerRun()\ncatch e\nprint "caught"\nreturn\nend try\nthrow "Expected trap"\nend sub\n';
    assert.equal(await runBrightScript(compile(source,optimize),main),'caught\n');
  }
});

test('LLVM scalar idioms retain high-bit semantics after reconstruction',{timeout:180000},async()=>{
  const cases=JSON.parse(await text('scaffolding/tests/llvm-scalar-idioms.json'));
  for(const [name,source,expected] of cases)
    assert.equal(await runBrightScript(compile(source,true)),expected,name);
  // Retain zero, partial patterns, sign bits and full-width masks while keeping
  // the simulator run bounded; the complete fixture runs in the main LLVM suite.
  const population=(await text('scaffolding/tests/backend_popcount.tower')).replace('while i < 256','while i < 8');
  assert.equal(await runBrightScript(compile(population,true)),'0\n');
});

test('build a sideloadable conformance package for later device validation',async()=>{
  const source=await text('scaffolding/tests/backend_semantics.tower');
  const emitted=compile(source,true);
  const directory=new URL('build/roku-device/source/',root);
  await mkdir(directory,{recursive:true});
  await writeFile(new URL('program.brs',directory),emitted);
  await writeFile(new URL('Main.brs',directory),'sub Main()\nprint "TOWER_ROKU_BEGIN"\nTowerRun()\nprint "TOWER_ROKU_END"\nend sub\n');
  await writeFile(new URL('../manifest',directory),'title=Tower Roku conformance\nmajor_version=1\nminor_version=0\nbuild_version=0\n');
  await writeFile(new URL('../expected.txt',directory),'TOWER_ROKU_BEGIN\n'+reference(source)+'TOWER_ROKU_END\n');
});
