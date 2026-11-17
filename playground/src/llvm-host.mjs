import { TowerWASI } from './wasi-host.mjs';
import { configureTower, configureFoundation, configureBedrock } from './bootstrap.mjs';

// LLVM and LLD run in their own WASM instance, with only an in-memory filesystem.
export async function loadLLVM(bytes, log = () => {}, bootstrap, foundation, bedrock) {
  const wasi = new TowerWASI({ log });
  const { instance } = await WebAssembly.instantiate(bytes, { wasi_snapshot_preview1: wasi.wasiImport });
  wasi.initialize(instance);
  if (bedrock !== undefined) configureBedrock(instance.exports, bedrock);
  configureTower(instance.exports, foundation ?? bootstrap);
  const e = instance.exports, decoder = new TextDecoder();
  function string(pointer) {
    const memory = new Uint8Array(e.memory.buffer), end = memory.indexOf(0, pointer);
    if (!pointer || end < 0) throw new Error('Invalid LLVM compiler response');
    return decoder.decode(memory.subarray(pointer, end));
  }
  return {
    compile(source) {
      const text = new TextEncoder().encode(source);
      const pointer = e.malloc(text.length || 1);
      if (!pointer) throw new Error('Unable to allocate foundation source memory');
      try {
        new Uint8Array(e.memory.buffer).set(text, pointer);
        const result = JSON.parse(string(e.tw_llvm_compile(pointer, text.length)));
        if (result.status === 'error') return result;
        return { ...result, before: string(e.tw_llvm_before()), after: string(e.tw_llvm_after()),
          wasm: new Uint8Array(e.memory.buffer, e.tw_llvm_bytes(), e.tw_llvm_size()).slice() };
      } finally { e.free(pointer); }
    },
  };
}

// This host formats output and reports explicit Tower traps. It does not execute
// the instruction graph; tower_main is the program compiled by LLVM and LLD.
export async function executeWasm(compiled, update = () => {}) {
  let output = '', pending = '', outputBytes = 0, outputTruncated = false, lastUpdate = performance.now();
  let failure = null;
  const module = await WebAssembly.compile(compiled.wasm);
  const allowed = new Set(['print', 'trap']);
  for (const item of WebAssembly.Module.imports(module))
    if (item.module !== 'tower' || item.kind !== 'function' || !allowed.has(item.name))
      throw new Error(`Unexpected compiled program import: ${item.module}.${item.name}`);
  const instance = await WebAssembly.instantiate(module, { tower: {
    print(kind, bits, name) {
      const text = (kind === 3 ? '&' + compiled.names[name >>> 0] : kind === 2 ? bits ? 'true' : 'false' : String(kind === 1 ? bits >>> 0 : bits | 0)) + '\n';
      const bytes = new TextEncoder().encode(text).length;
      if (outputBytes + bytes <= 65536) { output += text; pending += text; outputBytes += bytes; }
      else outputTruncated = true;
      const now = performance.now();
      if (now - lastUpdate >= 50) { update({ status: 'executing', output: pending, outputTruncated }); pending = ''; lastUpdate = now; }
    },
    trap(error, offset) {
      failure = { error: compiled.errors[error >>> 0] ?? 'Unknown Tower trap', errorOffset: offset >>> 0 };
      // This aborts the host call, not a language-level exception or WASM EH.
      throw new Error(failure.error);
    },
  } });
  try { instance.exports.tower_main(); }
  catch (error) { if (!failure) failure = { error: error.message, errorOffset: 0 }; }
  const result = { status: failure ? 'error' : 'done', error: failure?.error ?? '', errorOffset: failure?.errorOffset ?? 0,
    output: pending, outputTruncated };
  update(result);
  return { ...result, output };
}
