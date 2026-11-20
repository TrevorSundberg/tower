import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {Worker} from 'node:worker_threads';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {loadLLVM} from '../src/llvm-host.mjs';
import {loadTower} from '../src/tower-host.mjs';
import {loadTower as loadFixtureTower} from '../tests/compiler-fixtures.mjs';
import {buildCompiler} from '../src/compiler-build.mjs';

// Host/measurement adapter. Workload generation and compiler implementation are
// Tower. Both compared compilers use the same builder and native support files.
const root=new URL('../../',import.meta.url),read=path=>readFile(new URL(path,root));
const reference=process.argv[2];
if(!reference || reference.startsWith('--'))throw new Error('Pass a pre-view compiler revision, e.g. 8f49aa3');
const git=(...args)=>execFileSync('git',args,{cwd:fileURLToPath(root),encoding:'utf8'});
const baselineRevision=git('rev-parse',reference+'^{commit}').trim();
const recipe=JSON.parse(await read('build/compiler-project/project.json'));
const files=recipe.files,originals=structuredClone(files);
for(const entry of ['library/entities.tower','compiler/semantic_layout.tower','backend/import_instructions.tower']) {
 const file=originals.find(file=>file.path===entry);assert.ok(file,entry);
 file.text=git('show',baselineRevision+':scaffolding/'+entry);
}
assert.ok(!originals.find(file=>file.path==='library/entities.tower').text.includes('fn entity_view_open('),'Baseline already has world views');
const baselineRecipe=structuredClone(recipe);
const added=new Set(['entity_view_open','entity_view_close','entity_view_query']);
for(const reactor of Object.values(baselineRecipe.reactors)) {
 reactor.exports=reactor.exports.filter(name=>!added.has(name));
 reactor.arguments=reactor.arguments.filter(argument=>!added.has(argument.replace(/^--export(?:-if-defined)?=/,'')));
}
const grammar=Object.fromEntries(['bedrock','foundation','tower'].map(name=>[name,files.find(file=>file.path===name+'.tower').text]));
const instantiate=module=>loadLLVM(module,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
const builderBytes=await read('build/browser-wasi-llvm/tower-llvm.wasm');
const builderHash=createHash('sha256').update(builderBytes).digest('hex');
const builder=await instantiate(builderBytes);
const candidates={};
for(const [name,inputs,plan] of [['baseline',originals,baselineRecipe],['current',files,recipe]]) {
 const directory=new URL('build/language-next/world-'+name+'/',root);
 await mkdir(directory,{recursive:true});
 const options={compiler:builder,recipe:plan,files:inputs,workers:2,
  createWorker:()=>new Worker(new URL('./compiler-unit-node.mjs',import.meta.url)),
  support:async name=>gunzipSync(await read('build/compiler-project/'+name)),progress:phase=>console.log(name,phase)};
 candidates[name]=await buildCompiler({...options,onObject:(unit,bytes)=>writeFile(new URL(unit.object,directory),bytes)});
}

const generator=await loadFixtureTower(await read('build/browser-wasi/tower.wasm'),undefined,grammar.foundation);
generator.configureModules({entry:'.tower/tests/layout_depth_source.tower'});
const handle=generator.compile((await read('scaffolding/tests/layout_depth_source.tower')).toString());
let layout='';
try {
 let result;
 do{result=generator.execute(handle,100000);layout+=result.output;}while(result.status==='executing');
 assert.equal(result.status,'done',result.error);assert.ok(layout.includes('struct Level1024'));
}finally{generator.destroyExecution(handle);}

const report={baselineRevision,builderHash,node:process.version,cpu:os.cpus()[0].model,headers:{},hashes:{},cases:{}};
const compilers={};
for(const [name,inputs] of [['baseline',originals],['current',files]]) {
 report.hashes[name]=candidates[name].hashes;
 compilers[name]=await instantiate(candidates[name].modules.llvm);
 const host=await loadTower(candidates[name].modules.tower,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
 host.configureModules({entry:'headers.tower',files:inputs,builtins:grammar,library:'.'});
 report.headers[name]={};
 for(const pointerBytes of [4,8]) {
  const query=host.compile('import library.entities; print(sizeof(Entity)); print(sizeof(EntityStore));',{pointerBytes});
  try{const result=host.execute(query,10000);assert.equal(result.status,'done',result.error);report.headers[name][pointerBytes]=result.output;}
  finally{host.destroyExecution(query);}
 }
}
for(const [entry,source,library] of [['layout.tower',layout,false],['units/compiler_host.tower',files.find(file=>file.path==='units/compiler_host.tower').text,true]]) {
 const samples={baseline:[],current:[]};let reference;
 for(let i=0;i<12;i++)for(const name of i%2?['current','baseline']:['baseline','current']) {
  const compiler=compilers[name];compiler.configureModules({entry,files,builtins:grammar,library:'.'});
  const start=performance.now(),result=compiler.compile(source,{library,emit:'object'}),ms=performance.now()-start;
  assert.equal(result.status,'compiled',result.error);
  if(reference)assert.deepEqual(result.object,reference);else reference=result.object;
  if(i>=2)samples[name].push(ms);
 }
 const median=values=>{const sorted=[...values].sort((a,b)=>a-b);return (sorted[4]+sorted[5])/2;};
 report.cases[entry]={samples,median:Object.fromEntries(Object.entries(samples).map(([name,values])=>[name,median(values)]))};
 console.log(entry,JSON.stringify(report.cases[entry]));
}
await writeFile(new URL('build/language-next/world-benchmark.json',root),JSON.stringify(report,null,2));
