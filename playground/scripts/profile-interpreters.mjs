// Sampling is separate from timing: profiler overhead must not enter benchmarks.
import {Session} from 'node:inspector';
import {readFile,writeFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url);
const tower=await loadTower(await readFile(new URL(process.env.TOWER_PROFILE_REACTOR ?? 'build/browser-wasi/tower.wasm',root)),undefined,(await readFile(new URL('scaffolding/foundation.tower',root),'utf8')));
const source='fn add(a: i32, b: i32): i32 { var sum = a + b; return sum; } var i = 0; var sum = 0; loop { var stop = i == 500000; if stop { break; } sum = add(sum,i); i = i + 1; } print(sum);';
const session=new Session();session.connect();
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(error,result)=>error?reject(error):resolve(result)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:100});
for(const mode of ['graph','fast']){
  const handles=Array.from({length:8},()=>{const h=tower.compile(source);if(mode==='fast')tower.useFast(h);return h;});
  await post('Profiler.start');
  for(const handle of handles){let result;do{result=tower.execute(handle,100000);}while(result.status==='executing');assert.equal(result.status,'done',result.error);}
  const {profile}=await post('Profiler.stop');
  for(const handle of handles)tower.destroyExecution(handle);
  await writeFile(new URL(`build/${mode}-interpreter.cpuprofile`,root),JSON.stringify(profile));
  console.log(mode,profile.nodes.filter(n=>n.hitCount).toSorted((a,b)=>b.hitCount-a.hitCount).slice(0,14).map(n=>({name:n.callFrame.functionName,hits:n.hitCount})));
}
session.disconnect();
