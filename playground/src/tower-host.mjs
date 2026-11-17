import { TowerWASI } from './wasi-host.mjs';
import { configureTower, configureFoundation, configureBedrock } from './bootstrap.mjs';
import { foreignArgument, invokeForeign } from './foreign.mjs';
import { platformImports } from './platform.mjs';

/** The only module which knows about Wasm pointers and the C ABI. */
export async function loadTower(bytes, log = () => {}, bootstrap, foundation, bedrock, { imports = {} } = {}) {
  const available = {...platformImports((_stream, data, context) => context.output(data)),...imports};
  const wasi = new TowerWASI({ log });
  const module = await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport, tower_host: {
    call(handle, request) {
      try {
        const {name, args, types, pointerBytes} = JSON.parse(string(request));
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
        return BigInt(invokeForeign(available, name, context, args.map((a, i) => foreignArgument(a, types[i], pointerBytes))));
      } catch (error) {
        withSource(error.message, (pointer, length) => { exports.tw_exec_fail(handle, pointer, length); return 1; }); return 0n;
      }
    },
  } });
  wasi.initialize(instance);
  const exports = instance.exports;
  if (exports.tw_abi_version() !== 3) throw new Error('Unsupported Tower browser ABI');
  if (bedrock !== undefined) configureBedrock(exports, bedrock);
  configureTower(exports, bootstrap);
  if (foundation !== undefined) configureFoundation(exports, foundation);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const outputDecoders = new Map();
  function string(pointer) {
    const memory = new Uint8Array(exports.memory.buffer);
    const end = memory.indexOf(0, pointer);
    if (!pointer || end === -1) throw new Error('Invalid response from Tower');
    return decoder.decode(memory.subarray(pointer, end));
  }
  function withSource(source, action) {
      const bytes = new TextEncoder().encode(source);
      if (bytes.length > 128 * 1024) throw new Error('Playground source limit is 128 KiB');
      const pointer = exports.tw_alloc(bytes.length + 1);
      if (!pointer) throw new Error('Unable to allocate source memory');
      try {
        new Uint8Array(exports.memory.buffer).set(bytes, pointer);
        const result = action(pointer, bytes.length);
        if (!result) throw new Error(string(exports.tw_last_error()));
        return result;
      } finally { exports.tw_free(pointer); }
  }
  return {
    exports,
    configure: source => configureTower(exports, source),
    configureBedrock: source => configureBedrock(exports, source),
    bedrockSeed: () => string(exports.tw_bedrock_seed()),
    createBedrock: source => withSource(source, (pointer, length) => exports.tw_create_bedrock(pointer, length)),
    createFoundation: source => withSource(source, (pointer, length) => exports.tw_create_foundation(pointer, length)),
    create: source => withSource(source, (pointer, length) => exports.tw_create(pointer, length)),
    reset: (handle, source) => withSource(source, (pointer, length) => exports.tw_reset(handle, pointer, length)),
    step: handle => JSON.parse(string(exports.tw_step(handle))),
    inspect: handle => JSON.parse(string(exports.tw_inspect(handle))),
    format: handle => JSON.parse(string(exports.tw_format(handle))),
    destroy: handle => exports.tw_destroy(handle),
    compile: (source, { pointerBytes = 4 } = {}) => withSource(source, (pointer, length) => exports.tw_exec_create_target(pointer, length, pointerBytes)),
    execute(handle, budget = 10000) {
      const result=JSON.parse(string(exports.tw_exec_step(handle,budget)));
      let outputDecoder=outputDecoders.get(handle);
      if(!outputDecoder){outputDecoder=new TextDecoder();outputDecoders.set(handle,outputDecoder);}
      result.output=outputDecoder.decode(new Uint8Array(result.outputBytes??[]),{stream:result.status==='executing'});
      delete result.outputBytes;
      if(result.status!=='executing')outputDecoders.delete(handle);
      return result;
    },
    compileFoundation: source => withSource(source, (pointer, length) => exports.tw_exec_create_foundation(pointer, length)),
    foundation: handle => JSON.parse(string(exports.tw_exec_foundation(handle))),
    destroyExecution: handle => {outputDecoders.delete(handle);exports.tw_exec_destroy(handle);},
  };
}

export function runToEnd(tower, handle, events = []) {
  for (let i = 0; i < 1024; i++) {
    const event = tower.step(handle);
    if (event.status === 'error' || event.status === 'done') return { events, end: event };
    events.push(event);
  }
  throw new Error('Playground limit: 1,024 constructs per run');
}
