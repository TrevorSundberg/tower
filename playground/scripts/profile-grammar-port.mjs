// Usage: node playground/scripts/profile-grammar-port.mjs before.wasm report.json [after.wasm]
// Run without concurrent builds. Both versions use this checkout's same grammar.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadTower} from '../src/tower-host.mjs';
const [baseline,reportPath,current]=process.argv.slice(2);
assert(baseline&&reportPath,'Supply a baseline Wasm compiler and report path');
const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const foundation=await read('scaffolding/foundation.tower'),bedrock=await read('scaffolding/bedrock.tower');
const compilers={};
for(const [name,path] of [['before',baseline],['after',current??new URL('build/browser-wasi/tower.wasm',root)]])
 compilers[name]=await loadTower(await readFile(path),undefined,foundation,undefined,bedrock);
const fixtures={small:'var value = 42; print(value);',
 inference:await read('scaffolding/examples/inference.tower'),
 replacements:await read('scaffolding/examples/increment.tower'),
 declarations500:Array.from({length:500},(_,i)=>`var value${i} = ${i};`).join('\n')+'\nprint(value499);',
 grammar50:Array.from({length:50},(_,i)=>`parse Profile${i} = 'profile${i}';`).join('\n')+'\nprint(42);'};
const report={node:process.version,baseline,current:String(current??'build/browser-wasi/tower.wasm'),
 method:'12 warmups + 40 alternating paired samples; compile + canonical foundation formatting; milliseconds',fixtures:{}};
for(const [fixture,source] of Object.entries(fixtures)){
 const samples={before:[],after:[]};let expected;
 for(let i=0;i<52;i++)for(const name of i%2?['after','before']:['before','after']){
  const tower=compilers[name],start=performance.now(),handle=tower.compile(source);
  try{
   const result=tower.foundation(handle);assert.equal(result.error,undefined,JSON.stringify(result));
   const elapsed=performance.now()-start;
   expected??=JSON.stringify(result);assert.equal(JSON.stringify(result),expected);
   if(i>=12)samples[name].push(elapsed);
  }finally{tower.destroyExecution(handle);}
 }
 report.fixtures[fixture]={};
 for(const name of ['before','after']){
  const sorted=[...samples[name]].sort((a,b)=>a-b);
  report.fixtures[fixture][name]={p50:+sorted[20].toFixed(3),p95:+sorted[38].toFixed(3),samples:samples[name]};
 }
 console.log(fixture,JSON.stringify(Object.fromEntries(Object.entries(report.fixtures[fixture]).map(([name,{p50,p95}])=>[name,{p50,p95}]))));
}
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
