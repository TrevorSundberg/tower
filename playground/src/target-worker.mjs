import { getTower, getCompiler } from './compiler-runtime.mjs';
import { originalDiagnostic } from './foundation-source.mjs';
import { targets, targetInputs } from './targets.mjs';
import { fetchBytes as bytes } from './fetch-bytes.mjs';

const runtimes = new Map();
self.onmessage = async ({data:{id,source,foundation,bedrock,architecture,inputs={}}}) => {
  let tower, handle;
  const send = data => postMessage({id,architecture,...data});
  try {
    send({phase:'Loading…'});
    tower = await getTower(foundation,bedrock);
    handle = tower.compile(source,{pointerBytes:8});
    const checked = tower.execute(handle,0);
    if (checked.status === 'error') { send({error:checked.error,diagnostic:checked,done:true}); return; }
    const formatted = tower.foundation(handle);
    const compiler = await getCompiler('./tower-cross.wasm.gz');
    const keys = architecture === 'x86' ? ['windows','linux','mac'] : ['linux-arm','mac-arm'];
    for (const key of keys) {
      const target = targets[key]; send({phase:'Compiling '+target.label+'…'});
      if (!runtimes.has(key)) runtimes.set(key,await targetInputs(target,bytes));
      const runtime = runtimes.get(key);
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
