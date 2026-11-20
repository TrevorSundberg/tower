// Usage: node playground/scripts/benchmark-semantics.mjs before.wasm after.wasm
// Cold module startup is excluded. Alternate versions; warm up each ten times.
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {loadTower} from '../src/tower-host.mjs';
import assert from 'node:assert/strict';
const read=name=>readFile(new URL('../../'+name,import.meta.url),'utf8');
const foundation=await read('scaffolding/foundation.tower'),bedrock=await read('scaffolding/bedrock.tower');
const paths=process.argv.slice(2);assert.equal(paths.length,2,'Supply before and after Wasm compiler paths');
const compilers=[];
const towerSource=await read('scaffolding/tower.tower');
const files=[{path:'.tower/library/vector.tower',text:await read('scaffolding/library/vector.tower')}];
for(const path of paths)compilers.push(await loadTower(await readFile(path),undefined,foundation,undefined,bedrock,{tower:towerSource}));
for(const compiler of compilers)compiler.configureModules({files});
const cases={structs:await read('scaffolding/examples/structs.tower'),semantics:await read('scaffolding/tests/semantics.tower'),
 vector:'import library.vector;\nvar v: vector(i32); vector_init(i32, &v); vector_push(i32, &v, 42); print(v.data[0]); vector_dispose(i32, &v);'};
const report={node:process.version,paths,warmups:10,samples:31,cases:{}};
for(const [name,source] of Object.entries(cases))for(const pointerBytes of [4,8]){
 const samples=[[],[]];let expected;
 for(let i=0;i<41;i++)for(let stage=0;stage<2;stage++){
  const tower=compilers[stage],start=performance.now(),h=tower.compile(source,{pointerBytes}),ms=performance.now()-start;
  try{
   const r=tower.execute(h,100000);assert.equal(r.status,'done',r.error);
   if(expected===undefined)expected=r.output;else assert.equal(r.output,expected);
  }finally{tower.destroyExecution(h);}
  if(i>=10)samples[stage].push(ms);
 }
 const medians=samples.map(s=>s.slice().sort((a,b)=>a-b)[15]);
 report.cases[`${name}-${pointerBytes}`]={beforeMs:medians[0],afterMs:medians[1],ratio:medians[1]/medians[0],samples};
}
console.log(JSON.stringify(report,null,2));
