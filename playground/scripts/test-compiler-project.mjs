import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {Worker} from 'node:worker_threads';
import {loadLLVM} from '../src/llvm-host.mjs';
import {loadTower} from '../src/tower-host.mjs';
import {buildCompiler} from '../src/compiler-build.mjs';
const root = new URL('../../',import.meta.url);
const read = name => readFile(new URL(name,root));
// Select frozen input/output locations without changing the recipe's link policy.
const project = new URL(process.env.TOWER_TEST_COMPILER_PROJECT || 'build/compiler-project/',root);
const workbench = new URL(process.env.TOWER_TEST_COMPILER_WORKBENCH || 'build/compiler-workbench/',root);
const recipe = JSON.parse(await readFile(new URL('project.json',project)));
const grammar = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name => [name,(await read('scaffolding/'+name+'.tower')).toString()])));
let compiler = await loadLLVM(await read(process.env.TOWER_TEST_LLVM_WASM || 'build/browser-wasi-llvm/tower-llvm.wasm'),undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
const files = structuredClone(recipe.files);
const values = files.find(file => file.path === 'compiler/semantic_values.tower');
assert.ok(values.text.includes('null requires a pointer type'));
values.text = values.text.replace('null requires a pointer type','Compiler project generation says: null requires a pointer type');
let previous;
for (let generation = 1; generation <= 2; ++generation) {
  const started = performance.now();
  const objects = new URL('objects-'+generation+'/',workbench);
  await mkdir(objects,{recursive:true});
  const result = await buildCompiler({compiler,recipe,files,
    workers:generation === 1 ? 2 : 4,
    createWorker:() => new Worker(new URL('./compiler-unit-node.mjs',import.meta.url)),
    onObject:(unit,bytes) => writeFile(new URL(unit.object,objects),bytes),
    support:async name => gunzipSync(await readFile(new URL(name,project))),
    progress:phase => console.log(generation,Math.round(performance.now()-started)+'ms',phase)});
  const candidate = await loadTower(result.modules.tower,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
  const handle = candidate.compile('var value: i32 = null;');
  try { assert.match(candidate.execute(handle,0).error,/Compiler project generation says/); }
  finally { candidate.destroyExecution(handle); }
  compiler = await loadLLVM(result.modules.llvm,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
  console.log('Generation',generation,'passed',result.sizes);
  if (previous) assert.deepEqual(result.hashes,previous,'Successive reactor generations must have identical bytes');
  previous = result.hashes;
  await writeFile(new URL('generation'+generation+'.json',workbench),JSON.stringify({sizes:result.sizes,hashes:result.hashes,ms:performance.now()-started}));
}
console.log('Two successive browser compiler generations passed, including edited semantic behavior.');
