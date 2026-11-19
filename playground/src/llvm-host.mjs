import { TowerWASI } from './wasi-host.mjs';
import { configureTower, configureFoundation, configureBedrock } from './bootstrap.mjs';
import { foreignArgument, invokeForeign } from './foreign.mjs';
import { platformImports } from './platform.mjs';
import { moduleInputs, moduleDiagnostic } from './module-inputs.mjs';

// LLVM and LLD run in their own WASM instance, with only an in-memory filesystem.
export async function loadLLVM(bytes, log = () => {}, bootstrap, foundation, bedrock, {tower} = {}) {
  const wasi = new TowerWASI({ log });
  const { instance } = await WebAssembly.instantiate(bytes, { wasi_snapshot_preview1: wasi.wasiImport });
  wasi.initialize(instance);
  const modules = moduleInputs(instance.exports, {bedrock, foundation:foundation ?? bootstrap, tower});
  if (bedrock !== undefined) configureBedrock(instance.exports, bedrock);
  configureTower(instance.exports, foundation ?? bootstrap, modules.environment);
  const e = instance.exports, decoder = new TextDecoder();
  function string(pointer) {
    const memory = new Uint8Array(e.memory.buffer), end = memory.indexOf(0, pointer);
    if (!pointer || end < 0) throw new Error('Invalid LLVM compiler response');
    return decoder.decode(memory.subarray(pointer, end));
  }
  return {
    configureModules: modules.configure,
    dependencies: modules.dependencies,
    compile(source, { inputs = {}, emit = 'wasm', library = false, target = 'wasm32-unknown-unknown' } = {}) {
      if (!['wasm', 'object', 'executable'].includes(emit)) throw new Error('Unknown output format: ' + emit);
      const triple = new TextEncoder().encode(target + '\0'), triplePointer = e.malloc(triple.length);
      if (!triplePointer) throw new Error('Unable to allocate target name');
      try {
        new Uint8Array(e.memory.buffer).set(triple, triplePointer);
        if (e.tw_llvm_set_target ? !e.tw_llvm_set_target(triplePointer) : target !== 'wasm32-unknown-unknown') throw new Error('Target is unavailable in this compiler module');
      }
      finally { e.free(triplePointer); }
      e.tw_llvm_clear_inputs();
      for (const [name, data] of Object.entries(inputs)) {
        const filename = new TextEncoder().encode(name + '\0'), bytes = new Uint8Array(data);
        const n = e.malloc(filename.length), p = e.malloc(bytes.length || 1);
        if (!n || !p) { if (n) e.free(n); if (p) e.free(p); throw new Error('Unable to allocate link input'); }
        try {
          new Uint8Array(e.memory.buffer).set(filename, n); new Uint8Array(e.memory.buffer).set(bytes, p);
          if (!e.tw_llvm_add_input(n, p, bytes.length)) throw new Error('Invalid or oversized link input: ' + name);
        } finally { e.free(n); e.free(p); }
      }
      const text = new TextEncoder().encode(source);
      const pointer = e.malloc(text.length || 1);
      if (!pointer) throw new Error('Unable to allocate foundation source memory');
      try {
        new Uint8Array(e.memory.buffer).set(text, pointer);
        const result = JSON.parse(string(e.tw_llvm_compile_options(pointer, text.length, (emit === 'object' ? 1 : 0) | (library ? 2 : 0))));
        if (result.status === 'error') return moduleDiagnostic(result, modules.sourceMap());
        return { ...result, before: string(e.tw_llvm_before()), after: string(e.tw_llvm_after()), disassembly: e.tw_llvm_disassembly ? string(e.tw_llvm_disassembly()) : '',
          [result.format === 'object' ? 'object' : result.format === 'wasm' ? 'wasm' : 'binary']: new Uint8Array(e.memory.buffer, e.tw_llvm_bytes(), e.tw_llvm_size()).slice() };
      } finally { e.free(pointer); }
    },
  };
}

// This host formats output and reports explicit Tower traps. It does not execute
// the instruction graph; tower_main is the program compiled by LLVM and LLD.
export async function executeWasm(compiled, update = () => {}, { imports = {} } = {}) {
  let output = '', pending = '', outputBytes = 0, outputTruncated = false, lastUpdate = performance.now();
  let failure = null;
  const decoder = new TextDecoder();
  function append(text,bytes=new TextEncoder().encode(text).length) {
    if(outputBytes+bytes<=65536){output+=text;pending+=text;outputBytes+=bytes;}else outputTruncated=true;
  }
  imports={...platformImports((_stream,data)=>append(decoder.decode(data,{stream:true}),data.length)),...imports};
  const module = await WebAssembly.compile(compiled.wasm);
  const allowed = new Set(['print', 'trap']);
  const env = {};
  for (const item of WebAssembly.Module.imports(module)) {
    if (item.module === 'tower' && item.kind === 'function' && allowed.has(item.name)) continue;
    if (item.module !== 'env' || item.kind !== 'function' || !Object.hasOwn(compiled.signatures ?? {}, item.name))
      throw new Error(`Unexpected compiled program import: ${item.module}.${item.name}`);
    if (!Object.hasOwn(imports, item.name)) throw new Error(`No implementation registered for external function '${item.name}'`);
    env[item.name] = imports[item.name]?.wasm ?? ((...args) => invokeForeign(imports, item.name, context, args.map((a, i) => foreignArgument(a, compiled.signatures[item.name][i]))));
  }
  const context = {
    memory: () => new Uint8Array(instance.exports.memory.buffer),
    allocate: size => instance.exports.tower_allocate(size, 1),
    free: pointer => instance.exports.tower_deallocate(pointer),
  };
  const instance = await WebAssembly.instantiate(module, { env, tower: {
    print(kind, bits, pointerBytes) {
      const value = kind === 3 ? '0x' + BigInt.asUintN(pointerBytes * 8, bits).toString(16).padStart(pointerBytes * 2, '0') :
        kind === 2 ? bits ? 'true' : 'false' : kind === 0 ? BigInt.asIntN(32, bits) : kind === 6 ? BigInt.asIntN(64, bits) : BigInt.asUintN(64, bits);
      const text = String(value) + '\n';
      const bytes = new TextEncoder().encode(text).length;
      append(decoder.decode(new TextEncoder().encode(text),{stream:true}),bytes);
      const now = performance.now();
      if (now - lastUpdate >= 50) { update({ status: 'executing', output: pending, outputTruncated }); pending = ''; lastUpdate = now; }
    },
    trap(message, offset) {
      const bytes = context.memory(), end = bytes.indexOf(0, message);
      failure = { error: end < 0 ? 'Invalid Tower trap message' : new TextDecoder().decode(bytes.subarray(message, end)), errorOffset: offset >>> 0 };
      // This aborts the host call, not a language-level exception or WASM EH.
      throw new Error(failure.error);
    },
  } });
  try { instance.exports.tower_main(); }
  catch (error) { if (!failure) failure = { error: error.message, errorOffset: 0 }; }
  append(decoder.decode(),0);
  const result = { status: failure ? 'error' : 'done', error: failure?.error ?? '', errorOffset: failure?.errorOffset ?? 0,
    output: pending, outputTruncated };
  update(result);
  return { ...result, output };
}
