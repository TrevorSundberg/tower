import { loadTower } from './tower-host.mjs';
import { loadLLVM } from './llvm-host.mjs';
import { originalDiagnostic } from './foundation-source.mjs';
import { targets, targetInputs } from './targets.mjs';

self.onmessage = async ({data:{id,source,foundation,bedrock,architecture,inputs={}}}) => {
  let tower, handle;
  const send = data => postMessage({id,architecture,...data});
  const bytes = async url => {
    const response = await fetch(url); if (!response.ok) throw new Error('Unable to load '+url);
    const data = new Uint8Array(await response.arrayBuffer());
    if (data[0] === 31 && data[1] === 139)
      return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    return data;
  };
  try {
    send({phase:'Loading…'});
    tower = await loadTower(await bytes('./tower.wasm'),undefined,foundation,undefined,bedrock);
    handle = tower.compile(source,{pointerBytes:8});
    const checked = tower.execute(handle,0);
    if (checked.status === 'error') { send({error:checked.error,diagnostic:checked,done:true}); return; }
    const formatted = tower.foundation(handle);
    const [wasm,canonical,seed] = await Promise.all([bytes('./tower-cross.wasm.gz'),fetch('./foundation.tower').then(r=>r.text()),fetch('./bedrock.tower').then(r=>r.text())]);
    const compiler = await loadLLVM(wasm,undefined,canonical,undefined,seed);
    const keys = architecture === 'x86' ? ['windows','linux','mac'] : ['linux-arm','mac-arm'];
    for (const key of keys) {
      const target = targets[key]; send({phase:'Compiling '+target.label+'…'});
      const runtime = await targetInputs(target,bytes);
      const start = performance.now();
      // Platform-specific object files must match this target. A target-prefixed
      // filename scopes an uploaded object to that target; plain files go to all.
      const selected = Object.fromEntries(Object.entries(inputs).filter(([name])=>!Object.keys(targets).some(k=>name.startsWith(k+'--')) || name.startsWith(key+'--')));
      for (const name of Object.keys(selected)) if (Object.hasOwn(runtime,name)) throw new Error('Link input conflicts with runtime: '+name);
      const result = compiler.compile(formatted.source,{target:target.triple,emit:'executable',inputs:{...runtime,...selected}});
      if (result.status === 'error') { send({target:key,error:result.error,diagnostic:originalDiagnostic(result,formatted.spans)}); continue; }
      const output = result.binary;
      postMessage({id,architecture,target:key,bytes:output,before:result.before,after:result.after,disassembly:result.disassembly,ms:performance.now()-start,timings:result.timings},[output.buffer]);
    }
    send({done:true,phase:'Finished'});
  } catch(error) { send({error:error.message,done:true}); }
  finally { if(handle) tower.destroyExecution(handle); }
};
