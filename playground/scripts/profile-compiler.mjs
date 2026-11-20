// Run without concurrent builds/tests. CPU sampling is deliberately separate
// from timings. Use an unstripped reactor for readable Tower function names.
// node playground/scripts/profile-compiler.mjs reactor.wasm report.json [baseline.wasm]
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Session} from 'node:inspector';
import os from 'node:os';
import {loadLLVM} from '../src/llvm-host.mjs';

const [current, destination, baseline] = process.argv.slice(2);
assert(current && destination, 'Supply a reactor path and report path');
const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const recipeBytes = await read('build/compiler-project/project.json');
const {files} = JSON.parse(recipeBytes);
const grammar = Object.fromEntries(['bedrock', 'foundation', 'tower'].map(name =>
  [name, files.find(file => file.path === name + '.tower').text]));
const paths = baseline ? {baseline, current} : {current};
const compilers = {}, hashes = {}, startup = {};
for (const [name, path] of Object.entries(paths)) {
  const bytes = await readFile(path), start = performance.now();
  compilers[name] = await loadLLVM(bytes, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower});
  startup[name] = performance.now() - start;
  hashes[name] = hash(bytes);
}
const cases = [
  ['examples/functions.tower', (await read('scaffolding/examples/functions.tower')).toString(), false],
  ['examples/collections.tower', (await read('scaffolding/examples/collections.tower')).toString(), false],
  ...['compiler-host', 'compiler-entities', 'compiler-semantics'].map(name => {
    const entry = 'units/' + name + '.tower';
    return [entry, files.find(file => file.path === entry).text, true];
  }),
].filter(([entry]) => (!process.env.TOWER_PROFILE_CASE || entry.includes(process.env.TOWER_PROFILE_CASE)) &&
  (!process.env.TOWER_PROFILE_EXCLUDE || !entry.includes(process.env.TOWER_PROFILE_EXCLUDE)));
assert(cases.length, 'No workloads match the requested filter');
const warmups = Number(process.env.TOWER_PROFILE_WARMUPS ?? 6), pairs = Number(process.env.TOWER_PROFILE_PAIRS ?? 16);
const repeats = Number(process.env.TOWER_PROFILE_REPEATS ?? 8);
assert(Number.isInteger(warmups) && warmups >= 0);
assert(Number.isInteger(pairs) && pairs >= 1);
assert(Number.isInteger(repeats) && repeats >= 1);
const summary = values => {
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return {median:sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95:sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))], samples:values};
};
const report = {node:process.version, cpu:os.cpus()[0].model, paths, hashes,
  recipeHash:hash(recipeBytes), warmups, pairs, repeats, profileOnly:!!process.env.TOWER_PROFILE_ONLY,
  workloads:cases.map(([entry]) => entry), startupMs:startup, cases:{},
  method:'Alternating pairs, fresh compilation with warm grammar caches; configuration excluded, parse through object emission and output transport included. Sampling follows timing.'};
function compile(name, entry, source, library) {
  const compiler = compilers[name];
  compiler.configureModules({entry, files, builtins:grammar, library:'.'});
  const start = performance.now(), result = compiler.compile(source, {library, emit:'object'});
  const elapsed = performance.now() - start;
  assert.equal(result.status, 'compiled', result.error);
  return {result, elapsed};
}
for (const [entry, source, library] of process.env.TOWER_PROFILE_ONLY ? [] : cases) {
  console.log('Timing', entry);
  const samples = Object.fromEntries(Object.keys(compilers).map(name => [name, {}]));
  let expected;
  for (let i = 0; i < warmups + pairs; ++i) {
    const order = Object.keys(compilers);
    if (i % 2) order.reverse();
    for (const name of order) {
      const {result, elapsed} = compile(name, entry, source, library);
      expected ??= result.object;
      assert.deepEqual(result.object, expected, entry + ': deterministic object bytes');
      if (i >= warmups) for (const [phase, value] of Object.entries({total:elapsed, ...result.timings}))
        (samples[name][phase] ??= []).push(value);
    }
  }
  report.cases[entry] = {sourceHash:hash(source), objectHash:hash(expected), objectBytes:expected.length,
    timings:Object.fromEntries(Object.entries(samples).map(([name, phases]) =>
      [name, Object.fromEntries(Object.entries(phases).map(([phase, values]) => [phase, summary(values)]))]))};
  const medians = Object.fromEntries(Object.entries(report.cases[entry].timings).map(([name, phases]) =>
    [name, Object.fromEntries(Object.entries(phases).map(([phase, data]) => [phase, data.median]))]));
  console.log(entry, JSON.stringify(medians));
}
const session = new Session();
session.connect();
const post = (method, params = {}) => new Promise((resolve, reject) =>
  session.post(method, params, (error, result) => error ? reject(error) : resolve(result)));
try {
  await post('Profiler.enable');
  await post('Profiler.setSamplingInterval', {interval:100});
  await post('Profiler.start');
  for (let i = 0; i < repeats; ++i)
    for (const [entry, source, library] of cases) {
      console.log('Sampling', i + 1, entry);
      const {elapsed} = compile('current', entry, source, library);
      console.log('Sampled compile ms', elapsed);
    }
  const {profile} = await post('Profiler.stop');
  await writeFile(destination + '.cpuprofile', JSON.stringify(profile));
  const hits = new Map();
  for (const node of profile.nodes) {
    const name = node.callFrame.functionName;
    hits.set(name, (hits.get(name) ?? 0) + (node.hitCount ?? 0));
  }
  const ranked = [...hits].sort((a, b) => b[1] - a[1]);
  const entries = values => values.map(([name, samples]) => ({function:name, samples}));
  report.sampleCount = [...hits.values()].reduce((sum, count) => sum + count, 0);
  report.hotspots = entries(ranked.slice(0, 50));
  report.towerHotspots = entries(ranked.filter(([name]) =>
    /^(tower\.|sem_|entity_|generic_|compiler_|frontend_|lr_|bytes_|syntax_|node_|backend_)/.test(name)).slice(0, 40));
  console.log(JSON.stringify(report.hotspots.slice(0, 25), null, 2));
} finally { session.disconnect(); }
await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
