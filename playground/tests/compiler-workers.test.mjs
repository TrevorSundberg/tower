import {after,test} from 'node:test';
import {copyText, guestString} from './guest_text.mjs';
import {selectedTestSteps} from './selected_test.mjs';
import {loadTower} from '../src/tower-host.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
import {loadLLVM} from '../src/llvm-host.mjs';
import {compileUnits as compileUnitsImpl} from '../src/compiler-build.mjs';

const root = new URL('../../',import.meta.url);
const read = path => readFile(new URL(path,root));
const project = JSON.parse(await read('build/compiler-project/project.json'));
const files = [...project.files];
const names = ['batch-a','batch-b','batch-c','batch-d'];
const kernel = (await read('scaffolding/tests/parallel_unit.tower')).toString();
for (const name of names) files.push({path:'tests/'+name+'.tower',text:kernel});
const recipe = {units:names.map(name => ({entry:'tests/'+name+'.tower',object:name+'.o'}))};
// Match the production caller's complete language/type resource transport.
const grammar = Object.fromEntries(files.filter(file => /^(?:[^/]+|types\/[^/]+)\.tower$/.test(file.path)).map(file => [file.path.slice(0,-'.tower'.length),file.text]));
const compiler = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower,builtins:grammar});
const createWorker = () => new Worker(new URL('../scripts/compiler-unit-node.mjs',import.meta.url));
const artifacts = process.env.TOWER_TEST_ARTIFACTS;
let observedCalls = 0;
async function compileUnits(options) {
  if (!process.env.TOWER_TEST_PHASES && !artifacts) return compileUnitsImpl(options);
  const call = observedCalls++, start = performance.now(), cpu = process.cpuUsage();
  let result, error;
  try { result = await compileUnitsImpl(options); return result; }
  catch (cause) { error = cause.message; throw cause; }
  finally {
    const record = {call,workers:options.workers ?? 1,wallMs:performance.now()-start,
      cpu:process.cpuUsage(cpu),peakRssKiB:process.resourceUsage().maxRSS,stats:result?.stats,error};
    console.error(JSON.stringify(record));
    if (artifacts) {
      await writeFile(`${artifacts}/call_${call}.json`,JSON.stringify(record,null,2)+'\n');
      for (const [name,bytes] of Object.entries(result?.inputs ?? {}))
        await writeFile(`${artifacts}/call_${call}_${name}`,bytes);
    }
  }
}

const fixtures = new Map([['parallel_unit.tower', kernel]]);
for (const path of ['inferred_parallel_unit.tower', 'known_parallel_unit.tower', 'iteration_parallel_unit.tower',
  'semantic_invalid/enum_number.tower', 'semantic_invalid/enum_mix.tower']) {
  fixtures.set(path, (await read('scaffolding/tests/' + path)).toString());
}
function batchFiles(sources) {
  const replacements = new Map();
  for (const [index, name] of sources.entries()) {
    if (!fixtures.has(name)) throw new Error('Missing worker fixture ' + name);
    replacements.set(recipe.units[index].entry, fixtures.get(name));
  }
  return files.map(file => replacements.has(file.path) ? {...file, text:replacements.get(file.path)} : file);
}

async function build(workers, {inputs = files, plan = recipe, children = workers > 1,
  cancelOnDispatch = false, heldUnit = 0} = {}) {
  const controller = cancelOnDispatch || heldUnit ? new AbortController() : undefined;
  const exits = [], published = [];
  let admitted = 0, timer, result, error;
  function child() {
    const worker = createWorker();
    exits.push(new Promise(resolve => worker.once('exit', resolve)));
    if (!heldUnit) return worker;
    // Preserve the original lost-receipt control at the real message boundary.
    return {
      postMessage:data => worker.postMessage(data),
      terminate:() => worker.terminate(),
      on:(event, listener) => worker.on(event, event === 'message' ? data => {
        if (data.type !== 'result' || data.unit !== heldUnit) listener(data);
      } : listener),
    };
  }
  // The 30s guard also covers retirement after the earlier failure.
  if (heldUnit) timer = setTimeout(() => controller.abort(), 30000);
  try {
    try {
      result = await compileUnits({compiler, recipe:plan, files:inputs, workers,
        signal:controller?.signal, createWorker:children ? child : undefined,
        progress:() => {
          if (++admitted === 1 && cancelOnDispatch) timer = setTimeout(() => controller.abort(), 1);
        },
        onObject:unit => published.push(unit.object),
      });
    } catch (cause) { error = cause.message; }
    await Promise.all(exits);
    return {result, error, admitted, published, exits:exits.length, aborted:controller?.signal.aborted};
  } finally { clearTimeout(timer); }
}

let cross;
async function compileTarget(target) {
  if (!cross) {
    cross = await loadLLVM(await read('build/browser-wasi-llvm/tower-cross.wasm'), undefined,
      grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower,builtins:grammar});
    cross.configureModules({entry:recipe.units[0].entry,files,builtins:grammar,library:'.'});
  }
  const result = cross.compile(kernel, {target, library:true, emit:'object'});
  if (artifacts && result.status === 'compiled') {
    await writeFile(`${artifacts}/${target}.before.ll`, result.before);
    await writeFile(`${artifacts}/${target}.after.ll`, result.after);
    await writeFile(`${artifacts}/${target}.o`, result.object);
  }
  return {result, error:result.error};
}

