import {TowerWASI} from './wasi-host.mjs';
import {compilerWorkerError, compilerHeap} from './compiler-threads.mjs';

let instance, status, failures, heap, slot, callback;
const unsupported = () => { throw new Error('Compiler kernel attempted a coordinator-only host operation'); };
async function message(data, post) {
  try {
    if (data.initialize) {
      ({status, failures, heap, slot} = data);
      const check = () => {
        if (!Atomics.load(heap, 1)) return;
        const error = compilerWorkerError(status, failures); if (error) throw error;
      };
      const wasi = new TowerWASI();
      instance = await WebAssembly.instantiate(data.module, {
        env: {memory:data.memory, work_host_available: () => 1, work_host_capacity: () => 1,
          work_host_entry: () => callback, tw_foreign_call:unsupported,
          work_host_time: () => BigInt(Date.now()) * 1000000n,
          work_host_check: () => { check(); data.memory.grow(0); },
          ...compilerHeap(data.memory, heap, check)},
        wasi_snapshot_preview1: wasi.wasiImport,
        wasi: {'thread-spawn':unsupported}, tower_host:{call:unsupported},
      });
      // wasm-ld initializes shared data once. _initialize remains coordinator-
      // only; wasi_thread_start installs the stack/TLS from pthread_create.
      wasi.instance = instance;
      const table = instance.exports.__indirect_function_table;
      callback = table.grow(1);
      table.set(callback, instance.exports.work_thread_entry);
      Atomics.store(status, slot, 1);
      post({ready:true, callback});
    } else {
      instance.exports.wasi_thread_start(data.id, data.argument);
      Atomics.store(status, slot, 1);
      Atomics.notify(status, slot);
    }
  } catch (error) {
    if (status) {
      const bytes = new TextEncoder().encode(error.stack || error.message);
      const size = failures.length / status.length;
      failures.set(bytes.subarray(0, size - 1), slot * size);
      Atomics.store(status, slot, 3); Atomics.notify(status, slot);
      Atomics.store(heap, 1, 1); Atomics.notify(heap, 0);
    }
    post({error:error.stack || error.message});
  }
}

if (typeof self !== 'undefined') {
  self.onmessage = ({data}) => message(data, data => self.postMessage(data));
} else {
  const nodeThreads = 'node:worker_threads';
  const {parentPort} = await import(nodeThreads);
  parentPort.on('message', data => message(data, data => parentPort.postMessage(data)));
}
