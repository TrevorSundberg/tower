// Measure the Tower workload; assertions and allocator behavior are Tower code.
// Usage: node scaffolding/tests/guest-runtime-benchmark.mjs compiler
import {execFileSync} from 'node:child_process';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = new URL('../../build/shared-runtime/', import.meta.url);
await mkdir(out,{recursive:true});
const input = root+'scaffolding/tests/guest_runtime_benchmark.tower';
const wasm = fileURLToPath(new URL('benchmark.wasm',out));
execFileSync(process.argv[2],[input,'--target','wasm32-unknown-unknown','-o',wasm,
  '--bedrock',root+'scaffolding/bedrock.tower','--foundation',root+'scaffolding/foundation.tower']);
const {instance} = await WebAssembly.instantiate(await readFile(wasm),{
  tower:{trap(){throw Error('Tower benchmark trapped')},print(){throw Error('Unexpected print')}}});
const samples=[[],[]], rounds=1000;
for(let trial=0;trial<40;trial++)for(const variant of trial%2?[1,0]:[0,1]){
  const start=performance.now();
  const value=instance.exports.guest_runtime_benchmark(variant,rounds);
  const ms=performance.now()-start;
  if(value!==2016n*BigInt(rounds))throw Error('Benchmark checksum mismatch');
  if(trial>=10)samples[variant].push(ms);
}
const median=values=>values.toSorted((a,b)=>a-b)[Math.floor(values.length/2)];
const before=median(samples[0]),after=median(samples[1]);
console.log(JSON.stringify({node:process.version,rounds,allocationsPerSample:rounds*64,
  warmups:10,samples:30,beforeMs:before,afterMs:after,ratio:after/before,raw:samples},null,2));
