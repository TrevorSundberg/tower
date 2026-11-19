import {readFile, writeFile} from 'node:fs/promises';
import {loadTower, loadLLVM, executeWasm} from '../tests/compiler-fixtures.mjs';
import assert from 'node:assert/strict';
import os from 'node:os';

const root = new URL('../../', import.meta.url);
const foundation = await readFile(new URL('scaffolding/foundation.tower', root), 'utf8');
import {workloads} from './interpreter-workloads.mjs';

const median = xs => xs.toSorted((a,b)=>a-b)[Math.floor(xs.length/2)];
const wasmPath = process.env.TOWER_BENCH_REACTOR ?? 'build/browser-wasi/tower.wasm';
const tower = await loadTower(await readFile(new URL(wasmPath, root)), undefined, foundation);
const modes = tower.exports.tw_exec_fast ? ['graph','fast'] : ['graph'];
const baseline = process.env.TOWER_BENCH_BASELINE ? await loadTower(await readFile(new URL(process.env.TOWER_BENCH_BASELINE,root)),undefined,foundation) : null;
if(baseline)modes.unshift('baseline');
let compiler;
if (process.env.TOWER_BENCH_WASM !== '0') compiler = await loadLLVM(await readFile(new URL('build/browser-wasi-llvm/tower-llvm.wasm',root)),undefined,foundation);
if(compiler)modes.push('llvm-fast','llvm-debug-fast');
const report = {environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model},reactor:wasmPath,warmups:3,samples:15,workloads:{}};
for (const [name,source] of Object.entries(workloads)) {
  const rows = Object.fromEntries(modes.map(mode=>[mode,{setup:[],execute:[]} ]));
  const imported={};
  if(compiler)for(const mode of ['llvm-fast','llvm-debug-fast']){
    const at=performance.now();
    const result=compiler.compile(source,{emit:'foundation',optimize:mode==='llvm-fast'});
    assert.equal(result.status,'compiled',result.error);
    imported[mode]=result.foundation;rows[mode].optimizationMs=performance.now()-at;
    rows[mode].foundationBytes=new TextEncoder().encode(result.foundation).length;
  }
  let expected;
  for (let sample=-3;sample<15;sample++) for (const mode of sample%2 ? modes.toReversed() : modes) {
    const machine = mode === 'baseline' ? baseline : tower;
    const start=performance.now(), handle=machine.compile(imported[mode]??source);
    if(mode.includes('fast')) machine.useFast(handle);
    const prepared=performance.now(); let output='',result;
    do {result=machine.execute(handle,100000);output+=result.output;} while(result.status==='executing');
    const end=performance.now();
    assert.equal(result.status,'done',result.error);
    expected??=output; assert.equal(output,expected);
    if(sample>=0){rows[mode].setup.push(prepared-start);rows[mode].execute.push(end-prepared);}
    if(mode.includes('fast')) rows[mode].cache = tower.fastStats(handle);
    machine.destroyExecution(handle);
  }
  if(compiler){
    const start=performance.now(), compiled=compiler.compile(source), setup=performance.now()-start;
    assert.equal(compiled.status,'compiled',compiled.error);
    const samples=[];
    for(let i=-3;i<15;i++) {const start=performance.now();const result=await executeWasm(compiled);const ms=performance.now()-start;assert.equal(result.output,expected);if(i>=0)samples.push(ms);}
    rows.wasm={setup:[setup],execute:samples};
  }
  for(const row of Object.values(rows)){row.setupMedianMs=median(row.setup);row.executeMedianMs=median(row.execute);}
  report.workloads[name]=rows;
  console.error(name, Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.executeMedianMs])));
}
const json=JSON.stringify(report,null,2)+'\n';
if(process.argv[2])await writeFile(process.argv[2],json);else console.log(json);
