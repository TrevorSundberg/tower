import { getTower, getCanonicalTower, getCompiler, warmCompiler, useCompiler } from './compiler-runtime.mjs';
import { originalDiagnostic } from './foundation-source.mjs';
import { targets, sourceTargets, targetInputs, nativeTargetKeys, linkInputsForTarget } from './targets.mjs';
import { fetchBytes as bytes } from './fetch-bytes.mjs';
import {projectDiagnostic} from './projects.mjs';

const runtimes = new Map();
async function receive({data:{command,id,source,foundation,bedrock,targetKeys=[],inputs={},files,drive=[], builtins={}, entry='input.tower', optimize=true, comments=true, compiler, library='.tower'}}) {
  useCompiler(compiler);
  const keys = nativeTargetKeys.filter(key => targetKeys.includes(key));
  if (command === 'warm') {
    try {
      // Start the large reactor fetch alongside the small target runtimes.
      const ready = getCompiler('./tower-cross.wasm.gz');
      await Promise.all([ready,...keys.map(async key => runtimes.set(key,await targetInputs(targets[key],bytes)))]);
      for (const key of keys) await warmCompiler('./tower-cross.wasm.gz',{
        target:targets[key].triple,emit:'executable',inputs:runtimes.get(key),
      });
      postMessage({warm:true});
    } catch(error) { postMessage({warm:true,error:error.message}); }
    return;
  }
  let tower, handle;
  const send = data => postMessage({id,...data});
  try {
    send({phase:'Loading…'});
    tower = (await getTower(foundation,bedrock,builtins.tower)).tower;
    tower.mountFiles(drive);
    tower.configureModules({entry, files:drive, builtins:{...builtins,bedrock,foundation}, library});
    handle = tower.compile(files?.[0]?.text ?? source,{pointerBytes:keys.length || targetKeys.includes('c') ? 8 : 4});
    const checked = tower.execute(handle,0);
    if (checked.status === 'error') { const diagnostic = projectDiagnostic(checked,files); send({error:(diagnostic.errorFile ? diagnostic.errorFile + ': ' : '') + checked.error,diagnostic,done:true}); return; }
    if (!comments) tower.stripComments(handle);
    const formatted = tower.foundation(handle);
    send({foundation:formatted.source});
    for (const key of Object.keys(sourceTargets).filter(key=>targetKeys.includes(key))) {
      let generated;
      try {
        const start=performance.now();
        const target=sourceTargets[key];
        send({target:key,phase:optimize?'Optimizing…':'Emitting…'});
        // Compile each profile before layout queries or LLVM lowering. The Roku
        // graph is 32-bit even when C/native output is selected alongside it.
        await getTower(foundation,bedrock,builtins.tower);
        tower.configureModules({entry, files:drive, builtins:{...builtins,bedrock,foundation}, library});
        generated=tower.compile(files?.[0]?.text ?? source,{pointerBytes:target.pointerBytes});
        const initial=tower.execute(generated,0);
        if(initial.status==='error') throw new Error(initial.error);
        if(!comments) tower.stripComments(generated);
        const canonical=tower.foundation(generated).source;
        let result={};
        if (optimize || key==='roku') {
          const {compiler}=await getCompiler('./tower-llvm.wasm.gz');
          result=compiler.compile(canonical,{emit:'foundation',target:target.pointerBytes===4?'wasm32-unknown-unknown':'wasm64-unknown-unknown',optimize});
          if (result.status==='error') throw new Error(result.error);
          await getCanonicalTower();
          tower.destroyExecution(generated); generated=undefined;
          generated=tower.compile(result.foundation,{pointerBytes:target.pointerBytes});
          const checked=tower.execute(generated,0);
          if (checked.status==='error') throw new Error(checked.error);
        }
        const emitted=key==='roku'?tower.rokuSource(generated,{comments}):tower.cSource(generated,{comments});
        const output=new TextEncoder().encode(emitted);
        postMessage({id,target:key,bytes:output,disassembly:emitted,before:result.before,after:result.after,ms:performance.now()-start},[output.buffer]);
      } catch(error) { send({target:key,error:error.message}); }
      finally { if(generated) tower.destroyExecution(generated); }
    }
    if (!keys.length) { send({done:true}); return; }
    const {compiler} = await getCompiler('./tower-cross.wasm.gz');
    for (const key of keys) {
      const target = targets[key]; send({target:key,phase:'Compiling…'});
      if (!runtimes.has(key)) runtimes.set(key,await targetInputs(target,bytes));
      const runtime = runtimes.get(key);
      const start = performance.now();
      // Platform-specific object files must match this target. A target-prefixed
      // filename scopes an uploaded object to that target; plain files go to all.
      const selected = linkInputsForTarget(inputs,key);
      for (const name of Object.keys(selected)) if (Object.hasOwn(runtime,name)) throw new Error('Link input conflicts with runtime: '+name);
      const result = compiler.compile(formatted.source,{target:target.triple,emit:'executable',optimize,inputs:{...runtime,...selected}});
      if (result.status === 'error') { send({target:key,error:result.error,diagnostic:originalDiagnostic(result,formatted.spans,formatted.sourceMap)}); continue; }
      const output = result.binary;
      postMessage({id,target:key,bytes:output,before:result.before,after:result.after,disassembly:result.disassembly,ms:performance.now()-start,timings:result.timings},[output.buffer]);
    }
    send({done:true});
  } catch(error) { send({error:error.message,done:true}); }
  finally { if(handle) tower.destroyExecution(handle); }
}
let queue = Promise.resolve();
self.onmessage = event => { queue = queue.then(() => receive(event)); };
