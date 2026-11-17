import { loadTower } from './tower-host.mjs';
import { loadLLVM, executeWasm } from './llvm-host.mjs';
import { originalDiagnostic } from './foundation-source.mjs';

// One disposable worker per backend. Neither runner waits for the other.
self.onmessage = async ({ data: { id, source, foundation, bedrock, backend, pointerBytes=4, inputs={} } }) => {
  let tower, handle;
  const timings = {}, start = performance.now();
  const send = data => postMessage({ id, backend, ...data });
  try {
    send({ phase: 'Loading…' });
    const response = await fetch('./tower.wasm');
    if (!response.ok) throw new Error('Unable to load Tower execution module');
    tower = await loadTower(await response.arrayBuffer(), undefined, foundation, undefined, bedrock);
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
      const [wasm, canonical, canonicalBedrock] = await Promise.all([fetch('./tower-llvm.wasm'), fetch('./foundation.tower'), fetch('./bedrock.tower')]);
      if (!wasm.ok || !canonical.ok || !canonicalBedrock.ok) throw new Error('LLVM module, bedrock.tower or foundation.tower is unavailable');
      // Canonical text uses the bundled foundation spelling, even when the
      // editable input module gives those same semantic nodes different syntax.
      const compiler = await loadLLVM(await wasm.arrayBuffer(), undefined, await canonical.text(), undefined, await canonicalBedrock.text());
      timings.llvmLoad = performance.now() - at;
      send({ phase: 'Compiling LLVM…' });
      at = performance.now();
      const compiled = compiler.compile(formatted.source,{inputs});
      timings.llvm = performance.now() - at;
      Object.assign(timings, compiled.timings);
      const diagnostic = result => originalDiagnostic(result, formatted.spans);
      if (compiled.status === 'error') { send({ result: diagnostic(compiled), timings }); return; }
      send({ llvm: { before: compiled.before, after: compiled.after, wasm: compiled.wasm }, timings });
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
