import { decodeBytes } from './host-bytes.mjs';
import { TowerWASI } from './wasi-host.mjs';
import { configureTower, configureFoundation, configureBedrock } from './bootstrap.mjs';
import { foreignArgument, invokeForeign } from './foreign.mjs';
import { platformImports } from './platform.mjs';
import { moduleInputs, moduleDiagnostic } from './module-inputs.mjs';

// LLVM and LLD run in their own WASM instance, with only an in-memory filesystem.
export async function loadLLVM(bytes, log = () => {}, bootstrap, foundation, bedrock, {tower, builtins = {}} = {}) {
  const wasi = new TowerWASI({ log });
  const module = bytes instanceof WebAssembly.Module ? bytes : await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
  wasi.initialize(instance);
  const modules = moduleInputs(instance.exports, {...builtins, bedrock, foundation:foundation ?? bootstrap, tower});
  if (bedrock !== undefined) configureBedrock(instance.exports, bedrock);
  configureTower(instance.exports, foundation ?? bootstrap, modules.environment);
  const e = instance.exports, decoder = new TextDecoder();
  function string(pointer) {
    const memory = new Uint8Array(e.memory.buffer), end = memory.indexOf(0, pointer);
    if (!pointer || end < 0) throw new Error('Invalid LLVM compiler response');
    return decodeBytes(decoder, memory.subarray(pointer, end));
  }
  return {
    module,
    configureModules: modules.configure,
    dependencies: modules.dependencies,
    // The coordinator and ticket validation are Tower code. This object owns
    // only its host handle; artifacts stay in the transport until acceptance.
    createWork(units, workers, revision, profile) {
      const handle = e.compiler_work_create?.(units,workers,revision,profile);
      if (!handle) throw new Error('Unable to create Tower compiler work coordinator');
      let live = handle;
      const requireLive = () => { if (!live) throw new Error('Compiler work is closed'); return live; };
      return {
        next:() => e.compiler_work_next(requireLive()),
        accept:(unit,success) => !!e.compiler_work_accept(requireLive(),unit,revision,profile,success),
        done:() => !!e.compiler_work_done(requireLive()),
        failed:() => e.compiler_work_failed(requireLive()),
        peak:() => e.compiler_work_peak(requireLive()),
        cancel:() => { if (live) e.compiler_work_cancel(live); },
        close:() => { if (live) e.compiler_work_close(live); live = 0; },
      };
    },
    // Link an explicit reactor recipe using Tower's own LLD service. The browser
    // supplies bytes and arguments; language/link policy remains in Tower.
    linkReactor(inputs, args) {
      if (!e.backend_reactor_link) throw new Error('This compiler does not support reactor builds');
      const link = e.backend_link_create();
      if (!link) throw new Error('Unable to allocate reactor linker');
      function withBytes(bytes, action) {
        const p = e.malloc(bytes.length || 1);
        if (!p) throw new Error('Unable to allocate reactor input');
        try { new Uint8Array(e.memory.buffer).set(bytes, p); return action(p); }
        finally { e.free(p); }
      }
      const text = value => new TextEncoder().encode(value + '\0');
      try {
        for (const [name, data] of Object.entries(inputs)) withBytes(text(name), n => withBytes(data, p => {
          if (!e.backend_link_add_input(link, n, p, data.length)) throw new Error('Invalid reactor input: ' + name);
        }));
        for (const arg of args) withBytes(text(arg), p => e.backend_reactor_argument(link, p));
        if (!e.backend_reactor_link(link)) throw new Error(string(e.backend_reactor_error(link)));
        return new Uint8Array(e.memory.buffer, e.backend_reactor_bytes(link), e.backend_reactor_size(link)).slice();
      } finally { e.backend_link_close(link); }
    },
    compile(source, { inputs = {}, emit = 'wasm', library = false, optimize = true, target = 'wasm32-unknown-unknown' } = {}) {
      if (!['wasm', 'object', 'executable', 'foundation'].includes(emit)) throw new Error('Unknown output format: ' + emit);
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
        const result = JSON.parse(string(e.tw_llvm_compile_options(pointer, text.length, (emit === 'object' ? 1 : 0) | (library ? 2 : 0) | (emit === 'foundation' ? 4 : 0) | (optimize ? 0 : 8), modules.environment)));
        if (result.status === 'error') return moduleDiagnostic(result, modules.sourceMap());
        if (emit === 'foundation') return {...result, foundation:string(e.tw_llvm_foundation()), before:string(e.tw_llvm_before()), after:string(e.tw_llvm_after())};
        return { ...result, sourceMap:modules.sourceMap(), before: string(e.tw_llvm_before()), after: string(e.tw_llvm_after()), disassembly: e.tw_llvm_disassembly ? string(e.tw_llvm_disassembly()) : '',
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
  imports={...platformImports((_stream,data)=>append(decodeBytes(decoder, data,{stream:true}),data.length)),...imports};
  const module = await WebAssembly.compile(compiled.wasm);
  const allowed = new Set(['print', 'trap']);
  const env = {};
  for (const item of WebAssembly.Module.imports(module)) {
    if (item.module === 'tower' && item.kind === 'function' && allowed.has(item.name)) continue;
    if (item.module !== 'env' || item.kind !== 'function' || !Object.hasOwn(compiled.signatures ?? {}, item.name))
      throw new Error(`Unexpected compiled program import: ${item.module}.${item.name}`);
    if (!Object.hasOwn(imports, item.name)) throw new Error(`No implementation registered for external function '${item.name}'`);
    env[item.name] = imports[item.name]?.wasm ?? ((...args) => invokeForeign(imports, item.name, context, args.map((a, i) => {
      const type = compiled.signatures[item.name][i];
      return type === 'f32' || type === 'f64' ? a : foreignArgument(a, type);
    })));
  }
  const context = {
    memory: () => new Uint8Array(instance.exports.memory.buffer),
    allocate: size => instance.exports.tower_allocate(size, 1),
    free: pointer => instance.exports.tower_deallocate(pointer),
  };
  const instance = await WebAssembly.instantiate(module, { env, tower: {
    print(kind, bits, pointerBytes) {
      const runtimePrintText = 256, runtimePrintI8 = 12, runtimePrintI16 = 13;
      const value = kind === runtimePrintText ? decodeBytes(new TextDecoder(), context.memory().subarray(Number(bits), Number(bits) + pointerBytes)) :
        kind === 3 ? '0x' + BigInt.asUintN(pointerBytes * 8, bits).toString(16).padStart(pointerBytes * 2, '0') :
        kind === 2 ? bits ? 'true' : 'false' : kind === 0 ? BigInt.asIntN(32, bits) : kind === 6 ? BigInt.asIntN(64, bits) :
        kind === runtimePrintI8 ? BigInt.asIntN(8, bits) : kind === runtimePrintI16 ? BigInt.asIntN(16, bits) : BigInt.asUintN(64, bits);
      const text = String(value) + '\n';
      const bytes = new TextEncoder().encode(text).length;
      append(decodeBytes(decoder, new TextEncoder().encode(text),{stream:true}),bytes);
      const now = performance.now();
      if (now - lastUpdate >= 50) { update({ status: 'executing', output: pending, outputTruncated }); pending = ''; lastUpdate = now; }
    },
    trap(message, offset) {
      const bytes = context.memory(), end = bytes.indexOf(0, message);
      failure = { error: end < 0 ? 'Invalid Tower trap message' : decodeBytes(new TextDecoder(), bytes.subarray(message, end)), errorOffset: offset >>> 0 };
      // This aborts the host call, not a language-level exception or WASM EH.
      throw new Error(failure.error);
    },
  } });
  try { instance.exports.tower_main(); }
  catch (error) { if (!failure) failure = { error: error.message, errorOffset: 0 }; }
  append(decodeBytes(decoder, ),0);
  // Native traps carry assembled-module offsets, like frontend errors. Localize
  // using this artifact's snapshot before the caller applies Foundation spans.
  const result = moduleDiagnostic({ status: failure ? 'error' : 'done', error: failure?.error ?? '', errorOffset: failure?.errorOffset ?? 0,
    output: pending, outputTruncated }, compiled.sourceMap);
  update(result);
  return { ...result, output };
}