// Tower starts each operation and checks it before requesting the next. Only
// one registration owns these observations. Drain its last operation on exit.
let results, pending, host;
function start(request) {
  if (pending) throw new Error('A worker observation is still pending');
  const index = results.length;
  results.push(undefined);
  pending = request().then(value => { results[index] = value; });
  return index;
}
function object(context, id, key) {
  const name = guestString(context, key);
  const bytes = results[id].result.inputs[name];
  if (!(bytes instanceof Uint8Array)) throw new Error('Missing object bytes for ' + name);
  return bytes;
}
const imports = {
  start_batch(ctx, source, workers) {
    const name = guestString(ctx, source);
    return start(() => build(workers, {inputs:batchFiles(recipe.units.map(() => name))}));
  },
  start_invalid(ctx, first, second, workers, heldUnit) {
    const names = [guestString(ctx, first)];
    if (second) names.push(guestString(ctx, second));
    return start(() => build(workers, {inputs:batchFiles(names), heldUnit}));
  },
  start_cancelled:(_, workers) => start(() => build(workers, {cancelOnDispatch:true})),
  start_recovery:() => start(() => build(1, {plan:{units:recipe.units.slice(0,1)}, children:true})),
  start_target:(ctx, target) => start(() => compileTarget(guestString(ctx, target))),
  finished:(_, id) => results[id] !== undefined,
  diagnostic:(ctx, id) => copyText(ctx, results[id].error ?? ''),
  object_count:(_, id) => Object.keys(results[id].result.inputs).length,
  object_size:(ctx, id, key) => object(ctx, id, key).length,
  object_copy(ctx, id, key) {
    const bytes = object(ctx, id, key);
    const address = ctx.allocate(bytes.length || 1);
    if (!address) throw new Error('Cannot allocate the observed object');
    ctx.memory().set(bytes, address);
    return address;
  },
  publication_count:(_, id) => results[id].published.length,
  publication:(ctx, id, index) => copyText(ctx, results[id].published[index]),
  peak_workers:(_, id) => results[id].result.stats.peak,
  timing_count:(_, id) => results[id].result.stats.timings.length,
  interval_start:(_, id, index) => results[id].result.stats.timings[index].start,
  interval_end:(_, id, index) => results[id].result.stats.timings[index].end,
  worker_exits:(_, id) => results[id].exits,
  admissions:(_, id) => results[id].admitted,
  aborted:(_, id) => results[id].aborted,
  text_matches(ctx, id, field, pattern, flags) {
    const key = guestString(ctx, field);
    const text = key === 'error' ? results[id].error : results[id].result[key];
    if (typeof text !== 'string') throw new Error('Missing worker text ' + key);
    return new RegExp(guestString(ctx, pattern), guestString(ctx, flags)).test(text);
  },
  target_status:(ctx, id) => copyText(ctx, results[id].result.status),
  target_size:(_, id) => results[id].result.object.length,
};

const folder = 'playground/tests/fixtures/compiler_workers/';
async function run(name) {
  if (!host) {
    const builtins = {...grammar};
    for (const module of ['library/testing','library/test_data','library/vector','backend/text']) {
      builtins[module] = (await read('scaffolding/' + module + '.tower')).toString();
    }
    const bytes = await readFile(process.env.TOWER_TEST_WASM || new URL('build/browser-wasi/tower.wasm', root));
    host = await loadTower(bytes, undefined, grammar.foundation, undefined, grammar.bedrock,
      {tower:grammar.tower, builtins, imports, threads:{capacity:1}});
  }
  const entry = 'suite.tower', suffix = '_' + name + '_test.tower';
  const sources = await Promise.all([entry, 'suite' + suffix].map(async path =>
    ({path, text:(await read(folder + path)).toString()})));
  results = [];
  try {
    for (const _ of selectedTestSteps(host, entry, 1024, {files:sources, suffix}, 2048)) {
      if (pending) { await pending; pending = undefined; }
    }
  } finally {
    try { await pending; } finally { results = pending = undefined; }
  }
}
after(() => host?.close());

test('real compiler workers preserve Tower fixture objects and publication order', () => run('objects'));
test('generic inference is isolated per ECS world and deterministic across compiler workers', () => run('inference'));
test('compiler cancellation terminates children and cannot publish partial artifacts', () => run('cancel'));
test('inferred staged dependencies are isolated across compiler worlds', () => run('staging'));
test('parallel diagnostics select source order and publish no failed build objects', () => run('diagnostics'));
test('an earlier Tower failure cancels a worker whose later receipt never arrives', () => run('missing_receipt'));
test('the dense Tower batch kernel vectorizes on native targets without changing baseline Wasm', () => run('vectorization'));
test('borrowed iteration remains deterministic across independently owned compiler worlds', () => run('iteration'));
