import { decodeBytes } from './host-bytes.mjs';
import { compilerThreads } from './compiler-threads.mjs';
import { TowerWASI } from './wasi-host.mjs';
import { configureTower, configureFoundation, configureBedrock } from './bootstrap.mjs';
import { foreignArgument, foreignResult, invokeForeign } from './foreign.mjs';
import { platformImports } from './platform.mjs';
import { moduleInputs, moduleDiagnostic } from './module-inputs.mjs';

/** The only module which knows about Wasm pointers and the C ABI. */
export async function loadTower(bytes, log = () => {}, bootstrap, foundation, bedrock, { imports = {}, tower, builtins = {}, threads = {} } = {}) {
  const available = {...platformImports((_stream, data, context) => context.output(data)),...imports};
  const wasi = new TowerWASI({ log });
  const module = bytes instanceof WebAssembly.Module ? bytes : await WebAssembly.compile(bytes);
  const foreignCall = (handle, request) => {
      try {
        const {name, args, types, pointerBytes, returnType} = JSON.parse(string(request));
        const context = {
          pointerBytes,
          memory: () => new Uint8Array(exports.memory.buffer, exports.tw_exec_memory(handle), exports.tw_exec_memory_size(handle)),
          allocate: size => exports.tw_exec_allocate(handle, size),
          free: pointer => exports.tw_exec_deallocate(handle, Number(pointer)),
          output: bytes => {
            const copy=bytes.slice(), pointer=exports.tw_alloc(copy.length || 1);
            if(!pointer)throw new Error('Unable to allocate host output');
            try{new Uint8Array(exports.memory.buffer).set(copy,pointer);exports.tw_exec_output(handle,pointer,copy.length);}finally{exports.tw_free(pointer);}
          },
        };
        return foreignResult(invokeForeign(available, name, context, args.map((a, i) => foreignArgument(a, types[i], pointerBytes))), returnType);
      } catch (error) {
        withSource(error.message, (pointer, length) => { exports.tw_exec_fail(handle, pointer, length); return 1; }); return 0n;
      }
    };
  const transport = await compilerThreads(module, threads);
  let instance;
  try {
    instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport,
      wasi: transport?.wasi, tower_host: {call: foreignCall}, env: {tw_foreign_call: foreignCall, ...transport?.env} });
    transport?.attach(instance);
    wasi.initialize(instance);
  } catch (error) { transport?.close(); throw error; }
  const exports = instance.exports;
  let modules;
  try {
    modules = moduleInputs(exports, {...builtins, bedrock, foundation:foundation ?? bootstrap, tower});
    if (exports.tw_abi_version() !== 3) throw new Error('Unsupported Tower IDE ABI');
    if (bedrock !== undefined) configureBedrock(exports, bedrock);
    configureTower(exports, bootstrap, modules.environment);
    if (foundation !== undefined) configureFoundation(exports, foundation);
  } catch (error) { transport?.close(); throw error; }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const outputDecoders = new Map();
  const sourceMaps = new Map();
  function remember(handle) { sourceMaps.set(handle, modules.sourceMap()); return handle; }
  function string(pointer) {
    const memory = new Uint8Array(exports.memory.buffer);
    const end = memory.indexOf(0, pointer);
    if (!pointer || end === -1) throw new Error('Invalid response from Tower');
    return decodeBytes(decoder, memory.subarray(pointer, end));
  }
  function withSource(source, action) {
      transport?.check();
      const bytes = new TextEncoder().encode(source);
      if (bytes.length > 8 * 1024 * 1024) throw new Error('Compilation source limit is 8 MiB');
      const pointer = exports.tw_alloc(bytes.length + 1);
      if (!pointer) throw new Error('Unable to allocate source memory');
      try {
        new Uint8Array(exports.memory.buffer).set(bytes, pointer);
        const result = action(pointer, bytes.length);
        if (!result) throw new Error(string(exports.tw_last_error()));
        return result;
      } finally {
        if (transport?.failed()) transport.close();
        else exports.tw_free(pointer);
      }
  }
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    transport?.close();
    outputDecoders.clear(); sourceMaps.clear();
  };
  const host = {
    exports,
    close,
    configureModules: modules.configure,
    dependencies: modules.dependencies,
    mountFiles: files => wasi.mountFiles(files),
    configure: source => { modules.configure({builtins:{foundation:source}}); configureTower(exports, source, modules.environment); },
    // Reject invalid grammar before publishing its source to future imports.
    configureBedrock: source => { configureBedrock(exports, source); modules.configure({builtins:{bedrock:source}}); },
    bedrockSeed: () => string(exports.tw_bedrock_seed()),
    createBedrock: source => withSource(source, (pointer, length) => exports.tw_create_bedrock(pointer, length)),
    createFoundation: source => withSource(source, (pointer, length) => exports.tw_create_foundation(pointer, length)),
    create: source => withSource(source, (pointer, length) => exports.tw_create(pointer, length)),
    reset: (handle, source) => withSource(source, (pointer, length) => exports.tw_reset(handle, pointer, length)),
    step: handle => JSON.parse(string(exports.tw_step(handle))),
    inspect: handle => JSON.parse(string(exports.tw_inspect(handle))),
    format: handle => JSON.parse(string(exports.tw_format(handle))),
    destroy: handle => exports.tw_destroy(handle),
    complete(source, cursor, {editingModule = '', files, entry} = {}) {
      if (files || entry) modules.configure({...(files ? {files} : {}), ...(entry ? {entry} : {})});
      return withSource(source, (p, n) => JSON.parse(string(exports.tw_complete(p, n, cursor,
        editingModule === 'bedrock' ? 2 : editingModule === 'foundation' ? 1 : 0, 0, 0, 0))));
    },
    inspectDocument(source,{editingModule='',files,entry,pointerBytes=4}={}) {
      if(files || entry)modules.configure({...(files?{files}:{}),...(entry?{entry}:{})});
      return withSource(source,(pointer,length)=>{
        const query=exports.language_document(pointer,length,editingModule==='bedrock'?2:editingModule==='foundation'?1:0,pointerBytes);
        if(!query)throw new Error('Invalid or unallocatable language query');
        try{return JSON.parse(string(exports.language_document_result(query)));}
        finally{exports.completion_dispose(query);}
      });
    },
    compile: (source, { pointerBytes = 4 } = {}) => remember(withSource(source, (pointer, length) => exports.tw_exec_create_target(pointer, length, pointerBytes))),
    compileFiles(files, {pointerBytes = 4} = {}) {
      if (!files.length || files.length > 1024) throw new Error('Project needs 1?1,024 source files.');
      modules.configure({entry:files[0].path, files});
      return remember(withSource(files[0].text, (pointer, length) => exports.tw_exec_create_target(pointer, length, pointerBytes)));
    },
    execute(handle, budget = 10000) {
      const result=JSON.parse(string(exports.tw_exec_step(handle,budget)));
      let outputDecoder=outputDecoders.get(handle);
      if(!outputDecoder){outputDecoder=new TextDecoder();outputDecoders.set(handle,outputDecoder);}
      result.output=decodeBytes(outputDecoder, new Uint8Array(result.outputBytes??[]),{stream:result.status==='executing'});
      delete result.outputBytes;
      if(result.status!=='executing')outputDecoders.delete(handle);
      return moduleDiagnostic(result, sourceMaps.get(handle));
    },
    useFast(handle) {
      if (!exports.tw_exec_fast(handle)) throw new Error('Select the fast interpreter before executing a program');
    },
    checkCandidate(handle, {fast=false, roku=false}={}) {
      if (!exports.tw_candidate_check(handle,Number(fast),Number(roku))) throw new Error(string(exports.tw_last_error()));
    },
    fastStats: handle => JSON.parse(string(exports.tw_exec_fast_stats(handle))),
    bytecode(handle, {optimizationProfile=0}={}) {
      const size = exports.tw_exec_bytecode_options(handle,optimizationProfile);
      if (!size) throw new Error(string(exports.tw_last_error()));
      try { return new Uint8Array(exports.memory.buffer, exports.tw_exec_bytecode_data(), size).slice(); }
      finally { exports.tw_exec_bytecode_release?.(); }
    },
    preparePackage(handle, {optimizationProfile=0}={}) {
      // Older editable compiler generations retain the original validated load.
      if (!exports.tw_exec_prepare_package) {
        const bytecode = host.bytecode(handle,{optimizationProfile});
        return {bytecode,handle:host.loadBytecode(bytecode)};
      }
      const canonical = exports.tw_exec_prepare_package(handle,optimizationProfile);
      if (!canonical) throw new Error(string(exports.tw_last_error()));
      try {
        const size = exports.tw_exec_bytecode_size();
        const bytecode = new Uint8Array(exports.memory.buffer,exports.tw_exec_bytecode_data(),size).slice();
        return {bytecode,handle:canonical};
      } catch (error) { exports.tw_exec_destroy(canonical); throw error; }
      finally { exports.tw_exec_bytecode_release?.(); }
    },
    prepareFoundationPackage(source, {pointerBytes=4,optimizationProfile=0}={}) {
      // Older editable generations keep their existing checked round trip.
      if (!exports.tw_exec_prepare_foundation_package) {
        const original = host.compile(source,{pointerBytes});
        try { return host.preparePackage(original,{optimizationProfile}); }
        finally { host.destroyExecution(original); }
      }
      const canonical = withSource(source,(pointer,length) =>
        exports.tw_exec_prepare_foundation_package(pointer,length,pointerBytes,optimizationProfile));
      if (!canonical) throw new Error(string(exports.tw_last_error()));
      try {
        const size = exports.tw_exec_bytecode_size();
        const bytecode = new Uint8Array(exports.memory.buffer,exports.tw_exec_bytecode_data(),size).slice();
        return {bytecode,handle:canonical};
      } catch (error) { exports.tw_exec_destroy(canonical); throw error; }
      finally { exports.tw_exec_bytecode_release?.(); }
    },
    loadBytecode(bytes) {
      if (!(bytes instanceof Uint8Array) || bytes.length > 256 * 1024 * 1024) throw new Error('Invalid .towerbc input');
      const pointer = exports.tw_alloc(bytes.length || 1);
      if (!pointer) throw new Error('Cannot allocate .towerbc input');
      try {
        new Uint8Array(exports.memory.buffer).set(bytes, pointer);
        const handle = exports.tw_exec_load_bytecode(pointer, bytes.length);
        if (!handle) throw new Error(string(exports.tw_last_error()));
        return handle;
      } finally { exports.tw_free(pointer); }
    },
    compileFoundation: source => remember(withSource(source, (pointer, length) => exports.tw_exec_create_foundation(pointer, length))),
    foundation: handle => ({...JSON.parse(string(exports.tw_exec_foundation(handle))), sourceMap:sourceMaps.get(handle)}),
    cSource(handle, {comments=true}={}) {
      const pointer = exports.tw_exec_c(handle, comments ? 0 : 1);
      if (!pointer) throw new Error(string(exports.tw_last_error()));
      return string(pointer);
    },
    stripComments: handle => exports.tw_exec_strip_comments(handle),
    rokuSource(handle, {comments=true}={}) {
      const pointer = exports.tw_exec_roku(handle, comments ? 0 : 1);
      if (!pointer) throw new Error(string(exports.tw_last_error()));
      return string(pointer);
    },
    destroyExecution: handle => {sourceMaps.delete(handle);outputDecoders.delete(handle);exports.tw_exec_destroy(handle);},
  };
  for (const [name, method] of Object.entries(host)) {
    if (name === 'close' || typeof method !== 'function') continue;
    host[name] = (...args) => {
      // A fatal shared instance may have an interrupted allocator. Cleanup
      // after abandonment must release the host reference, not reenter Wasm.
      if ((name === 'destroy' || name === 'destroyExecution') && (closed || transport?.failed())) {
        close(); return;
      }
      if (closed) throw new Error('Tower compiler is closed');
      try { transport?.check(); return method(...args); }
      catch (error) { if (transport?.failed()) close(); throw error; }
    };
  }
  return host;
}

export function runToEnd(tower, handle, events = []) {
  for (let i = 0; i < 1024; i++) {
    const event = tower.step(handle);
    if (event.status === 'error' || event.status === 'done') return { events, end: event };
    events.push(event);
  }
  throw new Error('Playground limit: 1,024 constructs per run');
}
