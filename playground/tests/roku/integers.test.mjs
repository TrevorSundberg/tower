import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runBrightScript,wastCases,assertions} from './harness.mjs';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');
// Exercise the exact shipped runtime text, not a JS transcription of it.
const towerRuntime=await read('../../../scaffolding/compiler/roku-runtime.tower');
const runtime=[...towerRuntime.matchAll(/re_text\(r, ("(?:\\.|[^"\\])*")\);/g)].map(m=>JSON.parse(m[1])).join('');
assert.ok(runtime.includes('function tr_udiv('));

for(const width of [32,64]) test(`wasm2brs pinned i${width} numeric corpus`,{timeout:180000},async()=>{
  const cases=wastCases(await read(`fixtures/i${width}.wast`),width);
  assert.ok(cases.length>300,`Only ${cases.length} expectations parsed`);
  assert.equal(new Set(cases.map(c=>c.op)).size,width===64?32:31);
  assert.equal(await runBrightScript(runtime,assertions(cases)),`passed ${cases.length}\n`);
});

test('seeded full-width random arithmetic and bitwise differential checks',{timeout:180000},async()=>{
  let seed=0x62bc58973412abcdn;
  const random=()=>{seed=BigInt.asUintN(64,seed*6364136223846793005n+1442695040888963407n);return seed;};
  const cases=[];
  for(const width of [32,64]) for(let i=0;i<24;i++) {
    const a=BigInt.asUintN(width,random()),b=BigInt.asUintN(width,random())||1n;
    const wrap=x=>BigInt.asUintN(width,x);
    for(const [op,value] of Object.entries({add:a+b,sub:a-b,mul:a*b,and:a&b,or:a|b,xor:a^b,div_u:a/b,rem_u:a%b}))
      cases.push({op,width,values:[a,b],expected:wrap(value)});
  }
  assert.equal(await runBrightScript(runtime,assertions(cases)),`passed ${cases.length}\n`);
});

test('prepare the same integer corpus for later physical-device execution',async()=>{
  const cases=[...wastCases(await read('fixtures/i32.wast'),32),...wastCases(await read('fixtures/i64.wast'),64)];
  const checks=assertions(cases).replace('sub Main()','sub tr_numeric_checks()');
  const source=runtime+'\n'+checks+'\nfunction TowerRun() as object\ntr_numeric_checks()\nreturn {}\nend function\n';
  const directory=new URL('../../../build/roku-device/',import.meta.url);
  await mkdir(directory,{recursive:true});
  await writeFile(new URL('integers.brs',directory),source);
  await writeFile(new URL('integers-expected.txt',directory),`TOWER_ROKU_BEGIN\npassed ${cases.length}\nTOWER_ROKU_END\n`);
});
