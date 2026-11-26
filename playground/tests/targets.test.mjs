import { after, test } from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {browserTargetImports} from './browser_target_host.mjs';
import {runSelectedTest} from './selected_test.mjs';
import assert from 'node:assert/strict';
import { inferBrowserTarget, detectBrowserTarget } from '../src/browser-target.mjs';
import { targets, targetChoices, savedTargetSelection, targetSelectionKey, targetInputs, linkInputsForTarget } from '../src/targets.mjs';

const caseNames = [
  'unknown',
  'Windows fallback',
  'Windows x64',
  'Linux x64',
  'Linux fallback',
  'Linux ARM64',
  'Mac ambiguous Intel UA',
  'Mac x64 hints',
  'Mac ARM64 hints beat UA',
  'Mac hints beat touch heuristic',
  'hints supply OS separately',
  'Android is not desktop Linux',
  'iOS',
  'iPad desktop mode',
  'Chrome OS',
  '32-bit Linux is not x64',
  '32-bit ARM is not ARM64',
  '32-bit hints',
  'WoW64 supports x64',
  'Windows ARM unavailable',
];
const directory = 'playground/src/browser_target_cases/';
const read = path => readFile(new URL('../../' + path, import.meta.url), 'utf8');
const file = async path => ({path, text:await read(path)});

let host;
async function openTargetTests() {
  const modules = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower',
    'library/testing', 'backend/text', 'library/vector'];
  const builtins = Object.fromEntries(await Promise.all(modules.map(async name =>
    [name, await read('scaffolding/' + name + '.tower')])));
  const bytes = await readFile(process.env.TOWER_TEST_WASM ||
    new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
  return loadTower(bytes, undefined, builtins.foundation, undefined, builtins.bedrock, {
    builtins, tower:builtins.tower, threads:{capacity:1}, imports:browserTargetImports(),
  });
}
after(() => host?.close());

for (const name of caseNames) test('browser target: '+name, async () => {
  host ??= await openTargetTests();
  const entry = directory + name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '_') + '_test.tower';
  // Each explicit entry owns one test. The browser target itself is an ES module.
  const files = await Promise.all([file(entry), file(directory + 'check.tower')]);
  runSelectedTest(host, entry, 1, {files, suffix:'_browser_test.tower'});
});
test('denied, absent and stalled client hints fall back promptly', async () => {
  for (const getHighEntropyValues of [undefined,()=>Promise.reject(Error('denied')),()=>new Promise(()=>{})]) {
    const result=await detectBrowserTarget({platform:'Linux',userAgentData:{getHighEntropyValues}},5);
    assert.equal(result.key,'linux');
    assert.match(result.reason,/fallback/);
  }
});
test('client hints improve independently inferred architecture', async () => {
  const result=await detectBrowserTarget({platform:'Linux',userAgentData:{getHighEntropyValues:async()=>({architecture:'arm',bitness:'64'})}});
  assert.equal(result.key,'linux-arm');
});
const storage = values => ({getItem:key=>values[key]??null});
test('saved native selections persist with Wasm enabled while pre-fix selections are ignored', () => {
  const current=savedTargetSelection(storage({[targetSelectionKey]:'{"wasm":false,"linux-arm":true,"x86":true,"unknown":true}'}));
  assert.deepEqual(Object.keys(current),Object.keys(targetChoices)); assert.equal(current['linux-arm'],true); assert.equal(current.linux,false);
  assert.equal(current.wasm,true);
  assert.deepEqual(Object.entries(savedTargetSelection(storage({[targetSelectionKey]:'{"wasm":false}'}))).filter(([,enabled])=>enabled),[['interpreter',true],['fast',true],['wasm',true]]);
  assert.equal(savedTargetSelection(storage({'tower-build-targets-v1':'{"wasm":true,"x86":true,"arm":true}'})),null);
  assert.equal(savedTargetSelection(storage({'tower-build-targets-v2':JSON.stringify(Object.fromEntries(Object.keys(targets).map(key=>[key,true])))})),null);
  assert.equal(savedTargetSelection(storage({[targetSelectionKey]:'broken'})),null);
  assert.equal(savedTargetSelection({getItem(){throw Error('denied');}}),null);
});
test('detected marker requires explicit OS and architecture without fallback assumptions',()=>{
  assert.equal(inferBrowserTarget({platform:'Win32'},{architecture:'x86',bitness:'64'}).strongMatch,true);
  assert.equal(inferBrowserTarget({platform:'Linux aarch64'}).strongMatch,true);
  assert.equal(inferBrowserTarget({platform:'Win32'}).strongMatch,false);
  assert.equal(inferBrowserTarget({platform:'MacIntel'}).strongMatch,false);
  assert.equal(inferBrowserTarget({},{architecture:'x86',bitness:'64'}).strongMatch,false);
  assert.equal(inferBrowserTarget({platform:'Win32'},{architecture:'x86'}).strongMatch,false);
  assert.equal(inferBrowserTarget({platform:'Android'},{architecture:'arm',bitness:'64'}).strongMatch,false);
});
test('explicit profiles load only their runtime and scope uploaded link inputs', async () => {
  const requested=[];
  const inputs=await targetInputs(targets.linux,async path=>{requested.push(path);return new Uint8Array([1]);});
  assert.deepEqual(requested,['./targets/x86_64-unknown-linux-gnu-runtime.o']);
  assert.equal(Object.keys(inputs).length,1);
  assert.deepEqual(await targetInputs(targets.wasm,()=>assert.fail('Wasm runtime is bundled')),{});
  await assert.rejects(()=>targetInputs({},()=>{}),/Unknown/);
  assert.deepEqual(Object.keys(linkInputsForTarget({'common.o':1,'linux--x.o':2,'linux-arm--x.o':3,'windows--x.o':4},'linux')),['common.o','linux--x.o']);
});
