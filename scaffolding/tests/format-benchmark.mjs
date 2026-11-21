// Run from the repository root with a pre-port reactor path. Exact-output
// regression fixtures run separately from this production formatter benchmark.
// Reports observations, never enforces a timing threshold on shared machines.
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {loadTower} from '../../playground/src/tower-host.mjs';
const baseline=process.argv[2];
if(!baseline)throw new Error('Usage: node scaffolding/tests/format-benchmark.mjs baseline.wasm');
const foundation=await readFile('scaffolding/foundation.tower','utf8');
const bedrock=await readFile('scaffolding/bedrock.tower','utf8');
const engines=await Promise.all([baseline,'build/browser-wasi/tower.wasm'].map(async path=>
  loadTower(await readFile(path),undefined,foundation,undefined,bedrock)));
const fixtures=[
  ['small',Array.from({length:10},(_,i)=>'var v'+i+':i32='+i+';').join('\n')],
  ['declarations',Array.from({length:1000},(_,i)=>'var v'+i+':i32='+i+';').join('\n')],
  ['comments',Array.from({length:5000},(_,i)=>'var v'+i+':i32='+i+'; // comment\n').join('')],
  ['strings',Array.from({length:200},(_,i)=>'var s'+i+':u8*="'+('ordinary text '.repeat(100))+'";').join('\n')],
];
const results=[];
for(const [fixture,input] of fixtures){
  const handles=engines.map(engine=>{
    const handle=engine.create(input);
    // The benchmark intentionally exceeds the UI helper's 1,024-construct cap.
    for(let i=0;i<10000;i++){
      const event=engine.step(handle);
      assert.notEqual(event.status,'error',event.error);
      if(event.status==='done')return handle;
    }
    throw new Error('Benchmark parse budget exhausted');
  });
  const compiled=engines.map(engine=>engine.compile(input));
  try {
    // The 5,000-root fixture exceeds the foundation compiler's module limit;
    // benchmark its source path only, never time an empty failed compilation.
    for(const method of fixture==='comments'?['format']:['format','foundation']){
      const ids=method==='format'?handles:compiled;
      const output=engines.map((engine,i)=>engine[method](ids[i]));
      assert.equal(output[0].error,undefined);
      assert.equal(output[1].error,undefined);
      assert.ok(output[0].source);
      assert.ok(output[1].source);
      assert.equal(output[0].source,output[1].source);
      assert.deepEqual(output[0].spans,output[1].spans);
      const samples=[[],[]];
      for(let iteration=0;iteration<50;iteration++){
        for(const i of iteration%2?[1,0]:[0,1]){
          const start=performance.now();engines[i][method](ids[i]);
          const duration=performance.now()-start;
          if(iteration>=10)samples[i].push(duration);
        }
      }
      const statistics=samples.map(values=>{
        values.sort((a,b)=>a-b);
        return {p50:values[20],p95:values[38]};
      });
      results.push({fixture,method,reference:statistics[0],tower:statistics[1],
        ratio:statistics[1].p50/statistics[0].p50});
    }
  } finally {
    engines.forEach((engine,i)=>{engine.destroy(handles[i]);engine.destroyExecution(compiled[i]);});
  }
}
console.log(JSON.stringify({node:process.version,warmups:10,samples:40,results},null,2));
