// The same synchronous platform ABI as library/platform.tower. Browser hosts
// supply byte sinks; no filesystem or network access is implied.
// MVP Wasm import/export descriptor for exactly () -> void, with no code body.
// A typed Wasm function lets the engine reject incompatible result types too;
// the older compiler's JSON signatures describe only the parameters.
const abortWasm = new WebAssembly.Instance(new WebAssembly.Module(Uint8Array.of(
  0,97,115,109,1,0,0,0,
  1,4,1,96,0,0,
  2,13,1,3,101,110,118,5,97,98,111,114,116,0,0,
  7,9,1,5,97,98,111,114,116,0,0
)),{env:{abort(){throw new WebAssembly.RuntimeError('Program aborted');}}}).exports.abort;
const abort = {
  wasm: abortWasm,
  validate(context,args){
    if(args.length!==0 || context.returnType!=='void')
      throw new Error("Unsupported signature for external function 'abort': expected fn(): void");
  },
};
export function platformImports(write) {
  return {
    abort,
    platform_write(context, stream, pointer, length) {
      if (stream !== 1 && stream !== 2) return -1n;
      const p = Number(pointer), n = Number(length), memory = context.memory();
      if (!Number.isSafeInteger(p) || !Number.isSafeInteger(n) || p < 0 || n < 0 || p > memory.length || n > memory.length-p)
        throw new Error('platform_write buffer is outside execution memory');
      const accepted = write(stream,memory.subarray(p,p+n),context);
      return accepted === undefined ? BigInt(n) : BigInt(accepted);
    },
  };
}
