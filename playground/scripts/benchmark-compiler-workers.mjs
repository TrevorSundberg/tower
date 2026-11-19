import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {loadLLVM} from '../src/llvm-host.mjs';
import {compileUnits} from '../src/compiler-build.mjs';

const root = new URL('../../',import.meta.url);
const read = path => readFile(new URL(path,root));
const recipe = JSON.parse(await read('build/compiler-project/project.json'));
const files = recipe.files;
const grammar = Object.fromEntries(['bedrock','foundation','tower'].map(name => [name,files.find(file => file.path===name+'.tower').text]));
const compiler = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
const report = {cpu:os.cpus()[0].model,cpus:os.availableParallelism(),node:process.version,units:recipe.units.length,runs:[]};
let reference;
for (const workers of [0,1,2,4,8]) {
  let memory = process.memoryUsage().rss;
  const sample = setInterval(() => { memory = Math.max(memory,process.memoryUsage().rss); },50);
  const started = performance.now();
  try {
    const result = await compileUnits({compiler,recipe,files,workers:workers || 1,
      createWorker:workers ? () => new Worker(new URL('./compiler-unit-node.mjs',import.meta.url)) : undefined});
    const ms = performance.now()-started;
    const hashes = Object.fromEntries(Object.entries(result.inputs).map(([name,bytes]) => [name,createHash('sha256').update(bytes).digest('hex')]));
    if (reference) assert.deepEqual(hashes,reference,'Compiler object bytes depend on worker count');
    else reference = hashes;
    const events = result.stats.timings.flatMap(t => [[t.start,1],[t.end,-1]]).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
    let active = 0, overlap = 0;
    for (const [,delta] of events) { active += delta; overlap = Math.max(overlap,active); }
    if (workers > 1) assert.ok(overlap > 1,'No real compilation interval overlap');
    const run = {workers,ms,peakRSS:memory,overlap,stats:result.stats,hashes};
    report.runs.push(run);
    console.log(JSON.stringify({workers,ms,peakRSS:memory,overlap,units:recipe.units.length}));
  } finally { clearInterval(sample); }
  await mkdir(new URL('build/compiler-parallel/',root),{recursive:true});
  await writeFile(new URL('build/compiler-parallel/benchmark.json',root),JSON.stringify(report,null,2));
}
