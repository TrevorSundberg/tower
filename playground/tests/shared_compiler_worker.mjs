// Browser transport for existing Tower assertions; no compiler policy lives here.
import {compilerThreads} from '../src/compiler-threads.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';
import {loadTower} from '../src/tower-host.mjs';

self.onmessage = async ({data}) => {
  const {capacity, mode, files, builtins, fixtures} = data;
  const children = new Set(), phases = [], logs = [];
  let opened = 0, closed = 0, spawns = 0, owner;
  const workerFactory = url => {
    const worker = new Worker(url, {type:'module'});
    children.add(worker); opened++;
    const terminate = worker.terminate.bind(worker), post = worker.postMessage.bind(worker);
    worker.terminate = () => {
      if (children.delete(worker)) closed++;
      terminate();
    };
    worker.postMessage = message => { if (message.id !== undefined) spawns++; post(message); };
    return worker;
  };
  const phase = (name, memory, action) => {
    self.postMessage({progress:name});
    const before = memory.buffer.byteLength, start = performance.now();
    const result = action();
    phases.push({name, milliseconds:performance.now()-start, memoryBefore:before, memoryAfter:memory.buffer.byteLength});
    return result;
  };
  try {
    if (!crossOriginIsolated) throw new Error('Shared compiler checks require cross-origin isolation');
    const module = await WebAssembly.compile(await (await fetch(mode === 'pool' ? '/work.wasm' : '/compiler.wasm')).arrayBuffer());
    if (!WebAssembly.Module.imports(module).some(item => item.kind === 'memory')) throw new Error('Expected shared-memory compiler profile');
    const results = [];
    if (mode === 'pool') {
      owner = await compilerThreads(module, {capacity, workerFactory});
      const wasi = new TowerWASI({log:text => logs.push(text)});
      const instance = await WebAssembly.instantiate(module, {env:owner.env, wasi:owner.wasi, wasi_snapshot_preview1:wasi.wasiImport});
      owner.attach(instance); wasi.initialize(instance);
      // Each Tower call checks a simultaneous barrier, distinct thread IDs,
      // allocation/growth, partial/full cancellation drain and stale tickets.
      for (let repeat = 0; repeat < 2; repeat++) {
        const code = phase('pool lifecycle '+repeat, owner.memory, () => instance.exports.main(0, 0));
        if (code !== 0) throw new Error('Tower pool fixture returned '+code);
      }
    } else {
      owner = await loadTower(module, text => logs.push(text), builtins.foundation, undefined, builtins.bedrock,
        {tower:builtins.tower, builtins, threads:{capacity, workerFactory}});
      owner.configureModules({files});
      const {memory} = owner.exports;
      for (const name of ['evaluation_query_tests', 'semantic_stage_tests']) {
        const code = phase(name, memory, () => owner.exports[name](4, capacity));
        if (code !== 0) throw new Error(name+' returned '+code);
      }
      if (capacity > 1) {
        for (const name of ['lr_work_tests', 'semantic_world_tests']) {
          const code = phase(name, memory, () => owner.exports[name](4));
          if (code !== 0) throw new Error(name+' returned '+code);
        }
      }
      for (const fixture of fixtures) for (const fast of [false, true]) {
        const result = phase(fixture.name+(fast ? ':fast' : ':graph'), memory, () => {
          const handle = owner.compile(fixture.source, {pointerBytes:4});
          try {
            if (fast) owner.useFast(handle);
            let step, output = '';
            do { step = owner.execute(handle, 100000); output += step.output; }
            while (step.status === 'executing');
            if (step.status !== 'done' || step.outputTruncated) throw new Error(step.error || 'Incomplete fixture output');
            if (output !== fixture.output) throw new Error(fixture.name+' output: '+JSON.stringify(output));
            return {name:fixture.name, fast, output, canonical:owner.foundation(handle).source};
          } finally { owner.destroyExecution(handle); }
        });
        results.push(result);
      }
    }
    owner.close();
    if (children.size !== 0 || opened !== capacity || closed !== opened) throw new Error('Nested worker ownership was not closed');
    self.postMessage({result:{mode, capacity, isolated:crossOriginIsolated, opened, closed, spawns, phases, results, logs}});
  } catch (error) {
    self.postMessage({error:error.stack || error.message, phases, logs});
  } finally {
    owner?.close();
    for (const worker of children) worker.terminate();
    self.close();
  }
};
