import { executeWasm } from './llvm-host.mjs';
import { originalDiagnostic } from './foundation-source.mjs';
import { getTower, getCompiler } from './compiler-runtime.mjs';

// Completed workers retain compiler/grammar state. Active cancellation still
// terminates the worker, including synchronous compilation or an infinite loop.
self.onmessage = async ({ data: { id, source, foundation, bedrock, backend, pointerBytes=4, inputs={} } }) => {
  let tower, handle;
  const timings = {}, start = performance.now();
  const send = data => postMessage({ id, backend, ...data });
  try {
    send({ phase: 'Loading…' });
    tower = await getTower(foundation, bedrock);
    timings.load = performance.now() - start;
    let at = performance.now();
    handle = tower.compile(source,{pointerBytes});
    timings.tower = performance.now() - at;
    const checked = tower.execute(handle, 0);
    if (checked.status === 'error') { send({ result: checked, timings }); return; }
    at = performance.now();
    const formatted = tower.foundation(handle);
    timings.instructions = performance.now() - at;
    send({ foundation: formatted.source, timings });
    if (backend === 'interpreter') {
      send({ phase: 'Executing…' });
      const execution = performance.now();
      let pending = '', lastUpdate = execution;
      for (;;) {
        const result = tower.execute(handle, 10000); pending += result.output;
        const now = performance.now();
        if (result.status !== 'executing' || now - lastUpdate >= 50) {
          timings.execute = now - execution;
          send({ result: { ...result, output: pending }, timings }); pending = ''; lastUpdate = now;
        }
        if (result.status !== 'executing') break;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } else {
      send({ phase: 'Loading LLVM…' });
      at = performance.now();
      // Canonical text uses the bundled foundation spelling, even when the
      // editable input module gives those same semantic nodes different syntax.
      const compiler = await getCompiler('./tower-llvm.wasm.gz');
      timings.llvmLoad = performance.now() - at;
      send({ phase: 'Compiling LLVM…' });
      at = performance.now();
      const compiled = compiler.compile(formatted.source,{inputs});
      timings.llvm = performance.now() - at;
      Object.assign(timings, compiled.timings);
      const diagnostic = result => originalDiagnostic(result, formatted.spans);
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
};
