import { executeWasm } from './llvm-host.mjs';
import { originalDiagnostic } from './foundation-source.mjs';
import { getTower, getCanonicalTower, getCompiler, warmCompiler, useCompiler } from './compiler-runtime.mjs';
import {projectDiagnostic} from './projects.mjs';

// Compilation is coalesced across edits. The UI grants execution explicitly,
// after which edits/cancellation can terminate the worker and an infinite loop.
let desired, executionPermit;
async function permitExecution(event) {
  if (desired !== event) return false;
  return new Promise(resolve => {
    executionPermit = {id:event.data.id,resolve};
    postMessage({id:event.data.id,backend:event.data.backend,ready:true});
  });
}
async function receive(event) {
  const {command, id, source, foundation, bedrock, backend, pointerBytes=4, inputs={}, files, drive=[], builtins={}, entry='input.tower', bytecode, optimize=true, comments=true, compiler, library='.tower'} = event.data;
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
    let formatted = backend === 'interpreter' ? undefined : event.data.formatted;
    if (!formatted) {
      const frontend = await getTower(foundation, bedrock, builtins.tower, {projectFollows:command !== 'disassemble'}); tower = frontend.tower;
      if (command === 'disassemble') {
        await getCanonicalTower();
        handle = tower.loadBytecode(bytecode);
        send({disassembly:tower.foundation(handle).source, pointerBytes:new DataView(bytecode.buffer,bytecode.byteOffset).getUint32(20,true)});
        return;
      }
      timings.load = frontend.loadMs; timings.loadCached = frontend.cached;
      let at = performance.now();
      tower.mountFiles(drive);
      tower.configureModules({entry, files:drive, builtins:{...builtins,bedrock,foundation}, library, replaceBuiltins:true});
      handle = tower.compile(files?.[0]?.text ?? source,{pointerBytes});
      timings.tower = performance.now() - at;
      const checked = tower.execute(handle, 0);
      if (checked.status === 'error') { send({ result: checked, timings }); return; }
      at = performance.now();
      if (!comments) tower.stripComments(handle);
      formatted = tower.foundation(handle);
      timings.instructions = performance.now() - at;
    } else {
      // The coordinator forwards only canonical text and source locations for
      // this revision/profile. Each backend retains its own compiler and memory.
      timings.frontendShared = true;
    }
    send({ foundation: formatted.source, formatted, timings });
    if (backend === 'interpreter' || backend === 'fast') {
      if (backend === 'fast') {
        send({phase:optimize?'Optimizing with LLVM…':'Lowering through LLVM…'});
        const llvmCompiler = await getCompiler('./tower-llvm.wasm.gz');
        const optimizationStart = performance.now();
        const compiled = llvmCompiler.compiler.compile(formatted.source,{emit:'foundation',optimize,target:pointerBytes===8?'wasm64-unknown-unknown':'wasm32-unknown-unknown'});
        timings.optimize = performance.now() - optimizationStart;
        timings.llvmLoad = llvmCompiler.loadMs; timings.llvmLoadCached = llvmCompiler.cached;
        if(compiled.status==='error'){send({result:originalDiagnostic(compiled,formatted.spans,formatted.sourceMap),timings});return;}
        const canonical = await getCanonicalTower();
        timings.canonicalLoad = canonical.loadMs; timings.canonicalLoadCached = canonical.cached;
        tower = canonical.tower;
        tower.mountFiles(drive);
        if (handle) tower.destroyExecution(handle); handle = undefined;
        const packageStart = performance.now();
        const prepared = tower.prepareFoundationPackage(compiled.foundation,{pointerBytes,optimizationProfile:compiled.optimizationProfile});
        handle = prepared.handle;
        const disassembly = tower.foundation(handle).source;
        timings.package = performance.now() - packageStart;
        send({optimizedFoundation:compiled.foundation,optimizationProfile:compiled.optimizationProfile,fastLLVM:{before:compiled.before,after:compiled.after},timings});
        send({bytecode:prepared.bytecode,disassembly,cache:tower.fastStats(handle),timings});
      }
      if (!await permitExecution(event)) return;
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
      const at = performance.now();
      const compiled = compiler.compile(formatted.source,{inputs,optimize});
      timings.llvm = performance.now() - at;
      Object.assign(timings, compiled.timings);
      const diagnostic = result => originalDiagnostic(result, formatted.spans, formatted.sourceMap);
      if (compiled.status === 'error') { send({ result: diagnostic(compiled), timings }); return; }
      send({ llvm: { before: compiled.before, after: compiled.after, disassembly: compiled.disassembly, wasm: compiled.wasm }, timings });
      if (!await permitExecution(event)) return;
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
// Source capability updates and reactor calls remain serialized. Yield once at
// admission so already queued edit messages replace obsolete pending requests.
let draining = false, warmRequest;
async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (desired || warmRequest) {
      await new Promise(resolve => setTimeout(resolve,0));
      const event = desired ?? warmRequest;
      if (!event) continue;
      if (event === warmRequest) warmRequest = null;
      await receive(event);
      if (desired === event) desired = null;
    }
  } finally { draining = false; }
}
self.onmessage = event => {
  const {command,id} = event.data;
  if (command === 'execute' || command === 'cancel') {
    if (command === 'cancel' && desired?.data.id === id) desired = null;
    if (executionPermit?.id === id) {
      const permit = executionPermit; executionPermit = null;
      permit.resolve(command === 'execute' && desired?.data.id === id);
    }
    return;
  }
  if (command !== 'warm') {
    if (executionPermit) { executionPermit.resolve(false); executionPermit = null; }
    desired = event;
  } else warmRequest = event;
  void drain();
};
