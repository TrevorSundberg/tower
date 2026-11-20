import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {loadLLVM} from '../src/llvm-host.mjs';
import {loadTower} from '../tests/compiler-fixtures.mjs';

// Measurement/transport only. Workload generation and both compilers are Tower.
// Supply a saved before-change reactor built with the same bootstrap/toolchain.
if(!process.argv[2])throw new Error('Pass the saved baseline tower-llvm.wasm path');
const root=new URL('../../',import.meta.url),read=path=>readFile(new URL(path,root));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const recipeBytes=await read('build/compiler-project/project.json');
const {files}=JSON.parse(recipeBytes);
const grammar=Object.fromEntries(['bedrock','foundation','tower'].map(name=>[name,files.find(file=>file.path===name+'.tower').text]));
const bytes={baseline:await readFile(process.argv[2]),current:await read('build/browser-wasi-llvm/tower-llvm.wasm')};
const compilers={};
for(const [name,module] of Object.entries(bytes))
 compilers[name]=await loadLLVM(module,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});

const generator=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,grammar.foundation);
generator.configureModules({entry:'.tower/tests/layout_depth_source.tower'});
const handle=generator.compile((await read('scaffolding/tests/layout_depth_source.tower')).toString());
let layout='';
try {
 let result;
 do{result=generator.execute(handle,100000);layout+=result.output;}while(result.status==='executing');
 assert.equal(result.status,'done',result.error);assert.ok(layout.includes('struct Level1024'));
}finally{generator.destroyExecution(handle);}

const warmups=6,pairs=16;
const report={node:process.version,cpu:os.cpus()[0].model,baselinePath:process.argv[2],warmups,pairs,
 hashes:Object.fromEntries(Object.entries(bytes).map(([name,module])=>[name,hash(module)])),
 recipeHash:hash(recipeBytes),cases:{}};
const cases=[['examples/templates.tower',(await read('scaffolding/examples/templates.tower')).toString(),false],
 ['layout.tower',layout,false],
 ['units/compiler_host.tower',files.find(file=>file.path==='units/compiler_host.tower').text,true]];
for(const [entry,source,library] of cases){
 const samples={baseline:[],current:[]};let expected;
 for(let i=0;i<warmups+pairs;i++)for(const name of i%2?['current','baseline']:['baseline','current']){
  const compiler=compilers[name];compiler.configureModules({entry,files,builtins:grammar,library:'.'});
  const start=performance.now(),result=compiler.compile(source,{library,emit:'object'}),ms=performance.now()-start;
  assert.equal(result.status,'compiled',result.error);
  if(expected)assert.deepEqual(result.object,expected);else expected=result.object;
  if(i>=warmups)samples[name].push(ms);
 }
 const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=sorted.length/2;return (sorted[middle-1]+sorted[middle])/2;};
 report.cases[entry]={samples,median:Object.fromEntries(Object.entries(samples).map(([name,values])=>[name,median(values)]))};
 console.log(entry,JSON.stringify(report.cases[entry]));
}
await writeFile(new URL('build/language-next/ownership-benchmark.json',root),JSON.stringify(report,null,2));
