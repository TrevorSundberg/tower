// Host transport only. Tower owns admission, access claims, dependencies, jobs,
// continuations and publication. wasi-libc owns thread stacks, TLS and allocation.
const READY = 1, RUNNING = 2, FAILED = 3;
const FAILURE_BYTES = 8192;
const HEAP_FREE = 0, HEAP_LOCKED = 1, HEAP_CONTENDED = 2;
const HEAP_WAIT_MS = 100, WASM_PAGE_BYTES = 65536;
export function compilerWorkerError(status, failures) {
  for (let slot = 0; slot < status.length; slot++) {
    if (Atomics.load(status, slot) !== FAILED) continue;
    const bytes = failures.subarray(slot * FAILURE_BYTES, (slot + 1) * FAILURE_BYTES);
    const end = bytes.indexOf(0);
    return new Error(new TextDecoder().decode(bytes.slice(0, end < 0 ? bytes.length : end)) || 'Compiler worker failed');
  }
  return null;
}
export function compilerHeap(memory, heap, check) {
  let refreshed = 0;
  const release = () => {
    if (Atomics.exchange(heap, 0, HEAP_FREE) === HEAP_CONTENDED) Atomics.notify(heap, 0, 1);
  };
  return {
    work_host_heap_enter: () => {
      check();
      if (Atomics.compareExchange(heap, 0, HEAP_FREE, HEAP_LOCKED) !== HEAP_FREE) {
        // A waiter publishes contention before sleeping. A waking waiter keeps
        // that marker while owning the lock, handing off to any remaining waiters.
        while (Atomics.exchange(heap, 0, HEAP_CONTENDED) !== HEAP_FREE) {
          Atomics.wait(heap, 0, HEAP_CONTENDED, HEAP_WAIT_MS);
          check();
        }
      }
      // Refresh after acquisition: the previous owner may have grown memory.
      // This is a platform compatibility primitive, not a Tower allocator.
      try {
        if (memory.buffer.byteLength !== refreshed) refreshed = memory.grow(0) * WASM_PAGE_BYTES;
      }
      catch (error) { release(); throw error; }
    },
    work_host_heap_leave: release,
  };
}
export async function compilerThreads(module, {memory,
  workerURL = new URL(import.meta.url.endsWith('.mjs') ? './compiler-thread-worker.mjs' : './compiler-thread-worker.js', import.meta.url),
  workerFactory, capacity = 4} = {}) {
  if (!WebAssembly.Module.imports(module).some(item => item.kind === 'memory')) return null;
  if (!memory) memory = new WebAssembly.Memory({initial:128, maximum:32768, shared:true});
  if (!(memory.buffer instanceof SharedArrayBuffer)) throw new Error('Compiler threads require shared memory');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 256) throw new Error('Invalid compiler worker capacity');
  if (!workerFactory) {
    if (typeof Worker !== 'undefined') workerFactory = url => new Worker(url, {type:'module'});
    else {
      const nodeThreads = 'node:worker_threads';
      const {Worker} = await import(nodeThreads);
      // A worker loads a file even when its coordinator was launched from stdin.
      // V8's Wasm switches are process-wide; Node rejects them when explicitly
      // repeated in Worker.execArgv (ordinary inheritance handles them).
      const execArgv = process.execArgv.filter((argument, index, args) =>
        !argument.startsWith('--input-type') && args[index - 1] !== '--input-type'
        && !/^--(?:no-)?wasm-/.test(argument) && argument !== '--disable-wasm-trap-handler');
      workerFactory = url => new Worker(url, {type:'module',
        ...(execArgv.length === process.execArgv.length ? {} : {execArgv})});
    }
  }
  let callback, nextID = 2, closed = false;
  const workers = [], status = new Int32Array(new SharedArrayBuffer(capacity * 4));
  const failures = new Uint8Array(new SharedArrayBuffer(capacity * FAILURE_BYTES));
  const heap = new Int32Array(new SharedArrayBuffer(8));
  let failure;
  function check() {
    if (Atomics.load(heap, 1)) failure ||= compilerWorkerError(status, failures);
    if (failure) throw failure;
    if (closed) throw new Error('Compiler worker transport is closed');
  }
  const close = () => {
    closed = true;
    for (const worker of workers) worker.terminate();
    workers.length = 0;
  };
  // Browsers must finish nested-worker startup before entering synchronous Wasm:
  // its atomic waits cannot service the parent's JavaScript startup event loop.
  try {
    await Promise.all(Array.from({length:capacity}, (_, slot) => new Promise((resolve, reject) => {
      const worker = workerFactory(workerURL);
      workers[slot] = worker;
      const ready = data => {
        if (data.error) { reject(new Error(data.error)); return; }
        if (!data.ready) return;
        if (callback !== undefined && callback !== data.callback) { reject(new Error('Compiler callback table mismatch')); return; }
        callback = data.callback;
        resolve();
      };
      if (worker.on) { worker.on('message', ready); worker.on('error', reject); }
      else {
        worker.addEventListener('message', event => ready(event.data));
        worker.addEventListener('error', event => reject(new Error(event.message)));
      }
      worker.postMessage({initialize:true, module, memory, status, failures, heap, slot});
    })));
  } catch (error) { close(); throw error; }
  for (const worker of workers) worker.unref?.();
  function attach(instance) {
    const table = instance.exports.__indirect_function_table;
    if (table.grow(1) !== callback) { close(); throw new Error('Compiler callback table mismatch'); }
    table.set(callback, instance.exports.work_thread_entry);
  }
  const env = {memory, work_host_available: () => closed ? 0 : 1,
    work_host_capacity: () => closed ? 1 : capacity, work_host_entry: () => callback,
    work_host_check: () => { check(); memory.grow(0); },
    work_host_time: () => BigInt(Date.now()) * 1000000n,
    ...compilerHeap(memory, heap, check)};
  const wasi = {'thread-spawn': argument => {
    if (closed) return -1;
    // pthread_join can return just before the child's JS completion store.
    // Wait for that handoff directly; no parent message callback is required.
    for (;;) {
      check();
      for (let slot = 0; slot < capacity; slot++) {
        if (Atomics.compareExchange(status, slot, READY, RUNNING) !== READY) continue;
        const id = nextID++;
        workers[slot].postMessage({id, argument});
        return id;
      }
      Atomics.wait(status, 0, RUNNING, 1);
    }
  }};
  return {env, wasi, memory, attach, close, check, failed:() => Boolean(failure || Atomics.load(heap, 1))};
}
