// Sampling is separate from timing: profiler overhead must not enter benchmarks.
import {Session} from 'node:inspector';
import {readFile,writeFile} from 'node:fs/promises';
import {loadTower, loadLLVM} from '../tests/compiler-fixtures.mjs';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url);
const tower=await loadTower(await readFile(new URL(process.env.TOWER_PROFILE_REACTOR ?? 'build/browser-wasi/tower.wasm',root)),undefined,(await readFile(new URL('scaffolding/foundation.tower',root),'utf8')));
const source=await readFile(new URL('scaffolding/benchmarks/interpreter_profile.tower',root),'utf8');
const session=new Session();session.connect();
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(error,result)=>error?reject(error):resolve(result)));
await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:100});
const compiler=await loadLLVM(await readFile(new URL('build/browser-wasi-llvm/tower-llvm.wasm',root)),undefined,await readFile(new URL('scaffolding/foundation.tower',root),'utf8'));
const optimized=compiler.compile(source,{emit:'foundation'});
assert.equal(optimized.status,'compiled',optimized.error);
for(const mode of ['graph','fast','llvm-fast']){
  const handles=Array.from({length:8},()=>{const h=tower.compile(mode==='llvm-fast'?optimized.foundation:source);if(mode.includes('fast'))tower.useFast(h);return h;});
  await post('Profiler.start');
  for(const handle of handles){let result;do{result=tower.execute(handle,100000);}while(result.status==='executing');assert.equal(result.status,'done',result.error);}
  const {profile}=await post('Profiler.stop');
  for(const handle of handles)tower.destroyExecution(handle);
  await writeFile(new URL(`build/${mode}-interpreter.cpuprofile`,root),JSON.stringify(profile));
}
session.disconnect();
