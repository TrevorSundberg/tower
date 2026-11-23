// Inject a guest-thread trap after successful startup. The actual transport must
// report it through shared state while its coordinator is blocked inside Wasm.
// Install the message handler synchronously before accepting an initial port.
// An awaited dynamic import lets a browser dispatch and drop that first message.
import '../src/compiler-thread-worker.mjs';
const instantiate = WebAssembly.instantiate;
WebAssembly.instantiate = async (...args) => {
  const instance = await instantiate(...args);
  return {exports:{...instance.exports, wasi_thread_start() {
    throw new WebAssembly.RuntimeError('Injected compiler worker failure');
  }}};
};
