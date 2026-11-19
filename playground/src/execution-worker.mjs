import { executeWasm } from './llvm-host.mjs';
import { originalDiagnostic } from './foundation-source.mjs';
import { getTower, getCanonicalTower, getCompiler, warmCompiler, useCompiler } from './compiler-runtime.mjs';
import {projectDiagnostic} from './projects.mjs';

// Completed workers retain compiler/grammar state. Active cancellation still
// terminates the worker, including synchronous compilation or an infinite loop.
async function receive({ data: { command, id, source, foundation, bedrock, backend, pointerBytes=4, inputs={}, files, drive=[], builtins={}, entry='input.tower', bytecode, optimize=true, compiler, library='.tower' } }) {
  useCompiler(compiler);
  if (command === 'warm') {
    try { await warmCompiler('./tower-llvm.wasm.gz'); postMessage({warm:true}); }
    catch (error) { postMessage({warm:true,error:error.message}); }
    return;
  }
  let tower, handle;
  const timings = {};
  const send = data => postMessage({ id, backend, ...data, ...(data.result ? {result:projectDiagnostic(data.result, files)} : {}) });
  try {
    send({ phase: 'Loading…' });
    const frontend = await getTower(foundation, bedrock, builtins.tower); tower = frontend.tower;
    if (command === 'disassemble') {
      await getCanonicalTower();
      handle = tower.loadBytecode(bytecode);
      send({disassembly:tower.foundation(handle).source, pointerBytes:new DataView(bytecode.buffer,bytecode.byteOffset).getUint32(20,true)});
      return;
    }
    timings.load = frontend.loadMs; timings.loadCached = frontend.cached;
    let at = performance.now();
    tower.mountFiles(drive);
    tower.configureModules({entry, files:drive, builtins:{...builtins,bedrock,foundation}, library});
    handle = tower.compile(files?.[0]?.text ?? source,{pointerBytes});
    timings.tower = performance.now() - at;
    const checked = tower.execute(handle, 0);
    if (checked.status === 'error') { send({ result: checked, timings }); return; }
    at = performance.now();
    const formatted = tower.foundation(handle);
    timings.instructions = performance.now() - at;
    send({ foundation: formatted.source, timings });
    if (backend === 'interpreter' || backend === 'fast') {
      if (backend === 'fast') {
        send({phase:optimize?'Optimizing with LLVM…':'Lowering through LLVM…'});
        const llvmCompiler = await getCompiler('./tower-llvm.wasm.gz');
        const optimizationStart = performance.now();
        const compiled = llvmCompiler.compiler.compile(formatted.source,{emit:'foundation',optimize,target:pointerBytes===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
        timings.optimize = performance.now() - optimizationStart;
        timings.llvmLoad = llvmCompiler.loadMs; timings.llvmLoadCached = llvmCompiler.cached;
        if(compiled.status==='error'){send({result:originalDiagnostic(compiled,formatted.spans,formatted.sourceMap),timings});return;}
        await getCanonicalTower();
        tower.destroyExecution(handle);
        handle = tower.compile(compiled.foundation,{pointerBytes});
        const checked = tower.execute(handle,0);
        if(checked.status==='error'){send({result:checked,timings});return;}
        send({optimizedFoundation:compiled.foundation,optimizationProfile:compiled.optimizationProfile,fastLLVM:{before:compiled.before,after:compiled.after},timings});
        const start = performance.now(); tower.useFast(handle);
        timings.prepare = performance.now() - start;
        const packageStart = performance.now();
        await getCanonicalTower();
        const bytecode = tower.bytecode(handle,{optimizationProfile:compiled.optimizationProfile}), loaded = tower.loadBytecode(bytecode);
        try {
          const disassembly = tower.foundation(loaded).source;
          timings.package = performance.now() - packageStart;
          send({bytecode,disassembly,cache:tower.fastStats(handle),timings});
        } finally { tower.destroyExecution(loaded); }
      }
      send({ phase: 'Executing…' });
      const execution = performance.now();
      let pending = '', lastUpdate = execution;
      for (;;) {
        const result = tower.execute(handle, 10000); pending += result.output;
        const now = performance.now();
        if (result.status !== 'executing' || now - lastUpdate >= 50) {
          timings.execute = now - execution;
          const located=backend==='fast'?originalDiagnostic(result,formatted.spans,formatted.sourceMap):result;
          send({ result: { ...located, output: pending }, timings, ...(backend === 'fast' ? {cache:tower.fastStats(handle)} : {}) }); pending = ''; lastUpdate = now;
        }
        if (result.status !== 'executing') break;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } else {
      send({ phase: 'Loading LLVM…' });
      // Canonical text uses the bundled foundation spelling, even when the
      // editable input module gives those same semantic nodes different syntax.
      const loaded = await getCompiler('./tower-llvm.wasm.gz'), compiler = loaded.compiler;
      timings.llvmLoad = loaded.loadMs; timings.llvmLoadCached = loaded.cached;
      send({ phase: 'Compiling LLVM…' });
      at = performance.now();
      const compiled = compiler.compile(formatted.source,{inputs,optimize});
      timings.llvm = performance.now() - at;
      Object.assign(timings, compiled.timings);
      const diagnostic = result => originalDiagnostic(result, formatted.spans, formatted.sourceMap);
      if (compiled.status === 'error') { send({ result: diagnostic(compiled), timings }); return; }
      send({ llvm: { before: compiled.before, after: compiled.after, disassembly: compiled.disassembly, wasm: compiled.wasm }, timings });
      send({ phase: 'Executing…' });
      const execution = performance.now();
      await executeWasm(compiled, result => {
        timings.execute = performance.now() - execution;
        send({ result: diagnostic(result), timings });
      });
    }
  } catch (error) { send({ error: error.message, timings }); }
  finally { if (handle) tower.destroyExecution(handle); }
}
// A real request can arrive while preloading. Serialize access to the reactor;
// cancellation still terminates the worker, including a pending warm run.
let queue = Promise.resolve();
self.onmessage = event => { queue = queue.then(() => receive(event)); };
