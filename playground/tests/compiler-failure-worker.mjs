// Inject a guest-thread trap after successful startup. The actual transport must
// report it through shared state while its coordinator is blocked inside Wasm.
const instantiate = WebAssembly.instantiate;
WebAssembly.instantiate = async (...args) => {
  const instance = await instantiate(...args);
  return {exports:{...instance.exports, wasi_thread_start() {
    throw new WebAssembly.RuntimeError('Injected compiler worker failure');
  }}};
};
await import('../src/compiler-thread-worker.mjs');
