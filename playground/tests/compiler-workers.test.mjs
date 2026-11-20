import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import {loadLLVM} from '../src/llvm-host.mjs';
import {compileUnits} from '../src/compiler-build.mjs';

// Worker/message integration only. Functional language and access assertions
// live in the same Tower fixtures used by the interpreter/backend suite.
const root = new URL('../../',import.meta.url);
const read = path => readFile(new URL(path,root));
const project = JSON.parse(await read('build/compiler-project/project.json'));
const files = [...project.files];
const names = ['batch-a','batch-b','batch-c','batch-d'];
const kernel = (await read('scaffolding/tests/parallel-unit.tower')).toString();
for (const name of names) files.push({path:'tests/'+name+'.tower',text:kernel});
const recipe = {units:names.map(name => ({entry:'tests/'+name+'.tower',object:name+'.o'}))};
const grammar = Object.fromEntries(['bedrock','foundation','tower'].map(name => [name,files.find(file => file.path===name+'.tower').text]));
const compiler = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
const createWorker = () => new Worker(new URL('../scripts/compiler-unit-node.mjs',import.meta.url));

test('real compiler workers preserve Tower fixture objects and publication order',async () => {
  const serial = await compileUnits({compiler,recipe,files});
  for (const workers of [2,4]) {
    const published = [];
    const parallel = await compileUnits({compiler,recipe,files,workers,createWorker,onObject:unit => published.push(unit.object)});
    assert.deepEqual(parallel.inputs,serial.inputs);
    assert.deepEqual(published,recipe.units.map(unit => unit.object));
    assert.equal(parallel.stats.peak,workers);
    const times = parallel.stats.timings;
    assert.ok(times.some((a,i) => times.some((b,j) => i!==j && a.start<b.end && b.start<a.end)));
  }
});

test('compiler cancellation terminates children and cannot publish partial artifacts',async () => {
  const controller = new AbortController(), exits = [], published = [];
  let dispatched = false;
  await assert.rejects(compileUnits({compiler,recipe,files,workers:2,signal:controller.signal,
    createWorker:() => {
      const worker = createWorker();
      exits.push(new Promise(resolve => worker.once('exit',resolve)));
      return worker;
    },
    progress:() => { if (!dispatched) { dispatched = true; setTimeout(() => controller.abort(),1); } },
    onObject:unit => published.push(unit.object)}),/cancelled|stopped/i);
  await Promise.all(exits);
  assert.equal(exits.length,2);
  assert.deepEqual(published,[]);
  // A fresh build is independent of the cancelled revision.
  const recovered = await compileUnits({compiler,recipe:{units:recipe.units.slice(0,1)},files,workers:1,createWorker});
  assert.ok(recovered.inputs[recipe.units[0].object].length);
});

test('parallel diagnostics select source order and publish no failed build objects',async () => {
  const broken = structuredClone(files), published = [];
  broken.find(file => file.path===recipe.units[0].entry).text = (await read('scaffolding/tests/semantic-invalid/enum-number.tower')).toString();
  broken.find(file => file.path===recipe.units[1].entry).text = (await read('scaffolding/tests/semantic-invalid/enum-mix.tower')).toString();
  let serial;
  try { await compileUnits({compiler,recipe,files:broken}); }
  catch (error) { serial = error.message; }
  assert.ok(serial);
  const admitted = [];
  await assert.rejects(compileUnits({compiler,recipe,files:broken,workers:2,createWorker,
    progress:phase => admitted.push(phase),onObject:unit => published.push(unit.object)}),error => error.message===serial);
  assert.equal(admitted.length,2,'Failure must prevent admission of later units');
  assert.deepEqual(published,[]);
});

test('an earlier Tower failure cancels a worker whose later receipt never arrives',async () => {
  const broken = structuredClone(files), exits = [];
  broken.find(file => file.path===recipe.units[0].entry).text = (await read('scaffolding/tests/semantic-invalid/enum-number.tower')).toString();
  let expected;
  try { await compileUnits({compiler,recipe,files:broken}); } catch (error) { expected = error.message; }
  assert.ok(expected);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),5000);
  try {
    await assert.rejects(compileUnits({compiler,recipe,files:broken,workers:2,signal:controller.signal,
      createWorker:() => {
        const worker = createWorker();
        exits.push(new Promise(resolve => worker.once('exit',resolve)));
        return {
          postMessage:data => worker.postMessage(data),
          terminate:() => worker.terminate(),
          on:(event,listener) => worker.on(event,event==='message' ? data => {
            // Hold an irrelevant later response to exercise adversarial delivery.
            if (data.type!=='result' || data.unit!==2) listener(data);
          } : listener),
        };
      }}),error => error.message===expected);
    await Promise.all(exits);
    assert.equal(controller.signal.aborted,false);
  } finally { clearTimeout(timeout); }
});

test('the dense Tower batch kernel vectorizes on native targets without changing baseline Wasm',async () => {
  const native = await loadLLVM(await read('build/browser-wasi-llvm/tower-cross.wasm'),undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
  native.configureModules({entry:recipe.units[0].entry,files,builtins:grammar,library:'.'});
  for (const target of ['x86_64-unknown-linux-gnu','aarch64-unknown-linux-gnu','wasm32-unknown-unknown']) {
    const result = native.compile(kernel,{target,library:true,emit:'object'});
    assert.equal(result.status,'compiled',result.error);
    assert.equal(/<\d+ x i32>/.test(result.after),!target.startsWith('wasm'));
    assert.ok(result.object.length);
  }
});
