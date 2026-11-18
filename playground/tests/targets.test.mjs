import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferBrowserTarget, detectBrowserTarget, defaultTargetSelection } from '../src/browser-target.mjs';
import { targets, nativeTargetKeys, savedTargetSelection, targetInputs, linkInputsForTarget } from '../src/targets.mjs';

const cases = [
  ['unknown', {}, {}, 'windows'],
  ['Windows fallback', {platform:'Win32'}, {}, 'windows'],
  ['Windows x64', {userAgent:'Windows NT 10.0; Win64; x64'}, {}, 'windows'],
  ['Linux x64', {platform:'Linux x86_64'}, {}, 'linux'],
  ['Linux fallback', {platform:'Linux'}, {}, 'linux'],
  ['Linux ARM64', {platform:'Linux aarch64'}, {}, 'linux-arm'],
  ['Mac ambiguous Intel UA', {platform:'MacIntel',userAgent:'Macintosh; Intel Mac OS X 10_15_7'}, {}, 'mac-arm'],
  ['Mac x64 hints', {platform:'MacIntel'}, {architecture:'x86',bitness:'64'}, 'mac'],
  ['Mac ARM64 hints beat UA', {platform:'MacIntel',userAgent:'Macintosh; Intel Mac OS X'}, {architecture:'arm',bitness:'64'}, 'mac-arm'],
  ['Mac hints beat touch heuristic', {platform:'MacIntel',maxTouchPoints:10}, {platform:'macOS',architecture:'arm',bitness:'64'}, 'mac-arm'],
  ['hints supply OS separately', {userAgent:'Windows NT 10.0'}, {platform:'Linux',architecture:'arm',bitness:'64'}, 'linux-arm'],
  ['Android is not desktop Linux', {platform:'Linux aarch64',userAgent:'Linux; Android 14'}, {}, 'wasm'],
  ['iOS', {platform:'iPhone'}, {}, 'wasm'],
  ['iPad desktop mode', {platform:'MacIntel',maxTouchPoints:5}, {}, 'wasm'],
  ['Chrome OS', {userAgent:'X11; CrOS x86_64'}, {}, 'wasm'],
  ['32-bit Linux is not x64', {platform:'Linux i686'}, {}, 'wasm'],
  ['32-bit ARM is not ARM64', {platform:'Linux armv7l'}, {}, 'wasm'],
  ['32-bit hints', {platform:'Win32'}, {architecture:'x86',bitness:'32'}, 'wasm'],
  ['WoW64 supports x64', {platform:'Win32'}, {architecture:'x86',bitness:'32',wow64:true}, 'windows'],
  ['Windows ARM unavailable', {platform:'Win32'}, {architecture:'arm',bitness:'64'}, 'wasm'],
];
for (const [name,nav,hints,key] of cases) test('browser target: '+name, () => {
  const result=inferBrowserTarget(nav,hints);
  assert.equal(result.key,key);
  assert.equal(defaultTargetSelection(result).wasm,true);
  assert.equal(defaultTargetSelection(result)[key],true);
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
test('saved selections sanitize keys, preserve all-off and migrate architecture groups', () => {
  const current=savedTargetSelection(storage({'tower-build-targets-v2':'{"wasm":false,"linux-arm":true,"x86":true,"unknown":true}'}));
  assert.deepEqual(Object.keys(current),Object.keys(targets)); assert.equal(current['linux-arm'],true); assert.equal(current.linux,false);
  assert.ok(Object.values(savedTargetSelection(storage({'tower-build-targets-v2':'{"wasm":false}'}))).every(x=>!x));
  const legacy=savedTargetSelection(storage({'tower-build-targets-v1':'{"wasm":false,"x86":true,"arm":true}'}));
  assert.equal(legacy.wasm,false); for(const key of nativeTargetKeys) assert.equal(legacy[key],true);
  assert.equal(savedTargetSelection(storage({'tower-build-targets-v2':'broken'})),null);
  assert.equal(savedTargetSelection({getItem(){throw Error('denied');}}),null);
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
